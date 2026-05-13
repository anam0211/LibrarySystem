/*
  SQL Server schema for all JPA entities in the backend.
  Target database from application.yaml: LibraryDB

  Usage in SQL Server Management Studio:
    1. Create/select database LibraryDB.
    2. Run this script.

  Notes:
    - This script is idempotent for table creation: it creates tables only when missing.
    - It does not drop existing data.
    - Hibernate ddl-auto=update can still add/adjust columns if entity mappings change later.
*/

IF DB_ID(N'LibraryDB') IS NULL
BEGIN
    CREATE DATABASE LibraryDB;
END
GO

USE LibraryDB;
GO

IF OBJECT_ID(N'dbo.users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.users (
        user_id INT IDENTITY(1,1) NOT NULL,
        full_name NVARCHAR(150) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        password_hash NVARCHAR(255) NOT NULL,
        phone NVARCHAR(30) NULL,
        verification_email NVARCHAR(255) NULL,
        verification_phone NVARCHAR(30) NULL,
        verification_address NVARCHAR(500) NULL,
        role VARCHAR(20) NOT NULL CONSTRAINT DF_users_role DEFAULT ('READER'),
        status VARCHAR(20) NOT NULL CONSTRAINT DF_users_status DEFAULT ('ACTIVE'),
        verification_status VARCHAR(20) NOT NULL CONSTRAINT DF_users_verification_status DEFAULT ('UNVERIFIED'),
        id_card_number NVARCHAR(30) NULL,
        id_card_image_url NVARCHAR(500) NULL,
        created_at DATETIME2 NULL CONSTRAINT DF_users_created_at DEFAULT (SYSDATETIME()),
        updated_at DATETIME2 NULL,
        CONSTRAINT PK_users PRIMARY KEY (user_id),
        CONSTRAINT UK_users_email UNIQUE (email),
        CONSTRAINT CK_users_role CHECK (role IN ('ADMIN', 'LIBRARIAN', 'READER')),
        CONSTRAINT CK_users_status CHECK (status IN ('ACTIVE', 'SUSPENDED')),
        CONSTRAINT CK_users_verification_status CHECK (verification_status IN ('UNVERIFIED', 'PENDING', 'VERIFIED'))
    );
END
GO

IF OBJECT_ID(N'dbo.authors', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.authors (
        author_id INT IDENTITY(1,1) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        bio NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_authors_created_at DEFAULT (SYSDATETIME()),
        CONSTRAINT PK_authors PRIMARY KEY (author_id)
    );
END
GO

IF OBJECT_ID(N'dbo.publishers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.publishers (
        publisher_id INT IDENTITY(1,1) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_publishers_created_at DEFAULT (SYSDATETIME()),
        CONSTRAINT PK_publishers PRIMARY KEY (publisher_id),
        CONSTRAINT UK_publishers_name UNIQUE (name)
    );
END
GO

IF OBJECT_ID(N'dbo.categories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.categories (
        category_id INT IDENTITY(1,1) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        parent_id INT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_categories_created_at DEFAULT (SYSDATETIME()),
        CONSTRAINT PK_categories PRIMARY KEY (category_id),
        CONSTRAINT FK_categories_parent FOREIGN KEY (parent_id) REFERENCES dbo.categories(category_id)
    );
END
GO

IF OBJECT_ID(N'dbo.books', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.books (
        book_id INT IDENTITY(1,1) NOT NULL,
        isbn NVARCHAR(20) NULL,
        title NVARCHAR(500) NOT NULL,
        subtitle NVARCHAR(500) NULL,
        publisher_id INT NULL,
        publish_year INT NULL,
        language_code NVARCHAR(10) NULL,
        page_count INT NULL,
        description NVARCHAR(MAX) NULL,
        keywords NVARCHAR(MAX) NULL,
        stock_total INT NOT NULL CONSTRAINT DF_books_stock_total DEFAULT (0),
        stock_available INT NOT NULL CONSTRAINT DF_books_stock_available DEFAULT (0),
        original_price DECIMAL(12,2) NULL,
        average_rating FLOAT NOT NULL CONSTRAINT DF_books_average_rating DEFAULT (0),
        review_count INT NOT NULL CONSTRAINT DF_books_review_count DEFAULT (0),
        status VARCHAR(20) NOT NULL CONSTRAINT DF_books_status DEFAULT ('ACTIVE'),
        created_at DATETIME2 NOT NULL CONSTRAINT DF_books_created_at DEFAULT (SYSDATETIME()),
        updated_at DATETIME2 NULL,
        CONSTRAINT PK_books PRIMARY KEY (book_id),
        CONSTRAINT FK_books_publishers FOREIGN KEY (publisher_id) REFERENCES dbo.publishers(publisher_id),
        CONSTRAINT CK_books_status CHECK (status IN ('ACTIVE', 'ARCHIVED')),
        CONSTRAINT CK_books_stock CHECK (stock_total >= 0 AND stock_available >= 0 AND stock_available <= stock_total),
        CONSTRAINT CK_books_average_rating CHECK (average_rating >= 0 AND average_rating <= 5),
        CONSTRAINT CK_books_review_count CHECK (review_count >= 0)
    );
END
GO

IF OBJECT_ID(N'dbo.book_authors', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.book_authors (
        book_id INT NOT NULL,
        author_id INT NOT NULL,
        author_order INT NOT NULL CONSTRAINT DF_book_authors_author_order DEFAULT (1),
        CONSTRAINT PK_book_authors PRIMARY KEY (book_id, author_id),
        CONSTRAINT FK_book_authors_books FOREIGN KEY (book_id) REFERENCES dbo.books(book_id),
        CONSTRAINT FK_book_authors_authors FOREIGN KEY (author_id) REFERENCES dbo.authors(author_id),
        CONSTRAINT CK_book_authors_author_order CHECK (author_order >= 1)
    );
END
GO

IF OBJECT_ID(N'dbo.book_categories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.book_categories (
        book_id INT NOT NULL,
        category_id INT NOT NULL,
        CONSTRAINT PK_book_categories PRIMARY KEY (book_id, category_id),
        CONSTRAINT FK_book_categories_books FOREIGN KEY (book_id) REFERENCES dbo.books(book_id),
        CONSTRAINT FK_book_categories_categories FOREIGN KEY (category_id) REFERENCES dbo.categories(category_id)
    );
END
GO

IF OBJECT_ID(N'dbo.book_images', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.book_images (
        image_id INT IDENTITY(1,1) NOT NULL,
        book_id INT NOT NULL,
        file_url NVARCHAR(500) NOT NULL,
        is_primary BIT NOT NULL CONSTRAINT DF_book_images_is_primary DEFAULT (0),
        uploaded_by INT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_book_images_created_at DEFAULT (SYSDATETIME()),
        CONSTRAINT PK_book_images PRIMARY KEY (image_id),
        CONSTRAINT FK_book_images_books FOREIGN KEY (book_id) REFERENCES dbo.books(book_id),
        CONSTRAINT FK_book_images_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES dbo.users(user_id)
    );
END
GO

IF OBJECT_ID(N'dbo.user_addresses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_addresses (
        address_id INT IDENTITY(1,1) NOT NULL,
        user_id INT NOT NULL,
        full_name NVARCHAR(150) NOT NULL,
        phone_number NVARCHAR(30) NOT NULL,
        address_line NVARCHAR(500) NOT NULL,
        is_default BIT NOT NULL CONSTRAINT DF_user_addresses_is_default DEFAULT (0),
        CONSTRAINT PK_user_addresses PRIMARY KEY (address_id),
        CONSTRAINT FK_user_addresses_users FOREIGN KEY (user_id) REFERENCES dbo.users(user_id)
    );
END
GO

IF OBJECT_ID(N'dbo.carts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.carts (
        cart_id INT IDENTITY(1,1) NOT NULL,
        user_id INT NOT NULL,
        CONSTRAINT PK_carts PRIMARY KEY (cart_id),
        CONSTRAINT UK_carts_user_id UNIQUE (user_id),
        CONSTRAINT FK_carts_users FOREIGN KEY (user_id) REFERENCES dbo.users(user_id)
    );
END
GO

IF OBJECT_ID(N'dbo.cart_items', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.cart_items (
        cart_item_id INT IDENTITY(1,1) NOT NULL,
        cart_id INT NOT NULL,
        book_id INT NOT NULL,
        added_at DATETIME2 NOT NULL CONSTRAINT DF_cart_items_added_at DEFAULT (SYSDATETIME()),
        CONSTRAINT PK_cart_items PRIMARY KEY (cart_item_id),
        CONSTRAINT UK_cart_items_cart_book UNIQUE (cart_id, book_id),
        CONSTRAINT FK_cart_items_carts FOREIGN KEY (cart_id) REFERENCES dbo.carts(cart_id),
        CONSTRAINT FK_cart_items_books FOREIGN KEY (book_id) REFERENCES dbo.books(book_id)
    );
END
GO

IF OBJECT_ID(N'dbo.wishlists', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.wishlists (
        user_id INT NOT NULL,
        book_id INT NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_wishlists_created_at DEFAULT (SYSDATETIME()),
        CONSTRAINT PK_wishlists PRIMARY KEY (user_id, book_id),
        CONSTRAINT FK_wishlists_users FOREIGN KEY (user_id) REFERENCES dbo.users(user_id),
        CONSTRAINT FK_wishlists_books FOREIGN KEY (book_id) REFERENCES dbo.books(book_id)
    );
END
GO

IF OBJECT_ID(N'dbo.loans', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.loans (
        loan_id INT IDENTITY(1,1) NOT NULL,
        borrower_id INT NOT NULL,
        processed_by INT NULL,
        status VARCHAR(20) NOT NULL CONSTRAINT DF_loans_status DEFAULT ('OPEN'),
        delivery_method VARCHAR(20) NOT NULL CONSTRAINT DF_loans_delivery_method DEFAULT ('PICKUP'),
        delivery_address NVARCHAR(500) NULL,
        delivery_phone NVARCHAR(30) NULL,
        tracking_code NVARCHAR(80) NULL,
        loaned_at DATETIME2 NULL,
        due_at DATETIME2 NULL,
        closed_at DATETIME2 NULL,
        note NVARCHAR(255) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_loans_created_at DEFAULT (SYSDATETIME()),
        CONSTRAINT PK_loans PRIMARY KEY (loan_id),
        CONSTRAINT FK_loans_borrower FOREIGN KEY (borrower_id) REFERENCES dbo.users(user_id),
        CONSTRAINT FK_loans_processed_by FOREIGN KEY (processed_by) REFERENCES dbo.users(user_id),
        CONSTRAINT CK_loans_status CHECK (status IN ('PENDING', 'PREPARING', 'SHIPPING', 'OPEN', 'RETURNING', 'CLOSED', 'CANCELLED', 'EXPIRED')),
        CONSTRAINT CK_loans_delivery_method CHECK (delivery_method IN ('PICKUP', 'HOME_DELIVERY'))
    );
END
GO

IF OBJECT_ID(N'dbo.loan_items', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.loan_items (
        loan_item_id INT IDENTITY(1,1) NOT NULL,
        loan_id INT NOT NULL,
        book_id INT NOT NULL,
        qty INT NOT NULL CONSTRAINT DF_loan_items_qty DEFAULT (1),
        status VARCHAR(20) NOT NULL CONSTRAINT DF_loan_items_status DEFAULT ('BORROWED'),
        borrowed_at DATETIME2 NULL,
        due_at DATETIME2 NULL,
        returned_at DATETIME2 NULL,
        CONSTRAINT PK_loan_items PRIMARY KEY (loan_item_id),
        CONSTRAINT FK_loan_items_loans FOREIGN KEY (loan_id) REFERENCES dbo.loans(loan_id),
        CONSTRAINT FK_loan_items_books FOREIGN KEY (book_id) REFERENCES dbo.books(book_id),
        CONSTRAINT CK_loan_items_qty CHECK (qty >= 1),
        CONSTRAINT CK_loan_items_status CHECK (status IN ('PENDING', 'BORROWED', 'RETURNING', 'RETURNED', 'DAMAGED', 'LOST'))
    );
END
GO

IF OBJECT_ID(N'dbo.fines', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.fines (
        fine_id INT IDENTITY(1,1) NOT NULL,
        user_id INT NOT NULL,
        loan_id INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        reason VARCHAR(30) NOT NULL,
        status VARCHAR(20) NOT NULL CONSTRAINT DF_fines_status DEFAULT ('UNPAID'),
        created_at DATETIME2 NOT NULL CONSTRAINT DF_fines_created_at DEFAULT (SYSDATETIME()),
        paid_at DATETIME2 NULL,
        CONSTRAINT PK_fines PRIMARY KEY (fine_id),
        CONSTRAINT FK_fines_users FOREIGN KEY (user_id) REFERENCES dbo.users(user_id),
        CONSTRAINT FK_fines_loans FOREIGN KEY (loan_id) REFERENCES dbo.loans(loan_id),
        CONSTRAINT CK_fines_amount CHECK (amount >= 0),
        CONSTRAINT CK_fines_reason CHECK (reason IN ('LATE_RETURN', 'DAMAGED_BOOK', 'LOST_BOOK')),
        CONSTRAINT CK_fines_status CHECK (status IN ('UNPAID', 'PAID'))
    );
END
GO

IF OBJECT_ID(N'dbo.reviews', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.reviews (
        review_id INT IDENTITY(1,1) NOT NULL,
        user_id INT NOT NULL,
        book_id INT NOT NULL,
        rating INT NOT NULL,
        comment NVARCHAR(MAX) NULL,
        hidden BIT NOT NULL CONSTRAINT DF_reviews_hidden DEFAULT (0),
        created_at DATETIME2 NOT NULL CONSTRAINT DF_reviews_created_at DEFAULT (SYSDATETIME()),
        CONSTRAINT PK_reviews PRIMARY KEY (review_id),
        CONSTRAINT FK_reviews_users FOREIGN KEY (user_id) REFERENCES dbo.users(user_id),
        CONSTRAINT FK_reviews_books FOREIGN KEY (book_id) REFERENCES dbo.books(book_id),
        CONSTRAINT CK_reviews_rating CHECK (rating BETWEEN 1 AND 5)
    );
END
GO

IF OBJECT_ID(N'dbo.notifications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.notifications (
        notification_id INT IDENTITY(1,1) NOT NULL,
        user_id INT NOT NULL,
        type VARCHAR(20) NOT NULL,
        channel VARCHAR(20) NOT NULL,
        subject NVARCHAR(255) NULL,
        body NVARCHAR(MAX) NOT NULL,
        related_loan_id INT NULL,
        related_book_id INT NULL,
        scheduled_at DATETIME2 NOT NULL,
        sent_at DATETIME2 NULL,
        read_at DATETIME2 NULL,
        status VARCHAR(20) NOT NULL CONSTRAINT DF_notifications_status DEFAULT ('PENDING'),
        fail_reason NVARCHAR(255) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_notifications_created_at DEFAULT (SYSDATETIME()),
        CONSTRAINT PK_notifications PRIMARY KEY (notification_id),
        CONSTRAINT CK_notifications_type CHECK (type IN ('LOAN_STATUS', 'DUE_SOON', 'OVERDUE', 'FINE_CREATED', 'GENERIC')),
        CONSTRAINT CK_notifications_channel CHECK (channel IN ('INAPP', 'EMAIL')),
        CONSTRAINT CK_notifications_status CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'CANCELLED'))
    );
END
GO

IF OBJECT_ID(N'dbo.system_configs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.system_configs (
        config_id INT IDENTITY(1,1) NOT NULL,
        config_key NVARCHAR(100) NOT NULL,
        config_value NVARCHAR(500) NOT NULL,
        description NVARCHAR(500) NULL,
        CONSTRAINT PK_system_configs PRIMARY KEY (config_id),
        CONSTRAINT UK_system_configs_config_key UNIQUE (config_key)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_books_publisher_id' AND object_id = OBJECT_ID(N'dbo.books'))
    CREATE INDEX IX_books_publisher_id ON dbo.books(publisher_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_book_authors_author_id' AND object_id = OBJECT_ID(N'dbo.book_authors'))
    CREATE INDEX IX_book_authors_author_id ON dbo.book_authors(author_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_book_categories_category_id' AND object_id = OBJECT_ID(N'dbo.book_categories'))
    CREATE INDEX IX_book_categories_category_id ON dbo.book_categories(category_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_book_images_book_id' AND object_id = OBJECT_ID(N'dbo.book_images'))
    CREATE INDEX IX_book_images_book_id ON dbo.book_images(book_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_user_addresses_user_id' AND object_id = OBJECT_ID(N'dbo.user_addresses'))
    CREATE INDEX IX_user_addresses_user_id ON dbo.user_addresses(user_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_cart_items_book_id' AND object_id = OBJECT_ID(N'dbo.cart_items'))
    CREATE INDEX IX_cart_items_book_id ON dbo.cart_items(book_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_wishlists_book_id' AND object_id = OBJECT_ID(N'dbo.wishlists'))
    CREATE INDEX IX_wishlists_book_id ON dbo.wishlists(book_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_loans_borrower_id_created_at' AND object_id = OBJECT_ID(N'dbo.loans'))
    CREATE INDEX IX_loans_borrower_id_created_at ON dbo.loans(borrower_id, created_at DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_loan_items_loan_id' AND object_id = OBJECT_ID(N'dbo.loan_items'))
    CREATE INDEX IX_loan_items_loan_id ON dbo.loan_items(loan_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_loan_items_book_id' AND object_id = OBJECT_ID(N'dbo.loan_items'))
    CREATE INDEX IX_loan_items_book_id ON dbo.loan_items(book_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_reviews_book_id_created_at' AND object_id = OBJECT_ID(N'dbo.reviews'))
    CREATE INDEX IX_reviews_book_id_created_at ON dbo.reviews(book_id, created_at DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_fines_user_id_created_at' AND object_id = OBJECT_ID(N'dbo.fines'))
    CREATE INDEX IX_fines_user_id_created_at ON dbo.fines(user_id, created_at DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_notifications_user_id_created_at' AND object_id = OBJECT_ID(N'dbo.notifications'))
    CREATE INDEX IX_notifications_user_id_created_at ON dbo.notifications(user_id, created_at DESC);
GO

