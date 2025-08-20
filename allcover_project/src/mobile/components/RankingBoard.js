import { useState, useRef, useEffect, useCallback } from "react";
import 'animate.css';
import styles from "../css/components/RankingBoard.module.css";
import useScoreboard from "../../stores/useScoreboardStore";
import useSignInStore from "../../stores/useSignInStore";

function RankingBoard({ sideRankingModalToggle, scoreInputModalToggle }) {
    const { members = [] } = useScoreboard();
    const { signInUser } = useSignInStore();
    const memberId = signInUser?.id || null;
    const [showMyScore, setShowMyScore] = useState(false);
    const myScoreRef = useRef(null);
    const scrollContainerRef = useRef(null);

    // 점수 집계 종료 상태 확인 (게임 종료와 동일)
    const isScoreCountingStopped = members.length > 0 && members[0]?.scoreCounting === false;
    
    // 점수 입력이 차단되어야 하는 상태 (점수 집계 종료)
    const isScoreInputBlocked = isScoreCountingStopped;

    const getCardClass = (grade) => {
        switch (grade) {
            case 0:
                return styles.scoreCard0;
            case 1:
                return styles.scoreCard1;
            case 2:
                return styles.scoreCard2;
            case 3:
                return styles.scoreCard3;
            case 4:
                return styles.scoreCard4;
            case 5:
                return styles.scoreCard5;
            case 6:
                return styles.scoreCard6;    
            default:
                return "";
        }
    };

    function getAvgScore(...scores) {
        const validScores = scores.filter(score => score !== null && score !== undefined);
        const totalScore = validScores.reduce((acc, score) => acc + score, 0);
        if (validScores.length === 0) return 0;
        const avg = totalScore / validScores.length;
        return Number.isInteger(avg) ? avg : avg.toFixed(0);
    }

    const sortedMembers = Array.isArray(members) ? [...members].sort((a, b) => {
        const totalA = (a?.game1 || 0) + (a?.game2 || 0) + (a?.game3 || 0) + (a?.game4 || 0);
        const totalB = (b?.game1 || 0) + (b?.game2 || 0) + (b?.game3 || 0) + (b?.game4 || 0);
        return totalB - totalA;
    }) : [];

    const topTotalScore = sortedMembers.length > 0 
        ? (sortedMembers[0]?.game1 || 0) + (sortedMembers[0]?.game2 || 0) + (sortedMembers[0]?.game3 || 0) + (sortedMembers[0]?.game4 || 0) 
        : 0;

    // 내 점수 인덱스 찾기
    const myScoreIndex = sortedMembers.findIndex(member => member?.memberId === memberId);

    // 페이지 진입 시 내 점수 카드를 중앙으로 스크롤
    useEffect(() => {
        if (myScoreIndex >= 0 && myScoreRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const cardElement = myScoreRef.current;
            const containerHeight = container.clientHeight;
            const cardHeight = cardElement.offsetHeight;
            const cardTop = cardElement.offsetTop;
            
            // 카드를 컨테이너 중앙에 위치시키기 위한 스크롤 위치 계산
            const scrollTop = cardTop - (containerHeight / 2) + (cardHeight / 2);
            
            container.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
            });
        }
    }, [myScoreIndex, sortedMembers]);

    const findMyScore = () => {
        if (myScoreIndex >= 0) {
            setShowMyScore(true);
            if (myScoreRef.current && scrollContainerRef.current) {
                const container = scrollContainerRef.current;
                const cardElement = myScoreRef.current;
                const containerHeight = container.clientHeight;
                const cardHeight = cardElement.offsetHeight;
                const cardTop = cardElement.offsetTop;
                
                const scrollTop = cardTop - (containerHeight / 2) + (cardHeight / 2);
                
                container.scrollTo({
                    top: scrollTop,
                    behavior: 'smooth'
                });
                
                // 3초 후 애니메이션 효과 제거
                setTimeout(() => setShowMyScore(false), 3000);
            }
        }
    };

    return (
        <div className={styles.rankingBoardMain}>
            <div 
                className={styles.scoreCardBox}
                ref={scrollContainerRef}
            >
                {sortedMembers.map((member, index) => {
                    if (!member) return null;
                    const memberTotalScore = (member?.game1 || 0) + (member?.game2 || 0) + (member?.game3 || 0) + (member?.game4 || 0);
                    const scoreDifference = topTotalScore - memberTotalScore;
                    const isMyScore = memberId === member?.memberId;
                    
                    return (
                        <div 
                            key={index} 
                            className={`${styles.scoreCard} ${getCardClass(member?.grade)} ${isMyScore ? styles.myScoreCard : ""}`}
                            ref={isMyScore ? myScoreRef : null}
                        >
                            {/* 순위 배지 */}
                            <div className={styles.rankBadge}>
                                <span className={styles.rankNumber}>{index + 1}</span>
                                {/* 1등과의 핀 차이 표시 */}
                                {index > 0 && scoreDifference > 0 && (
                                    <div className={styles.pinDifference}>
                                        <span>-{scoreDifference}</span>
                                    </div>
                                )}
                            </div>

                            {/* 프로필 섹션 */}
                            <div className={styles.profileSection}>
                                <div className={styles.profileImageContainer}>
                                    {member?.memberProfile ? (
                                        <img className={styles.profileImage} src={member?.memberProfile} alt="Profile" />
                                    ) : (
                                        <div className={styles.defaultProfile}>
                                            <i className="fa-solid fa-user"></i>
                                        </div>
                                    )}
                                    {member?.memberRole === "MASTER" && 
                                        <img className={styles.roleBadge} src={require("../../imges/club/master.png")} alt="Master" />
                                    }
                                    {member?.memberRole === "STAFF" && 
                                        <img className={styles.roleBadge} src={require("../../imges/club/staff.png")} alt="Staff" />
                                    }
                                </div>
                                <div className={styles.memberInfo}>
                                    <h3 className={styles.memberName}>{member?.memberName}</h3>
                                    <div className={styles.memberDetails}>
                                        <span className={styles.gradeInfo}>
                                            {member?.grade === 0 ? "신입" : `${member?.grade}군`}
                                        </span>
                                        <span className={styles.avgInfo}>
                                            에버: {member?.memberAvg == 0 ? "신입" : member?.memberAvg}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 점수 섹션 */}
                            <div className={styles.scoreSection}>
                                <div className={styles.scoreGrid}>
                                    <div className={styles.scoreItem}>
                                        <span className={styles.gameLabel}>1G</span>
                                        <span className={`${styles.gameScore} ${(member && member?.game1 >= 200) ? styles.highScore : ""}`}>
                                            {member?.game1 == null ? "-" : member?.game1}
                                        </span>
                                    </div>
                                    <div className={styles.scoreItem}>
                                        <span className={styles.gameLabel}>2G</span>
                                        <span className={`${styles.gameScore} ${(member && member?.game2 >= 200) ? styles.highScore : ""}`}>
                                            {member?.game2 == null ? "-" : member?.game2}
                                        </span>
                                    </div>
                                    <div className={styles.scoreItem}>
                                        <span className={styles.gameLabel}>3G</span>
                                        <span className={`${styles.gameScore} ${(member && member?.game3 >= 200) ? styles.highScore : ""}`}>
                                            {member?.game3 == null ? "-" : member?.game3}
                                        </span>
                                    </div>
                                    <div className={styles.scoreItem}>
                                        <span className={styles.gameLabel}>4G</span>
                                        <span className={`${styles.gameScore} ${(member && member?.game4 >= 200) ? styles.highScore : ""}`}>
                                            {member?.game4 == null ? "-" : member?.game4}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className={styles.totalSection}>
                                    <div className={styles.totalItem}>
                                        <span className={styles.totalLabel}>평균</span>
                                        <span className={`${styles.totalScore} ${getAvgScore(member?.game1, member?.game2, member?.game3, member?.game4) >= 200 ? styles.highScore : ""}`}>
                                            {getAvgScore(member?.game1, member?.game2, member?.game3, member?.game4)}
                                        </span>
                                    </div>
                                    <div className={styles.totalItem}>
                                        <span className={styles.totalLabel}>총점</span>
                                        <span className={`${styles.totalScore} ${(member && memberTotalScore >= 800) ? styles.highScore : ""}`}>
                                            {memberTotalScore}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 내 점수 강조 효과 */}
                            {isMyScore && showMyScore && (
                                <div className={styles.myScoreHighlight}>
                                    <i className="fa-solid fa-star"></i>
                                    내 점수
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 하단 버튼들 */}
            <div className={styles.modalContainer}>
                <div className={styles.modalBox}>
                    <div className={styles.modal} onClick={sideRankingModalToggle}>
                        <i className="fa-solid fa-ranking-star"></i>
                        <span className={styles.title}>사이드 순위</span>
                    </div>
                </div>
                <div className={`${styles.modalBox} ${isScoreInputBlocked ? styles.disabled : ""}`}>
                    <div 
                        className={`${styles.modal} ${isScoreInputBlocked ? styles.disabledModal : ""}`} 
                        onClick={isScoreInputBlocked ? null : scoreInputModalToggle}
                        style={{ cursor: isScoreInputBlocked ? 'not-allowed' : 'pointer' }}
                    >
                        <i className="fa-solid fa-plus-minus"></i>
                        <span className={styles.title}>
                            {isScoreCountingStopped ? "점수 집계 종료" : "점수 입력"}
                        </span>
                    </div>
                </div>
                <div className={styles.modalBox}>
                    <div className={styles.modal} onClick={findMyScore}>
                        <i className="fa-solid fa-star"></i>
                        <span className={styles.title}>내 점수 찾기</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RankingBoard;