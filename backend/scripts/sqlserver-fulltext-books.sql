IF NOT EXISTS (SELECT 1 FROM sys.fulltext_catalogs WHERE name = N'LibraryCatalogFT')
BEGIN
    CREATE FULLTEXT CATALOG LibraryCatalogFT AS DEFAULT;
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.fulltext_indexes
    WHERE object_id = OBJECT_ID(N'dbo.books')
)
BEGIN
    DECLARE @pkIndexName sysname;
    DECLARE @sql nvarchar(max);

    SELECT TOP 1 @pkIndexName = i.name
    FROM sys.indexes i
    WHERE i.object_id = OBJECT_ID(N'dbo.books')
      AND i.is_primary_key = 1;

    IF @pkIndexName IS NULL
    BEGIN
        THROW 50001, 'Primary key index for dbo.books was not found.', 1;
    END;

    SET @sql = N'
        CREATE FULLTEXT INDEX ON dbo.books (
            title LANGUAGE 1066,
            subtitle LANGUAGE 1066,
            description LANGUAGE 1066,
            keywords LANGUAGE 1066,
            isbn LANGUAGE 1033
        )
        KEY INDEX ' + QUOTENAME(@pkIndexName) + N'
        ON LibraryCatalogFT
        WITH CHANGE_TRACKING AUTO;
    ';

    EXEC sp_executesql @sql;
END;
GO
