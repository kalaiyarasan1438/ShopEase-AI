package com.shopeasy.repository;

import com.shopeasy.entity.User;
import com.shopeasy.entity.Vendor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, Long> {
    Optional<Vendor> findByUserId(Long userId);
    Optional<Vendor> findByUser(User user);
    boolean existsByUserId(Long userId);
    Page<Vendor> findByStatus(Vendor.VendorStatus status, Pageable pageable);
    long countByStatus(Vendor.VendorStatus status);
}
