import { useEffect, useCallback } from "react";
import RankingBoard from "../components/RankingBoard";
import WaitingRoom from "../components/WaitingRoom";
import styles from "../css/routes/Scoreboard.module.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import GradeSettingModal from "../components/modal/GradeSettingModal";
import TeamSettingModal from "../components/modal/TeamSettingModal";
import ConfirmModal from "../components/modal/ConfirmModal";
import SideGameJoinUsers from "../components/modal/SideGameJoinUsers";
import SideRankingModal from "../components/modal/SideRankingModal";
import ScoreInputModal from "../components/modal/ScoreInputModal";
import GameResult from "../components/GameResult";
import TeamScoreboard from "../components/TeamScoreboard";
import useScoreboard from "../../stores/useScoreboardStore";
import { useCookies } from "react-cookie";
import { ACCESS_TOKEN, ROOT_PATH } from "../../constants";
import { onClickBackBtn } from "../../hooks";
import { WebSocketProvider, useWebSocketContext } from "../../contexts/WebSocketContext";

function ScoreboardContent() {
    const [cookies] = useCookies();
    const { addMessageHandler, removeMessageHandler, connectionStatus, sendAuthenticatedMessage, token, requestInitialData } = useWebSocketContext();

    const { 
        members, gradeModal, teamModal, confirmModal, sideJoinUserModal,
        sideRankingModal, scoreInputModal, page, navTitle,
        setMembers, addMember, updateMemberTeamNumber, batchUpdateMemberTeamNumbers, 
        batchUpdateMemberGrades, updateMemberScore, 
        updateMemberConfirmedStatus, toggleSideJoinUserModal, toggleSideRankingModal, 
        toggleScoreInputModal, setPage
    } = useScoreboard();


    const navigator = useNavigate();

    // WebSocket 메시지 핸들러를 useCallback으로 감싸기
    const handleWebSocketMessage = useCallback((data) => {
        
        // 초기 데이터 처리 (배열인 경우)
        if (Array.isArray(data)) {
            setMembers(data);
            return;
        }
        
        // 특정 업데이트 타입 처리
        if (data && data.type) {
            switch (data.type) {
                // 팀 관련 업데이트
                case 'teamNumberUpdate':
                    updateMemberTeamNumber(data.userId, data.teamNumber);
                    break;
                case 'batchTeamNumberUpdate':
                    if (data.updates && Array.isArray(data.updates)) {
                        batchUpdateMemberTeamNumbers(data.updates);
                    }
                    break;
                
                // 등급 관련 업데이트
                case 'batchGradeUpdate':
                    if (data.updates && Array.isArray(data.updates)) {
                        batchUpdateMemberGrades(data.updates);
                    }
                    break;
                
                // 점수 관련 업데이트
                case 'scoreUpdated':
                    updateMemberScore(data.userId, data.score1, data.score2, data.score3, data.score4);
                    break;
                
                // 사이드 게임 관련 업데이트
                case 'sideUpdated':
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
                    break;
                
                // 참석 확정 관련 업데이트
                case 'confirmedUpdated':
                    updateMemberConfirmedStatus(data.userId, data.confirmed);
                    break;
                
                // 점수 집계 관련 업데이트
                case 'scoreCountingUpdated':
                    // 점수 집계 상태가 변경되면 전체 데이터를 다시 요청하여 members 업데이트
                    console.log('점수 집계 상태 변경됨:', data.scoreCounting);
                    // 초기 데이터를 다시 요청하여 members 배열 업데이트
                    requestInitialData();
                    break;
                
                // 새로운 회원 참여 알림
                case 'newParticipantJoin':
                    if (data.newParticipant) {
                        addMember(data.newParticipant);
                    }
                    break;
                
                // 기존 타입들 (하위 호환성)
                case 'SCOREBOARD_UPDATE':
                    if (data.members && Array.isArray(data.members)) {
                        setMembers(data.members);
                    }
                    break;
                case 'initialData':
                    if (data.scoreboards && Array.isArray(data.scoreboards)) {
                        setMembers(data.scoreboards);
                    }
                    break;
                case 'cardDrawStart':
                    // 카드뽑기 시작은 WaitingRoom에서 처리하므로 여기서는 로그만 출력
                    break;
                case 'cardSelected':
                    // 카드 선택은 WaitingRoom에서 처리하므로 여기서는 로그만 출력
                    break;
                default:
            }
        } else if (data && Array.isArray(data)) {
            // 기존 방식: 전체 멤버 데이터 배열
            setMembers(data);
        }
    }, [setMembers, updateMemberTeamNumber, batchUpdateMemberTeamNumbers, 
        batchUpdateMemberGrades, updateMemberScore, 
        updateMemberConfirmedStatus, requestInitialData]);

    useEffect(() => {
        addMessageHandler(handleWebSocketMessage);

        // 컴포넌트 언마운트 시 핸들러 제거
        return () => {
            removeMessageHandler(handleWebSocketMessage);
        };
    }, [addMessageHandler, removeMessageHandler, handleWebSocketMessage]);

    useEffect(() => {
        if(cookies[ACCESS_TOKEN] == null) {
            alert("로그인이 필요한 서비스입니다.")
            navigator(ROOT_PATH);
        }
        setPage(0);
    }, [cookies, navigator, setPage]);

    // STOMP 메시지 전송 예시 함수들
    const sendTeamUpdateExample = useCallback(() => {
        if (!token) {
            console.error('❌ 토큰이 없어서 메시지를 전송할 수 없습니다.');
            return;
        }

        // STOMP 방식: 팀 번호 업데이트 메시지
        const teamUpdateMessage = {
            action: "updateTeamNumber",
            gameId: 123,
            users: [
                { userId: 1, teamNumber: 2 },
                { userId: 2, teamNumber: 1 }
            ]
        };

        sendAuthenticatedMessage(teamUpdateMessage);
    }, [token, sendAuthenticatedMessage]);

    const sendScoreUpdateExample = useCallback(() => {
        if (!token) {
            console.error('❌ 토큰이 없어서 메시지를 전송할 수 없습니다.');
            return;
        }

        // STOMP 방식: 점수 업데이트 메시지
        const scoreUpdateMessage = {
            action: "updateScore",
            gameId: 123,
            userId: 456,
            score: {
                game1Score: 180,
                game2Score: 200,
                game3Score: 0,
                game4Score: 0
            }
        };

        sendAuthenticatedMessage(scoreUpdateMessage);
    }, [token, sendAuthenticatedMessage]);

    const navBtnClickHandler = (index) => {
        setPage(index);
    };

    const getConnectionStatusColor = () => {
        switch (connectionStatus) {
            case 'connected':
                return '#28a745';
            case 'connecting':
                return '#ffc107';
            case 'error':
                return '#dc3545';
            default:
                return '#6c757d';
        }
    };

    const getConnectionStatusText = () => {
        switch (connectionStatus) {
            case 'connected':
                return '연결됨';
            case 'connecting':
                return '연결 중...';
            case 'error':
                return '연결 실패';
            default:
                return '연결 안됨';
        }
    };

    // 게임 이름 가져오기
    const getGameName = () => {
        if (members && members.length > 0 && members[0]?.gameName) {
            return members[0].gameName;
        }
        return "스코어보드";
    };

    // 연결 상태 표시 컴포넌트
    const ConnectionStatusIndicator = () => (
        <div className={styles.connectionStatus}>
            <div 
                className={styles.connectionDot}
                style={{
                    backgroundColor: getConnectionStatusColor(),
                    animation: connectionStatus === 'connecting' ? 'pulse 1s infinite' : 'none'
                }}
            />
            <span 
                className={styles.connectionText}
                style={{ color: getConnectionStatusColor() }}
            >
                {getConnectionStatusText()}
            </span>
        </div>
    );

    return (
        <>
            <div className={styles.container}>
                <div className={styles.topBox}>
                    <div onClick={() => onClickBackBtn(navigator)}>
                        <i className="fa-solid fa-chevron-left"></i>
                    </div>
                    <div className={styles.titleBox}>
                        <h2>{getGameName()}</h2>
                        <ConnectionStatusIndicator />
                    </div>
                </div>
                <div className={styles.main}>
                    <div className={styles.navBox}>
                        <div>
                            {navTitle.map((btn, index) => (
                                <button
                                    key={index}
                                    className={`${styles.navBtn} ${page === index ? styles.selectedBtn : ""}`}
                                    onClick={() => navBtnClickHandler(index)}
                                >
                                    {btn}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={styles.contentsBox}>
                        {page === 0 && (
                            <WaitingRoom />
                        )}
                        {page === 2 && <TeamScoreboard members={members} />}
                        {page === 3 && <GameResult members={members} />}
                        {page === 4 && <div>1</div>}
                    </div>
                </div>
                {page === 1 && (
                    <RankingBoard
                        members={members}
                        sideRankingModalToggle={toggleSideRankingModal}
                        scoreInputModalToggle={toggleScoreInputModal}
                    />
                )}
                {gradeModal && (
                    <div className={styles.modalArea}>
                        <GradeSettingModal />
                    </div>
                )}
                {teamModal && (
                    <div className={styles.modalArea}>
                        <TeamSettingModal />
                    </div>
                )}
                {confirmModal && (
                    <div className={styles.modalArea}>
                        <ConfirmModal />
                    </div>
                )}
                {sideJoinUserModal && (
                    <div className={styles.modalArea}>
                        <SideGameJoinUsers
                            sideJoinSetModalToggle={toggleSideJoinUserModal}
                        />
                    </div>
                )}
                {sideRankingModal && (
                    <div className={styles.modalArea}>
                        <SideRankingModal
                            sideRankingModalToggle={toggleSideRankingModal}
                        />
                    </div>
                )}
                {scoreInputModal && (
                    <div className={styles.modalArea}>
                        <ScoreInputModal />
                    </div>
                )}
            </div>
            <style jsx>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </>
    );
}

function Scoreboard() {
    const [searchParams] = useSearchParams();
    const gameId = searchParams.get('gameId');

    return (
        <WebSocketProvider gameId={gameId}>
            <ScoreboardContent />
        </WebSocketProvider>
    );
}

export default Scoreboard;
