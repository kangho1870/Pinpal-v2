package com.kh.pinpal2.game.repository;

import com.kh.pinpal2.game.entity.QGame;
import com.kh.pinpal2.scoreboard.entity.QScoreboard;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.Tuple;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class GameCustomRepositoryImpl implements GameCustomRepository {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<Tuple> findAllByClubId(Long clubId, Instant cursor, int size) {
        QGame game = QGame.game;
        QScoreboard scoreboard = QScoreboard.scoreboard;

        BooleanBuilder builder = new BooleanBuilder();
        builder.and(game.club.id.eq(clubId));

        if (cursor != null) {
            builder.and(game.createdAt.gt(cursor));
        }

        return queryFactory
                .select(
                        game,
                        scoreboard.count()
                )
                .from(game)
                .leftJoin(scoreboard).on(scoreboard.game.eq(game))
                .where(builder)
                .groupBy(game.id, game.name, game.type, game.confirmCode, game.scoreCounting, 
                        game.date, game.time, game.status, game.isDelete, game.club.id, 
                        game.createdAt, game.updatedAt)
                .orderBy(game.createdAt.desc())
                .limit(size + 1)
                .fetch();
    }

    @Override
    public long countByClubIdAndCursor(Long clubId, Instant cursor) {
        QGame game = QGame.game;

        BooleanBuilder builder = new BooleanBuilder();
        builder.and(game.club.id.eq(clubId));

        if (cursor != null) {
            builder.and(game.createdAt.gt(cursor));
        }

        return queryFactory
                .select(game.count())
                .from(game)
                .where(builder)
                .fetchOne();
    }
}
