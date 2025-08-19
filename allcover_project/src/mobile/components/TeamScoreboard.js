import { useEffect, useMemo } from "react";
import useScoreboard from "../../stores/useScoreboardStore";
import styles from "../css/components/modal/CommonModal.module.css";

export default function TeamScoreboard() {
    const { members = [], setTeam1stMember } = useScoreboard();

    const teams = Array.isArray(members) ? members.reduce((acc, member) => {
        if (!member) return acc;
        if (!acc[member.teamNumber]) {
            acc[member.teamNumber] = [];
        }
        acc[member.teamNumber].push(member);
        return acc;
    }, {}) : {};
    
    const teamScores = Object.keys(teams).map(teamNumber => {
        const teamMembers = teams[teamNumber];
        if (!Array.isArray(teamMembers)) return null;
        const hasZeroScore1 = teamMembers.some(member => member?.game1 === null);
        const hasZeroScore2 = teamMembers.some(member => member?.game2 === null);
        const hasZeroScore3 = teamMembers.some(member => member?.game3 === null);
        const hasZeroScore4 = teamMembers.some(member => member?.game4 === null);
        const totalScore = teamMembers.reduce((sum, member) => {
                const game1Score = hasZeroScore1 ? 0 : (member?.game1 || 0) - (member?.memberAvg || 0);
                const game2Score = hasZeroScore2 ? 0 : (member?.game2 || 0) - (member?.memberAvg || 0);
                const game3Score = hasZeroScore3 ? 0 : (member?.game3 || 0) - (member?.memberAvg || 0);
                const game4Score = hasZeroScore4 ? 0 : (member?.game4 || 0) - (member?.memberAvg || 0);
                return sum + game1Score + game2Score + game3Score + game4Score;
            }, 0);
        return {
            teamNumber,
            members: teamMembers,
            totalScore
        };
    }).filter(Boolean);

    const sortedTeams = useMemo(() => {
        return teamScores
            .filter(team => team?.teamNumber !== "0")
            .sort((a, b) => b.totalScore - a.totalScore);
    }, [teamScores]);

    useEffect(() => {
        if (sortedTeams.length > 0) {
            const topTeamMemberIds = sortedTeams[0]?.members?.map(member => member?.memberId);
            const topTeamMemberMembers = sortedTeams[0]?.members?.map(member => member);
            const teamMember = {
                ids: topTeamMemberIds,
                members: topTeamMemberMembers
            }
            if (teamMember) {
                setTeam1stMember(teamMember);
            }
        }
    }, [members, setTeam1stMember])

    return (
        <div style={{display: "flex", flexDirection: "column", alignItems: "center", width: "100%", height: "100%", overflowY: "auto", padding: "16px"}}>
            {sortedTeams.map((team, index) => {
                if (!team) return null;
                const hasZeroScore1 = team.members.some(member => member?.game1 === null);
                const hasZeroScore2 = team.members.some(member => member?.game2 === null);
                const hasZeroScore3 = team.members.some(member => member?.game3 === null);
                const hasZeroScore4 = team.members.some(member => member?.game4 === null);
                const game1Total = hasZeroScore1 ? 0 : team.members.reduce((sum, member) => sum + (member?.game1 || 0) - (member?.memberAvg || 0), 0);
                const game2Total = hasZeroScore2 ? 0 : team.members.reduce((sum, member) => sum + (member?.game2 || 0) - (member?.memberAvg || 0), 0);
                const game3Total = hasZeroScore3 ? 0 : team.members.reduce((sum, member) => sum + (member?.game3 || 0) - (member?.memberAvg || 0), 0);
                const game4Total = hasZeroScore4 ? 0 : team.members.reduce((sum, member) => sum + (member?.game4 || 0) - (member?.memberAvg || 0), 0);
                const totalSum = game1Total + game2Total + game3Total + game4Total;
                
                return (
                    <div key={team.teamNumber} className={styles.card} style={{width: "100%", marginBottom: "16px"}}>
                        <div style={{display: "flex", alignItems: "center", marginBottom: "12px"}}>
                            <div style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                background: index === 0 ? "#ffd700" : index === 1 ? "#c0c0c0" : index === 2 ? "#cd7f32" : "#004EA2",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "600",
                                fontSize: "16px",
                                marginRight: "12px"
                            }}>
                                {index + 1}
                            </div>
                            <div style={{fontWeight: "600", fontSize: "18px"}}>
                                Team {team.teamNumber}
                            </div>
                        </div>
                        
                        <div style={{overflowX: "auto"}}>
                            <table style={{width: "100%", borderCollapse: "collapse", fontSize: "12px"}}>
                                <thead>
                                    <tr style={{background: "#f8f9fa"}}>
                                        <th style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center", minWidth: "40px"}}>순위</th>
                                        <th style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center", minWidth: "80px"}}>이름</th>
                                        <th style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center", minWidth: "50px"}}>Avg</th>
                                        <th style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center", minWidth: "40px"}}>1G</th>
                                        <th style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center", minWidth: "40px"}}>2G</th>
                                        <th style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center", minWidth: "40px"}}>3G</th>
                                        <th style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center", minWidth: "40px"}}>4G</th>
                                        <th style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center", minWidth: "50px"}}>총점</th>
                                        <th style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center", minWidth: "50px"}}>평균</th>
                                        <th style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center", minWidth: "50px"}}>합계</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {team.members.map((member, idx) => {
                                        if (!member) return null;
                                        const scores = [member?.game1, member?.game2, member?.game3, member?.game4].filter(score => score !== null && score !== 0);
                                        const memberTotal = scores.reduce((sum, score) => sum + score, 0);
                                        const memberAvg = scores.length > 0 ? memberTotal / scores.length : 0;
                                        const avgTotal = scores.reduce((sum, score) => sum + score, 0) - ((member?.memberAvg || 0) * scores.length);
                                        
                                        return (
                                            <tr key={idx} style={{background: "#ffffff", borderBottom: "1px solid #dee2e6"}}>
                                                <td style={{padding: "6px", border: "1px solid #dee2e6", textAlign: "center", fontWeight: "600"}}>
                                                    {idx + 1}
                                                </td>
                                                <td style={{padding: "6px", border: "1px solid #dee2e6", textAlign: "center", fontWeight: "600"}}>
                                                    {member?.memberName}
                                                </td>
                                                <td style={{padding: "6px", border: "1px solid #dee2e6", textAlign: "center"}}>
                                                    {member?.memberAvg}
                                                </td>
                                                <td style={{padding: "6px", border: "1px solid #dee2e6", textAlign: "center", background: member?.game1 != null ? "#e3f2fd" : "transparent"}}>
                                                    {member?.game1 == null ? "-" : member?.game1}
                                                </td>
                                                <td style={{padding: "6px", border: "1px solid #dee2e6", textAlign: "center", background: member?.game2 != null ? "#e3f2fd" : "transparent"}}>
                                                    {member?.game2 == null ? "-" : member?.game2}
                                                </td>
                                                <td style={{padding: "6px", border: "1px solid #dee2e6", textAlign: "center", background: member?.game3 != null ? "#e3f2fd" : "transparent"}}>
                                                    {member?.game3 == null ? "-" : member?.game3}
                                                </td>
                                                <td style={{padding: "6px", border: "1px solid #dee2e6", textAlign: "center", background: member?.game4 != null ? "#e3f2fd" : "transparent"}}>
                                                    {member?.game4 == null ? "-" : member?.game4}
                                                </td>
                                                <td style={{padding: "6px", border: "1px solid #dee2e6", textAlign: "center", fontWeight: "600"}}>
                                                    {memberTotal}
                                                </td>
                                                <td style={{padding: "6px", border: "1px solid #dee2e6", textAlign: "center"}}>
                                                    {memberAvg.toFixed(1)}
                                                </td>
                                                <td style={{padding: "6px", border: "1px solid #dee2e6", textAlign: "center", fontWeight: "600", color: avgTotal >= 0 ? "#dc3545" : "#004EA2"}}>
                                                    {avgTotal >= 0 ? `+${avgTotal}` : avgTotal}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr style={{background: "#f8f9fa", fontWeight: "600"}}>
                                        <td style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center"}} colSpan={3}>
                                            팀 합계
                                        </td>
                                        <td style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center", color: game1Total >= 0 ? "#dc3545" : "#004EA2"}}>
                                            {game1Total >= 0 ? `+${game1Total}` : game1Total}
                                        </td>
                                        <td style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center", color: game2Total >= 0 ? "#dc3545" : "#004EA2"}}>
                                            {game2Total >= 0 ? `+${game2Total}` : game2Total}
                                        </td>
                                        <td style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center", color: game3Total >= 0 ? "#dc3545" : "#004EA2"}}>
                                            {game3Total >= 0 ? `+${game3Total}` : game3Total}
                                        </td>
                                        <td style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center", color: game4Total >= 0 ? "#dc3545" : "#004EA2"}}>
                                            {game4Total >= 0 ? `+${game4Total}` : game4Total}
                                        </td>
                                        <td style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center"}} colSpan={2}>
                                            팀 종합
                                        </td>
                                        <td style={{padding: "8px", border: "1px solid #dee2e6", textAlign: "center", fontWeight: "600", color: totalSum >= 0 ? "#dc3545" : "#004EA2"}}>
                                            {totalSum >= 0 ? `+${totalSum}` : totalSum}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
