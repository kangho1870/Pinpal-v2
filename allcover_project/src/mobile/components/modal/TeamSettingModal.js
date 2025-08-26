import { useEffect, useState, useMemo } from "react";
import styles from "../../css/components/modal/CommonModal.module.css";
import { useSearchParams } from "react-router-dom";
import useScoreboard from "../../../stores/useScoreboardStore";
import { useWebSocketContext } from "../../../contexts/WebSocketContext";
import Modal from "../common/Modal";

function TeamSettingModal() {
    const [searchParams] = useSearchParams();
    const gameId = searchParams.get("gameId");
    const { members, toggleTeamModal } = useScoreboard();
    const [selectGrade, setSelectGrade] = useState(1);
    const [teamBtns] = useState([1, 2, 3, 4, 5, 6, 7, 8]);
    const [updatedMembers, setUpdatedMembers] = useState([]);
    
    const { sendMessage } = useWebSocketContext();

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
        // 멤버들을 평균 순으로 정렬
        const sortedMembers = [...members].sort((a, b) => (b.memberAvg || 0) - (a.memberAvg || 0));
        
        // 팀 수 계산 (최대 8팀)
        const totalMembers = sortedMembers.length;
        const teamCount = Math.min(8, Math.ceil(totalMembers / 2)); // 최소 2명씩
        
        // 각 팀에 균등하게 배분
        const randomTeams = sortedMembers.map((member, index) => ({
            userId: member.memberId,
            teamNumber: (index % teamCount) + 1
        }));

        const payload = {
            action: "updateTeam",
            users: randomTeams,
            gameId: gameId
        };

        const success = sendMessage(payload);
        if (success) {
            alert('팀이 랜덤으로 설정되었습니다.');
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

        const success = sendMessage(payload);
        if (success) {
            toggleTeamModal();
        } else {
            alert("서버와 연결되지 않았습니다. 잠시 후 다시 시도해주세요.");
        }
    };

    const buttons = [
        {
            text: "랜덤 설정",
            className: styles.randomBtn,
            onClick: teamRandomSetting
        },
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
            title="팀 설정"
            buttons={buttons}
            size="large"
        >
            <div className={styles.mb3}>
                <div style={{marginBottom: "12px", fontSize: "14px", color: "#6c757d"}}>
                    미설정: {teamCounts[0]}명
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
        </Modal>
    );
}

export default TeamSettingModal;

