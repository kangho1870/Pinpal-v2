import { useEffect, useState, useRef } from "react";
import styles from "../css/routes/MyClub.module.css";
import useSignInStore from "../../stores/useSignInStore";
import { useCookies } from "react-cookie";
import { ACCESS_TOKEN, CLUB_DETAIL_PATH, ROOT_PATH, SCOREBOARD_PATH } from "../../constants";
import { useNavigate, useParams } from "react-router-dom";
import { onClickBackBtn } from "../../hooks";
import { addGameRequest, clubJoinRequest, clubMemberAvgUpdateRequest, clubMemberRoleUpdateRequest, getCeremoniesRequest, getClubInfoRequest, getClubMembersRequest, getGameListRequest, getMemberListRequest, gameJoinRequest, gameJoinCancelRequest, getGameParticipantsRequest, getScoreboardMembers, getClubScoreboardsRequest, exportScoreboardExcelRequest } from "../../apis";
import Loading from "../components/loading/Loading";
import useClubStore from "../../stores/useClubStore";
import { tr } from "framer-motion/client";
import { useDuplicateRequestHandler } from "../../hooks/useDuplicateRequestHandler";

function MyClub() {
    const { members, setMembers, setCeremonys, setGames } = useClubStore();
    const { signInUser, login } = useSignInStore();
    const [loading, setLoading] = useState(false);
    const [addGameModal, setAddGameModal] = useState(false);
    const [participatedGames, setParticipatedGames] = useState(new Set());
    const navigator = useNavigate();
    const [cookies, removeCookie] = useCookies();
    const [clubInfo, setClubInfo] = useState({});
    const token = cookies[ACCESS_TOKEN];
    const [page, setPage] = useState(0);
    const { clubId } = useParams();
    const memberId = signInUser?.id || null;
    // 현재 사용자의 클럽 역할은 멤버 목록에서 가져와야 함
    const getCurrentUserClubRole = () => {
        if (!members || !signInUser) return null;
        const currentMember = members.find(member => member.memberId === signInUser.id);
        return currentMember?.clubRole || null;
    };
    const roles = getCurrentUserClubRole();
    
    // 현재 사용자의 클럽 역할을 가져오는 헬퍼 함수
    const getCurrentUserRole = () => {
        return getCurrentUserClubRole();
    };
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        if(cookies[ACCESS_TOKEN] && clubId) {
            pageLoad();
        }
        return () => { isMounted.current = false; };
    }, [cookies, clubId, signInUser]);

    const getMembersResponse = (responseBody) => {
        
        if (!responseBody) {
            alert('서버에 문제가 있습니다.');
            return;
        }
        
        // 백엔드에서 UserClubRespDto 배열을 직접 반환하는 경우
        if (Array.isArray(responseBody)) {
            // 백엔드 응답 구조를 프론트엔드에서 사용하는 구조로 변환
            const transformedMembers = responseBody.map(member => ({
                memberId: member.user?.id || member.id,
                memberName: member.user?.name || member.name,
                memberProfile: member.user?.profile || member.profileImageUrl,
                clubRole: member.role || 'MEMBER',
                avg: member.avg || 0,
                grade: member.grade || 0,
                // 기존 구조와의 호환성을 위한 추가 필드들
                average1Score: 0,
                average2Score: 0,
                average3Score: 0,
                average4Score: 0,
                avgScore: member.avg || 0
            }));
            
            if (isMounted.current) setMembers(transformedMembers);
            if (isMounted.current) setLoading(false);
            return;
        }
        
        // 기존 응답 구조 (code 필드가 있는 경우) - fallback
        if (responseBody.code === 'SU' && responseBody.members) {
            if (isMounted.current) setMembers(responseBody.members);
            if (isMounted.current) setLoading(false);
        } else if (responseBody.code === 'ERROR') {
            // 새로운 ErrorResponse 구조
            alert(responseBody.message || '멤버 목록을 불러오는데 실패했습니다.');
        } else {
            // 기존 에러 응답
            const message = 
                responseBody.code === 'AF' ? '잘못된 접근입니다.' :
                responseBody.code === 'DBE' ? '서버에 문제가 있습니다.' : 
                '멤버 목록을 불러오는데 실패했습니다.';
            alert(message);
        }
    }
    const getMembersRequest = () => {
        setLoading(true);
        getClubMembersRequest(clubId, token).then(getMembersResponse)
    }
    const addGameModalBtnClickHandler = () => {
        setAddGameModal(!addGameModal);
    }
    const getCeremonysListResponse = (responseBody) => {

        if (!responseBody) {
            alert('서버에 문제가 있습니다.');
            return;
        }
        
        // 백엔드에서 Map<Long, List<CeremonyRespDto>> 구조를 반환하는 경우
        if (typeof responseBody === 'object' && !Array.isArray(responseBody)) {
            // Map 구조를 배열로 변환하여 기존 코드와 호환성 유지
            const ceremoniesArray = Object.entries(responseBody).map(([gameId, ceremonies]) => ({
                gameId: parseInt(gameId),
                ceremonies: ceremonies
            }));
            
            if (isMounted.current) setCeremonys(ceremoniesArray);

            return;
        }
        
        // 기존 에러 응답 구조
        if (responseBody.code === 'ERROR') {
            alert(responseBody.message || '시상 목록을 불러오는데 실패했습니다.');
        } else {
            const message = 
                responseBody.code === 'AF' ? '잘못된 접근입니다.' :
                responseBody.code === 'DBE' ? '서버에 문제가 있습니다.' : 
                '시상 목록을 불러오는데 실패했습니다.';
            alert(message);
        }
    }
    const getCeremonysList = () => {
        console.log('🔍 시상 목록 요청 시작:', { clubId, token });
        // 현재는 간단한 시상 목록만 가져오므로 필터링은 프론트엔드에서 처리
        getCeremoniesRequest(clubId, token).then(getCeremonysListResponse);
    }

    // 게임 참여 상태 확인 함수
    const checkGameParticipation = async (gameId) => {
        try {
            const response = await getGameParticipantsRequest(gameId, token);

            if (response && Array.isArray(response)) {
                // 현재 사용자가 참여자 목록에 있는지 확인
                const isParticipating = response.some(participant => 
                    String(participant.userId || participant.id || participant.memberId) === String(memberId)
                );
                return isParticipating;
            }
            return false;
        } catch (error) {
            console.error('게임 참여 상태 확인 실패:', error);
            return false;
        }
    };

    // 모든 게임의 참여 상태를 확인하는 함수
    const checkAllGamesParticipation = async (games) => {
        const participatedGameIds = new Set();
        
        for (const game of games) {
            try {
                const isParticipating = await checkGameParticipation(game.id);
                if (isParticipating) {
                    participatedGameIds.add(game.id);
                }
            } catch (error) {
                console.error(`게임 ${game.id} 참여 상태 확인 실패:`, error);
            }
        }

        setParticipatedGames(participatedGameIds);
    };

    const getGamesResponse = (responseBody) => {
        
        if (!responseBody) {
            alert('서버에 문제가 있습니다.');
            return;
        }
        
        // 백엔드에서 PageResponse<GameRespDto>를 반환하는 경우
        if (responseBody.content !== undefined) {
            const { content: games } = responseBody;
            
            if (games && Array.isArray(games)) {
                // 백엔드 응답 구조를 프론트엔드에서 사용하는 구조로 변환
                const transformedGames = games.map(game => ({
                    id: game.id,
                    gameName: game.name,
                    gameDate: game.date,
                    gameTime: game.time,
                    gameType: game.type,
                    members: game.members || [], // 백엔드에서 반환하는 members 배열
                    joinUserCount: game.joinUserCount || 0, // 참여자 수
                    // 기본값 설정
                    confirmedCode: "",
                    status: game.status || "ACTIVE",
                    scoreCounting: game.scoreCounting || false,
                    clubId: clubId
                }));
                
                if (isMounted.current) setGames(transformedGames);
                
                // 각 게임의 참여 상태 확인
                checkAllGamesParticipation(transformedGames);
                
                if (isMounted.current) setLoading(false);

                return;
            }
        }
        
        // 백엔드에서 GameRespDto 배열을 직접 반환하는 경우
        if (Array.isArray(responseBody)) {
            if (isMounted.current) setGames(responseBody);
            if (isMounted.current) setLoading(false);

            return;
        }
        
        // 기존 에러 응답 구조
        if (responseBody.code === 'ERROR') {
            alert(responseBody.message || '게임 목록을 불러오는데 실패했습니다.');
        } else {
            const message = 
                responseBody.code === 'AF' ? '잘못된 접근입니다.' :
                responseBody.code === 'DBE' ? '서버에 문제가 있습니다.' : 
                '게임 목록을 불러오는데 실패했습니다.';
            alert(message);
        }
    }
    const getGamesRequest = () => {
        setLoading(true);
        getGameListRequest(clubId, token).then(getGamesResponse);
    }
    const getClubInfoResponse = (responseBody) => {
        
        if (!responseBody) {
            alert('서버에 문제가 있습니다.');
            return;
        }
        
        // 백엔드에서 ClubRespDto를 직접 반환하는 경우
        if (responseBody.id && responseBody.name) {
            if (isMounted.current) setClubInfo({ 
                clubName: responseBody.name, 
                clubDescription: responseBody.description 
            });

            return;
        }
        
        // 기존 응답 구조 (code 필드가 있는 경우) - fallback
        if (responseBody.code === 'SU' && responseBody.clubName) {
            if (isMounted.current) setClubInfo({ 
                clubName: responseBody.clubName, 
                clubDescription: responseBody.clubDescription 
            });
        } else if (responseBody.code === 'ERROR') {
            // 새로운 ErrorResponse 구조
            alert(responseBody.message || '클럽 정보를 불러오는데 실패했습니다.');
        } else {
            // 기존 에러 응답
            const message = 
                responseBody.code === 'AF' ? '잘못된 접근입니다.' :
                responseBody.code === 'DBE' ? '서버에 문제가 있습니다.' : 
                '클럽 정보를 불러오는데 실패했습니다.';

            alert(message);
        }
    }
    const getClubInfo = () => {
        getClubInfoRequest(clubId, token).then(getClubInfoResponse);
    }
    const memberJoinClubResponse = (responseBody) => {
        if (!responseBody) {
            alert('서버에 문제가 있습니다.');
            return;
        }
        
        // 새로운 구조: void 응답 (성공 시 200 OK, 실패 시 예외 발생)
        if (responseBody.code === 'ERROR') {
            // 새로운 ErrorResponse 구조
            alert(responseBody.message || '클럽 가입에 실패했습니다.');
            return;
        }
        
        // 성공 시 (void 응답이므로 responseBody가 없거나 빈 객체)
        alert('클럽에 가입되었습니다.');
        // 사용자 정보는 이미 store에 있으므로 별도 API 호출 불필요
        getMembersRequest();
        pageLoad();
        if (isMounted.current) setLoading(false);
    }
    const memberJoinClubRequest = () => {
        if (members.some((member) => String(member.memberId) === String(memberId))) {
            alert("이미 가입한 클럽입니다.")
            return;
        }else if(signInUser == null) {
            alert("로그인이 필요합니다.")
            return;
        }
        setLoading(true);
        clubJoinRequest(clubId, memberId, token).then(memberJoinClubResponse);
    }
    const pageLoad = () => {
        getMembersRequest();
        getCeremonysList();
        getGamesRequest();
        getClubInfo();
    }
    return (
        <>
            <div className={styles.container}>
                <div className={styles.top}>
                    <div className={styles.clubTitle}>
                        <div className={styles.topCategory} onClick={() => onClickBackBtn(navigator)}><i className="fa-solid fa-chevron-left"></i></div>
                        <span className={styles.clubNameTitle}>{clubInfo.clubName}</span>
                        <div className={styles.topCategory}><i className="fa-solid fa-right-from-bracket"></i></div>
                    </div>
                    <div className={styles.clubNav}>
                        <button className={`${styles.clubNavBtns} ${page === 0 ? styles.selectedClubNavBtn : ""}`} onClick={() => setPage(0)}><span className={styles.btnSpan}>홈</span></button>
                        <button className={`${styles.clubNavBtns} ${page === 1 ? styles.selectedClubNavBtn : ""}`} onClick={() => setPage(1)}><span className={styles.btnSpan}>기록실</span></button>
                        <button className={`${styles.clubNavBtns} ${page === 2 ? styles.selectedClubNavBtn : ""}`} onClick={() => setPage(2)}><span className={styles.btnSpan}>게시판</span></button>
                        <button className={`${styles.clubNavBtns} ${page === 3 ? styles.selectedClubNavBtn : ""}`} onClick={() => setPage(3)}><span className={styles.btnSpan}>랭킹</span></button>
                        {(() => {
                            // 현재 사용자의 클럽 역할 찾기
                            const currentMember = members.find((member) => String(member.memberId) === String(memberId));
                            const userClubRole = currentMember?.clubRole || getCurrentUserRole();
                            
                            return userClubRole === "STAFF" || userClubRole === "MASTER";
                        })() &&
                            <button className={`${styles.clubNavBtns} ${page === 4 ? styles.selectedClubNavBtn : ""}`} onClick={() => setPage(4)}><span className={styles.btnSpan}>관리</span></button>
                        }
                    </div>
                </div>
                <div className={styles.contextArea}>
                    {page === 0 && <ClubHome clubInfo={clubInfo} setLoading={setLoading} pageLoad={pageLoad} participatedGames={participatedGames} setParticipatedGames={setParticipatedGames} clubId={clubId}></ClubHome>}
                    {page === 1 && <ClubCeremony setLoading={setLoading}></ClubCeremony>}
                    {page === 3 && <ClubRanking setLoading={setLoading}></ClubRanking>}
                    {page === 4 && <ClubSetting setLoading={setLoading} pageLoad={pageLoad} clubId={clubId}></ClubSetting>}
                </div>
            </div>
            {page === 0 && (() => {
                // 현재 사용자의 클럽 역할 찾기
                const currentMember = members.find((member) => String(member.memberId) === String(memberId));
                const userClubRole = currentMember?.clubRole || getCurrentUserRole();
                
                return userClubRole === "STAFF" || userClubRole === "MASTER";
            })() && (
                <div className={styles.modalContainer}>
                    <div className={styles.modalBox}>
                        <div className={styles.modal} onClick={addGameModalBtnClickHandler}>
                            <i className="fa-solid fa-plus"></i>
                            <span className={styles.modalTitle}>게임 생성</span>
                        </div>
                    </div>
                </div>
            )}
            {addGameModal && (() => {
                // 현재 사용자의 클럽 역할 찾기
                const currentMember = members.find((member) => String(member.memberId) === String(memberId));
                const userClubRole = currentMember?.clubRole || getCurrentUserRole();
                
                return userClubRole === "STAFF" || userClubRole === "MASTER";
            })() && (
                <div className={styles.addGameModal}>
                    <AddGameModal clubId={clubId} token={token} pageLoad={pageLoad} addGameModalBtnClickHandler={addGameModalBtnClickHandler} ></AddGameModal>
                </div>
            )}
            {loading && <Loading></Loading>}
            {page === 0 && !members.some((member) => String(member.memberId) === String(memberId)) && signInUser && 
                <button className={styles.clubJoinBtn} onClick={memberJoinClubRequest}>클럽 가입하기</button>
            }
        </>
    )
}

export default MyClub;

function ClubHome({ clubInfo, setLoading, pageLoad, participatedGames, setParticipatedGames, clubId }) {

    const { members, ceremonys, games } = useClubStore();
    const { signInUser, setSignInUser } = useSignInStore();
    const navigator = useNavigate();
    const [cookies] = useCookies();
    const token = cookies[ACCESS_TOKEN];

    const memberId = signInUser?.id || null;
    // 현재 사용자의 클럽 역할은 멤버 목록에서 가져와야 함
    const getCurrentUserClubRoleInHome = () => {
        if (!members || !signInUser) return null;
        const currentMember = members.find(member => member.memberId === signInUser.id);
        return currentMember?.clubRole || null;
    };
    const roles = getCurrentUserClubRoleInHome();

    console.log('ClubHome - clubId:', clubId);
    console.log('ClubHome - signInUser:', signInUser);


    const scheduleOnClickHandler = (gameId) => {
        console.log('scheduleOnClickHandler 호출됨:', { gameId, clubId, signInUser });
        
        if (!clubId) {
            console.error('clubId가 정의되지 않았습니다.');
            alert('클럽 정보를 찾을 수 없습니다.');
            return;
        }
        
        const targetPath = `${SCOREBOARD_PATH}?gameId=${gameId}&clubId=${String(clubId)}`;

        navigator(targetPath);
    }

    const formatShortDate = (date) => {
        
        // 날짜 값이 없거나 잘못된 경우 처리
        if (!date) {
            console.log('🔍 날짜 없음');
            return '날짜 없음';
        }
        
        try {
            // 한국 시간대로 처리
            const dateObj = new Date(date + 'T00:00:00+09:00');

            // 유효하지 않은 날짜인 경우
            if (isNaN(dateObj.getTime())) {
                console.log('🔍 날짜 오류 - 유효하지 않은 날짜');
                return '날짜 오류';
            }
            
            const formattedDate = new Intl.DateTimeFormat('ko-KR', {
                month: 'numeric',
                day: 'numeric',
                weekday: 'short'
            }).format(dateObj);
            
            return formattedDate.replace(/\./g, ' /').replace('/(', ' (');
        } catch (error) {
            console.error('날짜 포맷 오류:', error, '입력값:', date);
            return '날짜 오류';
        }
    };

    const formatDateTime = (date, time) => {
        console.log('🔍 formatDateTime 호출됨:', { date, time, dateType: typeof date, timeType: typeof time });
        
        // 날짜나 시간 값이 없는 경우 처리
        if (!date || !time) {
            console.log('🔍 일시 없음 - 날짜 또는 시간이 없음');
            return '일시 없음';
        }
        
        try {
            // 한국 시간대로 처리
            const dateTime = new Date(`${date}T${time}+09:00`);
            
            // 유효하지 않은 날짜인 경우
            if (isNaN(dateTime.getTime())) {
                console.log('🔍 일시 오류 - 유효하지 않은 날짜');
                return '일시 오류';
            }
            
            const formattedDate = new Intl.DateTimeFormat('ko-KR', {
                month: 'numeric',
                day: 'numeric',
                weekday: 'short',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            }).format(dateTime);
        
            return formattedDate.replace(/\./g, '/').replace('/(', ' (');
        } catch (error) {
            console.error('일시 포맷 오류:', error, '입력값:', { date, time });
            return '일시 오류';
        }
    };

    const gameJoinResponse = (responseBody) => {
        
        if (!responseBody) {
            alert('서버에 문제가 있습니다.');
            setLoading(false);
            return;
        }

        // 백엔드에서 GameRespDto를 반환하는 경우
        if (responseBody.id && responseBody.name) {
            alert('게임에 참여했습니다.');
            // 로컬 상태 업데이트
            setParticipatedGames(prev => new Set([...prev, responseBody.id]));
            // 게임 목록과 멤버 목록을 새로고침
            pageLoad();
            setLoading(false);
            return;
        }

        // 에러 처리
        if (responseBody.code === 'ERROR') {
            alert(responseBody.message || '게임 참여에 실패했습니다.');
        } else {
            alert('게임 참여에 실패했습니다.');
        }
        setLoading(false);
    }

    const gameJoinCancelResponse = (responseBody) => {
        
        if (!responseBody) {
            alert('서버에 문제가 있습니다.');
            setLoading(false);
            return;
        }

        // 백엔드에서 GameRespDto를 반환하는 경우
        if (responseBody.id && responseBody.name) {
            alert('게임 참여를 취소했습니다.');
            // 로컬 상태 업데이트
            setParticipatedGames(prev => {
                const newSet = new Set(prev);
                newSet.delete(responseBody.id);
                return newSet;
            });
            // 게임 목록과 멤버 목록을 새로고침
            pageLoad();
            setLoading(false);
            return;
        }

        // 에러 처리
        if (responseBody.code === 'ERROR') {
            alert(responseBody.message || '게임 참여 취소에 실패했습니다.');
        } else {
            alert('게임 참여 취소에 실패했습니다.');
        }
        setLoading(false);
    }

    // 게임 참여 상태 확인 함수
    const checkGameParticipation = async (gameId) => {
        try {
            const response = await getGameParticipantsRequest(gameId, token);
            
            if (response && Array.isArray(response)) {
                // 현재 사용자가 참여자 목록에 있는지 확인
                const isParticipating = response.some(participant => 
                    String(participant.userId || participant.id || participant.memberId) === String(memberId)
                );
                return isParticipating;
            }
            return false;
        } catch (error) {
            console.error('게임 참여 상태 확인 실패:', error);
            return false;
        }
    };

    const handleGameJoin = (gameId, isJoining) => {
        if (!members.some((member) => String(member.memberId) === String(memberId))) {
            alert("클럽원만 참여가능합니다.");
            return;
        }
        setLoading(true);
        
        if (isJoining) {
            gameJoinRequest(gameId, token)
                .then(gameJoinResponse)
                .catch((error) => {
                    const errorMessage = error.response?.data?.details || error.response?.data?.message || error.message;
                    if (errorMessage.includes('이미 참여한 게임입니다')) {
                        alert('이미 참여한 게임입니다.');
                        // 로컬 상태에 참여한 게임으로 추가
                        setParticipatedGames(prev => new Set([...prev, gameId]));
                        // 이미 참여한 경우 게임 목록을 새로고침하여 참여 상태 업데이트
                        pageLoad();
                    } else {
                        alert('게임 참여에 실패했습니다: ' + errorMessage);
                    }
                    setLoading(false);
                });
        } else {
            gameJoinCancelRequest(gameId, token)
                .then(gameJoinCancelResponse)
                .catch((error) => {
                    alert('게임 참여 취소에 실패했습니다: ' + (error.response?.data?.message || error.message));
                    setLoading(false);
                });
        }
    }

    const dateTimeCheck = (game) => {
        const gameDateTime = new Date(`${game.gameDate}T${game.gameTime}+09:00`);
        const now = new Date();

        // 게임 시간이 지났거나 게임이 종료된 경우 참석 불가
        const isGameTimePassed = now > gameDateTime;
        const isGameFinished = game.status === "FINISHED";
        
        return isGameTimePassed || isGameFinished;
    }

    useEffect(() => {
        if(cookies[ACCESS_TOKEN] == null) {
            alert("로그인이 필요한 서비스입니다.");
            navigator(ROOT_PATH);
        }
    },[members])

    return (
        <>
            <div className={`${styles.clubBannerArea}`}>
                <img className={styles.bannerImage} src={require("../../imges/KakaoTalk_20241108_021010839.jpg")} alt="배너 이미지"></img>
            </div>
            <div
                className={`${styles.clubDescription} ${styles.commonDiv}`}
                dangerouslySetInnerHTML={{ __html: clubInfo.clubDescription }}
            />
            <div className={styles.divSection}></div>
            <div className={styles.subTitle}>
                <h3>클럽 일정</h3>
            </div>
            <div className={`${styles.clubSchedule}`}>
                {(() => {
                    // 현재 시간보다 지나간 게임들을 필터링
                    const now = new Date();
                    const futureGames = games.filter(game => {
                        const gameDateTime = new Date(`${game.gameDate}T${game.gameTime}+09:00`);
                        return gameDateTime > now; // 현재 시간보다 미래인 게임만 포함
                    });

                    if (futureGames.length === 0) {
                        return (
                            <div className={styles.nodataContainer}>
                                <Nodata text={"진행중인 일정이 없습니다."}></Nodata>
                            </div>
                        );
                    }

                    // 게임을 타입별로 그룹화
                    const gamesByType = {
                        "정기모임": futureGames.filter(game => game.gameType === "정기모임"),
                        "정기번개": futureGames.filter(game => game.gameType === "정기번개"),
                        "기타": futureGames.filter(game => game.gameType === "기타")
                    };

                    return (
                        <>
                            {/* 정기모임 */}
                            {gamesByType["정기모임"].length > 0 && (
                                <div className={styles.gameTypeSection}>
                                    <h4 className={styles.gameTypeTitle}>정기모임</h4>
                                                                                                                {gamesByType["정기모임"].map((game, index) => (
                                        <div key={`정기모임-${index}`}>
                                            <div className={`${styles.scheduleBox} ${game.status === "FINISHED" ? styles.gameFinished : ""}`}>
                                                <div className={styles.scheduleTitle}>
                                                    <p>
                                                        {game.gameName}
                                                        {game.status === "FINISHED" && (
                                                            <span className={styles.gameFinishedBadge}>종료</span>
                                                        )}
                                                    </p>
                                                    <div className={styles.scheduleTitle}>
                                                        <h5>{formatShortDate(game.gameDate)}</h5>
                                                            {!dateTimeCheck(game) && (
                                                                (() => {
                                                                    // 로컬 상태와 백엔드 멤버 목록을 모두 확인
                                                                    const backendParticipating = game.members.some((member) => {
                                                                        const memberIdToCheck = member.memberId || member.id || member.userId;
                                                                        const result = String(memberIdToCheck) === String(memberId);
                                                                        return result;
                                                                    });
                                                                    const localParticipating = participatedGames.has(game.id);
                                                                    const isParticipating = backendParticipating || localParticipating;

                                                                    return isParticipating ? (
                                                                        <button className={styles.scheduleCancleBtn} onClick={() => handleGameJoin(game.id, false)}>취소</button>
                                                                    ) : (
                                                                        <button className={styles.scheduleJoinBtn} onClick={() => handleGameJoin(game.id, true)}>참석</button>
                                                                    );
                                                                })()
                                                            )}
                                                        {dateTimeCheck(game) && (
                                                            <button 
                                                                className={styles.scheduleCancleBtn}
                                                                onClick={() => {
                                                                    const gameDateTime = new Date(`${game.gameDate}T${game.gameTime}`);
                                                                    const now = new Date();
                                                                    const isGameTimePassed = now > gameDateTime;
                                                                    const isGameFinished = game.status === "FINISHED";
                                                                    
                                                                    if (isGameTimePassed) {
                                                                        alert("게임 시간이 지나서 참석할 수 없습니다.");
                                                                    } else if (isGameFinished) {
                                                                        alert("게임이 종료되어 참석할 수 없습니다.");
                                                                    }
                                                                }}
                                                            >
                                                                참석불가
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={styles.scheduleContnet}>
                                                    <div className={styles.imgBox}>
                                                        <img className={styles.scheduleImg} src={require("../../imges/club/bowlingGame.png")}></img>
                                                    </div>
                                                    <div className={styles.scheduleDescriptionArea}>
                                                        <div className={styles.scheduleDescriptionBox}>
                                                            <span className={styles.descriptionSubTitle}>일시:</span>
                                                            <h5 className={styles.descriptionSubContent}>{formatDateTime(game.gameDate, game.gameTime)}</h5>
                                                        </div>
                                                        <div className={styles.scheduleDescriptionBox}>
                                                            <span className={styles.descriptionSubTitle}>장소:</span>
                                                            <h5 className={styles.descriptionSubContent}>서면볼링센터</h5>
                                                        </div>
                                                        <div className={styles.scheduleDescriptionBox}>
                                                            <span className={styles.descriptionSubTitle}>참석:</span>
                                                            <h5 className={styles.descriptionSubContent}>{(game.joinUserCount || 0) + "명"}</h5>
                                                        </div>
                                                        <button className={styles.scoreboard} onClick={() => scheduleOnClickHandler(game.id)}>점수판</button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.memberProfileContainer}>
                                                {game.members.map((member, i) => (
                                                    <div key={i} className={styles.gameMemberBox}>
                                                        <img className={styles.memberProfileImg} src={member.memberProfile}></img>
                                                        {member.memberRole == "MASTER" && 
                                                            <img className={styles.staffImg} src={require("../../imges/club/master.png")}></img>
                                                        }
                                                        {member.memberRole == "STAFF" && 
                                                            <img className={styles.staffImg} src={require("../../imges/club/staff.png")}></img>
                                                        }
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 정기번개 */}
                            {gamesByType["정기번개"].length > 0 && (
                                <div className={styles.gameTypeSection}>
                                    <h4 className={styles.gameTypeTitle}>정기번개</h4>
                                        {gamesByType["정기번개"].map((game, index) => (
                                            <div key={`정기번개-${index}`}>
                                                <div className={`${styles.scheduleBox} ${game.status === "FINISHED" ? styles.gameFinished : ""}`}>
                                                    <div className={styles.scheduleTitle}>
                                                        <p>
                                                            {game.gameName}
                                                            {game.status === "FINISHED" && (
                                                                <span className={styles.gameFinishedBadge}>종료</span>
                                                            )}
                                                        </p>
                                                        <div className={styles.scheduleTitle}>
                                                            <h5>{formatShortDate(game.gameDate)}</h5>
                                                            {!dateTimeCheck(game) && (
                                                                (() => {
                                                                    // 로컬 상태와 백엔드 멤버 목록을 모두 확인
                                                                    const backendParticipating = game.members.some((member) => {
                                                                        const memberIdToCheck = member.memberId || member.id || member.userId;
                                                                        const result = String(memberIdToCheck) === String(memberId);

                                                                        return result;
                                                                    });
                                                                    const localParticipating = participatedGames.has(game.id);
                                                                    const isParticipating = backendParticipating || localParticipating;
                                                                    return isParticipating ? (
                                                                        <button className={styles.scheduleCancleBtn} onClick={() => handleGameJoin(game.id, false)}>취소</button>
                                                                    ) : (
                                                                        <button className={styles.scheduleJoinBtn} onClick={() => handleGameJoin(game.id, true)}>참석</button>
                                                                    );
                                                                })()
                                                            )}
                                                        {dateTimeCheck(game) && (
                                                            <button 
                                                                className={`${game.status === "FINISHED" ? styles.gameFinishedBtn : styles.scheduleCancleBtn}`}
                                                                onClick={() => {
                                                                    const gameDateTime = new Date(`${game.gameDate}T${game.gameTime}+09:00`);
                                                                    const now = new Date();
                                                                    const isGameTimePassed = now > gameDateTime;
                                                                    const isGameFinished = game.status === "FINISHED";
                                                                    
                                                                    if (isGameTimePassed) {
                                                                        alert("게임 시간이 지나서 참석할 수 없습니다.");
                                                                    } else if (isGameFinished) {
                                                                        alert("게임이 종료되어 참석할 수 없습니다.");
                                                                    }
                                                                }}
                                                            >
                                                                {game.status === "FINISHED" ? "게임종료" : "참석불가"}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={styles.scheduleContnet}>
                                                    <div className={styles.imgBox}>
                                                        <img className={styles.scheduleImg} src={require("../../imges/club/bowlingGame.png")} alt="볼링 게임"></img>
                                                    </div>
                                                    <div className={styles.scheduleDescriptionArea}>
                                                        <div className={styles.scheduleDescriptionBox}>
                                                            <span className={styles.descriptionSubTitle}>일시:</span>
                                                            <h5 className={styles.descriptionSubContent}>{formatDateTime(game.gameDate, game.gameTime)}</h5>
                                                        </div>
                                                        <div className={styles.scheduleDescriptionBox}>
                                                            <span className={styles.descriptionSubTitle}>장소:</span>
                                                            <h5 className={styles.descriptionSubContent}>서면볼링센터</h5>
                                                        </div>
                                                        <div className={styles.scheduleDescriptionBox}>
                                                            <span className={styles.descriptionSubTitle}>참석:</span>
                                                            <h5 className={styles.descriptionSubContent}>{(game.joinUserCount || 0) + "명"}</h5>
                                                        </div>
                                                        <button className={styles.scoreboard} onClick={() => scheduleOnClickHandler(game.id)}>점수판</button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.memberProfileContainer}>
                                                {game.members.map((member, i) => (
                                                    <div key={i} className={styles.gameMemberBox}>
                                                        <img className={styles.memberProfileImg} src={member.memberProfile}></img>
                                                        {member.memberRole == "MASTER" && 
                                                            <img className={styles.staffImg} src={require("../../imges/club/master.png")}></img>
                                                        }
                                                        {member.memberRole == "STAFF" && 
                                                            <img className={styles.staffImg} src={require("../../imges/club/staff.png")}></img>
                                                        }
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                                                        {/* 기타 */}
                            {gamesByType["기타"].length > 0 && (
                                <div className={styles.gameTypeSection}>
                                    <h4 className={styles.gameTypeTitle}>기타</h4>
                                        {gamesByType["기타"].map((game, index) => (
                                            <div key={`기타-${index}`}>
                                                <div className={`${styles.scheduleBox} ${game.status === "FINISHED" ? styles.gameFinished : ""}`}>
                                                    <div className={styles.scheduleTitle}>
                                                        <p>
                                                            {game.gameName}
                                                            {game.status === "FINISHED" && (
                                                                <span className={styles.gameFinishedBadge}>종료</span>
                                                            )}
                                                        </p>
                                                        <div className={styles.scheduleTitle}>
                                                            <h5>{formatShortDate(game.gameDate)}</h5>
                                                        {!dateTimeCheck(game) && (
                                                            (() => {
                                                                // 로컬 상태와 백엔드 멤버 목록을 모두 확인
                                                                const backendParticipating = game.members.some((member) => {
                                                                    const memberIdToCheck = member.memberId || member.id || member.userId;
                                                                    const result = String(memberIdToCheck) === String(memberId);
                                                                    console.log('🔍 기타 멤버 참여 확인:', {
                                                                        member,
                                                                        memberIdToCheck,
                                                                        currentMemberId: memberId,
                                                                        result
                                                                    });
                                                                    return result;
                                                                });
                                                                const localParticipating = participatedGames.has(game.id);
                                                                const isParticipating = backendParticipating || localParticipating;
                                                                console.log('🔍 기타 참여 상태 확인:', {
                                                                    gameId: game.id,
                                                                    gameName: game.gameName,
                                                                    memberId,
                                                                    gameMembers: game.members,
                                                                    isParticipating
                                                                });
                                                                return isParticipating ? (
                                                                    <button className={styles.scheduleCancleBtn} onClick={() => handleGameJoin(game.id, false)}>취소</button>
                                                                ) : (
                                                                    <button className={styles.scheduleJoinBtn} onClick={() => handleGameJoin(game.id, true)}>참석</button>
                                                                );
                                                            })()
                                                        )}
                                                        {dateTimeCheck(game) && (
                                                            <button 
                                                                className={`${game.status === "FINISHED" ? styles.gameFinishedBtn : styles.scheduleCancleBtn}`}
                                                                onClick={() => {
                                                                    const gameDateTime = new Date(`${game.gameDate}T${game.gameTime}+09:00`);
                                                                    const now = new Date();
                                                                    const isGameTimePassed = now > gameDateTime;
                                                                    const isGameFinished = game.status === "FINISHED";
                                                                    
                                                                    if (isGameTimePassed) {
                                                                        alert("게임 시간이 지나서 참석할 수 없습니다.");
                                                                    } else if (isGameFinished) {
                                                                        alert("게임이 종료되어 참석할 수 없습니다.");
                                                                    }
                                                                }}
                                                            >
                                                                {game.status === "FINISHED" ? "게임종료" : "참석불가"}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={styles.scheduleContnet}>
                                                    <div className={styles.imgBox}>
                                                        <img className={styles.scheduleImg} src={require("../../imges/club/bowlingGame.png")}></img>
                                                    </div>
                                                    <div className={styles.scheduleDescriptionArea}>
                                                        <div className={styles.scheduleDescriptionBox}>
                                                            <span className={styles.descriptionSubTitle}>일시:</span>
                                                            <h5 className={styles.descriptionSubContent}>{formatDateTime(game.gameDate, game.gameTime)}</h5>
                                                        </div>
                                                        <div className={styles.scheduleDescriptionBox}>
                                                            <span className={styles.descriptionSubTitle}>장소:</span>
                                                            <h5 className={styles.descriptionSubContent}>서면볼링센터</h5>
                                                        </div>
                                                        <div className={styles.scheduleDescriptionBox}>
                                                            <span className={styles.descriptionSubTitle}>참석:</span>
                                                            <h5 className={styles.descriptionSubContent}>{(game.joinUserCount || 0) + "명"}</h5>
                                                        </div>
                                                        <button className={styles.scoreboard} onClick={() => scheduleOnClickHandler(game.id)}>점수판</button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.memberProfileContainer}>
                                                {game.members.map((member, i) => (
                                                    <div key={i} className={styles.gameMemberBox}>
                                                        <img className={styles.memberProfileImg} src={member.memberProfile}></img>
                                                        {member.memberRole == "MASTER" && 
                                                            <img className={styles.staffImg} src={require("../../imges/club/master.png")}></img>
                                                        }
                                                        {member.memberRole == "STAFF" && 
                                                            <img className={styles.staffImg} src={require("../../imges/club/staff.png")}></img>
                                                        }
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>
            <div className={styles.divSection}></div>
            <div className={styles.subTitle}>
                <h3>최근 게임</h3>
            </div>
            <div className={`${styles.clubRecentGame} ${styles.commonDiv}`}>
                {ceremonys.length > 0 ? (
                    ceremonys.map((gameCeremony, i) => {
                        // 해당 게임의 정보 찾기
                        const game = games.find(g => g.id === gameCeremony.gameId);
                        const gameName = game ? game.gameName : `게임 ${gameCeremony.gameId}`;
                        
                        return (
                            <div key={gameCeremony.gameId} className={styles.recentGameBox}>
                                <p>{gameName}</p>
                                {gameCeremony.ceremonies.map((ceremony, j) => (
                                    <div key={j} className={styles.recentGameCeremony}>
                                        <div className={styles.recentGameDescriptionBox}>
                                            <span className={styles.recentGameSubTitle}>
                                                {ceremony.type === 'pin1st' ? '1등' : 
                                                 ceremony.type === 'team1st' ? '팀 1등' : 
                                                 ceremony.type}
                                            </span>
                                            <h5 className={styles.recentGameSubContent}>
                                                {ceremony.winners && ceremony.winners.length > 0 
                                                    ? ceremony.winners.join(', ') 
                                                    : '-'}
                                            </h5>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })
                ) : (
                    <div className={styles.nodataContainer}>
                        <Nodata text={"최근 게임 데이터가 없습니다."}></Nodata>
                    </div>
                )}
            </div>
            <div className={styles.divSection}></div>
            <div className={styles.subTitle}>
                <h3>클럽 멤버</h3>
            </div>
            <div className={`${styles.memberContainer} ${styles.commonDiv}`}>
                {members
                    .sort((a, b) => {
                        // 1. memberId가 현재 사용자(memberId)와 같은 항목을 제일 위로
                        if (a.memberId === memberId) return -1;
                        if (b.memberId === memberId) return 1;

                        // 2. MASTER가 STAFF보다 위로, 그 외는 기본 순서
                        const roleOrder = { MASTER: 1, STAFF: 2, MEMBER: 3 };
                        return (roleOrder[a.memberRole] || 4) - (roleOrder[b.memberRole] || 4);
                    })
                    .map((member, i) => (
                        <div key={member.memberId} className={styles.memberBox}>
                            <div className={styles.memberProfile}>
                                <img className={styles.memberImg} src={member.memberProfile} alt="Profile" />
                                {member.clubRole === "MASTER" && (
                                    <img
                                        className={styles.staffImg}
                                        src={require("../../imges/club/master.png")}
                                        alt="Master"
                                    />
                                )}
                                {member.clubRole === "STAFF" && (
                                    <img
                                        className={styles.staffImg}
                                        src={require("../../imges/club/staff.png")}
                                        alt="Staff"
                                    />
                                )}
                            </div>
                            <div className={styles.memberProfileBox}>{member.memberName}</div>
                        </div>
                    ))
                }
            </div>
        </>
    )
}

function ClubCeremony({ setLoading }) {

    const { members, ceremonys, games } = useClubStore();
    const navigator = useNavigate();
    const { signInUser, setSignInUser } = useSignInStore();
    const [cookies] = useCookies();
    const token = cookies[ACCESS_TOKEN];
    const [expandedIndices, setExpandedIndices] = useState([]);
    const [pageStates, setPageStates] = useState([]);
    const [attendanceFilter, setAttendanceFilter] = useState('all'); // 'all' or 'participated'
    const [gameTypeFilter, setGameTypeFilter] = useState('all'); // 'all', '정기모임', '정기번개', '기타'
    const [scoreboardData, setScoreboardData] = useState({});
    
    // 중복 요청 처리 훅 사용
    const { loadingStates, handleApiRequest } = useDuplicateRequestHandler();

    const toggleCeremonyInfo = async (index) => {
        setExpandedIndices((prevIndices) => {
            if(prevIndices.includes(index)) {
                // 클릭한 인덱스가 이미 열려있으면 닫기
                return prevIndices.filter(i => i !== index);
            }else {
                setPageStates((prevPageStates) => {
                    const newPageStates = [...prevPageStates];
                    newPageStates[index] = 0; // 개인점수로 초기화
                    return newPageStates;
                });
                
                // 클릭한 인덱스가 닫혀있으면 열기
                const newIndices = [...prevIndices, index];
                
                // scoreboard 데이터 가져오기
                const ceremonyData = ceremonys[index];
                if (ceremonyData && ceremonyData.gameId) {
                    fetchScoreboardData(ceremonyData.gameId);
                }
                
                return newIndices;
            }
        });
    };

    const handlePageChange = (index, newPage) => {
        console.log('🔍 페이지 변경:', index, newPage, '현재 pageStates:', pageStates);
        setPageStates((prevPageStates) => {
            const newPageStates = [...prevPageStates];
            newPageStates[index] = newPage; // 해당 세리머니의 페이지 상태 업데이트
            console.log('🔍 새로운 pageStates:', newPageStates);
            return newPageStates;
        });
    };

    const { clubId } = useParams(); // URL 파라미터에서 clubId 가져오기
    const memberId = signInUser?.id || null;
    
    console.log('🔍 ClubCeremony - clubId:', clubId, 'memberId:', memberId);

    function getAvgScore(...scores) {
        const validScores = scores.filter(score => score !== null && score !== undefined);
        const totalScore = validScores.reduce((acc, score) => acc + score, 0);
        
    
        const avg = totalScore / 4;
        return Number.isInteger(avg) ? avg : avg.toFixed(1);
    }

    function getHighScore(...scores) {
        const integerScores = scores.map(score => Number.parseInt(score, 10));
        return Math.max(...integerScores);
    }

    // 게임 정보를 찾는 함수
    const findGameInfo = (gameId) => {
        return games.find(game => game.id === gameId);
    };

    // scoreboard 데이터를 가져오는 함수
    const fetchScoreboardData = async (gameId) => {
        if (scoreboardData[gameId]) {
            return scoreboardData[gameId]; // 이미 가져온 데이터가 있으면 반환
        }

        // clubId가 유효한지 확인
        if (!clubId || clubId === '0') {
            console.error('유효하지 않은 clubId:', clubId);
            return [];
        }

        try {
            const response = await getClubScoreboardsRequest(clubId, null, null, null, token);
            console.log('🔍 Scoreboard API 응답:', response);
            if (response && Array.isArray(response)) {
                const gameScoreboard = response.find(item => item.game?.id === gameId);
                if (gameScoreboard && gameScoreboard.scoreboards) {
                    // scoreboard 데이터를 ceremony 데이터 구조와 맞게 변환
                    const transformedScoreboards = gameScoreboard.scoreboards.map(scoreboard => ({
                        memberId: scoreboard.memberId,
                        memberName: members.find(m => m.memberId === scoreboard.memberId)?.memberName || 'Unknown',
                        memberAvg: scoreboard.avg,
                        game1: scoreboard.score1,
                        game2: scoreboard.score2,
                        game3: scoreboard.score3,
                        game4: scoreboard.score4,
                        teamNumber: scoreboard.teamNumber // 백엔드에서 추가된 teamNumber 필드 사용
                    }));

                    setScoreboardData(prev => ({
                        ...prev,
                        [gameId]: transformedScoreboards
                    }));

                    return transformedScoreboards;
                }
            }
        } catch (error) {
            console.error('Scoreboard 데이터 가져오기 실패:', error);
        }
        return [];
    };

    // 엑셀 다운로드 함수
    const handleExcelDownload = async (gameId) => {
        const requestKey = `excel_download_${gameId}`;
        
        await handleApiRequest(
            requestKey,
            () => exportScoreboardExcelRequest(gameId, token),
            {
                showDuplicateAlert: true,
                duplicateMessage: '엑셀 다운로드가 이미 진행 중입니다.',
                onSuccess: (result) => {
                    if (result.success) {
                        alert('엑셀 파일이 다운로드되었습니다.');
                    } else {
                        alert('엑셀 다운로드에 실패했습니다.');
                    }
                },
                onError: (error) => {
                    console.error('엑셀 다운로드 오류:', error);
                    alert('엑셀 다운로드 중 오류가 발생했습니다.');
                }
            }
        );
    };

    useEffect(() => {
        setPageStates(new Array(ceremonys.length).fill(0));
        console.log('🔍 ceremonys 데이터:', ceremonys);
    }, [ceremonys, clubId])
    
    return (
        <>
            {members.some((member) => String(member.memberId) === String(memberId)) && 
                <div className={styles.clubCeremonyContainer}>
                    <div className={styles.filterBox}>
                        <div className={styles.filterNavBox}>
                            <div className={styles.filterNav}>
                                <p className={styles.filterTitle}>참석여부</p>
                                <div className={styles.filterBtns}>
                                    <button 
                                        className={`${styles.filterBtn} ${attendanceFilter === 'all' ? styles.filterBtnSelected : ''}`}
                                        onClick={() => setAttendanceFilter('all')}
                                    >
                                        전체
                                    </button>
                                    <button 
                                        className={`${styles.filterBtn} ${attendanceFilter === 'participated' ? styles.filterBtnSelected : ''}`}
                                        onClick={() => setAttendanceFilter('participated')}
                                    >
                                        참여한 게임만 보기
                                    </button>
                                </div>
                            </div>
                            <div className={styles.filterNav}>
                                <p className={styles.filterTitle}>게임종류</p>
                                <div className={styles.filterBtns}>
                                    <button 
                                        className={`${styles.filterBtn} ${gameTypeFilter === 'all' ? styles.filterBtnSelected : ''}`}
                                        onClick={() => setGameTypeFilter('all')}
                                    >
                                        전체
                                    </button>
                                    <button 
                                        className={`${styles.filterBtn} ${gameTypeFilter === '정기모임' ? styles.filterBtnSelected : ''}`}
                                        onClick={() => setGameTypeFilter('정기모임')}
                                    >
                                        정기모임
                                    </button>
                                    <button 
                                        className={`${styles.filterBtn} ${styles.gameType2} ${gameTypeFilter === '정기번개' ? styles.filterBtnSelected : ''}`}
                                        onClick={() => setGameTypeFilter('정기번개')}
                                    >
                                        정기번개
                                    </button>
                                    <button 
                                        className={`${styles.filterBtn} ${gameTypeFilter === '기타' ? styles.filterBtnSelected : ''}`}
                                        onClick={() => setGameTypeFilter('기타')}
                                    >
                                        기타
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.ceremonyContainer}>
                        {ceremonys.length > 0 ? ceremonys
                            .filter(data => {
                                // 게임 정보 찾기
                                const gameInfo = findGameInfo(data.gameId);
                                
                                // 게임 타입 필터링
                                if (gameTypeFilter !== 'all' && gameInfo?.gameType !== gameTypeFilter) {
                                    return false;
                                }
                                
                                // 참석 여부 필터링 (참여한 게임만 보기)
                                if (attendanceFilter === 'participated') {
                                    // 현재 사용자가 해당 게임에 참여했는지 확인
                                    const participated = scoreboardData[data.gameId]?.some(member => 
                                        String(member.memberId) === String(memberId)
                                    );
                                    if (!participated) {
                                        return false;
                                    }
                                }
                                
                                return true;
                            })
                            .map((data, i) => {
                                console.log('🔍 ceremony data:', data);
                                return (
                                    <>
                                <div className={`${styles.ceremonyBox} ${data.gameType == "정기번개" ? styles.redLine : data.gameType == "기타" ? styles.blackLine : ""}`} key={data.gameId}>
                                    <div className={styles.ceremonyArea}>
                                        <div className={styles.simpleInformation}>
                                            <div className={styles.simpleGameInfo}>
                                                <div className={styles.simpleGameInfoTitle}>
                                                    <h3>{(() => {
                                                        const gameInfo = findGameInfo(data.gameId);
                                                        return gameInfo?.gameName || gameInfo?.name || `게임 ${data.gameId}`;
                                                    })()}</h3>
                                                    <p>{(() => {
                                                        const gameInfo = findGameInfo(data.gameId);
                                                        console.log('🔍 게임 정보:', gameInfo, 'gameId:', data.gameId);
                                                        return gameInfo?.gameDate || gameInfo?.date || "-";
                                                    })()}</p>
                                                </div>
                                                <div className={styles.excelDownloadBtn}>
                                                    <button 
                                                        className={`${styles.excelBtn} ${loadingStates[`excel_download_${data.gameId}`] ? styles.excelBtnLoading : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleExcelDownload(data.gameId);
                                                        }}
                                                        disabled={loadingStates[`excel_download_${data.gameId}`]}
                                                        title={loadingStates[`excel_download_${data.gameId}`] ? "다운로드 중..." : "엑셀 다운로드"}
                                                    >
                                                        {loadingStates[`excel_download_${data.gameId}`] ? (
                                                            <>
                                                                <i className="fa-solid fa-spinner fa-spin"></i>
                                                                다운로드 중...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="fa-solid fa-file-excel"></i>
                                                                Excel
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className={styles.simpleInformationBox}>
                                                <div className={styles.simpleCeremony}>
                                                    <span className={styles.simpleCeremonyTitle}>1등</span>
                                                    <p>{(() => {
                                                        const pin1st = data.ceremonies?.find(c => c.type === 'pin1st');
                                                        return pin1st?.winners?.[0] || "-";
                                                    })()}</p>
                                                </div>
                                                <div className={styles.simpleCeremony}>
                                                    <span className={styles.simpleCeremonyTitle}>에버 1등</span>
                                                    <p>{(() => {
                                                        const avg1st = data.ceremonies?.find(c => c.type === 'avg1st');
                                                        return avg1st?.winners?.[0] || "-";
                                                    })()}</p>
                                                </div>
                                            </div>
                                            <div className={styles.simpleInformationBox}>
                                                <div className={styles.simpleCeremony}>
                                                    <span className={styles.simpleCeremonyTitle}>1군 1등</span>
                                                    <p>{(() => {
                                                        const grade1 = data.ceremonies?.find(c => c.type === 'grade1');
                                                        return grade1?.winners?.[0] || "-";
                                                    })()}</p>
                                                </div>
                                                <div className={styles.simpleCeremony}>
                                                    <span className={styles.simpleCeremonyTitle}>2군 1등</span>
                                                    <p>{(() => {
                                                        const grade2 = data.ceremonies?.find(c => c.type === 'grade2');
                                                        return grade2?.winners?.[0] || "-";
                                                    })()}</p>
                                                </div>
                                            </div>
                                            <div className={styles.simpleInformationBox}>
                                                <div className={styles.simpleCeremony}>
                                                    <span className={styles.simpleCeremonyTitle}>3군 1등</span>
                                                    <p>{(() => {
                                                        const grade3 = data.ceremonies?.find(c => c.type === 'grade3');
                                                        return grade3?.winners?.[0] || "-";
                                                    })()}</p>
                                                </div>
                                                <div className={styles.simpleCeremony}>
                                                    <span className={styles.simpleCeremonyTitle}>4군 1등</span>
                                                    <p>{(() => {
                                                        const grade4 = data.ceremonies?.find(c => c.type === 'grade4');
                                                        return grade4?.winners?.[0] || "-";
                                                    })()}</p>
                                                </div>
                                            </div>
                                            <div className={styles.simpleInformationBox}>
                                                <div className={styles.simpleCeremony}>
                                                    <span className={styles.simpleCeremonyTitle}>남자 하이스코어</span>
                                                    <p>{(() => {
                                                        const highScoreOfMan = data.ceremonies?.find(c => c.type === 'highScoreOfMan');
                                                        return highScoreOfMan?.winners?.[0] || "-";
                                                    })()}</p>
                                                </div>
                                                <div className={styles.simpleCeremony}>
                                                    <span className={styles.simpleCeremonyTitle}>여자 하이스코어</span>
                                                    <p>{(() => {
                                                        const highScoreOfGirl = data.ceremonies?.find(c => c.type === 'highScoreOfGirl');
                                                        return highScoreOfGirl?.winners?.[0] || "-";
                                                    })()}</p>
                                                </div>
                                            </div>
                                            <div className={styles.simpleInformationBox}>
                                                <div className={styles.simpleCeremony}>
                                                    <span className={styles.simpleCeremonyTitle}>팀 1등</span>
                                                    <div className={styles.simpleCeremonyInfoBox}>
                                                        <p className={styles.simpleCeremonyInfo}>
                                                            {(() => {
                                                                const team1st = data.ceremonies?.find(c => c.type === 'team1st');
                                                                return team1st?.winners?.join(', ') || "-";
                                                            })()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.moreInfoContainer}>
                                        <div className={styles.moreInfo} onClick={() => toggleCeremonyInfo(i)}>
                                            {!expandedIndices.includes(i) ? (
                                                <i class="fa-solid fa-chevron-down"></i>
                                            ) : (
                                                <i class="fa-solid fa-chevron-up"></i>
                                            )}
                                        </div>
                                    </div>
                                    {expandedIndices.includes(i) && 
                                        <div className={styles.ceremonyInfo} key={data.gameId}>
                                            <div className={styles.ceremonyInfoBtnBox}>
                                                <button className={`${styles.infoBtn} ${pageStates[i] == 0 ? styles.infoBtnSelectedBtn : ""}`} onClick={() => handlePageChange(i, 0)}>개인점수</button>
                                                <button className={`${styles.infoBtn} ${pageStates[i] == 1 ? styles.infoBtnSelectedBtn : ""}`} onClick={() => handlePageChange(i, 1)}>팀 점수</button>
                                            </div>
                                            <div className={styles.ceremonyContext}>
                                                {pageStates[i] === 0 &&
                                                    <table>
                                                        <thead>
                                                            <tr>
                                                                <th>순위</th>
                                                                <th>이름</th>
                                                                <th>에버</th>
                                                                <th>1G</th>
                                                                <th>2G</th>
                                                                <th>3G</th>
                                                                <th>4G</th>
                                                                <th>합계</th>
                                                                <th>평균</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(scoreboardData[data.gameId] || [])
                                                                .sort((a, b) => {
                                                                    const totalA = (a.game1 || 0) + (a.game2 || 0) + (a.game3 || 0) + (a.game4 || 0);
                                                                    const totalB = (b.game1 || 0) + (b.game2 || 0) + (b.game3 || 0) + (b.game4 || 0);
                                                                    return totalB - totalA; // 높은 점수 순으로 정렬
                                                                })
                                                                .map((member, i) => (
                                                                <tr key={i}>
                                                                    <td>{(i + 1)}</td>
                                                                    <td>{member.memberName}</td>
                                                                    <td>{member.memberAvg}</td>
                                                                    <td>{member.game1}</td>
                                                                    <td>{member.game2}</td>
                                                                    <td>{member.game3}</td>
                                                                    <td>{member.game4}</td>
                                                                    <td>{member.game1 + member.game2 + member.game3 + member.game4}</td>
                                                                    <td>{getAvgScore(member.game1 + member.game2 + member.game3 + member.game4)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                }
                                                {pageStates[i] == 1 &&
                                                    Object.entries(
                                                        (scoreboardData[data.gameId] || []).reduce((teams, member) => {
                                                            const teamNumber = member.teamNumber;
                                                            const scoreDifference = ((member.game1 + member.game2 + member.game3 + member.game4)) - (member.memberAvg * 4 );

                                                            if (!teams[teamNumber]) {
                                                                teams[teamNumber] = {
                                                                    members: [],
                                                                    totalDifference: 0,
                                                                    game1Total: 0,
                                                                    game2Total: 0,
                                                                    game3Total: 0,
                                                                    game4Total: 0
                                                                };
                                                            }

                                                            teams[teamNumber].members.push(member);
                                                            teams[teamNumber].totalDifference += scoreDifference;
                                                            teams[teamNumber].game1Total += member.game1 - member.memberAvg;
                                                            teams[teamNumber].game2Total += member.game2 - member.memberAvg;
                                                            teams[teamNumber].game3Total += member.game3 - member.memberAvg;
                                                            teams[teamNumber].game4Total += member.game4 - member.memberAvg;

                                                            return teams;
                                                        }, {})
                                                    )
                                                    // 팀별로 높은 총 차이 점수 순으로 정렬
                                                    .filter(([teamNumber]) => teamNumber !== "0") // 0팀 제외
                                                    .sort(([, teamA], [, teamB]) => teamB.totalDifference - teamA.totalDifference)
                                                    .map(([teamNumber, team], i) => (
                                                        <table className={styles.teamScoreTable} key={teamNumber}>
                                                            <thead>
                                                                <tr className={styles.teamScoreHeaderTr}>
                                                                    <th className={styles.teamScoreTh}>{i + 1 + "위"}</th>
                                                                    <th className={styles.teamScoreTh} colSpan={1}></th>
                                                                    <th className={styles.teamScoreTh}>Avg</th>
                                                                    <th className={styles.teamScoreTh}>1G</th>
                                                                    <th className={styles.teamScoreTh}>2G</th>
                                                                    <th className={styles.teamScoreTh}>3G</th>
                                                                    <th className={styles.teamScoreTh}>4G</th>
                                                                    <th className={styles.teamScoreTh}>총점</th>
                                                                    <th className={styles.teamScoreTh}>합계</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {team.members.map((member, index) => (
                                                                    <tr className={styles.teamScoreBodyTr} key={index}>
                                                                        {index === 0 && (
                                                                            <td className={styles.teamScoreTd} rowSpan={team.members.length}>{teamNumber}팀</td>
                                                                        )}

                                                                        <td className={styles.teamScoreTd}>{member.memberName}</td>
                                                                        <td className={styles.teamScoreTd}>{member.memberAvg}</td>
                                                                        <td className={`${styles.teamScoreTd} ${styles.gameScoreBackground}`}>{member.game1}</td>
                                                                        <td className={`${styles.teamScoreTd} ${styles.gameScoreBackground}`}>{member.game2}</td>
                                                                        <td className={`${styles.teamScoreTd} ${styles.gameScoreBackground}`}>{member.game3}</td>
                                                                        <td className={`${styles.teamScoreTd} ${styles.gameScoreBackground}`}>{member.game4}</td>
                                                                        <td className={styles.teamScoreTd}>
                                                                            {member.game1 + member.game2 + member.game3 + member.game4}
                                                                        </td>

                                                                        <td className={styles.teamScoreTd}>
                                                                            {((member.game1 - member.memberAvg) + (member.game2 - member.memberAvg) + (member.game3 - member.memberAvg) + (member.game4 - member.memberAvg))}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot>
                                                                <tr className={styles.teamScoreFooterTr}>
                                                                    <td className={styles.teamScoreTd} colSpan={4}>합계</td>
                                                                    <td className={styles.teamScoreTd}>{team.game1Total}</td>
                                                                    <td className={styles.teamScoreTd}>{team.game2Total}</td>
                                                                    <td className={styles.teamScoreTd}>{team.game3Total}</td>
                                                                    <td className={styles.teamScoreTd}>{team.game4Total}</td>
                                                                    <td className={`${styles.teamScoreTd} ${styles.teamTotalCell}`} colSpan={2}>팀 종합</td>
                                                                    <td className={styles.teamScoreTd}>{team.totalDifference}</td>
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    ))}
                                            </div>
                                        </div>
                                    }
                                </div>
                                    </>
                                );
                            }) : (
                                <div className={styles.nodataContainer}>
                                    <Nodata text={"기록이 없습니다."}></Nodata>
                                </div>
                            )
                        }
                    </div>
                </div>
            }
            {!members.some((member) => String(member.memberId) === String(memberId)) &&
                <div className={styles.nodataContainer}>
                    <Nodata text={"클럽원에게만 공개됩니다."}></Nodata>
                </div>
            }
        </>
    )
};

function ClubSetting({ pageLoad, clubId }) {
    const { members } = useClubStore();
    const { signInUser } = useSignInStore();
    const [cookies] = useCookies();
    const token = cookies[ACCESS_TOKEN];
    const [page, setPage] = useState(0);
    const [updatedMembers, setUpdatedMembers] = useState([]);
    
    // clubId는 URL 파라미터에서 가져오므로 제거
    // 현재 사용자의 클럽 역할은 멤버 목록에서 가져와야 함
    const getCurrentUserClubRoleInSetting = () => {
        if (!members || !signInUser) return null;
        const currentMember = members.find(member => member.memberId === signInUser.id);
        return currentMember?.clubRole || null;
    };
    const roles = getCurrentUserClubRoleInSetting();
    
    // 현재 사용자의 클럽 역할을 가져오는 헬퍼 함수
    const getCurrentUserRole = () => {
        return getCurrentUserClubRoleInSetting();
    };



    const clubMemberRoleUpdateResponse = (responseBody) => {
        if (!responseBody) {
            alert('서버에 문제가 있습니다.');
            return;
        }
        
        // 새로운 구조: void 응답 (성공 시 200 OK, 실패 시 예외 발생)
        if (responseBody.code === 'ERROR') {
            // 새로운 ErrorResponse 구조
            alert(responseBody.message || '역할 변경에 실패했습니다.');
            return;
        }
        
        // 성공 시 (void 응답이므로 responseBody가 없거나 빈 객체)
        alert('역할이 변경되었습니다.');
        pageLoad();
    }

    const handleRoleChange = (e, memberId) => {
        const selectedRole = e.target.value;
        const member = members.find((member) => String(member.memberId) === String(memberId));
    
        if (member && member.clubRole === "MASTER" && (selectedRole === "STAFF" || selectedRole === "MEMBER")) {
            alert("클럽장을 다른 사람에게 넘겨줘야 합니다.");
            return;  // 변경을 막고 함수 종료
        }

        const dto = {
            memberId: memberId,
            role: selectedRole
        }

        clubMemberRoleUpdateRequest(dto, clubId,token).then(clubMemberRoleUpdateResponse);
    };

    const groupedMembers = updatedMembers.reduce((acc, member) => {
        const { grade } = member; // memberGrade 대신 grade 사용
        if (!acc[grade]) {
            acc[grade] = [];
        }
        acc[grade].push(member);
        return acc;
    }, {});

    const memberAvgUpdate = (memberId, newAvg) => {
        setUpdatedMembers(prev =>
            prev.map(member =>
                String(member.memberId) === String(memberId) ? { ...member, avg: newAvg == "" || newAvg.length <= 2 ? member.avg : newAvg } : member
            )
        );
    };
    
    const memberGradeUpdate = (memberId, newGrade) => {
        setUpdatedMembers(prev =>
            prev.map(member =>
                String(member.memberId) === String(memberId) ? { ...member, grade: newGrade } : member
            )
        );
    };

    const memberAvgUpdateResponse = (responseBody) => {
        if (!responseBody) {
            alert('서버에 문제가 있습니다.');
            return;
        }
        
        // 새로운 구조: void 응답 (성공 시 200 OK, 실패 시 예외 발생)
        if (responseBody.code === 'ERROR') {
            // 새로운 ErrorResponse 구조
            alert(responseBody.message || '평균 점수 업데이트에 실패했습니다.');
            return;
        }
        
        // 성공 시 (void 응답이므로 responseBody가 없거나 빈 객체)
        alert('저장 완료되었습니다.');
        pageLoad();
    }

    const memberAvgUpdateRequest = () => {
        if((getCurrentUserRole() === "STAFF" || getCurrentUserRole() === "MASTER")) {
            const dto = {
                ids: updatedMembers.map(member => member.memberId),
                averages: updatedMembers.map(member => member.avg), // memberAvg 대신 avg 사용
                grades: updatedMembers.map(member => member.grade), // memberGrade 대신 grade 사용
            }
            clubMemberAvgUpdateRequest(dto, clubId, token).then(memberAvgUpdateResponse);
        } else {
            alert("접근 권한이 없습니다.")
            return;
        }
    }

    useEffect(() => {
        if(!(getCurrentUserRole() === "MASTER" || getCurrentUserRole() === "STAFF")) {
            alert("접근 권한이 없습니다.")
            window.location.href = CLUB_DETAIL_PATH(clubId);
        }
        setUpdatedMembers(members);
    }, [members])

    return (
        <div className={styles.container}>
            <div className={styles.clubNav}>
                <button
                    className={`${styles.clubNavBtns} ${page === 0 ? styles.selectedClubNavBtn : ""}`}
                    onClick={() => setPage(0)}
                >
                    에버
                </button>
                <button
                    className={`${styles.clubNavBtns} ${page === 1 ? styles.selectedClubNavBtn : ""}`}
                    onClick={() => setPage(1)}
                >
                    회원관리
                </button>
            </div>
            <div className={styles.contextArea}>
                {page === 0 && (
                    <>
                        {/* 1군부터 차례대로 나열하고 신입은 제일 밑으로 */}
                        {(() => {
                            // 1군부터 6군까지 순서대로 정렬
                            const sortedGrades = Object.keys(groupedMembers)
                                .filter(grade => grade !== "0") // 신입 제외
                                .sort((a, b) => parseInt(a) - parseInt(b)); // 숫자 순으로 정렬
                            
                            return (
                                <div className={styles.gradesAvg}>
                                    {Object.keys(groupedMembers).length === 0 ? (
                                        <div className={styles.nodataContainer}>
                                            <p>멤버 데이터가 없습니다.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* 1군부터 6군까지 순서대로 표시 */}
                                            {sortedGrades.map((grade) => (
                                                <div key={grade} className={styles.gradeGroup}>
                                                    <div className={styles.gradeTitleBox}>
                                                        <p className={styles.gradeTitle}>
                                                            {`${grade} 군 (${groupedMembers[grade].length})`}
                                                        </p>
                                                    </div>
                                                    {groupedMembers[grade].map((member) => (
                                                        <div key={member.memberId} className={styles.gradeBox}>
                                                            <div className={styles.memberAvgBox}>
                                                                <p>{member.memberName}</p>
                                                            </div>
                                                            <div className={styles.memberAvgBox}>
                                                                <p>{members.find((findMember) => findMember.memberId === member.memberId).avg}</p>
                                                            </div>
                                                            <div className={styles.memberAvgBox}>
                                                                <input
                                                                    type="number"
                                                                    placeholder="에버"
                                                                    className={styles.avgInput}
                                                                    onChange={(e) =>
                                                                        memberAvgUpdate(member.memberId, e.target.value)
                                                                    }
                                                                />
                                                            </div>
                                                            <div className={styles.memberAvgBox}>
                                                                <select 
                                                                    value={member.grade}
                                                                    className={styles.avgSelect}
                                                                    onChange={(e) => memberGradeUpdate(member.memberId, e.target.value)}
                                                                >
                                                                    <option value={0}>신입</option>
                                                                    <option value={1}>1군</option>
                                                                    <option value={2}>2군</option>
                                                                    <option value={3}>3군</option>
                                                                    <option value={4}>4군</option>
                                                                    <option value={5}>5군</option>
                                                                    <option value={6}>6군</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                            
                                            {/* 신입은 제일 밑에 표시 */}
                                            {groupedMembers["0"] && (
                                                <div key="0" className={styles.gradeGroup}>
                                                    <div className={styles.gradeTitleBox}>
                                                        <p className={styles.gradeTitle}>
                                                            신입 ({groupedMembers["0"].length})
                                                        </p>
                                                    </div>
                                                    {groupedMembers["0"].map((member) => (
                                                        <div key={member.memberId} className={styles.gradeBox}>
                                                            <div className={styles.memberAvgBox}>
                                                                <p>{member.memberName}</p>
                                                            </div>
                                                            <div className={styles.memberAvgBox}>
                                                                <p>{members.find((findMember) => findMember.memberId === member.memberId).avg}</p>
                                                            </div>
                                                            <div className={styles.memberAvgBox}>
                                                                <input
                                                                    type="number"
                                                                    placeholder="에버"
                                                                    className={styles.avgInput}
                                                                    onChange={(e) =>
                                                                        memberAvgUpdate(member.memberId, e.target.value)
                                                                    }
                                                                />
                                                            </div>
                                                            <div className={styles.memberAvgBox}>
                                                                <select 
                                                                    value={member.grade}
                                                                    className={styles.avgSelect}
                                                                    onChange={(e) => memberGradeUpdate(member.memberId, e.target.value)}
                                                                >
                                                                    <option value={0}>신입</option>
                                                                    <option value={1}>1군</option>
                                                                    <option value={2}>2군</option>
                                                                    <option value={3}>3군</option>
                                                                    <option value={4}>4군</option>
                                                                    <option value={5}>5군</option>
                                                                    <option value={6}>6군</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })()}
                        <div className={styles.avgSaveBtnBox}>
                            <button className={styles.avgSaveBtn} onClick={memberAvgUpdateRequest}>저장하기</button>
                        </div>
                    </>
                )}
                {page === 1 && (
                    <>
                        <div className={styles.memberSettingContainer}>
                            <div className={styles.memberSettingArea}>
                                {members
                                    .sort((a, b) => new Date(a.createTime) - new Date(b.createTime))
                                    .map((member) => {
                                        const roleText = 
                                            member.clubRole === "MASTER" ? "클럽장" :
                                            member.clubRole === "STAFF" ? "운영진" : "클럽원";
                                        return (
                                            <div key={member.memberId} className={styles.memberSettingBox}>
                                                <div className={styles.settingMemberProfileBox}>
                                                    <img className={styles.settingBoxMemberProfileImg} src={member.memberProfile} alt="Profile" />
                                                    <p>{member.memberName}</p>
                                                </div>
                                                <div className={styles.settingRoleContainer}>
                                                    <select
                                                        value={member.clubRole}
                                                        onChange={(e) => handleRoleChange(e, member.memberId)}
                                                        className={styles.roleSelect}
                                                        disabled={getCurrentUserRole() !== "MASTER"}
                                                    >
                                                        {getCurrentUserRole() === "MASTER" && (
                                                            <option value="MASTER">클럽장</option>
                                                        )}
                                                        <option value="STAFF">운영진</option>
                                                        <option value="MEMBER">클럽원</option>
                                                    </select>
                                                </div>
                                                <i className="fa-solid fa-user-slash"></i>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </>
                )}
            </div> 
        </div>
    );
}

function AddGameModal({ clubId, token, addGameModalBtnClickHandler, pageLoad }) {
    const [gameName, setGameName] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [gameType, setGameType] = useState(0);
    const [confirmCode, setConfirmCode] = useState("");
    const { addGame } = useClubStore();

    const handleGameNameChange = (e) => setGameName(e.target.value);
    const handleDateChange = (e) => setDate(e.target.value);
    const handleTimeChange = (e) => setTime(e.target.value);
    const handleConfirmCodeChange = (e) => setConfirmCode(e.target.value.slice(0, 8));

    const addGameResponse = (responseBody) => {
        console.log('게임 생성 응답:', responseBody);
        
        if (!responseBody) {
            alert('서버에 문제가 있습니다.');
            return;
        }

        // 백엔드 응답 구조에 맞춰 처리
        if (responseBody.content && Array.isArray(responseBody.content) && responseBody.content.length > 0) {
            // PageResponse 형태로 온 경우
            const createdGame = responseBody.content[0];
            
            // 생성된 게임을 스토어에 추가
            const newGame = {
                id: createdGame.id,
                gameName: createdGame.name,
                gameDate: createdGame.date,
                gameTime: createdGame.time,
                gameType: createdGame.type,
                members: [], // 새로 생성된 게임이므로 멤버는 비어있음
                // 기본값 설정
                confirmedCode: "",
                status: createdGame.status || "ACTIVE",
                scoreCounting: createdGame.scoreCounting || false,
                clubId: clubId
            };
            
            console.log('새로 생성된 게임:', newGame);
            addGame(newGame);
            addGameModalBtnClickHandler();
            alert('게임을 생성하였습니다.');
        } else if (responseBody.id && responseBody.name) {
            // 단일 게임 객체로 직접 온 경우
            const createdGame = responseBody;
            
            // 생성된 게임을 스토어에 추가
            const newGame = {
                id: createdGame.id,
                gameName: createdGame.name,
                gameDate: createdGame.date,
                gameTime: createdGame.time,
                gameType: createdGame.type,
                members: [], // 새로 생성된 게임이므로 멤버는 비어있음
                // 기본값 설정
                confirmedCode: "",
                status: createdGame.status || "ACTIVE",
                scoreCounting: createdGame.scoreCounting || false,
                clubId: clubId
            };
            
            console.log('새로 생성된 게임:', newGame);
            addGame(newGame);
            addGameModalBtnClickHandler();
            alert('게임을 생성하였습니다.');
        } else {
            // 에러 처리
            console.error('게임 생성 실패:', responseBody);
            alert('게임 생성에 실패했습니다.');
        }
    };

    const createGame = () => {
        // 게임 타입을 문자열로 변환
        const gameTypeString = gameType === 0 ? "정기번개" : gameType === 1 ? "정기모임" : gameType === 2 ? "기타" : "정기번개";
        
        const game = {
            gameName: gameName,
            date: date,
            time: time,
            gameType: gameTypeString,
            confirmCode: confirmCode,
            clubId: clubId
        }
        
        console.log('게임 생성 요청:', game);
        addGameRequest(game, token).then(addGameResponse);
    }

    return (
        <>
            <div className={styles.addGameModalContainer}>
                <div className={styles.titleBox}>
                    <div className={styles.backBtn} onClick={addGameModalBtnClickHandler}>
                        <i class="fa-solid fa-chevron-left"></i>
                    </div>
                    <p>게임 생성</p>
                </div>
                <div className={styles.gameInfoContainer}>
                    <div className={styles.gameInfoBox}>
                        <div className={styles.gameTitleBox}>
                            <span className={styles.title}>게임 이름</span>
                        </div>
                        <input 
                            className={styles.infoInput} 
                            placeholder="게임 이름" 
                            value={gameName} 
                            onChange={handleGameNameChange} 
                        />
                    </div>
                    <div className={styles.gameInfoBox}>
                        <span>날짜</span>
                        <input 
                            className={styles.infoInput} 
                            type="date" 
                            value={date} 
                            onChange={handleDateChange} 
                        />
                    </div>
                    <div className={styles.gameInfoBox}>
                        <span>시간</span>
                        <input 
                            className={styles.infoInput} 
                            type="time" 
                            value={time} 
                            onChange={handleTimeChange} 
                        />
                    </div>
                    <div className={styles.gameInfoBox}>
                        <span>모임 종류</span>
                        <div className={styles.gameTypeBtnBox}>
                            <button className={`${styles.gameTypeBtn} ${gameType == 0 ? styles.selectedBtn : ""}`} onClick={() => setGameType(0)}>정기번개</button>
                            <button className={`${styles.gameTypeBtn} ${gameType == 1 ? styles.selectedBtn : ""}`} onClick={() => setGameType(1)}>정기모임</button>
                            <button className={`${styles.gameTypeBtn} ${gameType == 2 ? styles.selectedBtn : ""}`} onClick={() => setGameType(2)}>기타</button>
                        </div>
                    </div>
                    <div className={styles.gameInfoBox}>
                        <span>참석확정코드</span>
                        <input 
                            className={styles.infoInput} 
                            type="number" 
                            placeholder="8자리 숫자를 입력해주세요." 
                            value={confirmCode} 
                            onChange={handleConfirmCodeChange} 
                        />
                    </div>
                </div>
                <div className={styles.addGameBtnBox}>
                    <button className={styles.addGameBtn} onClick={createGame}>게임 만들기</button>
                </div>
            </div>
        </>
    );
}

function ClubRanking({ setLoading }) {
    const { members } = useClubStore();
    const { signInUser } = useSignInStore();
    const [sortedMembers, setSortedMembers] = useState([]);
    const [openMore, setOpenMore] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startDay, setStartDay] = useState(""); // YYYY-MM-DD 형식으로 저장
    const [endDay, setEndDay] = useState("");
    const [cookies] = useCookies();
    const [gameType, setGameType] = useState(0);
    const { clubId } = useParams(); // URL 파라미터에서 clubId 가져오기

    const token = cookies[ACCESS_TOKEN];
    const memberId = signInUser?.id;

    const moreInfoHandler = (index) => {
        setOpenMore((prev) => {
            if(openMore.includes(index)) {
                
                return prev.filter(i => i !== index);
            }else {
                return [...prev, index]
            }
        })
    }

    const handleDateChange = (setter, value, currentDay) => {
        setter(value);
    
        const newDay = value.split("-")[2];
        const currentDayValue = currentDay.split("-")[2];
    
        if (newDay !== currentDayValue) {
            if (setter === setStartDate) {
                setStartDay(value);
            }
            if (setter === setEndDate) {
                setEndDay(value);
            }
        }
    };

    const calculateMemberAverages = (ceremonys) => {

        const memberScores = {};
    
        ceremonys.forEach((ceremony) => {
            if(ceremony.scoreboards && Array.isArray(ceremony.scoreboards)) {
                ceremony.scoreboards.forEach((scoreboard) => {
                    const memberId = scoreboard.memberId;
    
                    const gameScores = [scoreboard.game1, scoreboard.game2, scoreboard.game3, scoreboard.game4].filter(score => score !== null);
                    const game1Scores = [scoreboard.game1].filter(score => score !== null);
                    const game2Scores = [scoreboard.game2].filter(score => score !== null);
                    const game3Scores = [scoreboard.game3].filter(score => score !== null);
                    const game4Scores = [scoreboard.game4].filter(score => score !== null);
    
        
                    // 평균 계산
                    const averageScore = gameScores.reduce((acc, score) => acc + score, 0) / gameScores.length;
                    const average1Score = game1Scores.reduce((acc, score) => acc + score, 0) / game1Scores.length;
                    const average2Score = game2Scores.reduce((acc, score) => acc + score, 0) / game2Scores.length;
                    const average3Score = game3Scores.reduce((acc, score) => acc + score, 0) / game3Scores.length;
                    const average4Score = game4Scores.reduce((acc, score) => acc + score, 0) / game4Scores.length;
    
        
                    // 점수를 합산하여 저장
                    if (memberScores[String(memberId)]) {
                        memberScores[String(memberId)].totalScore += averageScore;
                        memberScores[String(memberId)].count += 1;
                    } else {
                        memberScores[String(memberId)] = { 
                            totalScore: averageScore, 
                            count: 1, 
                            average1Score: average1Score, 
                            average2Score: average2Score, 
                            average3Score: average3Score, 
                            average4Score: average4Score
                        };
                    }
                });
            }
        });
    
        // 각 멤버의 평균 점수 계산
        const membersWithAverages = members.map((member) => {
            const { totalScore = 0, count = 1, average1Score = 0, average2Score = 0, average3Score = 0, average4Score = 0 } = memberScores[String(member.memberId)] || {};
            const avgScore = totalScore / count;
            return { ...member, avgScore, average1Score, average2Score, average3Score, average4Score };
        });
    
        // 평균 점수 기준으로 멤버 정렬
        const sorted = membersWithAverages.sort((a, b) => b.avgScore - a.avgScore);
        setSortedMembers(sorted);
        setLoading(false);
    };

    const getCeremonysListResponse = (responseBody) => {
        if (!responseBody) {
            alert('서버에 문제가 있습니다.');
            return;
        }
        
        // 새로운 Map 구조 응답 처리
        if (typeof responseBody === 'object' && !Array.isArray(responseBody)) {
            // Map<Long, List<CeremonyRespDto>> 구조 처리
            console.log('새로운 ceremony 구조:', responseBody);
            
            // 백엔드의 새로운 scoreboard API 사용
            const gameTypeParam = gameType === 0 ? null : 
                gameType === 1 ? '정기모임' : 
                gameType === 2 ? '정기번개' : 
                gameType === 3 ? '기타' : null;
            
            getClubScoreboardsRequest(clubId, startDay, endDay, gameTypeParam, token).then((scoreboardResponse) => {
                if (scoreboardResponse && Array.isArray(scoreboardResponse)) {
                    console.log('Scoreboard 데이터:', scoreboardResponse);
                    
                    // 백엔드에서 받은 scoreboard 데이터로 랭킹 계산
                    calculateMemberAveragesFromScoreboards(scoreboardResponse);
                } else {
                    console.log('Scoreboard 데이터가 없습니다.');
                    calculateMemberAverages([]);
                }
            }).catch((error) => {
                console.error('Scoreboard 데이터 요청 실패:', error);
                calculateMemberAverages([]);
            });
        } else if (Array.isArray(responseBody)) {
            // 기존 배열 구조인 경우
            calculateMemberAverages(responseBody);
        } else {
            // 에러 응답인 경우
            const message = 
                responseBody.code === 'AF' ? '잘못된 접근입니다.' :
                responseBody.code === 'DBE' ? '서버에 문제가 있습니다.' : 
                '시상 목록을 불러오는데 실패했습니다.';
            alert(message);
        }
    }

    const calculateMemberAveragesFromScoreboards = (gameScoreboards) => {
        const memberScores = {};

        // GameScoreboardsRespDto 구조: [{ game: GameRespDto, scoreboards: [ScoreboardRespDto] }]
        gameScoreboards.forEach((gameScoreboard) => {
            const game = gameScoreboard.game;
            const scoreboards = gameScoreboard.scoreboards;

            scoreboards.forEach((scoreboard) => {
                const memberId = scoreboard.memberId;
                
                // ScoreboardRespDto에서 점수 정보 추출
                const gameScores = [scoreboard.score1, scoreboard.score2, scoreboard.score3, scoreboard.score4].filter(score => score !== null && score > 0);
                const game1Scores = [scoreboard.score1].filter(score => score !== null && score > 0);
                const game2Scores = [scoreboard.score2].filter(score => score !== null && score > 0);
                const game3Scores = [scoreboard.score3].filter(score => score !== null && score > 0);
                const game4Scores = [scoreboard.score4].filter(score => score !== null && score > 0);

                // 평균 계산
                const averageScore = gameScores.length > 0 ? gameScores.reduce((acc, score) => acc + score, 0) / gameScores.length : 0;
                const average1Score = game1Scores.length > 0 ? game1Scores.reduce((acc, score) => acc + score, 0) / game1Scores.length : 0;
                const average2Score = game2Scores.length > 0 ? game2Scores.reduce((acc, score) => acc + score, 0) / game2Scores.length : 0;
                const average3Score = game3Scores.length > 0 ? game3Scores.reduce((acc, score) => acc + score, 0) / game3Scores.length : 0;
                const average4Score = game4Scores.length > 0 ? game4Scores.reduce((acc, score) => acc + score, 0) / game4Scores.length : 0;

                // 멤버 ID를 키로 사용하여 점수 저장
                const memberKey = String(memberId);

                // 점수를 합산하여 저장
                if (memberScores[memberKey]) {
                    memberScores[memberKey].totalScore += averageScore;
                    memberScores[memberKey].count += 1;
                    memberScores[memberKey].total1Score += average1Score;
                    memberScores[memberKey].total2Score += average2Score;
                    memberScores[memberKey].total3Score += average3Score;
                    memberScores[memberKey].total4Score += average4Score;
                } else {
                    memberScores[memberKey] = { 
                        totalScore: averageScore, 
                        count: 1, 
                        total1Score: average1Score, 
                        total2Score: average2Score, 
                        total3Score: average3Score, 
                        total4Score: average4Score
                    };
                }
            });
        });

        // 각 멤버의 평균 점수 계산
        const membersWithAverages = members.map((member) => {
            const memberScore = memberScores[String(member.memberId)] || { 
                totalScore: 0, count: 1, total1Score: 0, total2Score: 0, total3Score: 0, total4Score: 0 
            };
            
            const avgScore = memberScore.totalScore / memberScore.count;
            const average1Score = memberScore.total1Score / memberScore.count;
            const average2Score = memberScore.total2Score / memberScore.count;
            const average3Score = memberScore.total3Score / memberScore.count;
            const average4Score = memberScore.total4Score / memberScore.count;
            
            return { 
                ...member, 
                avgScore, 
                average1Score, 
                average2Score, 
                average3Score, 
                average4Score 
            };
        });

        // 평균 점수 기준으로 멤버 정렬
        const sorted = membersWithAverages.sort((a, b) => b.avgScore - a.avgScore);
        setSortedMembers(sorted);
        setLoading(false);
    };

    const getCeremonysList = () => {
        console.log('🔍 시상 목록 요청 시작:', { clubId, token });
        // 현재는 간단한 시상 목록만 가져오므로 필터링은 프론트엔드에서 처리
        getCeremoniesRequest(clubId, token).then(getCeremonysListResponse);
    }

    const getGamesRequest = (clubId, token) => {
        return getGameListRequest(clubId, token);
    }

    useEffect(() => {
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 6);
    
        setStartDate(sixMonthsAgo.toISOString().split("T")[0]);
        setEndDate(today.toISOString().split("T")[0]);
        setStartDay(sixMonthsAgo.toISOString().split("T")[0]);
        setEndDay(today.toISOString().split("T")[0]);
    }, []);
    
    useEffect(() => {
        if (startDay && endDay) {
            setLoading(true);
            getCeremonysList();
        }
    }, [startDay, endDay, gameType]);

    return (
        <>
            <div className={styles.clubRankingContainer}>
                <div className={styles.filterBox}>
                    <div className={styles.filterNavBox}>
                        <div className={styles.filterNav}>
                            <p className={styles.filterTitle}>검색기간</p>
                            <div className={styles.searchBox}>
                                <input
                                    className={styles.dateInput}
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => handleDateChange(setStartDate, e.target.value, startDay)}
                                />
                                <p>~</p>
                                <input
                                    className={styles.dateInput}
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => handleDateChange(setEndDate, e.target.value, endDay)}
                                />
                            </div>
                        </div>
                        <div className={styles.filterNav}>
                            <p className={styles.filterTitle}>게임종류</p>
                            <div className={styles.filterBtns}>
                                <button className={`${styles.filterBtn} ${gameType == 0 ? styles.selectedFilterBtn : ""}`} onClick={() => setGameType(0)}>전체</button>
                                <button className={`${styles.filterBtn} ${gameType == 1 ? styles.selectedFilterBtn : ""}`} onClick={() => setGameType(1)}>정기모임</button>
                                <button className={`${styles.filterBtn} ${gameType == 2 ? styles.selectedFilterBtn : ""}`} onClick={() => setGameType(2)}>정기번개</button>
                                <button className={`${styles.filterBtn} ${gameType == 3 ? styles.selectedFilterBtn : ""}`} onClick={() => setGameType(3)}>기타</button>
                            </div>
                        </div>
                    </div>
                </div>
                <table className={`${styles.teamScoreTable} ${styles.rankTable}`}>
                    <thead>
                        <tr className={`${styles.teamScoreHeaderTr} ${styles.rankHeaderTr}`}>
                            <th className={styles.rankScoreTh}>순위</th>
                            <th className={styles.rankScoreTh}>이름</th>
                            <th className={styles.rankScoreTh}>1G Avg</th>
                            <th className={styles.rankScoreTh}>2G Avg</th>
                            <th className={styles.rankScoreTh}>3G Avg</th>
                            <th className={styles.rankScoreTh}>4G Avg</th>
                            <th className={styles.rankScoreTh}>평균</th>
                            <th className={styles.rankScoreTh}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedMembers.length > 0 && sortedMembers.map((member, i) => (
                            <>
                                <tr key={member.memberId} className={`${styles.teamScoreBodyTr} ${styles.rankBodyTr}`}>
                                    <td className={styles.rankScoreTd}>{(i + 1)}</td>
                                    <td className={styles.rankScoreTd}>
                                        <div className={styles.settingMemberProfileBox}>
                                            <img className={styles.memberProfileImg} src={member.memberProfile}></img>
                                            <p>{member.memberName}</p>
                                        </div>
                                    </td>
                                    <td className={`${styles.rankScoreTd} `}>{member.average1Score ? (Number.isInteger(member.average1Score) ? member.average1Score : member.average1Score.toFixed(1)) : "0"}</td>
                                    <td className={`${styles.rankScoreTd} `}>{member.average2Score ? (Number.isInteger(member.average2Score) ? member.average2Score : member.average2Score.toFixed(1)) : "0"}</td>
                                    <td className={`${styles.rankScoreTd} `}>{member.average3Score ? (Number.isInteger(member.average3Score) ? member.average3Score : member.average3Score.toFixed(1)) : "0"}</td>
                                    <td className={`${styles.rankScoreTd} `}>{member.average4Score ? (Number.isInteger(member.average4Score) ? member.average4Score : member.average4Score.toFixed(1)) : "0"}</td>
                                    <td className={styles.rankScoreTd}>{member.avgScore == 0 ? "0" : (Number.isInteger(member.avgScore) ? member.avgScore : member.avgScore.toFixed(1))}</td>
                                    <td className={styles.rankScoreTd} onClick={() => moreInfoHandler(member.memberId)}>
                                        {!openMore.includes(member.memberId) ? (
                                            <i class="fa-solid fa-chevron-down"></i>
                                        ) : (
                                            <i class="fa-solid fa-chevron-up"></i>
                                        )}
                                    </td>
                                </tr>
                                {openMore.includes(member.memberId) && 
                                    <tr>
                                        <td colSpan={8}>
                                            <div className={styles.memberMore}>

                                            </div>
                                        </td>
                                    </tr>
                                }
                            </>
                        ))}
                    </tbody>
                </table>
                {!sortedMembers.length > 0 &&
                    <div className={styles.nodataContainer}>
                        <Nodata text={"기록이 없습니다."}></Nodata>
                    </div>
                }
            </div>
        </>
    )
}

function Nodata({ text }) {
    return (
        <div className={styles.nodataBox}>
            <img className={styles.nodataImg} src={require("../../imges/club/noData.png")}></img>
            <span>{text}</span>
        </div>
    )
}