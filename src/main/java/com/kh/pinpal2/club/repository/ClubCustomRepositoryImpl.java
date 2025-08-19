package com.kh.pinpal2.club.repository;

import com.kh.pinpal2.club.entity.Club;
import com.kh.pinpal2.club.entity.QClub;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class ClubCustomRepositoryImpl implements ClubCustomRepository {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<Club> getAllClubs(Instant cursor, int size) {
        QClub club = QClub.club;

        BooleanBuilder booleanBuilder = new BooleanBuilder();

        if (cursor != null) {
            booleanBuilder.and(club.createdAt.gt(cursor));
        }
        return queryFactory
                .select(club)
                .from(club)
                .where(booleanBuilder)
                .limit(size + 1)
                .fetch();
    }

    @Override
    public long countByCursor(Instant cursor) {
        QClub club = QClub.club;

        BooleanBuilder booleanBuilder = new BooleanBuilder();
        if (cursor != null) {
            booleanBuilder.and(club.createdAt.gt(cursor));
        }

        return queryFactory
                .select(club.count())
                .from(club)
                .where(booleanBuilder)
                .fetchOne();
    }

    @Override
    public List<Club> getAllClubsByPage(int offset, int pageSize) {
        QClub club = QClub.club;

        return queryFactory
                .select(club)
                .from(club)
                .orderBy(club.createdAt.desc())
                .offset(offset)
                .limit(pageSize)
                .fetch();
    }
}
