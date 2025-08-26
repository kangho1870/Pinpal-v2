import { useEffect, useState, useCallback } from "react";
import styles from "../css/components/GameResult.module.css";
import useScoreboard from "../../stores/useScoreboardStore";
import { useSearchParams } from "react-router-dom";
import useSignInStore from "../../stores/useSignInStore";
import { scoreboardGameStop } from "../../apis";
import { useCookies } from "react-cookie";
import { ACCESS_TOKEN } from "../../constants";
import noProfileUrl from "../../imges/user-img/no-profile-url.png";

export default function GameResult() {
    const { signInUser } = useSignInStore();
    const [cookies] = useCookies();
    const token = cookies[ACCESS_TOKEN];
    const { members = [], team1stMember, setTeam1stMember } = useScoreboard();
    const [scoreCounting, setScoreCounting] = useState(true);
    const [searchParams] = useSearchParams();
    const gameId = searchParams.get("gameId");
    const clubId = searchParams.get("clubId");
    
    // 현재 사용자의 클럽 역할은 멤버 목록에서 가져와야 함
    const getCurrentUserClubRole = () => {
        if (!members || !signInUser) return null;
        const currentMember = members.find(member => member.memberId === signInUser.id);
        return currentMember?.memberRole || null;
    };
    const roles = getCurrentUserClubRole();

    const findCurrentUser = useCallback(() => {
        if (members.length > 0 && members[0] && typeof members[0].scoreCounting !== 'undefined') {
            const newScoreCounting = members[0].scoreCounting;
            console.log('GameResult - scoreCounting 상태 업데이트:', newScoreCounting);
            setScoreCounting(newScoreCounting);
        }
    }, [members]);

    useEffect(() => {
        findCurrentUser();
    }, [findCurrentUser]);

    // 팀 1등 계산 함수 (TeamScoreboard와 동일한 로직)
    const calculateTeam1st = useCallback(() => {
        console.log('🔍 GameResult - calculateTeam1st 호출됨');
        console.log('🔍 members:', members);
        
        const teams = Array.isArray(members) ? members.reduce((acc, member) => {
            if (!member) return acc;
            if (!acc[member.teamNumber]) {
                acc[member.teamNumber] = [];
            }
            acc[member.teamNumber].push(member);
            return acc;
        }, {}) : {};
        
        console.log('🔍 teams:', teams);
        
        const teamScores = Object.keys(teams).map(teamNumber => {
            const teamMembers = teams[teamNumber];
            if (!Array.isArray(teamMembers)) return null;
            const hasZeroScore1 = teamMembers.some(member => member?.game1 === null);
            const hasZeroScore2 = teamMembers.some(member => member?.game2 === null);
            const hasZeroScore3 = teamMembers.some(member => member?.game3 === null);
            const hasZeroScore4 = teamMembers.some(member => member?.game4 === null);
            const totalScore = teamMembers.reduce((sum, member) => {
                    const game1Score = hasZeroScore1 ? 0 : (member?.game1 || 0) - (member?.memberAvg || 0);
                    const game2Score = hasZeroScore2 ? 0 : (member?.game2 || 0) - (member?.memberAvg || 0);
                    const game3Score = hasZeroScore3 ? 0 : (member?.game3 || 0) - (member?.memberAvg || 0);
                    const game4Score = hasZeroScore4 ? 0 : (member?.game4 || 0) - (member?.memberAvg || 0);
                    return sum + game1Score + game2Score + game3Score + game4Score;
                }, 0);
            return {
                teamNumber,
                members: teamMembers,
                totalScore
            };
        }).filter(Boolean);

        console.log('🔍 teamScores:', teamScores);

        const sortedTeams = teamScores
            .filter(team => team?.teamNumber !== "0" && team?.teamNumber !== 0)
            .sort((a, b) => b.totalScore - a.totalScore);

        console.log('🔍 sortedTeams:', sortedTeams);
        console.log('🔍 팀 1등 멤버 IDs:', sortedTeams.length > 0 ? sortedTeams[0]?.members?.map(member => member?.memberId) : []);

        return sortedTeams.length > 0 ? sortedTeams[0]?.members?.map(member => member?.memberId) : [];
    }, [members]);

    // 팀 1등 계산 및 스토어에 저장
    useEffect(() => {
        if (members && members.length > 0) {
            console.log('🔍 GameResult - 팀 1등 계산 useEffect 실행');
            const calculatedTeam1st = calculateTeam1st();
            if (calculatedTeam1st && calculatedTeam1st.length > 0) {
                const team1stMembers = members.filter(member => 
                    calculatedTeam1st.includes(member.memberId)
                );
                const teamMember = {
                    ids: calculatedTeam1st,
                    members: team1stMembers
                };
                console.log('🔍 GameResult - 팀 1등 스토어에 저장:', teamMember);
                setTeam1stMember(teamMember);
            }
        }
    }, [members, calculateTeam1st, setTeam1stMember]);

    const sortedMembers = Array.isArray(members) ? [...members].sort((a, b) => {
        const totalA = (a?.game1 || 0) + (a?.game2 || 0) + (a?.game3 || 0) + (a?.game4 || 0);
        const totalB = (b?.game1 || 0) + (b?.game2 || 0) + (b?.game3 || 0) + (b?.game4 || 0);
        return totalB - totalA;
    }) : [];

    const topTotalScore = sortedMembers.length > 0 
        ? (sortedMembers[0]?.game1 || 0) + (sortedMembers[0]?.game2 || 0) + (sortedMembers[0]?.game3 || 0) + (sortedMembers[0]?.game4 || 0) 
        : 0;

    // 총핀 1등 (합계 점수가 가장 높은 사람)
    const total1stMember = sortedMembers[0];

    // 에버 1위 (총핀 1등을 제외하고 4게임 평균 점수가 자신의 평균 점수보다 가장 높은 사람)
    const getAvgTopScoreMember = () => {
        const excludedMemberId = total1stMember?.memberId;
        const eligibleMembers = members.filter(member => member?.memberId !== excludedMemberId);
        
        return eligibleMembers.reduce((best, current) => {
            const currentAvg = ((current?.game1 || 0) + (current?.game2 || 0) + (current?.game3 || 0) + (current?.game4 || 0)) / 4;
            const currentDiff = currentAvg - (current?.memberAvg || 0);
            
            const bestAvg = ((best?.game1 || 0) + (best?.game2 || 0) + (best?.game3 || 0) + (best?.game4 || 0)) / 4;
            const bestDiff = bestAvg - (best?.memberAvg || 0);
            
            return currentDiff > bestDiff ? current : best;
        }, eligibleMembers[0]);
    };

    const avgTopScoreMember = getAvgTopScoreMember();

    // 각 군 1등 (총핀 1등을 제외하고 4게임 평균 점수가 자신의 평균 점수보다 가장 높은 사람)
    const getTopMembersByGrade = () => {
        const excludedMemberId = total1stMember?.memberId;
        const grades = [1, 2, 3, 4, 5, 6];
        const gradeWinners = [];
        
        grades.forEach(grade => {
            const gradeMembers = members.filter(member => 
                member?.grade === grade && member?.memberId !== excludedMemberId
            );
            
            if (gradeMembers.length === 0) {
                gradeWinners.push(null);
                return;
            }
            
            const gradeWinner = gradeMembers.reduce((best, current) => {
                const currentAvg = ((current?.game1 || 0) + (current?.game2 || 0) + (current?.game3 || 0) + (current?.game4 || 0)) / 4;
                const currentDiff = currentAvg - (current?.memberAvg || 0);
                
                const bestAvg = ((best?.game1 || 0) + (best?.game2 || 0) + (best?.game3 || 0) + (best?.game4 || 0)) / 4;
                const bestDiff = bestAvg - (best?.memberAvg || 0);
                
                return currentDiff > bestDiff ? current : best;
            });
            
            gradeWinners.push(gradeWinner);
        });
        
        return gradeWinners;
    };

    const topMembers = getTopMembersByGrade();
    const grade1stId = topMembers[0]?.memberId || null;
    const grade2stId = topMembers[1]?.memberId || null;
    const grade3stId = topMembers[2]?.memberId || null;
    const grade4stId = topMembers[3]?.memberId || null;
    const grade5stId = topMembers[4]?.memberId || null;
    const grade6stId = topMembers[5]?.memberId || null;

    // 하이스코어 (총핀 1등 제외)
    const getHighScoreMember = (gender) => {
        const excludedMemberId = total1stMember?.memberId;
        const eligibleMembers = members.filter(member => 
            member?.memberId !== excludedMemberId && member?.gender === gender
        );
        
        if (eligibleMembers.length === 0) return null;
        
        return eligibleMembers.reduce((best, current) => {
            const currentHighest = Math.max(current?.game1 || 0, current?.game2 || 0, current?.game3 || 0, current?.game4 || 0);
            const bestHighest = Math.max(best?.game1 || 0, best?.game2 || 0, best?.game3 || 0, best?.game4 || 0);
            return currentHighest > bestHighest ? current : best;
        });
    };

    const highScoreOfMan = getHighScoreMember(0);
    const highScoreOfGirl = getHighScoreMember(1);

    // 팀 1등 멤버들의 ID 추출 (TeamScoreboard에서 계산된 값이 있으면 사용, 없으면 직접 계산)
    const team1stMemberIds = team1stMember?.members?.map(member => member.memberId) || calculateTeam1st();
    
    console.log('🔍 GameResult - team1stMember:', team1stMember);
    console.log('🔍 GameResult - team1stMemberIds:', team1stMemberIds);
    
    const resultSetOfLong = {
        gameId: gameId,
        clubId: clubId,
        pin1st: total1stMember?.memberId || null,
        avgTopScoreMember: avgTopScoreMember?.memberId || null,
        grade1st: grade1stId,
        grade2st: grade2stId,
        grade3st: grade3stId,
        grade4st: grade4stId,
        grade5st: grade5stId,
        grade6st: grade6stId,
        highScoreOfMan: highScoreOfMan?.memberId || null,
        highScoreOfGirl: highScoreOfGirl?.memberId || null,
        team1stIds: team1stMemberIds
    }

    const stopGameResponse = (responseBody) => {
        console.log('게임 종료 응답:', responseBody);
        
        // void 응답의 경우 responseBody가 null이거나 빈 객체일 수 있음
        // HTTP 200 OK이면 성공으로 처리
        if (responseBody === null || responseBody === undefined || Object.keys(responseBody).length === 0) {
            alert('게임이 종료되었습니다.');
            // 게임 종료 후 페이지 새로고침하여 최신 상태 반영
            window.location.reload();
            return;
        }
        
        // 에러 응답이 있는 경우
        if (responseBody.code && responseBody.code !== 'SU') {
            const message = 
                responseBody.code === 'VF' ? '올바른 데이터가 아닙니다.' :
                responseBody.code === 'DBE' ? '서버에 문제가 있습니다.' :
                responseBody.message || '게임 종료 중 오류가 발생했습니다.';
            alert(message);
            return;
        }
        
        // 기타 성공 응답
        alert('게임이 종료되었습니다.');
        window.location.reload();
    };
    const stopGameRequest = () => {
        scoreboardGameStop(resultSetOfLong, token).then(stopGameResponse);
    }

    return (
        <div className={styles.container}>
            {scoreCounting === false && sortedMembers?.length > 0 ? (
                <div className={styles.mainArea}>
                    <div className={styles.gameResultBox}>
                        <div className={styles.resultHeader}>
                            <h2>🏆 시상 결과</h2>
                        </div>
                        
                        <div className={styles.total1stBox}>
                            <div className={styles.medalContainer}>
                                <img className={styles.total1stImg} src={require("../../imges/gameResult-img/1st-PNG.png")} alt="총핀 1위"/>
                                <div className={styles.memberBox}>
                                    <p className={styles.awardTitle}>총핀 1위</p>
                                    <div className={styles.memberProfileBox}>
                                        <img className={styles.memberProfile} src={sortedMembers[0]?.memberProfile || noProfileUrl} alt="프로필"/>
                                        <h3 className={styles.memberName}>{sortedMembers[0]?.memberName || '-'}</h3>
                                        <p className={styles.totalScore}>{topTotalScore}점</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className={styles.total1stBox}>
                            <div className={styles.medalContainer}>
                                <img className={styles.total1stImg} src={require("../../imges/gameResult-img/1st-PNG.png")} alt="에버 1위"/>
                                <div className={styles.memberBox}>
                                    <p className={styles.awardTitle}>에버 1위</p>
                                    <div className={styles.memberProfileBox}>
                                        <img className={styles.memberProfile} src={avgTopScoreMember?.memberProfile || noProfileUrl} alt="프로필"/>
                                        <h3 className={styles.memberName}>{avgTopScoreMember?.memberName || '-'}</h3>
                                        <p className={styles.avgScore}>
                                            {avgTopScoreMember ? 
                                                `${((avgTopScoreMember?.game1 || 0) + (avgTopScoreMember?.game2 || 0) + (avgTopScoreMember?.game3 || 0) + (avgTopScoreMember?.game4 || 0)) / 4}점` 
                                                : '-'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* 각 군 1위에 대한 섹션 */}
                        <div className={styles.gradeSection}>
                            <h3 className={styles.sectionTitle}>🏅 군별 1등</h3>
                            <div className={styles.gradeGrid}>
                                {topMembers.map((grade, index) => (
                                    grade && (
                                        <div className={styles.gradeCard} key={index}>
                                            <div className={styles.gradeHeader}>
                                                <span className={styles.gradeNumber}>{index + 1}군</span>
                                            </div>
                                            <div className={styles.memberProfileBox}>
                                                <img className={styles.memberProfile} src={grade?.memberProfile || noProfileUrl} alt="프로필" />
                                                <h3 className={styles.memberName}>{grade?.memberName || '-'}</h3>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                        
                        <div className={styles.highScoreSection}>
                            <h3 className={styles.sectionTitle}>🎯 하이스코어</h3>
                            <div className={styles.highScoreGrid}>
                                {highScoreOfMan && (
                                    <div className={styles.highScoreCard}>
                                        <div className={styles.highScoreHeader}>
                                            <img className={styles.highScoreImg} src={require("../../imges/gameResult-img/highScore-png.png")} alt="하이스코어"/>
                                            <span className={styles.genderLabel}>남자</span>
                                        </div>
                                        <div className={styles.memberProfileBox}>
                                            <img className={styles.memberProfile} src={highScoreOfMan?.memberProfile || noProfileUrl} alt="프로필"/>
                                            <h3 className={styles.memberName}>{highScoreOfMan?.memberName || '-'}</h3>
                                        </div>
                                    </div>
                                )}
                                {highScoreOfGirl && (
                                    <div className={styles.highScoreCard}>
                                        <div className={styles.highScoreHeader}>
                                            <img className={styles.highScoreImg} src={require("../../imges/gameResult-img/highScore-png.png")} alt="하이스코어"/>
                                            <span className={styles.genderLabel}>여자</span>
                                        </div>
                                        <div className={styles.memberProfileBox}>
                                            <img className={styles.memberProfile} src={highScoreOfGirl?.memberProfile || noProfileUrl} alt="프로필"/>
                                            <h3 className={styles.memberName}>{highScoreOfGirl?.memberName || '-'}</h3>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {team1stMember?.members && team1stMember.members.length > 0 && (
                            <div className={styles.teamSection}>
                                <h3 className={styles.sectionTitle}>👥 팀 우승</h3>
                                <div className={styles.teamCard}>
                                    <div className={styles.teamHeader}>
                                        <img className={styles.grade1stImg} src={require("../../imges/gameResult-img/team1st-png.png")} alt="팀 1등"/>
                                        <span className={styles.teamLabel}>1등 팀</span>
                                    </div>
                                    <div className={styles.teamMembers}>
                                        {team1stMember?.members?.map((member, index) => (
                                            <div className={styles.teamMember} key={index}>
                                                <img className={styles.memberProfile} src={member?.memberProfile || noProfileUrl} alt="프로필"/>
                                                <h3 className={styles.memberName}>{member?.memberName || '-'}</h3>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {(roles === "STAFF" || roles === "MASTER") && (
                            <div className={styles.gameStopSection}>
                                <button className={styles.gameStopBtn} onClick={stopGameRequest}>
                                    <i className="fa-solid fa-stop-circle"></i>
                                    게임 종료
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <Loading />
            )}
        </div>
    );
}

function Loading() {
    return (
        <div className={styles.countingContainer}>
            <div className={styles.countingBox}>
                <div className={styles.spinner}>
                    <img src={require("../../imges/loading-img/Ball@1x-0.7s-200px-200px.gif")} alt="로딩" />
                    <h4>점수 집계 중입니다...</h4>
                </div>
            </div>
        </div>
    )
}