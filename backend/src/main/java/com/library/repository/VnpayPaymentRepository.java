package com.library.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.library.entity.VnpayPayment;

public interface VnpayPaymentRepository extends JpaRepository<VnpayPayment, Integer> {
    Optional<VnpayPayment> findByTxnRef(String txnRef);

    @Query("""
            select coalesce(sum(p.amountVnd), 0)
            from VnpayPayment p
            where p.status = 'SUCCESS'
              and upper(p.paymentType) = 'MEMBERSHIP'
            """)
    Long sumSuccessfulMembershipRevenue();
}
