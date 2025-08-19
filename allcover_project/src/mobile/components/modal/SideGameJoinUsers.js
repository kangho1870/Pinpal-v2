import { useState } from "react";
import styles from "../../css/components/modal/CommonModal.module.css";
import useScoreboard from "../../../stores/useScoreboardStore";
import Modal from "../common/Modal";

function SideGameJoinUsers() {

    const { members, toggleSideJoinUserModal } = useScoreboard();

    const [page, setPage] = useState(0);
    const [navBtns] = useState(["사이드", "Avg사이드"]);

    const btnClickHandler = (index) => {
        setPage(index);
    }
    
    return (
        <Modal
            isOpen={true}
            onClose={toggleSideJoinUserModal}
            title="사이드 참가자"
            size="large"
        >
            <div className={styles.mb3}>
                <div className={`${styles.grid} ${styles.grid2}`}>
                    {navBtns.map((btn, index) => (
                        <button
                            key={index}
                            className={`${styles.btn} ${page === index ? styles.confirmBtn : styles.cancelBtn}`}
                            onClick={() => btnClickHandler(index)}
                        >
                            {btn}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className={styles.mb3}>
                <div style={{maxHeight: "400px", overflowY: "auto"}}>
                    {page === 0 && members.filter(member => member.sideGrade1 === true)
                        .map((member, index) => (
                            <div key={index} className={styles.card}>
                                <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                                    <div style={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "50%",
                                        background: "#004EA2",
                                        color: "white",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: "600",
                                        fontSize: "16px"
                                    }}>
                                        {index + 1}
                                    </div>
                                    <div style={{flex: 1}}>
                                        <div style={{fontWeight: "600", fontSize: "16px", marginBottom: "4px"}}>
                                            {member.memberName}
                                        </div>
                                        <div style={{fontSize: "14px", color: "#6c757d"}}>
                                            평균: {member.memberAvg}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    {page === 1 && members.filter(member => member.sideAvg === true)
                        .map((member, index) => (
                            <div key={index} className={styles.card}>
                                <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                                    <div style={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "50%",
                                        background: "#28a745",
                                        color: "white",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: "600",
                                        fontSize: "16px"
                                    }}>
                                        {index + 1}
                                    </div>
                                    <div style={{flex: 1}}>
                                        <div style={{fontWeight: "600", fontSize: "16px", marginBottom: "4px"}}>
                                            {member.memberName}
                                        </div>
                                        <div style={{fontSize: "14px", color: "#6c757d"}}>
                                            평균: {member.memberAvg}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </Modal>
    );
}

export default SideGameJoinUsers;
