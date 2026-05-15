package com.library.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "memberships")
public class Membership {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    @Enumerated(EnumType.STRING)
    @Column(unique = true, nullable = false)
    MembershipType code; // FREE, PREMIUM

    @Column(nullable = false, columnDefinition = "nvarchar(255)")
    String name; // "Gói miễn phí", "Gói Premium"

    @Column(nullable = false)
    Double pricePerMonth; // 0, 49000

    @Column(nullable = false)
    Integer maxBorrowLimit; // 3, 6

    @Column(nullable = false)
    Double deliveryFee; // 20000, 0

    @Column(nullable = false)
    Boolean priorityProcessing; // false, true

    @Column(length = 500, columnDefinition = "nvarchar(500)")
    String benefitsDescription; // "Mượn tại quầy miễn phí. Giao tận nhà: 20.000đ / đơn..."
}