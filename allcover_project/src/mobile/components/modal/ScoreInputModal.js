import { useSearchParams } from "react-router-dom";
import styles from "../../css/components/modal/CommonModal.module.css";
import { useState, useEffect } from "react";
import axios from "axios";
import useScoreboard from "../../../stores/useScoreboardStore";
import useSignInStore from "../../../stores/useSignInStore";
import { scoreInputRequest } from "../../../apis";
import { useCookies } from "react-cookie";
import { ACCESS_TOKEN } from "../../../constants";
import { useWebSocketContext } from "../../../contexts/WebSocketContext";
import Modal from "../common/Modal";

export default function ScoreInputModal() {
    const [cookies] = useCookies();
    const token = cookies[ACCESS_TOKEN];
    const [searchParams] = useSearchParams();
    const gameId = searchParams.get('gameId');
    const { members, toggleScoreInputModal } = useScoreboard();
    const { signInUser } = useSignInStore();
    const { sendAuthenticatedMessage } = useWebSocketContext();
    
    const memberId = signInUser?.id || null;
    const member = members.find(member => member?.memberId == memberId);
    
    // 점수 집계 종료 상태 확인 (게임 종료와 동일)
    const isScoreCountingStopped = members.length > 0 && members[0]?.scoreCounting === false;
    
    // 게임이 종료되었는지 확인
    const isGameFinished = members.length > 0 && members[0]?.gameStatus === "FINISHED";
    
    // 현재 사용자가 게임에 참여했는지 확인
    const isUserParticipating = members.some(member => member?.memberId === memberId);
    
    // 점수 입력이 차단되어야 하는 상태 (점수 집계 종료, 게임 종료, 또는 게임 미참여)
    const isScoreInputBlocked = isScoreCountingStopped || isGameFinished || !isUserParticipating;

    const [game1Score, setGame1Score] = useState(member?.game1 || "");
    const [game2Score, setGame2Score] = useState(member?.game2 || "");
    const [game3Score, setGame3Score] = useState(member?.game3 || "");
    const [game4Score, setGame4Score] = useState(member?.game4 || "");

    const scores = {
        game1Score : game1Score,
        game2Score : game2Score,
        game3Score : game3Score,
        game4Score : game4Score
    }

    useEffect(() => {
        if (member) {
            setGame1Score(member?.game1 || "");
            setGame2Score(member?.game2 || "");
            setGame3Score(member?.game3 || "");
            setGame4Score(member?.game4 || "");
        }
    }, [member]);

    // 점수 입력이 차단된 경우 모달 닫기
    useEffect(() => {
        if (isScoreInputBlocked) {
            if (isScoreCountingStopped) {
                alert("점수 집계가 종료되어 점수 입력이 불가능합니다.");
            } else if (isGameFinished) {
                alert("게임이 종료되어 점수 입력이 불가능합니다.");
            } else if (!isUserParticipating) {
                alert("게임에 참여하지 않아 점수 입력이 불가능합니다.");
            }
            toggleScoreInputModal();
        }
    }, [isScoreInputBlocked, isScoreCountingStopped, isGameFinished, isUserParticipating, toggleScoreInputModal]);

    const scoreChangeHandler = (e, gameNumber) => {
        // 게임이 종료되거나 점수 집계가 종료된 경우 입력 차단
        if (isScoreInputBlocked) {
            return;
        }
        
        const value = e.target.value;
        const numValue = value === "" ? "" : parseInt(value);
        
        if (numValue === "" || (numValue >= 0 && numValue <= 300)) {
            switch(gameNumber) {
                case 1:
                    setGame1Score(numValue);
                    break;
                case 2:
                    setGame2Score(numValue);
                    break;
                case 3:
                    setGame3Score(numValue);
                    break;
                case 4:
                    setGame4Score(numValue);
                    break;
                default:
                    break;
            }
        }
    };

    const scoreInputSocket = () => {
        // 점수 입력이 차단된 경우 전송 차단
        if (isScoreInputBlocked) {
            if (isScoreCountingStopped) {
                alert("점수 집계가 종료되어 점수 입력이 불가능합니다.");
            } else if (isGameFinished) {
                alert("게임이 종료되어 점수 입력이 불가능합니다.");
            } else if (!isUserParticipating) {
                alert("게임에 참여하지 않아 점수 입력이 불가능합니다.");
            }
            return;
        }
        
        const scoreInput = {
            action: "updateScore",
            gameId: gameId,
            userId: memberId,
            score: scores
        }
        
        const success = sendAuthenticatedMessage(scoreInput);
        if (success) {
            toggleScoreInputModal();
        } else {
            alert("서버와 연결되지 않았습니다. 잠시 후 다시 시도해주세요.");
        }
    };

    const buttons = [
        {
            text: "취소",
            className: styles.cancelBtn,
            onClick: toggleScoreInputModal
        },
        {
            text: isScoreCountingStopped ? "점수 집계 종료" : 
                  isGameFinished ? "게임 종료" :
                  !isUserParticipating ? "게임 미참여" : "확인",
            className: isScoreInputBlocked ? styles.disabledBtn : styles.confirmBtn,
            onClick: isScoreInputBlocked ? null : scoreInputSocket,
            disabled: isScoreInputBlocked
        }
    ];

    return (
        <Modal
            isOpen={true}
            onClose={toggleScoreInputModal}
            title="점수 입력"
            buttons={buttons}
        >
            <div className={`${styles.grid} ${styles.grid2}`}>
                <div className={styles.mb2}>
                    <label style={{display: "block", marginBottom: "8px", fontWeight: "500"}}>1게임:</label>
                    <input
                        type="number"
                        value={game1Score}
                        onChange={(e) => scoreChangeHandler(e, 1)}
                        min="0"
                        max="300"
                        className={styles.inputField}
                        style={{color: game1Score >= 200 ? "#dc3545" : "inherit"}}
                        disabled={isScoreInputBlocked}
                    />
                </div>
                <div className={styles.mb2}>
                    <label style={{display: "block", marginBottom: "8px", fontWeight: "500"}}>2게임:</label>
                    <input
                        type="number"
                        value={game2Score}
                        onChange={(e) => scoreChangeHandler(e, 2)}
                        min="0"
                        max="300"
                        className={styles.inputField}
                        style={{color: game2Score >= 200 ? "#dc3545" : "inherit"}}
                        disabled={isScoreInputBlocked}
                    />
                </div>
                <div className={styles.mb2}>
                    <label style={{display: "block", marginBottom: "8px", fontWeight: "500"}}>3게임:</label>
                    <input
                        type="number"
                        value={game3Score}
                        onChange={(e) => scoreChangeHandler(e, 3)}
                        min="0"
                        max="300"
                        className={styles.inputField}
                        style={{color: game3Score >= 200 ? "#dc3545" : "inherit"}}
                        disabled={isScoreInputBlocked}
                    />
                </div>
                <div className={styles.mb2}>
                    <label style={{display: "block", marginBottom: "8px", fontWeight: "500"}}>4게임:</label>
                    <input
                        type="number"
                        value={game4Score}
                        onChange={(e) => scoreChangeHandler(e, 4)}
                        min="0"
                        max="300"
                        className={styles.inputField}
                        style={{color: game4Score >= 200 ? "#dc3545" : "inherit"}}
                        disabled={isScoreInputBlocked}
                    />
                </div>
            </div>
        </Modal>
    );
}
