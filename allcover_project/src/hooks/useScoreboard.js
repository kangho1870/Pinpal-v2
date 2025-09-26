import { useState, useCallback } from 'react';
import { useCookies } from 'react-cookie';
import useScoreboardStore from '../stores/useScoreboardStore';
import {
  getScoreboardMembers,
  gameJoinRequest,
  gameJoinCancelRequest,
  sideJoinRequest,
  confirmCheckRequest,
  gradeSettingRequest,
  teamSettingRequest,
  teamRandomSettingRequest,
  scoreInputRequest,
  scoreboardGameStop
} from '../apis';

const useScoreboard = (clubId) => {
  const [cookies] = useCookies(['accessToken']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const {
    members,
    setMembers,
    updateMember,
    resetMembers
  } = useScoreboardStore();

  // 스코어보드 멤버 조회
  const fetchScoreboardMembers = useCallback(async (gameId, clubId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getScoreboardMembers(gameId, clubId, cookies.accessToken);
      
      if (response && response.code === 'SUCCESS') {
        setMembers(response.data || []);
        return response.data;
      } else {
        throw new Error(response?.message || '스코어보드 멤버를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err.message || '스코어보드 멤버를 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('스코어보드 멤버 조회 에러:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cookies.accessToken, setMembers]);

  // 스코어보드 참가
  const joinScoreboard = useCallback(async (gameId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await gameJoinRequest(gameId, clubId, cookies.accessToken);
      
      if (response && response.id && response.name) {
        // 성공적으로 게임에 참여함
        return response;
      } else {
        throw new Error(response?.message || '스코어보드 참가에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err.message || '스코어보드 참가에 실패했습니다.';
      setError(errorMessage);
      console.error('스코어보드 참가 에러:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cookies.accessToken, clubId]);

  // 스코어보드 참가 취소
  const cancelScoreboardJoin = useCallback(async (gameId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await gameJoinCancelRequest(gameId, clubId, cookies.accessToken);
      
      if (response && response.id && response.name) {
        // 성공적으로 게임 참여를 취소함
        return response;
      } else {
        throw new Error(response?.message || '스코어보드 참가 취소에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err.message || '스코어보드 참가 취소에 실패했습니다.';
      setError(errorMessage);
      console.error('스코어보드 참가 취소 에러:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cookies.accessToken, clubId]);

  // 사이드 참가
  const joinSide = useCallback(async (gameId, memberId, sideType) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await sideJoinRequest(gameId, memberId, sideType, cookies.accessToken);
      
      if (response && response.code === 'SUCCESS') {
        const updatedMember = response.data;
        updateMember(memberId, updatedMember);
        return updatedMember;
      } else {
        throw new Error(response?.message || '사이드 참가에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err.message || '사이드 참가에 실패했습니다.';
      setError(errorMessage);
      console.error('사이드 참가 에러:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cookies.accessToken, updateMember]);

  // 확인 코드 체크
  const confirmCheck = useCallback(async (gameId, memberId, code) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await confirmCheckRequest(gameId, memberId, code, cookies.accessToken);
      
      if (response && response.code === 'SUCCESS') {
        const updatedMember = response.data;
        updateMember(memberId, updatedMember);
        return updatedMember;
      } else {
        throw new Error(response?.message || '확인 코드 체크에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err.message || '확인 코드 체크에 실패했습니다.';
      setError(errorMessage);
      console.error('확인 코드 체크 에러:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cookies.accessToken, updateMember]);

  // 등급 설정
  const setGrade = useCallback(async (gameId, updatedMembers) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await gradeSettingRequest(gameId, updatedMembers, cookies.accessToken);
      
      if (response && response.code === 'SUCCESS') {
        // 모든 멤버 상태 업데이트
        updatedMembers.forEach(member => {
          updateMember(member.memberId, member);
        });
        return response.data;
      } else {
        throw new Error(response?.message || '등급 설정에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err.message || '등급 설정에 실패했습니다.';
      setError(errorMessage);
      console.error('등급 설정 에러:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cookies.accessToken, updateMember]);

  // 팀 설정
  const setTeam = useCallback(async (gameId, members) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await teamSettingRequest(gameId, members, cookies.accessToken);
      
      if (response && response.code === 'SUCCESS') {
        // 모든 멤버 상태 업데이트
        members.forEach(member => {
          updateMember(member.memberId, member);
        });
        return response.data;
      } else {
        throw new Error(response?.message || '팀 설정에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err.message || '팀 설정에 실패했습니다.';
      setError(errorMessage);
      console.error('팀 설정 에러:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cookies.accessToken, updateMember]);

  // 랜덤 팀 설정
  const setRandomTeam = useCallback(async (gameId, members) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await teamRandomSettingRequest(gameId, members, cookies.accessToken);
      
      if (response && response.code === 'SUCCESS') {
        // 모든 멤버 상태 업데이트
        members.forEach(member => {
          updateMember(member.memberId, member);
        });
        return response.data;
      } else {
        throw new Error(response?.message || '랜덤 팀 설정에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err.message || '랜덤 팀 설정에 실패했습니다.';
      setError(errorMessage);
      console.error('랜덤 팀 설정 에러:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cookies.accessToken, updateMember]);

  // 점수 입력
  const inputScore = useCallback(async (gameId, memberId, scores) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await scoreInputRequest(gameId, memberId, scores, cookies.accessToken);
      
      if (response && response.code === 'SUCCESS') {
        const updatedMember = response.data;
        updateMember(memberId, updatedMember);
        return updatedMember;
      } else {
        throw new Error(response?.message || '점수 입력에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err.message || '점수 입력에 실패했습니다.';
      setError(errorMessage);
      console.error('점수 입력 에러:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cookies.accessToken, updateMember]);

  // 게임 종료
  const stopGame = useCallback(async (gameData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await scoreboardGameStop(gameData, cookies.accessToken);
      
      if (response && response.code === 'SUCCESS') {
        return response.data;
      } else {
        throw new Error(response?.message || '게임 종료에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err.message || '게임 종료에 실패했습니다.';
      setError(errorMessage);
      console.error('게임 종료 에러:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cookies.accessToken]);

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 스코어보드 초기화
  const resetScoreboard = useCallback(() => {
    resetMembers();
    clearError();
  }, [resetMembers, clearError]);

  return {
    // 상태
    members,
    loading,
    error,
    
    // 액션
    fetchScoreboardMembers,
    joinScoreboard,
    cancelScoreboardJoin,
    joinSide,
    confirmCheck,
    setGrade,
    setTeam,
    setRandomTeam,
    inputScore,
    stopGame,
    clearError,
    resetScoreboard
  };
};

export default useScoreboard;
