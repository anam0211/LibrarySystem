package com.library.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.library.entity.UserAddress;

@Repository
public interface UserAddressRepository extends JpaRepository<UserAddress, Integer> {
    List<UserAddress> findByUser_IdOrderByDefaultAddressDescIdDesc(Integer userId);
    Optional<UserAddress> findByUser_IdAndDefaultAddressTrue(Integer userId);
}
