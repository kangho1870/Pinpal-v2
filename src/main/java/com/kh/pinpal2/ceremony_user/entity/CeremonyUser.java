package com.kh.pinpal2.ceremony_user.entity;

import com.kh.pinpal2.base.entity.BaseUpdatableEntity;
import com.kh.pinpal2.ceremony.entity.Ceremony;
import com.kh.pinpal2.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class CeremonyUser extends BaseUpdatableEntity {

    @Column
    private int score;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "ceremony_id")
    private Ceremony ceremony;
}
