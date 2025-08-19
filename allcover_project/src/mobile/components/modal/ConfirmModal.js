import { useEffect, useState } from "react";
import styles from "../../css/components/modal/CommonModal.module.css";
import { useSearchParams } from "react-router-dom";
import useSignInStore from "../../../stores/useSignInStore";
import { confirmCheckRequest } from "../../../apis";
import useScoreboard from "../../../stores/useScoreboardStore";
import { useCookies } from "react-cookie";
import { ACCESS_TOKEN } from "../../../constants";
import { useWebSocketContext } from "../../../contexts/WebSocketContext";
import Modal from "../common/Modal";

export default function ConfirmModal() {
    const [searchParams] = useSearchParams();
    const { signInUser } = useSignInStore();
    const [cookies] = useCookies();
    const token = cookies[ACCESS_TOKEN];
    const { members, toggleConfirmModal } = useScoreboard();
    const gameId = searchParams.get("gameId");
    const memberId = signInUser?.id || null;

    const [isConfirm, setIsConfirm] = useState(false);
    const [code, setCode] = useState("");
    const [confirmResult, setConfirmResult] = useState(false);
    const [failCount, setFailCount] = useState(0);
    const [validCode, setValidCode] = useState(false);
    
    const { sendMessage } = useWebSocketContext();

    const codeChangeHandler = (e) => {
        setCode(e.target.value);
    }

    const confirmCheckSocket = () => {
        if(code == "") {
            setFailCount(failCount + 1);
            return;
        }
        const confirmCheck = {
            action: "updateConfirm",
            code: code,
            gameId: gameId,
            userId: memberId
        }
        
        console.log('🔧 updateConfirm 메시지 전송:', confirmCheck);
        const success = sendMessage(confirmCheck);
        if (!success) {
            alert("서버와 연결되지 않았습니다. 잠시 후 다시 시도해주세요.");
        }
    };

    const findCurrentUser = () => {
        const user = members.find(member => member?.memberId == memberId);
        if(user) {
            setIsConfirm(user?.confirmedJoin);
        }
    }

    useEffect(() => {
        findCurrentUser();
    }, [members]);

    // 확정 성공 시 모달 닫기
    useEffect(() => {
        const currentUser = members.find(member => String(member?.memberId) === String(memberId));
        if (currentUser?.confirmedJoin) {
            console.log('✅ 참석 확정 성공 - 모달 닫기');
            toggleConfirmModal();
        }
    }, [members, memberId, toggleConfirmModal]);

    const buttons = [
        {
            text: "취소",
            className: styles.cancelBtn,
            onClick: toggleConfirmModal
        },
        {
            text: "확정",
            className: styles.confirmBtn,
            onClick: confirmCheckSocket
        }
    ];

    return (
        <Modal
            isOpen={true}
            onClose={toggleConfirmModal}
            title="참석 확정"
            buttons={buttons}
            size="small"
        >
            <div className={styles.textCenter}>
                <div className={styles.mb2}>
                    <h4>확정 코드를 입력하세요</h4>
                </div>
                <div className={styles.mb3}>
                    <input
                        type="text"
                        value={code}
                        onChange={codeChangeHandler}
                        placeholder="확정 코드 입력"
                        className={styles.inputField}
                        maxLength={8}
                    />
                </div>
                {failCount > 0 && code.length === 0 && (
                    <div className={styles.textCenter} style={{color: "#dc3545", fontSize: "14px"}}>
                        코드를 입력해 주세요.
                    </div>
                )}
                {(validCode > 0 && code.length !== 0) && (
                    <div className={styles.textCenter} style={{color: "#dc3545", fontSize: "14px"}}>
                        코드가 일치하지 않습니다.
                    </div>
                )}
            </div>
        </Modal>
    );
}