import axios from "./requestInterceptor";
import { HOME_PATH } from "../constants";

// 서버 환경에 따른 API 도메인 설정
const ROOT_API_DOMAIN = process.env.REACT_APP_API_URL || 'https://pinpal.co.kr';

// 현재 백엔드 API 구조에 맞춘 URL 정의
const AUTH_API_URL = `${ROOT_API_DOMAIN}/api/auth`;
const AUTH_V1_API_URL = `${ROOT_API_DOMAIN}/api/v1/auth`; // OAuth2 로그인용
const CLUB_API_URL = `${ROOT_API_DOMAIN}/api/clubs`;
const USER_API_URL = `${ROOT_API_DOMAIN}/api/users`;
const SCOREBOARD_API_URL = `${ROOT_API_DOMAIN}/api/scoreboard`;
const GAME_API_URL = `${ROOT_API_DOMAIN}/api/games`;

// Auth 관련 API
const SIGN_UP_API_URL = `${AUTH_API_URL}/sign-up`;
const SIGN_IN_API_URL = `${AUTH_API_URL}/sign-in`;

// OAuth2 관련 API (백엔드 SecurityConfig에 맞춤)
const OAUTH2_SNS_SIGN_IN_URL = (sns, redirectUri) => `${AUTH_V1_API_URL}/sns-sign-in/${sns}?redirect_uri=${redirectUri}`;
const OAUTH2_CALLBACK_URL = (provider) => `${ROOT_API_DOMAIN}/oauth2/callback/${provider}`;

// Club 관련 API (현재 백엔드 구조)
const GET_CLUB_LIST_API_URL = (page) => `${CLUB_API_URL}?page=${page}`;
const GET_ALL_CLUBS_API_URL = (cursor) => `${CLUB_API_URL}?cursor=${cursor}`;
const GET_CLUB_INFO_API_URL = (clubId) => `${CLUB_API_URL}/${clubId}`;
const GET_CLUB_MEMBERS_API_URL = (clubId) => `${CLUB_API_URL}/${clubId}/members`;
const GET_CEREMONIES_API_URL = (clubId) => `${ROOT_API_DOMAIN}/api/ceremonies/club/${clubId}`;
const GET_MY_CLUBS_API_URL = `${USER_API_URL}/my-clubs`;
const EXPORT_SCOREBOARD_EXCEL_API_URL = (gameId) => `${ROOT_API_DOMAIN}/api/games/${gameId}/export/scoreboards`;
const CREATE_CLUB_API_URL = `${CLUB_API_URL}`;
const UPDATE_CLUB_API_URL = (clubId) => `${CLUB_API_URL}/${clubId}`;
const DELETE_CLUB_API_URL = (clubId) => `${CLUB_API_URL}/${clubId}`;
const JOIN_CLUB_API_URL = (clubId) => `${CLUB_API_URL}/${clubId}/members`;

// Scoreboard 관련 API (기존 구조 유지)
const GET_SCOREBOARD_MEMBER_API_URL = (gameId, clubId) => `${SCOREBOARD_API_URL}/?gameId=${gameId}&clubId=${clubId}`;
const GAME_JOIN_API_URL = (gameId) => `${GAME_API_URL}/${gameId}/scoreboards`;
const GAME_JOIN_CANCEL_API_URL = (gameId) => `${GAME_API_URL}/${gameId}/scoreboards`;
const GET_GAME_PARTICIPANTS_API_URL = (gameId) => `${GAME_API_URL}/${gameId}/participants`;
const SIDE_JOIN_API_URL = (gameId, memberId, sideType) => `${SCOREBOARD_API_URL}/joinSide?gameId=${gameId}&memberId=${memberId}&sideType=${sideType}`;
const CONFIRM_CHECK_API_URL = (gameId, memberId) => `${SCOREBOARD_API_URL}/confirmedJoin?gameId=${gameId}&memberId=${memberId}`;
const GRADE_SETTING_API_URL = (gameId) => `${SCOREBOARD_API_URL}/setGrade?gameId=${gameId}`;
const TEAM_SETTING_API_URL = (gameId) => `${SCOREBOARD_API_URL}/setTeam?gameId=${gameId}`;
const SCOREBOARD_SCORE_COUNTING_STOP_API_URL = (gameId) => `${SCOREBOARD_API_URL}/stopScoreCounting?gameId=${gameId}`;
const SCORE_INPUT_API_URL = (gameId, memberId) => `${SCOREBOARD_API_URL}/saveScore?memberId=${memberId}&gameId=${gameId}`;
const SCOREBOARD_GAME_STOP_API_URL = `${SCOREBOARD_API_URL}/stop`;

// Game 관련 API
const GET_GAMES_BY_CLUB_API_URL = (clubId, cursor) => {
    const baseUrl = `${GAME_API_URL}?clubId=${clubId}`;
    return cursor ? `${baseUrl}&cursor=${cursor}` : baseUrl;
};
const ADD_GAME_API_URL = `${GAME_API_URL}`;

// Authorization 헤더 설정
const bearerAuthorization = (accessToken) => ({ 
    headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    } 
});

// 응답 데이터 처리
const responseDataHandler = (response) => {
    const { data } = response;
    return data;
};

// 에러 처리
const responseErrorHandler = (error) => {
    console.log('API 에러:', error);
    console.log('에러 응답 데이터:', error.response?.data);
    console.log('에러 상태 코드:', error.response?.status);
    
    if (!error.response) {
        console.log('네트워크 에러 또는 서버 연결 실패');
        return { 
            code: 'ERROR', 
            message: '서버에 연결할 수 없습니다.',
            status: 0
        };
    }
    
    const { data, status } = error.response;
    
    // 새로운 ErrorResponse 구조 처리
    if (data && data.timestamp && data.status) {
        return { 
            code: 'ERROR', 
            message: data.message || '오류가 발생했습니다.',
            details: data.details,
            status: data.status
        };
    }
    
    // 기존 CodeMessageRespDto 구조 처리
    if (data && data.code) {
        return { code: data.code, message: data.message };
    }
    
    // 기본 에러 처리
    return { 
        code: 'ERROR', 
        message: data?.message || `HTTP ${status} 에러가 발생했습니다.`,
        status: status
    };
};

// ===== Auth 관련 함수 =====
export const signUpRequest = async (requestBody) => {
    const responseBody = await axios.post(SIGN_UP_API_URL, requestBody)
        .then(responseDataHandler)
        .catch(responseErrorHandler);
    return responseBody;
};

export const signInRequest = async (requestBody) => {
    const responseBody = await axios.post(SIGN_IN_API_URL, requestBody)
        .then(responseDataHandler)
        .catch(responseErrorHandler);
    return responseBody;
};

// OAuth2 로그인 함수
export const oauth2SignIn = (sns, redirectUri) => {
    const url = OAUTH2_SNS_SIGN_IN_URL(sns, redirectUri);
    window.location.href = url;
};

// OAuth2 콜백 처리 함수
export const handleOAuth2Callback = async (provider, code, state) => {
    const responseBody = await axios.get(OAUTH2_CALLBACK_URL(provider), {
        params: { code, state }
    })
    .then(responseDataHandler)
    .catch(responseErrorHandler);
    return responseBody;
};

// 기존 코드 호환성을 위한 함수들
export const idCheckRequest = async (requestBody) => {
    // 백엔드에 ID 체크 API가 있다면 해당 엔드포인트 사용
    // 현재는 signUpRequest와 동일한 구조로 처리
    const responseBody = await axios.post(`${AUTH_API_URL}/id-check`, requestBody)
        .then(responseDataHandler)
        .catch(responseErrorHandler);
    return responseBody;
};

export const getSignInRequest = async (accessToken) => {
    // 백엔드에 사용자 정보 조회 API가 있다면 해당 엔드포인트 사용
    const responseBody = await axios.get(`${USER_API_URL}/me`, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler);
    return responseBody;
};

// ===== Club 관련 함수 =====
export const getClubList = async (page, accessToken) => {
    console.log(GET_CLUB_LIST_API_URL(page))
    const responseBody = await axios.get(`${GET_CLUB_LIST_API_URL(page)}`, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler)
    return responseBody;
};

// 새로운 getAllClubs API (cursor 기반 페이지네이션)
export const getAllClubs = async (cursor, accessToken) => {
    const responseBody = await axios.get(`${GET_ALL_CLUBS_API_URL(cursor)}`, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler)
    return responseBody;
};

export const getClubInfoRequest = async (clubId, accessToken) => {
    const responseBody = await axios.get(`${GET_CLUB_INFO_API_URL(clubId)}`, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler)
    return responseBody;
};

export const getClubMembersRequest = async (clubId, accessToken) => {
    const responseBody = await axios.get(`${GET_CLUB_MEMBERS_API_URL(clubId)}`, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler)
    return responseBody;
};

export const getCeremoniesRequest = async (clubId, accessToken) => {
    const responseBody = await axios.get(`${GET_CEREMONIES_API_URL(clubId)}`, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler)
    return responseBody;
};

export const createClubRequest = async (clubData, accessToken) => {
    const responseBody = await axios.post(`${CREATE_CLUB_API_URL}`, clubData, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler)
    return responseBody;
};

export const updateClubRequest = async (clubId, clubData, accessToken) => {
    const responseBody = await axios.patch(`${UPDATE_CLUB_API_URL(clubId)}`, clubData, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler)
    return responseBody;
};

export const deleteClubRequest = async (clubId, accessToken) => {
    const responseBody = await axios.delete(`${DELETE_CLUB_API_URL(clubId)}`, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler)
    return responseBody;
};

// 클럽 가입 API - memberId 없이 현재 로그인한 사용자가 가입
export const joinClubRequest = async (clubId, accessToken) => {
    const responseBody = await axios.post(`${JOIN_CLUB_API_URL(clubId)}`, {}, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler)
    return responseBody;
};

// 내가 가입한 클럽 목록 조회
export const getMyClubsRequest = async (accessToken) => {
    const responseBody = await axios.get(GET_MY_CLUBS_API_URL, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler);
    return responseBody;
};

// 현재 사용자 정보 조회
export const getCurrentUserRequest = async (accessToken) => {
    const responseBody = await axios.get(`${USER_API_URL}/me`, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler);
    return responseBody;
};

// ===== Scoreboard 관련 함수 (기존 구조 유지) =====
export const getScoreboardMembers = async (gameId, clubId, accessToken) => {
    const responseBody = await axios.get(GET_SCOREBOARD_MEMBER_API_URL(gameId, clubId), bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler);
    return responseBody;
};

// 특정 게임의 scoreboard 데이터 조회
export const getScoreboardRequest = async (gameId, accessToken) => {
    const responseBody = await axios.get(`${SCOREBOARD_API_URL}/game/${gameId}`, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler);
    return responseBody;
};

// 클럽의 scoreboard 데이터 조회 (날짜 범위, 게임 타입 필터링)
export const getClubScoreboardsRequest = async (clubId, startDate, endDate, gameType, accessToken) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (gameType) params.append('type', gameType);
    
    const responseBody = await axios.get(`${GAME_API_URL}/${clubId}/scoreboards?${params.toString()}`, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler);
    return responseBody;
};

export const gameJoinRequest = async (gameId, accessToken) => {
    const responseBody = await axios.post(GAME_JOIN_API_URL(gameId), {}, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler);

    return responseBody;
}

export const gameJoinCancelRequest = async (gameId, accessToken) => {
    const responseBody = await axios.delete(GAME_JOIN_CANCEL_API_URL(gameId), bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler);
    return responseBody;
}

export const getGameParticipantsRequest = async (gameId, accessToken) => {
    const responseBody = await axios.get(GET_GAME_PARTICIPANTS_API_URL(gameId), bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler);
    return responseBody;
}

export const sideJoinRequest = async (gameId, memberId, sideType, accessToken) => {
    const responseBody = await axios.post(SIDE_JOIN_API_URL(gameId, memberId, sideType), {}, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler);
    return responseBody;
};

export const confirmCheckRequest = async (gameId, memberId, code, accessToken) => {
    const responseBody = await axios.post(`${CONFIRM_CHECK_API_URL(gameId, memberId)}`, { code: code }, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler);
    return responseBody;
}

export const scoreCountingStopRequest = async (gameId, accessToken) => {
    const responseBody = await axios.post(`${SCOREBOARD_SCORE_COUNTING_STOP_API_URL(gameId)}`, {}, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler);
    return responseBody;
}

export const gradeSettingRequest = async (gameId, updatedMembers, accessToken) => {
    const responsBody = await axios.post(`${GRADE_SETTING_API_URL(gameId)}`, { updatedMembers }, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler);
    return responsBody;
}

export const teamSettingRequest = async (gameId, members, accessToken) => {
    const responsBody = await axios.post(`${TEAM_SETTING_API_URL(gameId)}`, { members }, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler);
    return responsBody;
};

export const teamRandomSettingRequest = async (gameId, members, accessToken) => {
    // 프론트엔드에서 랜덤 팀 설정
    const shuffledMembers = [...members].sort(() => Math.random() - 0.5);
    
    // 팀 수 결정 (2~8팀, 인원수에 따라 적절히 조정)
    let teamCount;
    if (members.length <= 4) {
        teamCount = 2;
    } else if (members.length <= 8) {
        teamCount = 3;
    } else if (members.length <= 12) {
        teamCount = 4;
    } else if (members.length <= 16) {
        teamCount = 5;
    } else if (members.length <= 20) {
        teamCount = 6;
    } else if (members.length <= 24) {
        teamCount = 7;
    } else {
        teamCount = 8;
    }
    
    // 균등한 팀 분배
    const updatedMembers = shuffledMembers.map((member, index) => ({
        memberId: member.memberId,
        teamNumber: (index % teamCount) + 1
    }));

    const requestBody = { members: updatedMembers };
    
    const responsBody = await axios.post(`${TEAM_SETTING_API_URL(gameId)}`, requestBody, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler);
    return responsBody;
};

export const scoreInputRequest = async (gameId, memberId, scores, accessToken) => {
    const responsBody = await axios.post(`${SCORE_INPUT_API_URL(gameId, memberId)}`, scores, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler);
    return responsBody;
}

export const scoreboardGameStop = async (dto, accessToken) => {
    const responsBody = await axios.post(`${SCOREBOARD_GAME_STOP_API_URL}`, dto, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler);
    return responsBody;
}

// ===== Game 관련 함수 =====
export const getGameListRequest = async (clubId, accessToken, cursor = null) => {
    const responseBody = await axios.get(`${GET_GAMES_BY_CLUB_API_URL(clubId, cursor)}`, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler)
    return responseBody;
}

export const addGameRequest = async (game, accessToken) => {
    const responseBody = await axios.post(`${ADD_GAME_API_URL}`, game, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler)
    return responseBody;
}

// ===== 기존 호환성을 위한 함수들 (점진적 제거 예정) =====
export const getMemberListRequest = async (clubId, accessToken) => {
    // 새로운 API 구조에서는 클럽 정보에 멤버 정보가 포함될 예정
    const responseBody = await axios.get(`${GET_CLUB_INFO_API_URL(clubId)}`, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler)
    return responseBody;
};

export const getRecentCeremonysListRequest = async (clubId, accessToken) => {
    // 새로운 API 구조에서는 클럽 정보에 최근 행사 정보가 포함될 예정
    const responseBody = await axios.get(`${GET_CLUB_INFO_API_URL(clubId)}`, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler)
    return responseBody;
};

export const getCeremonysListRequest = async (clubId, data, accessToken) => {
    // 새로운 API 구조에서는 별도 엔드포인트로 분리될 예정
    const responseBody = await axios.get(`${GET_CLUB_INFO_API_URL(clubId)}`, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler)
    return responseBody;
};

export const addClubRequest = async (data, accessToken) => {
    return createClubRequest(data, accessToken);
};

export const clubMemberAvgUpdateRequest = async (data, clubId, accessToken) => {
    // 새로운 API 구조에서는 별도 엔드포인트로 분리될 예정
    const responseBody = await axios.patch(`${CLUB_API_URL}/${clubId}/grades`, data, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler)
    return responseBody;
}

export const clubMemberRoleUpdateRequest = async (data, clubId, accessToken) => {
    // 새로운 API 구조에서는 별도 엔드포인트로 분리될 예정
    const responseBody = await axios.patch(`${CLUB_API_URL}/${clubId}/roles`, data, bearerAuthorization(accessToken))
        .then(responseDataHandler)
        .catch(responseErrorHandler)
    return responseBody;
}

// 기존 호환성을 위한 함수 (memberId 파라미터 제거)
export const clubJoinRequest = async (clubId, memberId, accessToken) => {
    console.warn('clubJoinRequest는 deprecated되었습니다. joinClubRequest를 사용하세요.');
    return joinClubRequest(clubId, accessToken);
};

// ===== 엑셀 다운로드 관련 함수 =====
export const exportScoreboardExcelRequest = async (gameId, accessToken) => {
    try {
        const response = await axios.get(`${EXPORT_SCOREBOARD_EXCEL_API_URL(gameId)}`, {
            ...bearerAuthorization(accessToken),
            responseType: 'blob' // 파일 다운로드를 위해 blob으로 설정
        });
        
        // 파일 다운로드 처리
        const blob = new Blob([response.data], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `scoreboard_${gameId}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return { success: true };
    } catch (error) {
        console.error('엑셀 다운로드 실패:', error);
        return { success: false, error: error.message };
    }
};
