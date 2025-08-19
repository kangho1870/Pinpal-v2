package com.kh.pinpal2.ceremony.entity;

import com.kh.pinpal2.base.entity.BaseUpdatableEntity;
import com.kh.pinpal2.ceremony_user.entity.CeremonyUser;
import com.kh.pinpal2.game.entity.Game;
import jakarta.persistence.*;

import java.util.List;

@Entity
public class Ceremony extends BaseUpdatableEntity {

    @Column
    private String type;

    @Column
    private int grade;

    @Column
    private int rank;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    private Game game;

    @OneToMany(mappedBy = "ceremony", cascade = CascadeType.ALL)
    private List<CeremonyUser> recipients;
}
