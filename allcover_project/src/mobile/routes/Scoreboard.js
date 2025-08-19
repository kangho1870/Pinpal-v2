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
    const { addMessageHandler, removeMessageHandler, connectionStatus } = useWebSocketContext();

    const { 
        members, gradeModal, teamModal, confirmModal, sideJoinUserModal,
        sideRankingModal, scoreInputModal, page, navTitle,
        setMembers, toggleSideJoinUserModal, toggleSideRankingModal, toggleScoreInputModal, setPage
    } = useScoreboard();

    // members 상태 변경 감지
    useEffect(() => {
        console.log('🔄 Scoreboard members 상태 변경:', members);
    }, [members]);

    const navigator = useNavigate();

    // WebSocket 메시지 핸들러를 useCallback으로 감싸기
    const handleWebSocketMessage = useCallback((data) => {
        console.log("📨 WebSocket 메시지 수신:", data);
        console.log("📨 메시지 타입:", typeof data);
        console.log("📨 메시지 길이:", Array.isArray(data) ? data.length : '배열 아님');
        
        if (data && Array.isArray(data)) {
            console.log("📨 멤버 데이터 업데이트:", data);
            setMembers(data);
        } else {
            console.log("📨 유효하지 않은 데이터 형식:", data);
        }
    }, [setMembers]);

    useEffect(() => {
        console.log("🔗 WebSocket 메시지 핸들러 등록");
        addMessageHandler(handleWebSocketMessage);

        // 컴포넌트 언마운트 시 핸들러 제거
        return () => {
            console.log("🔌 WebSocket 메시지 핸들러 제거");
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
