package com.crypto.identity_service.conffig;

import com.crypto.identity_service.models.Role;
import com.crypto.identity_service.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Initializes default data on application startup
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) {
        initRoles();
    }

    private void initRoles() {
        // Create ROLE_USER if not exists
        if (roleRepository.findByName("ROLE_USER").isEmpty()) {
            Role userRole = Role.builder()
                    .name("ROLE_USER")
                    .description("Standard user role")
                    .build();
            roleRepository.save(userRole);
            log.info("Created default role: ROLE_USER");
        }

        // Create ROLE_VIP if not exists
        if (roleRepository.findByName("ROLE_VIP").isEmpty()) {
            Role vipRole = Role.builder()
                    .name("ROLE_VIP")
                    .description("VIP user with access to AI analysis features")
                    .build();
            roleRepository.save(vipRole);
            log.info("Created default role: ROLE_VIP");
        }

        // Create ROLE_ADMIN if not exists
        if (roleRepository.findByName("ROLE_ADMIN").isEmpty()) {
            Role adminRole = Role.builder()
                    .name("ROLE_ADMIN")
                    .description("Administrator role with full access")
                    .build();
            roleRepository.save(adminRole);
            log.info("Created default role: ROLE_ADMIN");
        }
    }
}
