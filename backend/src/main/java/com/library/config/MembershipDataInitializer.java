package com.library.config;

import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.library.entity.Membership;
import com.library.entity.User;
import com.library.repository.MembershipRepository;
import com.library.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Component
@Transactional
@RequiredArgsConstructor
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class MembershipDataInitializer implements ApplicationRunner {

    private final MembershipRepository membershipRepository;
    private final UserRepository userRepository;

    @Override
    public void run(ApplicationArguments args) {
        Membership freePlan = upsertPlan(
                "FREE",
                "Goi mien phi",
                0D,
                3,
                20000D,
                false,
                "Muon toi da 3 cuon. Phi giao sach tan nha 20.000d / don.");

        upsertPlan(
                "PREMIUM",
                "Goi Premium",
                49000D,
                6,
                0D,
                true,
                "Muon toi da 6 cuon. Mien phi giao sach va uu tien xu ly.");

        assignFreePlanToUsersWithoutMembership(freePlan);
    }

    private Membership upsertPlan(
            String code,
            String name,
            Double pricePerMonth,
            Integer maxBorrowLimit,
            Double deliveryFee,
            Boolean priorityProcessing,
            String benefitsDescription
    ) {
        Membership plan = membershipRepository.findByCode(code)
                .orElseGet(() -> Membership.builder().code(code).build());

        plan.setName(name);
        plan.setPricePerMonth(pricePerMonth);
        plan.setMaxBorrowLimit(maxBorrowLimit);
        plan.setDeliveryFee(deliveryFee);
        plan.setPriorityProcessing(priorityProcessing);
        plan.setBenefitsDescription(benefitsDescription);

        return membershipRepository.save(plan);
    }

    private void assignFreePlanToUsersWithoutMembership(Membership freePlan) {
        List<User> usersWithoutMembership = userRepository.findAll()
                .stream()
                .filter(user -> user.getMembership() == null)
                .toList();

        if (usersWithoutMembership.isEmpty()) {
            return;
        }

        usersWithoutMembership.forEach(user -> user.setMembership(freePlan));
        userRepository.saveAll(usersWithoutMembership);
    }
}
