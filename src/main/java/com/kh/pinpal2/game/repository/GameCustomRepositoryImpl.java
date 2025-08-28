package com.kh.pinpal2.game.repository;

import com.kh.pinpal2.game.entity.Game;
import com.kh.pinpal2.game.entity.GameType;
import com.kh.pinpal2.game.entity.QGame;
import com.kh.pinpal2.scoreboard.entity.QScoreboard;
import com.kh.pinpal2.user.entity.QUser;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.Tuple;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class GameCustomRepositoryImpl implements GameCustomRepository {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<Game> findAllByClubId(Long clubId, Instant cursor, int size) {
        QGame game = QGame.game;

        BooleanBuilder builder = new BooleanBuilder();
        builder.and(game.club.id.eq(clubId));

        if (cursor != null) {
            builder.and(game.createdAt.gt(cursor));
        }

        return queryFactory
                .select(
                        game
                )
                .from(game)
                .where(builder)
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

    @Override
    public List<Game> findAllByClubIdAndFilter(Long clubId, LocalDate startDate, LocalDate endDate, String type) {
        QGame game = QGame.game;

        BooleanBuilder builder = new BooleanBuilder();
        builder.and(game.club.id.eq(clubId));
        builder.and(game.status.eq("FINISHED"));

        // 날짜 범위 필터링
        if (startDate != null) {
            builder.and(game.date.goe(startDate));
        }
        if (endDate != null) {
            builder.and(game.date.loe(endDate));
        }

        // 게임 타입 필터링
        if (type != null && !type.isEmpty()) {
            builder.and(game.type.eq(GameType.valueOf(type)));
        }

        return queryFactory
                .select(game)
                .from(game)
                .where(builder)
                .orderBy(game.date.desc(), game.time.desc())
                .fetch();
    }
}
