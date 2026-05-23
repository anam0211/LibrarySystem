IF OBJECT_ID('dbo.fines', 'U') IS NOT NULL AND COL_LENGTH('dbo.fines', 'loan_id') IS NULL ALTER TABLE dbo.fines ADD loan_id INT NULL;
IF OBJECT_ID('dbo.fines', 'U') IS NOT NULL AND COL_LENGTH('dbo.fines', 'loan_item_id') IS NULL ALTER TABLE dbo.fines ADD loan_item_id INT NULL;
IF OBJECT_ID('dbo.loans', 'U') IS NOT NULL AND COL_LENGTH('dbo.loans', 'return_requested_at') IS NULL ALTER TABLE dbo.loans ADD return_requested_at DATETIME2 NULL;
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

IF OBJECT_ID('dbo.book_copies', 'U') IS NULL AND OBJECT_ID('dbo.books', 'U') IS NOT NULL
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
   AND OBJECT_ID('dbo.book_copies', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_loan_items_book_copy')
ALTER TABLE dbo.loan_items ADD CONSTRAINT fk_loan_items_book_copy FOREIGN KEY (copy_id) REFERENCES dbo.book_copies(copy_id);

-- Expand legacy quantity rows so every loan item represents one physical copy.
IF OBJECT_ID('dbo.loan_items', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.loan_items', 'book_id') IS NOT NULL
   AND COL_LENGTH('dbo.loan_items', 'copy_id') IS NOT NULL
   AND COL_LENGTH('dbo.loan_items', 'qty') IS NOT NULL
EXEC(N'WITH numbers AS (
    SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS number_value
    FROM sys.all_objects first_source
    CROSS JOIN sys.all_objects second_source
)
INSERT INTO dbo.loan_items (loan_id, book_id, copy_id, qty, status, borrowed_at, due_at, returned_at)
SELECT item.loan_id, item.book_id, NULL, 1, item.status, item.borrowed_at, item.due_at, item.returned_at
FROM dbo.loan_items item
INNER JOIN numbers ON numbers.number_value < ISNULL(item.qty, 1)
WHERE ISNULL(item.qty, 1) > 1');

IF OBJECT_ID('dbo.loan_items', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.loan_items', 'book_id') IS NOT NULL
   AND COL_LENGTH('dbo.loan_items', 'qty') IS NOT NULL
EXEC(N'UPDATE dbo.loan_items SET qty = 1 WHERE ISNULL(qty, 1) <> 1');

-- Materialize existing stock as physical copies before assigning legacy loans.
IF OBJECT_ID('dbo.loan_items', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.loan_items', 'book_id') IS NOT NULL
   AND OBJECT_ID('dbo.book_copies', 'U') IS NOT NULL
   AND OBJECT_ID('dbo.books', 'U') IS NOT NULL
EXEC(N'WITH loan_need AS (
    SELECT book_id,
           SUM(CASE WHEN status IN (''PENDING'', ''BORROWED'', ''RETURNING'') THEN 1 ELSE 0 END) AS held_count,
           COUNT(*) AS history_count
    FROM dbo.loan_items
    GROUP BY book_id
),
existing_copy AS (
    SELECT book_id, COUNT(*) AS copy_count
    FROM dbo.book_copies
    GROUP BY book_id
),
desired_copy AS (
    SELECT book.book_id,
           CASE
               WHEN ISNULL(book.stock_total, 0) >= ISNULL(need.held_count, 0)
                    AND ISNULL(book.stock_total, 0) >= CASE WHEN ISNULL(need.history_count, 0) > 0 THEN 1 ELSE 0 END
                   THEN ISNULL(book.stock_total, 0)
               WHEN ISNULL(need.held_count, 0) >= CASE WHEN ISNULL(need.history_count, 0) > 0 THEN 1 ELSE 0 END
                   THEN ISNULL(need.held_count, 0)
               ELSE 1
           END AS desired_count,
           ISNULL(current_copy.copy_count, 0) AS existing_count
    FROM dbo.books book
    LEFT JOIN loan_need need ON need.book_id = book.book_id
    LEFT JOIN existing_copy current_copy ON current_copy.book_id = book.book_id
),
numbers AS (
    SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS number_value
    FROM sys.all_objects first_source
    CROSS JOIN sys.all_objects second_source
)
INSERT INTO dbo.book_copies (book_id, barcode, status, condition, created_at)
SELECT desired.book_id,
       CONCAT(''MIG-'', desired.book_id, ''-'', REPLACE(CONVERT(VARCHAR(36), NEWID()), ''-'', '''')),
       ''AVAILABLE'',
       ''GOOD'',
       SYSUTCDATETIME()
FROM desired_copy desired
INNER JOIN numbers ON numbers.number_value <= desired.desired_count - desired.existing_count
WHERE desired.desired_count > desired.existing_count');

-- Assign currently held legacy loan items to distinct copies.
IF OBJECT_ID('dbo.loan_items', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.loan_items', 'book_id') IS NOT NULL
   AND OBJECT_ID('dbo.book_copies', 'U') IS NOT NULL
EXEC(N'WITH missing_item AS (
    SELECT loan_item_id, book_id,
           ROW_NUMBER() OVER (PARTITION BY book_id ORDER BY loan_item_id) AS row_number
    FROM dbo.loan_items
    WHERE copy_id IS NULL
      AND status IN (''PENDING'', ''BORROWED'', ''RETURNING'')
),
available_copy AS (
    SELECT copy.copy_id, copy.book_id,
           ROW_NUMBER() OVER (
               PARTITION BY copy.book_id
               ORDER BY CASE WHEN copy.status = ''AVAILABLE'' THEN 0 ELSE 1 END, copy.copy_id
           ) AS row_number
    FROM dbo.book_copies copy
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.loan_items used_item
        WHERE used_item.copy_id = copy.copy_id
          AND used_item.status IN (''PENDING'', ''BORROWED'', ''RETURNING'')
    )
)
UPDATE item
SET copy_id = copy.copy_id
FROM dbo.loan_items item
INNER JOIN missing_item missing ON missing.loan_item_id = item.loan_item_id
INNER JOIN available_copy copy
        ON copy.book_id = missing.book_id
       AND copy.row_number = missing.row_number');

-- Completed history may reuse a physical copy because exact legacy barcode is unknown.
IF OBJECT_ID('dbo.loan_items', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.loan_items', 'book_id') IS NOT NULL
   AND OBJECT_ID('dbo.book_copies', 'U') IS NOT NULL
EXEC(N'UPDATE item
SET copy_id = selected_copy.copy_id
FROM dbo.loan_items item
CROSS APPLY (
    SELECT TOP 1 copy.copy_id
    FROM dbo.book_copies copy
    WHERE copy.book_id = item.book_id
    ORDER BY copy.copy_id
) selected_copy
WHERE item.copy_id IS NULL');

-- Active loans own the current copy state after the legacy assignment.
IF OBJECT_ID('dbo.loan_items', 'U') IS NOT NULL AND OBJECT_ID('dbo.book_copies', 'U') IS NOT NULL
EXEC(N'UPDATE copy
SET status = CASE
        WHEN item.status = ''PENDING'' THEN ''RESERVED''
        WHEN item.status IN (''BORROWED'', ''RETURNING'') THEN ''BORROWED''
        ELSE copy.status
    END,
    condition = copy.condition
FROM dbo.book_copies copy
INNER JOIN dbo.loan_items item ON item.copy_id = copy.copy_id
WHERE item.status IN (''PENDING'', ''BORROWED'', ''RETURNING'')');

IF OBJECT_ID('dbo.books', 'U') IS NOT NULL AND OBJECT_ID('dbo.book_copies', 'U') IS NOT NULL
EXEC(N'UPDATE book
SET stock_total = inventory.total_count,
    stock_available = inventory.available_count
FROM dbo.books book
INNER JOIN (
    SELECT book_id,
           COUNT(*) AS total_count,
           SUM(CASE WHEN status = ''AVAILABLE'' THEN 1 ELSE 0 END) AS available_count
    FROM dbo.book_copies
    GROUP BY book_id
) inventory ON inventory.book_id = book.book_id');

IF OBJECT_ID('dbo.loan_items', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.loan_items', 'copy_id') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.loan_items WHERE copy_id IS NULL)
   AND EXISTS (
       SELECT 1
       FROM sys.columns
       WHERE object_id = OBJECT_ID('dbo.loan_items')
         AND name = 'copy_id'
         AND is_nullable = 1
   )
EXEC(N'IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(''dbo.loan_items'')
      AND name = ''ux_loan_items_active_copy''
) DROP INDEX ux_loan_items_active_copy ON dbo.loan_items;
ALTER TABLE dbo.loan_items ALTER COLUMN copy_id INT NOT NULL');

IF OBJECT_ID('dbo.loan_items', 'U') IS NOT NULL AND COL_LENGTH('dbo.loan_items', 'book_id') IS NOT NULL
EXEC(N'DECLARE @dropForeignKeys NVARCHAR(MAX) = N'''';
SELECT @dropForeignKeys = @dropForeignKeys + N''ALTER TABLE dbo.loan_items DROP CONSTRAINT ['' + foreign_key.name + N''];''
FROM sys.foreign_keys foreign_key
INNER JOIN sys.foreign_key_columns key_column ON key_column.constraint_object_id = foreign_key.object_id
INNER JOIN sys.columns column_definition
        ON column_definition.object_id = key_column.parent_object_id
       AND column_definition.column_id = key_column.parent_column_id
WHERE foreign_key.parent_object_id = OBJECT_ID(''dbo.loan_items'')
  AND column_definition.name = ''book_id'';
IF @dropForeignKeys <> N'''' EXEC sp_executesql @dropForeignKeys;
DECLARE @dropIndexes NVARCHAR(MAX) = N'''';
SELECT @dropIndexes = @dropIndexes
       + CASE WHEN legacy_index.is_unique_constraint = 1
              THEN N''ALTER TABLE dbo.loan_items DROP CONSTRAINT ['' + legacy_index.name + N''];''
              ELSE N''DROP INDEX ['' + legacy_index.name + N''] ON dbo.loan_items;''
         END
FROM (
    SELECT DISTINCT table_index.name, table_index.is_unique_constraint
    FROM sys.indexes table_index
    INNER JOIN sys.index_columns index_column ON index_column.object_id = table_index.object_id
                                               AND index_column.index_id = table_index.index_id
    INNER JOIN sys.columns column_definition ON column_definition.object_id = index_column.object_id
                                             AND column_definition.column_id = index_column.column_id
    WHERE table_index.object_id = OBJECT_ID(''dbo.loan_items'')
      AND column_definition.name = ''book_id''
      AND table_index.is_primary_key = 0
      AND table_index.name IS NOT NULL
) legacy_index;
IF @dropIndexes <> N'''' EXEC sp_executesql @dropIndexes;
DECLARE @dropDefaults NVARCHAR(MAX) = N'''';
SELECT @dropDefaults = @dropDefaults + N''ALTER TABLE dbo.loan_items DROP CONSTRAINT ['' + default_constraint.name + N''];''
FROM sys.default_constraints default_constraint
INNER JOIN sys.columns column_definition
        ON column_definition.object_id = default_constraint.parent_object_id
       AND column_definition.column_id = default_constraint.parent_column_id
WHERE default_constraint.parent_object_id = OBJECT_ID(''dbo.loan_items'')
  AND column_definition.name = ''book_id'';
IF @dropDefaults <> N'''' EXEC sp_executesql @dropDefaults;
ALTER TABLE dbo.loan_items DROP COLUMN book_id');

IF OBJECT_ID('dbo.loan_items', 'U') IS NOT NULL AND COL_LENGTH('dbo.loan_items', 'qty') IS NOT NULL
EXEC(N'DECLARE @dropQtyConstraints NVARCHAR(MAX) = N'''';
SELECT @dropQtyConstraints = @dropQtyConstraints + N''ALTER TABLE dbo.loan_items DROP CONSTRAINT ['' + check_constraint.name + N''];''
FROM sys.check_constraints check_constraint
WHERE check_constraint.parent_object_id = OBJECT_ID(''dbo.loan_items'')
  AND check_constraint.parent_column_id = COLUMNPROPERTY(OBJECT_ID(''dbo.loan_items''), ''qty'', ''ColumnId'');
IF @dropQtyConstraints <> N'''' EXEC sp_executesql @dropQtyConstraints;
DECLARE @dropQtyDefaults NVARCHAR(MAX) = N'''';
SELECT @dropQtyDefaults = @dropQtyDefaults + N''ALTER TABLE dbo.loan_items DROP CONSTRAINT ['' + default_constraint.name + N''];''
FROM sys.default_constraints default_constraint
INNER JOIN sys.columns column_definition
        ON column_definition.object_id = default_constraint.parent_object_id
       AND column_definition.column_id = default_constraint.parent_column_id
WHERE default_constraint.parent_object_id = OBJECT_ID(''dbo.loan_items'')
  AND column_definition.name = ''qty'';
IF @dropQtyDefaults <> N'''' EXEC sp_executesql @dropQtyDefaults;
ALTER TABLE dbo.loan_items DROP COLUMN qty');

IF OBJECT_ID('dbo.loan_items', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.loan_items', 'copy_id') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE object_id = OBJECT_ID('dbo.loan_items')
         AND name = 'ux_loan_items_active_copy'
   )
EXEC(N'CREATE UNIQUE INDEX ux_loan_items_active_copy
ON dbo.loan_items(copy_id)
WHERE copy_id IS NOT NULL AND status IN (''PENDING'', ''BORROWED'', ''RETURNING'')');

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

IF OBJECT_ID('dbo.reviews', 'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.key_constraints
       WHERE parent_object_id = OBJECT_ID('dbo.reviews')
         AND name = 'uk_reviews_user_book'
   )
ALTER TABLE dbo.reviews ADD CONSTRAINT uk_reviews_user_book UNIQUE (user_id, book_id);
