package com.kh.pinpal2.user_club.entity;

import com.kh.pinpal2.base.entity.BaseUpdatableEntity;
import com.kh.pinpal2.club.entity.Club;
import com.kh.pinpal2.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserClub extends BaseUpdatableEntity {

    @Column
    private int avg;

    @Column
    private int grade;

    @Enumerated(EnumType.STRING)
    @Column
    private ClubRole role;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "club_id")
    private Club club;

    public UserClub(User user, Club club) {
        this.user = user;
        this.club = club;
        this.avg = 0;
        this.grade = 0;
        this.role = ClubRole.MEMBER;
    }

    public UserClub(User user, Club club, ClubRole role) {
        this.user = user;
        this.club = club;
        this.avg = 0;
        this.grade = 0;
        this.role = role;
    }
}
