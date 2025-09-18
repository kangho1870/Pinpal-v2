package com.kh.pinpal2.game.entity;

import com.kh.pinpal2.base.entity.BaseUpdatableEntity;
import com.kh.pinpal2.club.entity.Club;
import com.kh.pinpal2.game.dto.GameCreateDto;
import com.kh.pinpal2.game.dto.GameUpdateDto;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Getter
@NoArgsConstructor
public class Game extends BaseUpdatableEntity {

    @Column
    private String name;

    @Enumerated(EnumType.STRING)
    @Column
    private GameType type;

    @Column
    private String confirmCode;

    @Column
    private boolean scoreCounting;

    @Column
    private boolean cardDrow;

    @Column
    private LocalDate date;

    @Column
    private LocalTime time;

    @Column
    private String status;

    @Column
    private boolean isDelete;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id")
    private Club club;

    public Game(GameCreateDto gameCreateDto, Club club) {
        this.name = gameCreateDto.gameName();
        this.type = gameCreateDto.gameType();
        this.confirmCode = gameCreateDto.confirmCode();
        this.date = gameCreateDto.date();
        this.time = gameCreateDto.time();
        this.scoreCounting = true;
        this.status = "ACTIVE";
        this.isDelete = false;
        this.club = club;
    }

    public void updateScoreCounting(boolean counting) {
        this.scoreCounting = counting;
    }

    public void update(GameUpdateDto gameUpdateDto) {
        if (gameUpdateDto.newName() != null && !gameUpdateDto.newName().equals(this.name)) {
            this.name = gameUpdateDto.newName();
        }
        if (gameUpdateDto.newType() != null && gameUpdateDto.newType() != this.type) {
            this.type = gameUpdateDto.newType();
        }
        if (gameUpdateDto.newConfirmedCode() != null && !gameUpdateDto.newConfirmedCode().equals(this.confirmCode)) {
            this.confirmCode = gameUpdateDto.newConfirmedCode();
        }
        if (this.scoreCounting != gameUpdateDto.scoreCounting()) {
            this.scoreCounting = gameUpdateDto.scoreCounting();
        }
        if (gameUpdateDto.newDate() != null && !gameUpdateDto.newDate().equals(this.date)) {
            this.date = gameUpdateDto.newDate();
        }
        if (gameUpdateDto.newTime() != null && !gameUpdateDto.newTime().equals(this.time)) {
            this.time = gameUpdateDto.newTime();
        }
        if (gameUpdateDto.status() != null && !gameUpdateDto.status().equals(this.status)) {
            this.status = gameUpdateDto.status();
        }
    }

    public void updateStatus(String finished) {
        this.status = finished;
    }

    public void updateCardDraw() {
        this.cardDrow = !this.cardDrow;
    }
}
