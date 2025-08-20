package com.kh.pinpal2.ceremony_user.repository;

import com.kh.pinpal2.ceremony_user.entity.CeremonyUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CeremonyUserRepository extends JpaRepository<CeremonyUser,Long> {
    @Modifying
    @Query("DELETE FROM CeremonyUser cu WHERE cu.ceremony.id IN :ceremonyIds")
    void deleteByCeremonyIds(@Param("ceremonyIds") List<Long> ceremonyIds);

    List<CeremonyUser> findAllByCeremonyId(Long id);
}
