import { useEffect, useState, useCallback } from "react";
import styles from "../css/components/WaitingRoom.module.css";
import useScoreboard from "../../stores/useScoreboardStore";
import useSignInStore from "../../stores/useSignInStore";
import { useSearchParams } from "react-router-dom";
import { useWebSocketContext } from "../../contexts/WebSocketContext";

function WaitingRoom() {
    const { 
        members = [], 
        toggleGradeModal, toggleTeamModal, toggleConfirmModal, toggleSideJoinUserModal
    } = useScoreboard();
    const { signInUser } = useSignInStore();
    const [searchParams] = useSearchParams();
    const [sideGrade1, setSideGrade1] = useState(false);
    const [sideAvg, setSideAvg] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const memberId = signInUser?.id || null;
    const gameId = searchParams.get("gameId");
    
    const { sendMessage } = useWebSocketContext();

    const sideJoinBtns = ["grade1", "avg"];

    const findCurrentUser = useCallback(() => {
        console.log('🔍 signInUser:', signInUser);
        console.log('🔍 findCurrentUser 호출:', { members, memberId });
        const user = members.find(member => String(member?.memberId) === String(memberId));
        console.log('🔍 찾은 사용자:', user);
        if(user) {
            console.log('🔍 사이드 상태 업데이트:', { sideGrade1: user?.sideGrade1, sideAvg: user?.sideAvg });
            setSideGrade1(user?.sideGrade1);
            setSideAvg(user?.sideAvg);
            // 현재 사용자의 클럽 역할 설정
            setCurrentUserRole(user?.memberRole);
            console.log('🔍 현재 사용자 역할 설정:', user?.memberRole);
        }
    }, [members, memberId]);

    useEffect(() => {
        findCurrentUser();
    }, [signInUser, members, memberId, findCurrentUser]);

    useEffect(() => {
        console.log('🔄 sideGrade1 상태 변경:', sideGrade1);
    }, [sideGrade1]);

    useEffect(() => {
        console.log('🔄 sideAvg 상태 변경:', sideAvg);
    }, [sideAvg]);

    const joinSideSocket = (i) => {
        const updateSide = {
            action: "updateSide",
            gameId: gameId,
            userId: memberId,
            sideType: sideJoinBtns[i]
        };
        
        console.log('🔧 updateSide 메시지 전송:', updateSide);
        const success = sendMessage(updateSide);
        if (!success) {
            alert("서버와 연결되지 않았습니다. 잠시 후 다시 시도해주세요.");
        }
    };

    const scoreCountingStop = () => {
        if(members.some((member) => member?.memberId === memberId)) {
            // 현재 점수 집계 상태의 반대값으로 설정
            const currentScoreCounting = members[0]?.scoreCounting;
            const newScoreCounting = currentScoreCounting === false ? true : false;
            
            console.log('점수 집계 상태 변경:', { currentScoreCounting, newScoreCounting });
            
            const updateScoreCounting = {
                action: "updateScoreCounting",
                gameId: parseInt(gameId),
                scoreCounting: newScoreCounting
            };
            
            const success = sendMessage(updateScoreCounting);
            if (success) {
                console.log('점수 집계 상태 변경 메시지 전송 성공');
            } else {
                alert("서버와 연결되지 않았습니다. 잠시 후 다시 시도해주세요.");
            }
        } else {
            alert("게임에 참석하지 않았습니다.")
        }
    }

    return (
        <div className={styles.mainBox}>
            <div className={styles.contentsBox}>
                <div className={styles.leftSide}>
                    <div className={styles.settingBoxTitle}>
                        <h4>확정 볼러</h4>
                    </div>
                    <div className={styles.confirmedMemberBox}>
                        {members
                            .filter(member => member?.confirmedJoin === true)
                            .map((member, i) => (
                                <div key={i} className={styles.userBox}>
                                    <div className={styles.noBox}>
                                        <p>{i + 1}</p>
                                    </div>
                                    <div className={styles.nameCardBox}>
                                        <div className={styles.checkIcon}>
                                            <i className="fa-regular fa-circle-check fa-xl" style={{color:"#63E6BE"}}></i>
                                            <h3 style={{ marginLeft: "2px" }}>{member?.grade == 0 ? null : member?.grade + "군"}</h3>
                                        </div>
                                        <div className={styles.description}>
                                            <h2>{member?.memberName}</h2>
                                        </div>
                                        <div className={styles.description}>
                                            <p>{member?.memberAvg}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
                <div className={styles.rightSide}>
                    <div className={styles.settingBoxTitle}>
                        <h4>설정</h4>
                    </div>
                    <div className={styles.userSettingBox}>
                        <div>
                            {sideJoinBtns.map((v, i) => (
                                <div key={i} className={styles.settingBox}>
                                    <div className={styles.sideJoinBox}>
                                        <div className={styles.checkBox}>
                                            <h4>{v === "grade1" ? "1군 사이드" : "에버 사이드"}</h4>
                                        </div>
                                        <button className={`${styles.sideJoinBtn} ${v === "grade1" && sideGrade1 ? styles.sideJoinedBtn : ""} ${v === "avg" && sideAvg ? styles.sideJoinedBtn : ""}`}
                                            onClick={() => joinSideSocket(i)}>
                                            <h4>
                                                {
                                                    v === "grade1" ? (!sideGrade1 ? "참가" : "취소")
                                                    : v === "avg" ? (!sideAvg ? "참가" : "취소")
                                                    : null
                                                }
                                            </h4>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div className={styles.settingBox}>
                                <div className={styles.btnBox}>
                                    <button className={styles.settingBtn} onClick={toggleConfirmModal}>
                                        <div><i className="fa-solid fa-user-check"></i></div>
                                    </button>
                                    <button className={styles.settingBtn}>
                                        <div><i className="fa-solid fa-right-from-bracket fa-xl"></i></div>
                                    </button>
                                </div>
                            </div>
                            <div className={styles.settingBox}>
                                <button className={styles.settingBtn2} onClick={toggleSideJoinUserModal}>
                                    <div><h4>사이드 참가자</h4></div>
                                </button>
                            </div>
                            {(currentUserRole === "STAFF" || currentUserRole === "MASTER") && (
                                <>
                                    <div className={styles.settingBox}>
                                        <div className={styles.gameSettingBox}>
                                            <button className={styles.settingBtn2} onClick={toggleGradeModal}><div><h4>군 설정</h4></div></button>
                                            <button className={styles.settingBtn2} onClick={toggleTeamModal}><div><h4>팀 설정</h4></div></button>
                                        </div>
                                    </div>
                                    <div className={styles.settingBox}>
                                        <button className={styles.settingBtn2} onClick={scoreCountingStop}><div><h4>{members[0]?.scoreCounting === false ? "점수집계 재개" : "점수집계 종료"}</h4></div></button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className={styles.settingBoxTitle}>
                        <h4>대기 볼러</h4>
                    </div>
                    <div className={styles.userSettingBox}>
                        {members
                            .filter(member => member?.confirmedJoin === false)
                            .map((member, i) => (
                                <div key={i} className={styles.waitingUser}>
                                    <div>
                                        <p>{i + 1}</p>
                                    </div>
                                    <div className={styles.waitingUserInfoBox}>
                                        <div className={styles.waitingUserDesBox}>
                                            <span className={styles.waitingSpan}>name</span>
                                            <div className={styles.profileContainer}>
                                                <img 
                                                    className={styles.memberProfile} 
                                                    src={member?.memberProfile || require("../../imges/user-img/no-profile-url.png")} 
                                                    alt="프로필" 
                                                    onError={(e) => {
                                                        e.target.src = require("../../imges/user-img/no-profile-url.png");
                                                    }}
                                                />
                                                {member?.clubRole === "MASTER" && 
                                                    <img className={styles.staffImg} src={require("../../imges/club/master.png")} alt="마스터" />
                                                }
                                                {member?.clubRole === "STAFF" && 
                                                    <img className={styles.staffImg} src={require("../../imges/club/staff.png")} alt="스태프" />
                                                }
                                            </div>
                                            <h4 className={styles.userInfo}>{member?.memberName}</h4>
                                        </div>
                                        <div className={styles.waitingUserDesBox}>
                                            <span className={styles.waitingSpan}>avg</span>
                                            <h4 className={styles.userInfo}>{member?.memberAvg}</h4>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WaitingRoom;
