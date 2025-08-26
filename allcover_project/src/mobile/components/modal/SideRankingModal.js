import { useMemo, useState } from "react";
import styles from "../../css/components/modal/CommonModal.module.css";
import useScoreboard from "../../../stores/useScoreboardStore";
import Modal from "../common/Modal";

export default function SideRankingModal() {
    const { members, toggleSideRankingModal } = useScoreboard();
    const [page, setPage] = useState(0);
    const [btns] = useState(["사이드", "에버 사이드"]);

    const btnClickHandler = (i) => {
        setPage(i);
    }
    
    // 사이드 멤버들이 모두 점수를 입력했는지 확인
    const sideGrade1Members = members.filter(member => member.sideGrade1 === true);
    const allSideGrade1Scored = sideGrade1Members.length > 0 && 
        sideGrade1Members.every(member => 
            member?.game1 !== null && member?.game1 !== undefined && member?.game1 > 0
        );

    // 총핀과 핀 차이를 계산 (모든 멤버가 점수를 입력했을 때만)
    const sortedMembers = useMemo(() => {
        if (!allSideGrade1Scored) return [];
        
        const membersWithTotalPins = members
            .filter(member => member.sideGrade1 === true)
            .map(member => ({
                ...member,
                totalPins: [member.game1, member.game2, member.game3, member.game4]
                    .reduce((sum, game) => sum + (game || 0), 0), // 각 게임 점수를 더해 총핀 계산
            }))
            .sort((a, b) => b.totalPins - a.totalPins); // 총핀 기준으로 내림차순 정렬

        const topTotalPins = membersWithTotalPins[0]?.totalPins || 0; // 1등의 총핀

        return membersWithTotalPins.map(member => ({
            ...member,
            pinDifference: topTotalPins - member.totalPins, // 1등과의 핀 차이
        }));
    }, [members, allSideGrade1Scored]);

    // 게임별로 등수 계산 (최대 7등까지) - 해당 게임에 점수가 있는 멤버만
    const getGameRankings = (gameKey) => {
        if (!allSideGrade1Scored) return [];
        
        return members
            .filter(member => member[gameKey] !== null && member[gameKey] > 0 && member.sideGrade1 === true) // 0보다 큰 점수들만 필터링
            .sort((a, b) => b[gameKey] - a[gameKey]) // 점수 기준으로 내림차순 정렬
            .slice(0, 7); // 7등까지 추출
    };

    const game1Rankings = getGameRankings("game1");
    const game2Rankings = getGameRankings("game2");
    const game3Rankings = getGameRankings("game3");
    const game4Rankings = getGameRankings("game4");

    return (
        <Modal
            isOpen={true}
            onClose={toggleSideRankingModal}
            title="사이드 순위"
            size="large"
        >
            <div className={styles.mb3}>
                <div className={`${styles.grid} ${styles.grid2}`}>
                    {btns.map((btn, i) => (
                        <button
                            key={i}
                            className={`${styles.btn} ${i === page ? styles.confirmBtn : styles.cancelBtn}`}
                            onClick={() => btnClickHandler(i)}
                        >
                            {btn}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className={styles.mb3}>
                {page === 0 && (
                    <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
                        {/* 사이드 순위 카드 */}
                        <div style={{maxHeight: "400px", overflowY: "auto"}}>
                            {!allSideGrade1Scored ? (
                                <div style={{
                                    textAlign: "center",
                                    padding: "40px 20px",
                                    color: "#6c757d",
                                    fontSize: "16px"
                                }}>
                                    모든 사이드 멤버가 점수를 입력하면<br />
                                    순위가 표시됩니다.
                                </div>
                            ) : (
                                sortedMembers
                                    .filter(member => member.sideGrade1 === true)
                                    .map((member, i) => (
                                    <div key={i} className={styles.card}>
                                        <div style={{display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px"}}>
                                            <div style={{
                                                width: "32px",
                                                height: "32px",
                                                borderRadius: "50%",
                                                background: i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#004EA2",
                                                color: "white",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontWeight: "600",
                                                fontSize: "14px"
                                            }}>
                                                {i + 1}
                                            </div>
                                            <div style={{flex: 1}}>
                                                <div style={{fontWeight: "600", fontSize: "16px"}}>
                                                    {member.memberName}
                                                </div>
                                                <div style={{fontSize: "12px", color: "#6c757d"}}>
                                                    평균: {member.memberAvg}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "12px"}}>
                                            <div style={{textAlign: "center"}}>
                                                <div style={{fontSize: "12px", color: "#6c757d", marginBottom: "4px"}}>1G</div>
                                                <div style={{fontWeight: "600", fontSize: "14px"}}>
                                                    {member.game1 == null ? '-' : member.game1}
                                                </div>
                                            </div>
                                            <div style={{textAlign: "center"}}>
                                                <div style={{fontSize: "12px", color: "#6c757d", marginBottom: "4px"}}>2G</div>
                                                <div style={{fontWeight: "600", fontSize: "14px"}}>
                                                    {member.game2 == null ? '-' : member.game2}
                                                </div>
                                            </div>
                                            <div style={{textAlign: "center"}}>
                                                <div style={{fontSize: "12px", color: "#6c757d", marginBottom: "4px"}}>3G</div>
                                                <div style={{fontWeight: "600", fontSize: "14px"}}>
                                                    {member.game3 == null ? '-' : member.game3}
                                                </div>
                                            </div>
                                            <div style={{textAlign: "center"}}>
                                                <div style={{fontSize: "12px", color: "#6c757d", marginBottom: "4px"}}>4G</div>
                                                <div style={{fontWeight: "600", fontSize: "14px"}}>
                                                    {member.game4 == null ? '-' : member.game4}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div style={{display: "flex", justifyContent: "space-between", fontSize: "14px"}}>
                                            <div>
                                                <span style={{color: "#6c757d"}}>총핀: </span>
                                                <span style={{fontWeight: "600"}}>{member.totalPins}</span>
                                            </div>
                                            <div>
                                                <span style={{color: "#6c757d"}}>핀차이: </span>
                                                <span style={{fontWeight: "600"}}>{member.pinDifference}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        {/* 게임별 순위 테이블 */}
                        <div style={{maxHeight: "200px", overflowY: "auto"}}>
                            <div className={styles.card}>
                                <div style={{fontWeight: "600", fontSize: "16px", marginBottom: "12px", textAlign: "center"}}>
                                    게임별 순위
                                </div>
                                {!allSideGrade1Scored && (
                                    <div style={{
                                        textAlign: "center",
                                        padding: "20px",
                                        color: "#6c757d",
                                        fontSize: "14px"
                                    }}>
                                        모든 사이드 멤버가 점수를 입력하면<br />
                                        게임별 순위가 표시됩니다.
                                    </div>
                                )}
                                <div style={{overflowX: "auto"}}>
                                    <table style={{width: "100%", borderCollapse: "collapse", fontSize: "12px"}}>
                                        <thead>
                                            <tr style={{background: "#f8f9fa"}}>
                                                <th style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center"}}>순위</th>
                                                <th style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center"}}>1G</th>
                                                <th style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center"}}>2G</th>
                                                <th style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center"}}>3G</th>
                                                <th style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center"}}>4G</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.from({ length: Math.max(game1Rankings.length, game2Rankings.length, game3Rankings.length, game4Rankings.length, 1) }, (_, i) => (
                                                <tr key={i}>
                                                    <td style={{padding: "6px", border: "1px solid #dee2e6", textAlign: "center", fontWeight: "600"}}>
                                                        {i + 1}위
                                                    </td>
                                                    <td style={{padding: "6px", border: "1px solid #dee2e6", textAlign: "center"}}>
                                                        {game1Rankings[i]?.memberName || "-"}
                                                    </td>
                                                    <td style={{padding: "6px", border: "1px solid #dee2e6", textAlign: "center"}}>
                                                        {game2Rankings[i]?.memberName || "-"}
                                                    </td>
                                                    <td style={{padding: "6px", border: "1px solid #dee2e6", textAlign: "center"}}>
                                                        {game3Rankings[i]?.memberName || "-"}
                                                    </td>
                                                    <td style={{padding: "6px", border: "1px solid #dee2e6", textAlign: "center"}}>
                                                        {game4Rankings[i]?.memberName || "-"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {page === 1 && (
                    <AvgSideRankingModal members={members} />
                )}
            </div>
        </Modal>
    );
}

function AvgSideRankingModal({ members }) {
    // sideAvg가 true인 멤버들만 필터링
    const filteredMembers = useMemo(() => {
        return members.filter(member => member.sideAvg === true);
    }, [members]);

    // 에버 사이드 멤버들이 모두 점수를 입력했는지 확인
    const allSideAvgScored = filteredMembers.length > 0 && 
        filteredMembers.every(member => 
            member?.game1 !== null && member?.game1 !== undefined && member?.game1 > 0
        );

    // 게임별로 memberAvg를 뺀 점수 계산 (해당 게임에 점수가 있는 멤버만)
    const getAvgGameRankings = (gameKey) => {
        if (!allSideAvgScored) return [];
        
        return filteredMembers
            .map(member => ({
                ...member,
                adjustedScore: member[gameKey] - (member.memberAvg || 0) // 각 게임 점수에서 memberAvg를 뺌
            }))
            .filter(member => member[gameKey] !== null && member[gameKey] > 0) // 0보다 큰 점수들만 필터링
            .sort((a, b) => b.adjustedScore - a.adjustedScore) // 점수 기준으로 내림차순 정렬
            .slice(0, 10); // 10등까지 추출
    };

    const game1Rankings = getAvgGameRankings("game1");
    const game2Rankings = getAvgGameRankings("game2");
    const game3Rankings = getAvgGameRankings("game3");
    const game4Rankings = getAvgGameRankings("game4");

    return (
        <div style={{maxHeight: "600px", overflowY: "auto"}}>
            <div className={styles.card}>
                <div style={{fontWeight: "600", fontSize: "16px", marginBottom: "12px", textAlign: "center"}}>
                    에버 사이드 순위
                </div>
                {!allSideAvgScored && (
                    <div style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        color: "#6c757d",
                        fontSize: "16px"
                    }}>
                        모든 에버 사이드 멤버가 점수를 입력하면<br />
                        순위가 표시됩니다.
                    </div>
                )}
                <div style={{overflowX: "auto"}}>
                    <table style={{width: "100%", borderCollapse: "collapse", fontSize: "11px"}}>
                        <thead>
                            <tr style={{background: "#f8f9fa"}}>
                                <th style={{padding: "6px", border: "1px solid #dee2e6", textAlign: "center"}}>순위</th>
                                <th style={{padding: "6px", border: "1px solid #dee2e6", textAlign: "center"}}>1G</th>
                                <th style={{padding: "6px", border: "1px solid #dee2e6", textAlign: "center"}}>2G</th>
                                <th style={{padding: "6px", border: "1px solid #dee2e6", textAlign: "center"}}>3G</th>
                                <th style={{padding: "6px", border: "1px solid #dee2e6", textAlign: "center"}}>4G</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: Math.max(game1Rankings.length, game2Rankings.length, game3Rankings.length, game4Rankings.length, 1) }, (_, i) => (
                                <tr key={i}>
                                    <td style={{padding: "4px", border: "1px solid #dee2e6", textAlign: "center", fontWeight: "600"}}>
                                        {i + 1}위
                                    </td>
                                    <td style={{padding: "4px", border: "1px solid #dee2e6", textAlign: "center"}}>
                                        {game1Rankings[i] ? (
                                            <>
                                                <div style={{fontWeight: "600"}}>{game1Rankings[i]?.memberName || "-"}</div>
                                                <div style={{fontSize: "10px"}}>
                                                    {game1Rankings[i]?.game1 != null ? (
                                                        <>
                                                            {game1Rankings[i]?.game1} (
                                                            {(game1Rankings[i]?.game1 - game1Rankings[i]?.memberAvg) >= 0 ? (
                                                                <span style={{color: "#dc3545"}}>+{(game1Rankings[i]?.game1 - game1Rankings[i]?.memberAvg).toFixed(0)}</span>
                                                            ) : (
                                                                <span style={{color: "#004EA2"}}>{(game1Rankings[i]?.game1 - game1Rankings[i]?.memberAvg).toFixed(0)}</span>
                                                            )}
                                                            )
                                                        </>
                                                    ) : ""}
                                                </div>
                                            </>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </td>
                                    <td style={{padding: "4px", border: "1px solid #dee2e6", textAlign: "center"}}>
                                        {game2Rankings[i] ? (
                                            <>
                                                <div style={{fontWeight: "600"}}>{game2Rankings[i]?.memberName || "-"}</div>
                                                <div style={{fontSize: "10px"}}>
                                                    {game2Rankings[i]?.game2 != null ? (
                                                        <>
                                                            {game2Rankings[i]?.game2} (
                                                            {(game2Rankings[i]?.game2 - game2Rankings[i]?.memberAvg) >= 0 ? (
                                                                <span style={{color: "#dc3545"}}>+{(game2Rankings[i]?.game2 - game2Rankings[i]?.memberAvg).toFixed(0)}</span>
                                                            ) : (
                                                                <span style={{color: "#004EA2"}}>{(game2Rankings[i]?.game2 - game2Rankings[i]?.memberAvg).toFixed(0)}</span>
                                                            )}
                                                            )
                                                        </>
                                                    ) : ""}
                                                </div>
                                            </>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </td>
                                    <td style={{padding: "4px", border: "1px solid #dee2e6", textAlign: "center"}}>
                                        {game3Rankings[i] ? (
                                            <>
                                                <div style={{fontWeight: "600"}}>{game3Rankings[i]?.memberName || "-"}</div>
                                                <div style={{fontSize: "10px"}}>
                                                    {game3Rankings[i]?.game3 != null ? (
                                                        <>
                                                            {game3Rankings[i]?.game3} (
                                                            {(game3Rankings[i]?.game3 - game3Rankings[i]?.memberAvg) >= 0 ? (
                                                                <span style={{color: "#dc3545"}}>+{(game3Rankings[i]?.game3 - game3Rankings[i]?.memberAvg).toFixed(0)}</span>
                                                            ) : (
                                                                <span style={{color: "#004EA2"}}>{(game3Rankings[i]?.game3 - game3Rankings[i]?.memberAvg).toFixed(0)}</span>
                                                            )}
                                                            )
                                                        </>
                                                    ) : ""}
                                                </div>
                                            </>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </td>
                                    <td style={{padding: "4px", border: "1px solid #dee2e6", textAlign: "center"}}>
                                        {game4Rankings[i] ? (
                                            <>
                                                <div style={{fontWeight: "600"}}>{game4Rankings[i]?.memberName || "-"}</div>
                                                <div style={{fontSize: "10px"}}>
                                                    {game4Rankings[i]?.game4 != null ? (
                                                        <>
                                                            {game4Rankings[i]?.game4} (
                                                            {(game4Rankings[i]?.game4 - game4Rankings[i]?.memberAvg) >= 0 ? (
                                                                <span style={{color: "#dc3545"}}>+{(game4Rankings[i]?.game4 - game4Rankings[i]?.memberAvg).toFixed(0)}</span>
                                                            ) : (
                                                                <span style={{color: "#004EA2"}}>{(game4Rankings[i]?.game4 - game4Rankings[i]?.memberAvg).toFixed(0)}</span>
                                                            )}
                                                            )
                                                        </>
                                                    ) : ""}
                                                </div>
                                            </>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
