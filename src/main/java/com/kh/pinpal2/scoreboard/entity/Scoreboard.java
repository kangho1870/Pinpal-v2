package com.kh.pinpal2.scoreboard.entity;

import com.kh.pinpal2.base.entity.BaseUpdatableEntity;
import com.kh.pinpal2.game.entity.Game;
import com.kh.pinpal2.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Scoreboard extends BaseUpdatableEntity {

    @Column
    private Integer score1;

    @Column
    private Integer score2;

    @Column
    private Integer score3;

    @Column
    private Integer score4;

    @Column
    private Integer grade;

    @Column
    private Integer avg;

    @Column
    private boolean confirmed;

    @Column
    private Instant confirmDate;

    @Column
    private Integer teamNumber;

    @Column
    private boolean side;

    @Column
    private boolean sideAvg;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    private Game game;

    public Scoreboard(Game game, User user, int avg) {
        this.game = game;
        this.user = user;
        this.score1 = 0;
        this.score2 = 0;
        this.score3 = 0;
        this.score4 = 0;
        this.grade = 0;
        this.avg = avg;
        this.teamNumber = 0;
        this.side = false;
        this.sideAvg = false;
        this.confirmed = false;
        this.confirmDate = null;
    }

    public void updateScore(int score1, int score2, int score3, int score4) {
        this.score1 = score1;
        this.score2 = score2;
        this.score3 = score3;
        this.score4 = score4;
    }

    public void updateGrade(int grade) {
        this.grade = grade;
    }

    public void updateTeamNumber(int teamNumber) {
        this.teamNumber = teamNumber;
    }

    public void updateSide(boolean side) {
        this.side = side;
    }

    public void updateSideAvg(boolean sideAvg) {
        this.sideAvg = sideAvg;
    }

    public void updateConfirmed(boolean confirmed) {
        this.confirmed = confirmed;
        this.confirmDate = Instant.now();
    }
}
