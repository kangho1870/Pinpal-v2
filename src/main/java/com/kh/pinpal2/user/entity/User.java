package com.kh.pinpal2.user.entity;

import com.kh.pinpal2.auth.dto.SignUpReqDto;
import com.kh.pinpal2.base.entity.BaseUpdatableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tbl_user")
@Getter
@NoArgsConstructor
public class User extends BaseUpdatableEntity {

    @Column
    private String name;

    @Column
    private String email;

    @Column
    private String password;

    @Column
    private int gender;

    @Enumerated(EnumType.STRING)
    @Column
    private Role role;

    @Column
    private String snsId;

    @Column
    private String joinPath;

    @Column
    private String birth;

    @Column
    private String profile;

    public User(SignUpReqDto signUpReqDto) {
        this.name = signUpReqDto.getName();
        this.email = signUpReqDto.getEmail();
        this.gender = signUpReqDto.getGender();
        this.snsId = signUpReqDto.getSnsId();
        this.joinPath = signUpReqDto.getJoinPath();
        this.birth = signUpReqDto.getBirth();
        this.profile = signUpReqDto.getProfileImageUrl();
        this.role = Role.USER;
    }

    public void updateProfile(String profile) {
        this.profile = profile;
    }

}
