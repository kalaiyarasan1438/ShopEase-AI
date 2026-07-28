package com.shopeasy.security;

import com.shopeasy.entity.User;
import com.shopeasy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;
    private final com.shopeasy.repository.VendorRepository vendorRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        boolean isLocked = !user.isEnabled();

        if (user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_VENDOR"))) {
            isLocked = vendorRepository.findByUser(user)
                .map(v -> v.getStatus() != com.shopeasy.entity.Vendor.VendorStatus.APPROVED)
                .orElse(true);
        }

        var authorities = user.getRoles().stream()
            .map(role -> new SimpleGrantedAuthority(role.getName()))
            .collect(Collectors.toSet());

        return org.springframework.security.core.userdetails.User
            .withUsername(user.getEmail())
            .password(user.getPassword())
            .authorities(authorities)
            .accountExpired(false)
            .accountLocked(isLocked)
            .credentialsExpired(false)
            .disabled(!user.isEnabled())
            .build();
    }
}
