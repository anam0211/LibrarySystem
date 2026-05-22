package com.library.config;

import java.util.List;
import java.util.Locale;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class DatabaseConstraintInitializer implements ApplicationRunner {

    private static final String SCHEMA = "dbo";

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        syncCheckConstraint(
                "loans",
                "status",
                "CK_loans_status",
                List.of("PENDING", "PREPARING", "SHIPPING", "OPEN", "OVERDUE", "RETURNING", "CLOSED", "CANCELLED", "EXPIRED"));
        syncCheckConstraint(
                "loans",
                "delivery_method",
                "CK_loans_delivery_method",
                List.of("PICKUP", "HOME_DELIVERY"));
        syncCheckConstraint(
                "loan_items",
                "status",
                "CK_loan_items_status",
                List.of("PENDING", "BORROWED", "RETURNING", "RETURNED", "DAMAGED", "LOST"));
        syncCheckConstraint(
                "notifications",
                "type",
                "CK_notifications_type",
                List.of("LOAN_STATUS", "DUE_SOON", "OVERDUE", "FINE_CREATED", "GENERIC"));
        dropUniqueConstraint("loan_items", "UQ_loan_items_loan_book");
        dropCheckConstraints("memberships", "code");
    }

    private void syncCheckConstraint(String table, String column, String constraintName, List<String> allowedValues) {
        String objectName = SCHEMA + "." + table;
        if (!tableExists(objectName)) {
            return;
        }

        dropExistingCheckConstraints(objectName, column);
        jdbcTemplate.execute(
                "ALTER TABLE " + quote(SCHEMA) + "." + quote(table)
                        + " WITH CHECK ADD CONSTRAINT " + quote(constraintName)
                        + " CHECK (" + quote(column) + " IN (" + toSqlStringList(allowedValues) + "))");
        log.info("Synchronized SQL Server check constraint {} on {}.{}", constraintName, objectName, column);
    }

    private void dropCheckConstraints(String table, String column) {
        String objectName = SCHEMA + "." + table;
        if (!tableExists(objectName)) {
            return;
        }

        dropExistingCheckConstraints(objectName, column);
        log.info("Dropped SQL Server check constraints on {}.{}", objectName, column);
    }

    private void dropUniqueConstraint(String table, String constraintName) {
        String objectName = SCHEMA + "." + table;
        if (!tableExists(objectName)) {
            return;
        }

        Integer exists = jdbcTemplate.queryForObject(
                """
                SELECT CASE WHEN EXISTS (
                    SELECT 1
                    FROM sys.key_constraints
                    WHERE parent_object_id = OBJECT_ID(?)
                      AND name = ?
                ) THEN 1 ELSE 0 END
                """,
                Integer.class,
                objectName,
                constraintName);

        if (exists != null && exists == 1) {
            jdbcTemplate.execute("ALTER TABLE " + quote(SCHEMA) + "." + quote(table)
                    + " DROP CONSTRAINT " + quote(constraintName));
            log.info("Dropped SQL Server unique constraint {} on {}", constraintName, objectName);
        }
    }

    private boolean tableExists(String objectName) {
        Integer exists = jdbcTemplate.queryForObject(
                "SELECT CASE WHEN OBJECT_ID(?, N'U') IS NULL THEN 0 ELSE 1 END",
                Integer.class,
                objectName);
        return exists != null && exists == 1;
    }

    private void dropExistingCheckConstraints(String objectName, String column) {
        List<String> constraintNames = jdbcTemplate.queryForList(
                """
                SELECT cc.name
                FROM sys.check_constraints cc
                WHERE cc.parent_object_id = OBJECT_ID(?)
                  AND LOWER(cc.definition) LIKE ?
                """,
                String.class,
                objectName,
                "%" + column.toLowerCase(Locale.ROOT) + "%");

        String[] objectParts = objectName.split("\\.", 2);
        String qualifiedTable = quote(objectParts[0]) + "." + quote(objectParts[1]);
        for (String constraintName : constraintNames) {
            jdbcTemplate.execute("ALTER TABLE " + qualifiedTable + " DROP CONSTRAINT " + quote(constraintName));
        }
    }

    private String toSqlStringList(List<String> values) {
        return values.stream()
                .map(value -> "'" + value.replace("'", "''") + "'")
                .reduce((left, right) -> left + ", " + right)
                .orElseThrow();
    }

    private String quote(String identifier) {
        return "[" + identifier.replace("]", "]]") + "]";
    }
}
