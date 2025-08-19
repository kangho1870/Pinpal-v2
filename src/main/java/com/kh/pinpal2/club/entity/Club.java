package com.kh.pinpal2.club.entity;

import com.kh.pinpal2.base.entity.BaseUpdatableEntity;
import com.kh.pinpal2.club.dto.ClubCreateDto;
import com.kh.pinpal2.club.dto.ClubUpdateDto;
import com.kh.pinpal2.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
public class Club extends BaseUpdatableEntity {

    @Column
    private String name;

    @Column
    private String description;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User owner;

    public Club(ClubCreateDto clubCreateDto, User user) {
        this.name = clubCreateDto.clubName();
        this.description = clubCreateDto.clubDescription();
        this.owner = user;
    }

    public void update(ClubUpdateDto clubUpdateDto) {
        if (clubUpdateDto.newName() != null && !clubUpdateDto.newName().equals(this.name)) {
            this.name = clubUpdateDto.newName();
        }
        if (clubUpdateDto.newDescription() != null && !clubUpdateDto.newDescription().equals(this.description)) {
            this.description = clubUpdateDto.newDescription();
        }
    }
}
