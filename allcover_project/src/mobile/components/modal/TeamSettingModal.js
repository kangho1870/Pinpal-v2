import { useEffect, useState, useMemo } from "react";
import styles from "../../css/components/modal/CommonModal.module.css";
import { useSearchParams } from "react-router-dom";
import useScoreboard from "../../../stores/useScoreboardStore";
import { useWebSocketContext } from "../../../contexts/WebSocketContext";
import Modal from "../common/Modal";

function TeamSettingModal() {
    const [searchParams] = useSearchParams();
    const gameId = searchParams.get("gameId");
    const { 
        members, 
        toggleTeamModal,
        setCardDrawData,
        setSelectedCards,
        setShowCardDrawModal
    } = useScoreboard();
    const [selectGrade, setSelectGrade] = useState(1);
    const [updatedMembers, setUpdatedMembers] = useState([]);
    const [showTeamInput, setShowTeamInput] = useState(false);
    const [teamCount, setTeamCount] = useState(2);
    const [currentPage, setCurrentPage] = useState(1);
    
    // 24개 팀을 8개씩 3페이지로 나누기
    const totalTeams = 24;
    const teamsPerPage = 8;
    const totalPages = Math.ceil(totalTeams / teamsPerPage);
    
    // 현재 페이지의 팀 번호들 계산
    const getCurrentPageTeams = () => {
        const startTeam = (currentPage - 1) * teamsPerPage + 1;
        const endTeam = Math.min(currentPage * teamsPerPage, totalTeams);
        return Array.from({ length: endTeam - startTeam + 1 }, (_, i) => startTeam + i);
    };
    
    const teamBtns = getCurrentPageTeams();
    
    const { sendAuthenticatedMessage } = useWebSocketContext();

    // 멤버 초기 세팅 (평균 순으로 정렬)
    useEffect(() => {
        if (members && members.length > 0) {
            const sortedMembers = [...members].sort((a, b) => (b.memberAvg || 0) - (a.memberAvg || 0));
            setUpdatedMembers(sortedMembers);
        }
    }, [members]);

    // 각 팀별 인원 수 계산
    const teamCounts = useMemo(() => {
        const counts = {};
        teamBtns.forEach(team => {
            counts[team] = updatedMembers.filter(member => member.teamNumber === team).length;
        });
        counts[0] = updatedMembers.filter(member => member.teamNumber === 0).length; // 미설정
        return counts;
    }, [updatedMembers, teamBtns]);

    const clickGradeBtn = (i) => {
        setSelectGrade(i);
    };

    // 페이지네이션 함수들
    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const setGradeByMember = (memberId) => {
        setUpdatedMembers(prev =>
            prev.map(member =>
                member.memberId === memberId ? { ...member, teamNumber: selectGrade } : member
            )
        );
    };

    const resetGradeByMember = (memberId) => {
        setUpdatedMembers(prev =>
            prev.map(member =>
                member.memberId === memberId ? { ...member, teamNumber: 0 } : member
            )
        );
    };

    const teamRandomSetting = () => {
        setShowTeamInput(true);
    };

    // 카드뽑기 시작
    const startCardDraw = () => {
        // 팀 수 입력 받기
        const teamCount = prompt('몇 팀으로 나누시겠습니까? (2-24팀)', '3');
        
        if (!teamCount || isNaN(teamCount) || teamCount < 2 || teamCount > 24) {
            alert('팀 수는 2팀에서 24팀 사이로 설정해주세요.');
            return;
        }
        
        const teamCountNum = parseInt(teamCount);
        
        // 각 군별 멤버 수 확인
        const gradeGroups = {};
        members.forEach(member => {
            const grade = member.grade || 0;
            if (!gradeGroups[grade]) {
                gradeGroups[grade] = [];
            }
            gradeGroups[grade].push(member);
        });
        
        // 각 군별로 팀에 균등하게 분배
        const cardDrawData = {};
        Object.keys(gradeGroups).forEach(grade => {
            const membersInGrade = gradeGroups[grade];
            const membersPerTeam = Math.floor(membersInGrade.length / teamCountNum);
            const remainingMembers = membersInGrade.length % teamCountNum;
            
            // 각 팀에 배정할 카드 번호 생성
            const teamCards = [];
            
            // 각 팀에 기본 카드 수 배정
            for (let team = 1; team <= teamCountNum; team++) {
                const baseCount = membersPerTeam;
                const extraCount = team <= remainingMembers ? 1 : 0;
                const totalForThisTeam = baseCount + extraCount;
                
                // 해당 팀에 배정할 카드 번호들 추가
                for (let i = 0; i < totalForThisTeam; i++) {
                    teamCards.push(team);
                }
            }
            
            // 카드 섞기
            for (let i = teamCards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [teamCards[i], teamCards[j]] = [teamCards[j], teamCards[i]];
            }
            
            cardDrawData[grade] = teamCards;
        });
        
        const payload = {
            action: "startCardDraw",
            gameId: gameId,
            teamCount: teamCountNum,
            cardDrawData: cardDrawData
        };
        
        const success = sendAuthenticatedMessage(payload);
        if (success) {
            alert(`${teamCountNum}팀으로 카드뽑기가 시작되었습니다!`);
        } else {
            alert('서버와 연결되지 않았습니다. 잠시 후 다시 시도해주세요.');
        }
    };

    // 팀 초기화 및 카드뽑기 초기화
    const resetAll = () => {
        if (window.confirm('팀 설정과 카드뽑기를 모두 초기화하시겠습니까?')) {
            // 1. 팀 번호 초기화 (모든 멤버의 teamNumber를 0으로 설정)
            const resetMembers = updatedMembers.map(member => ({
                ...member,
                teamNumber: 0
            }));
            setUpdatedMembers(resetMembers);

            // 2. 카드뽑기 데이터 초기화
            setCardDrawData(null);
            setSelectedCards({});
            setShowCardDrawModal(false);

            // 3. 백엔드에 팀 초기화 요청
            const payload = {
                action: "resetCardDraw",
                gameId: gameId
            };

            const success = sendAuthenticatedMessage(payload);
            if (success) {
                console.log('🎴 팀 및 카드뽑기 초기화 요청 전송');
            } else {
                alert('서버와 연결되지 않았습니다. 잠시 후 다시 시도해주세요.');
            }
        }
    };


    // grade별 멤버 그룹화
    const getMembersByGrade = () => {
        const gradeGroups = {};
        updatedMembers.forEach(member => {
            const grade = member.grade || 0;
            if (!gradeGroups[grade]) {
                gradeGroups[grade] = [];
            }
            gradeGroups[grade].push(member);
        });
        return gradeGroups;
    };


    const confirmTeamRandomSetting = () => {
        if (teamCount < 2 || teamCount > 24) {
            alert('팀 수는 2팀에서 24팀 사이로 설정해주세요.');
            return;
        }

        // 모든 멤버들 포함 (확정 여부 상관없이)
        const allMembers = members.filter(member => member?.memberId);
        
        if (allMembers.length < teamCount) {
            alert(`팀 수(${teamCount}팀)가 전체 멤버 수(${allMembers.length}명)보다 많습니다.`);
            return;
        }

        // 군별로 멤버들을 그룹화
        const gradeGroups = {};
        allMembers.forEach(member => {
            const grade = member.grade || 0;
            if (!gradeGroups[grade]) {
                gradeGroups[grade] = [];
            }
            gradeGroups[grade].push(member);
        });

        // 각 군별로 팀에 균등하게 분배
        const teamAssignments = {};
        Object.keys(gradeGroups).forEach(grade => {
            const membersInGrade = gradeGroups[grade];
            const membersPerTeam = Math.floor(membersInGrade.length / teamCount);
            const remainingMembers = membersInGrade.length % teamCount;

            // 각 팀에 기본 인원 배정
            for (let team = 1; team <= teamCount; team++) {
                if (!teamAssignments[team]) {
                    teamAssignments[team] = [];
                }
                
                const baseCount = membersPerTeam;
                const extraCount = team <= remainingMembers ? 1 : 0;
                const totalForThisTeam = baseCount + extraCount;
                
                // 해당 팀에 배정할 멤버들 선택
                const startIndex = (team - 1) * membersPerTeam + Math.min(team - 1, remainingMembers);
                const endIndex = startIndex + totalForThisTeam;
                
                for (let i = startIndex; i < endIndex && i < membersInGrade.length; i++) {
                    teamAssignments[team].push(membersInGrade[i]);
                }
            }
        });

        // 팀 배정 결과를 멤버별로 변환
        const randomTeams = [];
        Object.keys(teamAssignments).forEach(teamNumber => {
            teamAssignments[teamNumber].forEach(member => {
                randomTeams.push({
                    userId: member.memberId,
                    teamNumber: parseInt(teamNumber)
                });
            });
        });

        const payload = {
            action: "updateTeam",
            users: randomTeams,
            gameId: gameId
        };

        const success = sendAuthenticatedMessage(payload);
        if (success) {
            alert(`${teamCount}팀으로 균등하게 랜덤 설정되었습니다.`);
            setShowTeamInput(false);
            setTeamCount(2);
        } else {
            alert('서버와 연결되지 않았습니다. 잠시 후 다시 시도해주세요.');
        }
    };

    const teamSetting = () => {
        // 모든 멤버의 팀 정보를 전송 (변경되지 않은 멤버도 포함)
        const allTeams = updatedMembers.map(member => ({
            userId: member.memberId,
            teamNumber: member.teamNumber,
        }));

        const payload = {
            action: "updateTeam",
            users: allTeams,
            gameId: gameId
        };

        const success = sendAuthenticatedMessage(payload);
        if (success) {
            toggleTeamModal();
        } else {
            alert("서버와 연결되지 않았습니다. 잠시 후 다시 시도해주세요.");
        }
    };

    const buttons = showTeamInput ? [
        {
            text: "취소",
            className: styles.cancelBtn,
            onClick: () => {
                setShowTeamInput(false);
                setTeamCount(2);
            }
        },
        {
            text: "확인",
            className: styles.confirmBtn,
            onClick: confirmTeamRandomSetting
        }
    ] : [
        // 첫 번째 줄: 주요 기능 버튼들
        {
            text: "초기화",
            className: styles.resetBtn,
            onClick: resetAll
        },
        {
            text: "카드뽑기",
            className: styles.cardDrawBtn,
            onClick: startCardDraw
        },
        {
            text: "랜덤 설정",
            className: styles.randomBtn,
            onClick: teamRandomSetting
        },
        // 두 번째 줄: 확인/취소 버튼들
        {
            text: "취소",
            className: styles.cancelBtn,
            onClick: toggleTeamModal
        },
        {
            text: "확인",
            className: styles.confirmBtn,
            onClick: teamSetting
        }
    ];

    return (
        <Modal
            isOpen={true}
            onClose={toggleTeamModal}
            title={showTeamInput ? "팀 수 설정" : "팀 설정"}
            buttons={buttons}
            size="large"
        >
            {showTeamInput ? (
                <div className={styles.mb3}>
                    <div style={{marginBottom: "16px", fontSize: "16px", color: "#004EA2", fontWeight: "600"}}>
                        몇 팀으로 나누시겠습니까?
                    </div>
                    <div style={{marginBottom: "12px", fontSize: "14px", color: "#6c757d"}}>
                        전체 멤버: {members.filter(member => member?.memberId).length}명
                    </div>
                    <div style={{marginBottom: "20px"}}>
                        <input
                            type="number"
                            min="2"
                            max="24"
                            value={teamCount}
                            onChange={(e) => setTeamCount(parseInt(e.target.value) || 2)}
                            style={{
                                width: "100%",
                                padding: "12px",
                                fontSize: "16px",
                                border: "2px solid #e9ecef",
                                borderRadius: "8px",
                                textAlign: "center"
                            }}
                        />
                    </div>
                    <div style={{fontSize: "14px", color: "#6c757d", lineHeight: "1.5"}}>
                        <strong>설정 방법:</strong><br/>
                        • 모든 멤버(확정/미확정)를 각 팀마다 군별로 균등하게 분배합니다<br/>
                        • 예: 1군 3명, 2군 4명, 3군 3명 → 2팀으로 나누면<br/>
                        &nbsp;&nbsp;1팀: 1군 1명, 2군 2명, 3군 1명<br/>
                        &nbsp;&nbsp;2팀: 1군 2명, 2군 2명, 3군 2명
                    </div>
                </div>
            ) : (
                <div className={styles.mb3}>
                    <div style={{marginBottom: "12px", fontSize: "14px", color: "#6c757d"}}>
                        미설정: {teamCounts[0]}명
                    </div>
                    
                    {/* 페이지네이션 헤더 */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                        padding: "8px 0"
                    }}>
                        <button
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            style={{
                                background: currentPage === 1 ? "#e9ecef" : "#004EA2",
                                color: currentPage === 1 ? "#6c757d" : "white",
                                border: "none",
                                borderRadius: "6px",
                                padding: "8px 12px",
                                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                                fontSize: "14px",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                            }}
                        >
                            ← 이전
                        </button>
                        
                        <div style={{
                            fontSize: "14px",
                            color: "#004EA2",
                            fontWeight: "600"
                        }}>
                            {teamBtns[0]}팀 - {teamBtns[teamBtns.length - 1]}팀 ({currentPage}/{totalPages}페이지)
                        </div>
                        
                        <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            style={{
                                background: currentPage === totalPages ? "#e9ecef" : "#004EA2",
                                color: currentPage === totalPages ? "#6c757d" : "white",
                                border: "none",
                                borderRadius: "6px",
                                padding: "8px 12px",
                                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                                fontSize: "14px",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                            }}
                        >
                            다음 →
                        </button>
                    </div>
                    
                    <div className={`${styles.grid} ${styles.grid4}`}>
                        {teamBtns.map((team, i) => (
                            <button
                                key={i}
                                className={`${styles.btn} ${selectGrade === team ? styles.confirmBtn : styles.cancelBtn}`}
                                onClick={() => clickGradeBtn(team)}
                                style={{position: "relative"}}
                            >
                                {team}팀
                                {teamCounts[team] > 0 && (
                                    <span style={{
                                        position: "absolute",
                                        top: "-8px",
                                        right: "-8px",
                                        background: "#dc3545",
                                        color: "white",
                                        borderRadius: "50%",
                                        width: "20px",
                                        height: "20px",
                                        fontSize: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: "bold"
                                    }}>
                                        {teamCounts[team]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {!showTeamInput && (
                <div className={styles.mb3}>
                    <h4 style={{marginBottom: "16px", color: "#004EA2"}}>
                        멤버 목록 (에버 순)
                    </h4>
                    <div style={{maxHeight: "300px", overflowY: "auto"}}>
                        {updatedMembers.map((member, i) => (
                            <div key={i} className={styles.card} style={{
                                border: member.teamNumber === 0 ? "2px solid #ffc107" : "2px solid #e9ecef",
                                background: member.teamNumber === 0 ? "#fff3cd" : "white"
                            }}>
                                <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                                    <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                                        <img 
                                            src={member.memberProfile} 
                                            alt="프로필"
                                            style={{
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "50%",
                                                objectFit: "cover"
                                            }}
                                        />
                                        <div>
                                            <div style={{fontWeight: "600", fontSize: "16px"}}>
                                                {member.memberName}
                                            </div>
                                            <div style={{fontSize: "14px", color: "#6c757d"}}>
                                                평균: {member.memberAvg || 0}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                                        <button
                                            className={styles.btn}
                                            style={{
                                                padding: "6px 12px",
                                                fontSize: "12px",
                                                background: "#28a745",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer"
                                            }}
                                            onClick={() => setGradeByMember(member.memberId)}
                                        >
                                            설정
                                        </button>
                                        <button
                                            className={styles.btn}
                                            style={{
                                                padding: "6px 12px",
                                                fontSize: "12px",
                                                background: "#6c757d",
                                                color: "white",
                                                whiteSpace: "nowrap",
                                                minWidth: "60px",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer"
                                            }}
                                            onClick={() => resetGradeByMember(member.memberId)}
                                        >
                                            초기화
                                        </button>
                                        <span style={{
                                            padding: "4px 8px",
                                            background: member.teamNumber === 0 ? "#ffc107" : "#004EA2",
                                            color: member.teamNumber === 0 ? "#856404" : "white",
                                            borderRadius: "4px",
                                            fontSize: "12px",
                                            fontWeight: "500"
                                        }}>
                                            {member.teamNumber === 0 ? "미설정" : member.teamNumber + "팀"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Modal>
    );
}

export default TeamSettingModal;

