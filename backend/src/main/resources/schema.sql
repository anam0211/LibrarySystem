IF OBJECT_ID('dbo.fines', 'U') IS NOT NULL AND COL_LENGTH('dbo.fines', 'loan_id') IS NULL ALTER TABLE dbo.fines ADD loan_id INT NULL;
