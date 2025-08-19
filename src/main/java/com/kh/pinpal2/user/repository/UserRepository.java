package com.kh.pinpal2.user.repository;

import com.kh.pinpal2.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User,Long> {
    Optional<User> findBySnsIdAndJoinPath(String snsId, String registration);

    Optional<User> findByEmail(String name);

    boolean existsByEmail(String email);
}
