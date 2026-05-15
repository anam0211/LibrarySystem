package com.library.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.library.entity.VnpayPayment;

public interface VnpayPaymentRepository extends JpaRepository<VnpayPayment, Integer> {
    Optional<VnpayPayment> findByTxnRef(String txnRef);
}
