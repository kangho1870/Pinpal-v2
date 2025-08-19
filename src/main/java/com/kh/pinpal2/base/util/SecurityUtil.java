package com.kh.pinpal2.base.util;

import com.kh.pinpal2.base.exception.user.UserNotFoundException;
import com.kh.pinpal2.user.entity.User;
import com.kh.pinpal2.user.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtil {

    public static User getCurrentUser(UserRepository userRepository) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        return userRepository.findByEmail(userEmail)
                .orElseThrow(UserNotFoundException::new);
    }
}
