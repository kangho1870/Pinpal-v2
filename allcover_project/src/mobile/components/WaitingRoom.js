import { useEffect, useState, useCallback } from "react";
import styles from "../css/components/WaitingRoom.module.css";
import useScoreboard from "../../stores/useScoreboardStore";
import useSignInStore from "../../stores/useSignInStore";
import { useSearchParams } from "react-router-dom";
import { useWebSocketContext } from "../../contexts/WebSocketContext";

function WaitingRoom() {
    const { 
        members = [], 
        toggleGradeModal, toggleTeamModal, toggleConfirmModal, toggleSideJoinUserModal,
        femaleHandicap, setFemaleHandicap,
        cardDrawData, setCardDrawData,
        selectedCards, setSelectedCards,
        showCardDrawModal, setShowCardDrawModal,
        updateMemberTeamNumber,
        resetAllTeamNumbers,
        updateMemberSideStatus,
        setMembers
    } = useScoreboard();
    const { signInUser } = useSignInStore();
    const [searchParams] = useSearchParams();
    const [sideGrade1, setSideGrade1] = useState(false);
    const [sideAvg, setSideAvg] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [showHandicapInput, setShowHandicapInput] = useState(false);
    const [handicapInput, setHandicapInput] = useState(femaleHandicap.toString());

    const memberId = signInUser?.id || null;
    const gameId = searchParams.get("gameId");
    
    const { sendAuthenticatedMessage, addMessageHandler, removeMessageHandler, requestInitialData } = useWebSocketContext();

    const sideJoinBtns = ["grade1", "avg"];

    // 카드뽑기 관련 함수들

    const openCardDrawModal = () => {
        // 카드뽑기 데이터가 있거나, members에서 팀 번호가 설정된 사용자가 있으면 모달 열기
        const hasCardDrawData = cardDrawData && Object.keys(cardDrawData).length > 0;
        const hasTeamNumbers = members.some(member => member.teamNumber && member.teamNumber > 0);
        
        if (hasCardDrawData || hasTeamNumbers) {
            setShowCardDrawModal(true);
        } else {
            alert('카드뽑기가 아직 시작되지 않았습니다.');
        }
    };

    const selectCard = (grade, cardIndex) => {
        const currentUser = members.find(member => member.memberId === memberId);
        
        if (!currentUser) {
            alert('사용자 정보를 찾을 수 없습니다!');
            return;
        }
        
        if (String(currentUser.grade) !== String(grade)) {
            alert(`자신의 군 카드만 선택할 수 있습니다! (현재: ${currentUser.grade}군, 선택한 카드: ${grade}군)`);
            return;
        }

        // 이미 선택된 카드인지 확인
        if (selectedCards[`${grade}-${cardIndex}`]) {
            alert('이미 선택된 카드입니다!');
            return;
        }

        // 현재 사용자가 이미 다른 카드를 선택했는지 확인
        const userAlreadySelected = Object.keys(selectedCards).some(key => {
            const selectedCard = selectedCards[key];
            return selectedCard && selectedCard.userId === memberId;
        });

        if (userAlreadySelected) {
            alert('이미 카드를 선택하셨습니다! 한 사람당 하나의 카드만 선택할 수 있습니다.');
            return;
        }

        const teamNumber = cardDrawData[grade][cardIndex];

        const payload = {
            action: "selectCard",
            gameId: gameId,
            userId: memberId,
            grade: grade,
            cardIndex: cardIndex,
            teamNumber: teamNumber
        };

        const success = sendAuthenticatedMessage(payload);
        if (success) {
            // 로컬 상태 업데이트
            const cardKey = `${grade}-${cardIndex}`;
            setSelectedCards(prev => {
                const newSelectedCards = {
                    ...prev,
                    [cardKey]: {
                        userId: memberId,
                        teamNumber: teamNumber
                    }
                };
                console.log('🎴 로컬 selectedCards 업데이트:', {
                    cardKey,
                    newSelectedCards,
                    teamNumber
                });
                return newSelectedCards;
            });
        } else {
            alert('서버와 연결되지 않았습니다. 잠시 후 다시 시도해주세요.');
        }
    };

    // WebSocket 메시지 핸들러
    const handleWebSocketMessage = useCallback((data, message) => {
        
        if (data.type === 'initialData') {
            // 카드뽑기 시작 여부 확인
            if (data.cardDrawStarted) {
                // 카드뽑기 데이터가 있으면 설정
                if (data.cardDrawData) {
                    setCardDrawData(data.cardDrawData);
                }
                // 선택된 카드 정보가 있으면 설정
                if (data.selectedCards) {
                    setSelectedCards(data.selectedCards);
                }
            } else {
                // 카드뽑기가 시작되지 않은 경우 상태 초기화
                setCardDrawData(null);
                setSelectedCards({});
            }
        } else if (data.type === 'cardDrawStart') {
            setCardDrawData(data.cardData);
        } else if (data.type === 'cardSelected') {
            // 1. selectedCards 상태 업데이트
            const cardKey = `${data.grade}-${data.cardIndex}`;
            setSelectedCards(prev => {
                const newSelectedCards = {
                    ...prev,
                    [cardKey]: {
                        userId: data.userId,
                        teamNumber: data.teamNumber
                    }
                };
                console.log('🎴 WebSocket cardSelected 처리:', {
                    cardKey,
                    data,
                    newSelectedCards
                });
                return newSelectedCards;
            });
            
            // 2. members 배열의 해당 사용자 팀 번호 업데이트
            updateMemberTeamNumber(data.userId, data.teamNumber);
        } else if (data.type === 'cardDrawReset') {
            setCardDrawData(null);
            setSelectedCards({});
            setShowCardDrawModal(false);
            
            // 모든 멤버의 팀 번호를 0으로 초기화
            resetAllTeamNumbers();
        } else if (data.type === 'sideUpdated') {
            // 실제 사이드 상태로 업데이트
            if (data.sideType === 'grade1' && data.grade1 !== undefined) {
                // grade1 사이드 상태 직접 업데이트
                const currentMembers = useScoreboard.getState().members;
                const updatedMembers = currentMembers.map(member => {
                    if (member.memberId === data.userId) {
                        return { ...member, sideGrade1: data.grade1 };
                    }
                    return member;
                });
                // setMembers로 상태 업데이트
                setMembers(updatedMembers);
            } else if (data.sideType === 'avg' && data.avg !== undefined) {
                // avg 사이드 상태 직접 업데이트
                const currentMembers = useScoreboard.getState().members;
                const updatedMembers = currentMembers.map(member => {
                    if (member.memberId === data.userId) {
                        return { ...member, sideAvg: data.avg };
                    }
                    return member;
                });
                // setMembers로 상태 업데이트
                setMembers(updatedMembers);
            }
        }
    }, []);

    // WebSocket 메시지 핸들러 등록/해제
    useEffect(() => {
        addMessageHandler(handleWebSocketMessage);
        return () => {
            removeMessageHandler(handleWebSocketMessage);
        };
    }, [addMessageHandler, removeMessageHandler, handleWebSocketMessage]);

    // 컴포넌트 마운트 시 초기 데이터 요청
    useEffect(() => {
        requestInitialData();
    }, [requestInitialData]);

    const findCurrentUser = useCallback(() => {
        const user = members.find(member => String(member?.memberId) === String(memberId));
        if(user) {
            setSideGrade1(user?.sideGrade1); // sideGrade1 필드 사용
            setSideAvg(user?.sideAvg);
            // 현재 사용자의 클럽 역할 설정
            setCurrentUserRole(user?.memberRole);
        }
    }, [members, memberId]);

    useEffect(() => {
        findCurrentUser();
    }, [signInUser, members, memberId, findCurrentUser]);


    const joinSideSocket = (i) => {
        const updateSide = {
            action: "updateSide",
            gameId: gameId,
            userId: memberId,
            sideType: sideJoinBtns[i]
        };
        
        const success = sendAuthenticatedMessage(updateSide);
        if (!success) {
            alert("서버와 연결되지 않았습니다. 잠시 후 다시 시도해주세요.");
        }
    };

    const scoreCountingStop = () => {
        if(members.some((member) => member?.memberId === memberId)) {
            // 현재 점수 집계 상태의 반대값으로 설정
            const currentScoreCounting = members[0]?.scoreCounting;
            const newScoreCounting = currentScoreCounting === false ? true : false;
            
            const updateScoreCounting = {
                action: "updateScoreCounting",
                gameId: parseInt(gameId),
                scoreCounting: newScoreCounting
            };
            
            const success = sendAuthenticatedMessage(updateScoreCounting);
            if (!success) {
                alert("서버와 연결되지 않았습니다. 잠시 후 다시 시도해주세요.");
            }
        } else {
            alert("게임에 참석하지 않았습니다.")
        }
    }

    const handleHandicapSetting = () => {
        setShowHandicapInput(true);
    };

    const handleHandicapConfirm = () => {
        const handicap = parseInt(handicapInput);
        if (isNaN(handicap) || handicap < 0) {
            alert('올바른 핸디캡 점수를 입력해주세요.');
            return;
        }
        
        setFemaleHandicap(handicap);
        setShowHandicapInput(false);
        
        // 핸디캡은 프론트엔드에서만 처리 (로컬 상태)
    };

    const handleHandicapCancel = () => {
        setHandicapInput(femaleHandicap.toString());
        setShowHandicapInput(false);
    };

    return (
        <div className={styles.mainBox}>
            <div className={styles.contentsBox}>
                <div className={styles.leftSide}>
                    <div className={styles.settingBoxTitle}>
                        <h4>확정 볼러</h4>
                    </div>
                    <div className={styles.confirmedMemberBox}>
                        {members.filter(member => member?.confirmedJoin === true).length > 0 ? (
                            members
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
                                ))
                        ) : (
                            <div style={{ textAlign: 'center', color: '#6c757d', fontStyle: 'italic', padding: '20px' }}>
                                확정된 볼러가 없습니다
                            </div>
                        )}
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
                            <div className={styles.settingBox}>
                                <button className={styles.settingBtn2} onClick={openCardDrawModal}>
                                    <div><h4>카드뽑기</h4></div>
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
                                    <div className={styles.settingBox}>
                                        {showHandicapInput ? (
                                            <div className={styles.handicapInputBox}>
                                                <input
                                                    type="number"
                                                    value={handicapInput}
                                                    onChange={(e) => setHandicapInput(e.target.value)}
                                                    placeholder="핸디캡 점수"
                                                    className={styles.handicapInput}
                                                    min="0"
                                                />
                                                <div className={styles.handicapButtons}>
                                                    <button 
                                                        className={styles.handicapConfirmBtn} 
                                                        onClick={handleHandicapConfirm}
                                                    >
                                                        확인
                                                    </button>
                                                    <button 
                                                        className={styles.handicapCancelBtn} 
                                                        onClick={handleHandicapCancel}
                                                    >
                                                        취소
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button className={styles.settingBtn2} onClick={handleHandicapSetting}>
                                                <div><h4>여자핸디캡: {femaleHandicap}점</h4></div>
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className={styles.settingBoxTitle}>
                        <h4>대기 볼러</h4>
                    </div>
                    <div className={styles.waitingMemberBox}>
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
            
            {/* 카드뽑기 모달 */}
            {showCardDrawModal && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0, 0, 0, 0.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    padding: "20px"
                }}>
                    <div style={{
                        background: "white",
                        borderRadius: "16px",
                        padding: "24px",
                        maxWidth: "600px",
                        width: "100%",
                        maxHeight: "80vh",
                        overflowY: "auto"
                    }}>
                        <h3 style={{marginBottom: "20px", color: "#004EA2", textAlign: "center"}}>
                            🎴 카드뽑기
                        </h3>
                        
                        <div style={{marginBottom: "16px", fontSize: "14px", color: "#6c757d", textAlign: "center"}}>
                            카드를 클릭해서 팀을 선택하세요!
                        </div>
                        
                        {cardDrawData && Object.keys(cardDrawData).map(grade => {
                            const currentUser = members.find(member => member.memberId === memberId);
                            const isMyGrade = currentUser && String(currentUser.grade) === String(grade);
                            
                            // 현재 사용자의 군에 해당하는 카드만 표시
                            if (!isMyGrade) {
                                return null;
                            }
                            
                            return (
                                <div key={grade} style={{marginBottom: "24px"}}>
                                    <h4 style={{
                                        fontSize: "16px",
                                        fontWeight: "600",
                                        marginBottom: "12px",
                                        color: "#004EA2",
                                        textAlign: "center"
                                    }}>
                                        {grade === '0' ? '일반' : `${grade}군`} 카드
                                    </h4>
                                    <div style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "12px",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        margin: "0 auto",
                                        maxWidth: "400px"
                                    }}>
                                        {cardDrawData[grade].map((teamNumber, cardIndex) => {
                                            const cardKey = `${grade}-${cardIndex}`;
                                            const isSelected = !!selectedCards[cardKey]; // 존재 여부만 확인
                                            const isMyCard = isMyGrade;
                                            
                                            // 디버깅 로그
                                            if (isMyCard && selectedCards[cardKey]) {
                                                console.log('🎴 카드 선택 상태:', {
                                                    cardKey,
                                                    isSelected,
                                                    selectedCard: selectedCards[cardKey],
                                                    teamNumber
                                                });
                                            }
                                            
                                            // 현재 사용자가 이미 다른 카드를 선택했는지 확인 (selectedCards와 members 모두 확인)
                                            const userAlreadySelected = Object.keys(selectedCards).some(key => {
                                                const selectedCard = selectedCards[key];
                                                return selectedCard && selectedCard.userId === memberId;
                                            }) || members.some(member => 
                                                member.memberId === memberId && member.teamNumber && member.teamNumber > 0
                                            );
                                            
                                            // 이 카드가 선택되었는지 확인 (selectedCards만 확인)
                                            const isCardSelected = isSelected;
                                            
                                            const canClick = isMyCard && !isCardSelected && !userAlreadySelected;
                                            
                                            return (
                                                <div
                                                    key={cardIndex}
                                                    onClick={() => {
                                                        if (canClick) {
                                                            selectCard(grade, cardIndex);
                                                        }
                                                    }}
                                                    style={{
                                                        width: "100px",
                                                        height: "120px",
                                                        background: isCardSelected 
                                                            ? "linear-gradient(135deg, #28a745, #20c997)"
                                                            : userAlreadySelected && isMyCard
                                                            ? "#6c757d"
                                                            : "#004EA2",
                                                        borderRadius: "8px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        cursor: canClick ? "pointer" : "not-allowed",
                                                        transition: "all 0.3s ease",
                                                        transform: isCardSelected ? "rotateY(180deg)" : "rotateY(0deg)",
                                                        boxShadow: isCardSelected 
                                                            ? "0 0 20px rgba(40, 167, 69, 0.5)" 
                                                            : "0 2px 8px rgba(0, 0, 0, 0.2)",
                                                        opacity: isMyCard ? 1 : 0.6
                                                    }}
                                                >
                                                    {isCardSelected ? (
                                                        <div style={{
                                                            color: "white",
                                                            fontSize: "16px",
                                                            fontWeight: "bold",
                                                            textAlign: "center",
                                                            transform: "rotateY(180deg)" // 카드가 뒤집힐 때 텍스트를 다시 뒤집어서 정상적으로 보이게 함
                                                        }}>
                                                            {teamNumber}팀
                                                        </div>
                                                    ) : (
                                                        <div style={{
                                                            color: "white",
                                                            fontSize: "24px",
                                                            fontWeight: "bold"
                                                        }}>
                                                            ?
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {!cardDrawData && (
                            <div style={{
                                textAlign: "center", 
                                padding: "20px",
                                color: "#6c757d",
                                fontSize: "14px"
                            }}>
                                카드뽑기 데이터를 불러오는 중입니다...
                            </div>
                        )}
                        
                        <div style={{textAlign: "center", marginTop: "20px"}}>
                            <button
                                onClick={() => setShowCardDrawModal(false)}
                                style={{
                                    background: "#6c757d",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    padding: "12px 24px",
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    cursor: "pointer"
                                }}
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    )
}

export default WaitingRoom;
