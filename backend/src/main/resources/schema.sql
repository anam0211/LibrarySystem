IF OBJECT_ID('dbo.fines', 'U') IS NOT NULL AND COL_LENGTH('dbo.fines', 'loan_id') IS NULL ALTER TABLE dbo.fines ADD loan_id INT NULL;
IF OBJECT_ID('dbo.fines', 'U') IS NOT NULL AND COL_LENGTH('dbo.fines', 'loan_item_id') IS NULL ALTER TABLE dbo.fines ADD loan_item_id INT NULL;
IF OBJECT_ID('dbo.loan_items', 'U') IS NOT NULL AND COL_LENGTH('dbo.loan_items', 'copy_id') IS NULL ALTER TABLE dbo.loan_items ADD copy_id INT NULL;
IF OBJECT_ID('dbo.cart_items', 'U') IS NOT NULL AND COL_LENGTH('dbo.cart_items', 'quantity') IS NULL ALTER TABLE dbo.cart_items ADD quantity INT NOT NULL DEFAULT 1;
IF OBJECT_ID('dbo.vnpay_payments', 'U') IS NOT NULL AND COL_LENGTH('dbo.vnpay_payments', 'fine_id') IS NULL ALTER TABLE dbo.vnpay_payments ADD fine_id INT NULL;
IF OBJECT_ID('dbo.vnpay_payments', 'U') IS NOT NULL AND COL_LENGTH('dbo.vnpay_payments', 'membership_id') IS NULL ALTER TABLE dbo.vnpay_payments ADD membership_id INT NULL;
IF OBJECT_ID('dbo.vnpay_payments', 'U') IS NOT NULL AND COL_LENGTH('dbo.vnpay_payments', 'payment_type') IS NULL ALTER TABLE dbo.vnpay_payments ADD payment_type NVARCHAR(30) NOT NULL DEFAULT 'MEMBERSHIP';

IF OBJECT_ID('dbo.user_addresses', 'U') IS NOT NULL
   AND OBJECT_ID('dbo.users', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.users', 'verification_address') IS NOT NULL
EXEC(N'UPDATE u
SET verification_address = selected_address.address_line
FROM dbo.users u
OUTER APPLY (
    SELECT TOP 1 ua.address_line
    FROM dbo.user_addresses ua
    WHERE ua.user_id = u.user_id
      AND ua.address_line IS NOT NULL
      AND LTRIM(RTRIM(ua.address_line)) <> ''''
    ORDER BY ua.is_default DESC, ua.address_id DESC
) selected_address
WHERE selected_address.address_line IS NOT NULL
  AND (u.verification_address IS NULL OR LTRIM(RTRIM(u.verification_address)) = '''')');

IF OBJECT_ID('dbo.user_addresses', 'U') IS NOT NULL EXEC(N'DROP TABLE dbo.user_addresses');
IF OBJECT_ID('dbo.membership_plans', 'U') IS NOT NULL EXEC(N'DROP TABLE dbo.membership_plans');

IF OBJECT_ID('dbo.loan_items', 'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.key_constraints
       WHERE parent_object_id = OBJECT_ID('dbo.loan_items')
         AND name = 'UQ_loan_items_loan_book'
   )
ALTER TABLE dbo.loan_items DROP CONSTRAINT UQ_loan_items_loan_book;

IF OBJECT_ID('dbo.book_copies', 'U') IS NULL
CREATE TABLE dbo.book_copies (
    copy_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    book_id INT NOT NULL,
    barcode NVARCHAR(100) NOT NULL,
    status NVARCHAR(20) NOT NULL,
    condition NVARCHAR(20) NOT NULL,
    created_at DATETIME2 NOT NULL,
    CONSTRAINT uq_book_copies_barcode UNIQUE (barcode),
    CONSTRAINT fk_book_copies_book FOREIGN KEY (book_id) REFERENCES dbo.books(book_id)
);

IF OBJECT_ID('dbo.loan_items', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.loan_items', 'copy_id') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_loan_items_book_copy')
ALTER TABLE dbo.loan_items ADD CONSTRAINT fk_loan_items_book_copy FOREIGN KEY (copy_id) REFERENCES dbo.book_copies(copy_id);

IF OBJECT_ID('dbo.fines', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.fines', 'loan_item_id') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_fines_loan_item')
ALTER TABLE dbo.fines ADD CONSTRAINT fk_fines_loan_item FOREIGN KEY (loan_item_id) REFERENCES dbo.loan_items(loan_item_id);

IF OBJECT_ID('dbo.vnpay_payments', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.vnpay_payments', 'fine_id') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_vnpay_payments_fine')
ALTER TABLE dbo.vnpay_payments ADD CONSTRAINT fk_vnpay_payments_fine FOREIGN KEY (fine_id) REFERENCES dbo.fines(fine_id);

IF OBJECT_ID('dbo.vnpay_payments', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.vnpay_payments', 'membership_id') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_vnpay_payments_membership')
ALTER TABLE dbo.vnpay_payments ADD CONSTRAINT fk_vnpay_payments_membership FOREIGN KEY (membership_id) REFERENCES dbo.memberships(id);
