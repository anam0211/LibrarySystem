package com.library.repository;

import com.library.entity.Membership;
import com.library.entity.MembershipType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MembershipRepository extends JpaRepository<Membership, Integer> {
    Optional<Membership> findByCode(MembershipType code);
}