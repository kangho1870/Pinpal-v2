package com.kh.pinpal2.scoreboard.repository;

import com.kh.pinpal2.club.entity.QClub;
import com.kh.pinpal2.game.entity.QGame;
import com.kh.pinpal2.scoreboard.dto.ScoreboardMemberRow;
import com.kh.pinpal2.scoreboard.entity.QScoreboard;
import com.kh.pinpal2.user.entity.QUser;
import com.kh.pinpal2.user_club.entity.QUserClub;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class ScoreboardCustomRepositoryImpl implements ScoreboardCustomRepository {

    private final JPAQueryFactory queryFactory;

    @Override
    public long countByGameId(Long gameId) {
        QScoreboard scoreboard = QScoreboard.scoreboard;

        return queryFactory
                .select(scoreboard.count())
                .from(scoreboard)
                .where(scoreboard.game.id.eq(gameId))
                .fetchOne();
    }

    @Override
    public List<ScoreboardMemberRow> findAllWithMemberMetaByGameId(Long gameId) {
        QScoreboard s = QScoreboard.scoreboard;
        QUser user = QUser.user;
        QGame game = QGame.game;
        QClub club = QClub.club;
        QUserClub userClub = QUserClub.userClub;

        return queryFactory
                .select(Projections.constructor(ScoreboardMemberRow.class,
                        s.id,
                        user.id, user.name, user.profile,
                        game.id, game.name, game.scoreCounting, game.cardDrow,
                        s.score1, s.score2, s.score3, s.score4,
                        s.grade, s.confirmed, s.sideAvg, s.side, s.teamNumber,
                        userClub.role, s.avg, user.gender
                ))
                .from(s)
                .join(s.user, user)
                .join(s.game, game)
                .join(game.club, club)
                .leftJoin(userClub)
                .on(userClub.user.id.eq(user.id)
                        .and(userClub.club.id.eq(club.id)))
                .where(s.game.id.eq(gameId))
                .fetch();
    }
}
