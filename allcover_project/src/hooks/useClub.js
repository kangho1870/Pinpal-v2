import { useState, useCallback } from 'react';
import { useCookies } from 'react-cookie';
import useClubStore from '../stores/useClubStore';
import { 
  getClubList, 
  getAllClubs,
  getClubInfoRequest, 
  createClubRequest, 
  updateClubRequest,
  deleteClubRequest,
  joinClubRequest 
} from '../apis';

const useClub = () => {
  const [cookies] = useCookies(['accessToken']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const {
    clubs,
    currentClub,
    members,
    ceremonys,
    games,
    page,
    setClubs,
    setCurrentClub,
    setMembers,
    setCeremonys,
    setGames,
    addClub,
    addMember,
    updateClub,
    resetClub,
    reset
  } = useClubStore();

  // 클럽 목록 조회 (기존 방식)
  const fetchClubList = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getClubList(pageNum, cookies.accessToken);
      
      if (response && response.code === 'SUCCESS') {
        setClubs(response.data || []);
        return response.data;
      } else {
        throw new Error(response?.message || '클럽 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err.message || '클럽 목록을 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('클럽 목록 조회 에러:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cookies.accessToken, setClubs]);

  // 새로운 getAllClubs API 사용 (cursor 기반 페이지네이션)
  const fetchAllClubs = useCallback(async (cursor = new Date().toISOString()) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAllClubs(cursor, cookies.accessToken);
      
      if (response && response.code === 'SUCCESS') {
        // PageResponse 구조에 맞춰 처리
        const { content, hasNext, nextCursor } = response.data;
        setClubs(content || []);
        return { content, hasNext, nextCursor };
      } else {
        throw new Error(response?.message || '클럽 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err.message || '클럽 목록을 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('클럽 목록 조회 에러:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cookies.accessToken, setClubs]);

  // 클럽 상세 정보 조회
  const fetchClubInfo = useCallback(async (clubId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getClubInfoRequest(clubId, cookies.accessToken);
      
      if (response && response.code === 'SUCCESS') {
        const clubData = response.data;
        setCurrentClub(clubData);
        
        // 멤버, 행사, 게임 정보가 포함되어 있다면 설정
        if (clubData.members) {
          setMembers(clubData.members);
        }
        if (clubData.ceremonys) {
          setCeremonys(clubData.ceremonys);
        }
        if (clubData.games) {
          setGames(clubData.games);
        }
        
        return clubData;
      } else {
        throw new Error(response?.message || '클럽 정보를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err.message || '클럽 정보를 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('클럽 정보 조회 에러:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cookies.accessToken, setCurrentClub, setMembers, setCeremonys, setGames]);

  // 클럽 생성
  const createClub = useCallback(async (clubData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await createClubRequest(clubData, cookies.accessToken);
      
      if (response && response.code === 'SUCCESS') {
        const newClub = response.data;
        addClub(newClub);
        return newClub;
      } else {
        throw new Error(response?.message || '클럽 생성에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err.message || '클럽 생성에 실패했습니다.';
      setError(errorMessage);
      console.error('클럽 생성 에러:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cookies.accessToken, addClub]);

  // 클럽 수정
  const updateClubData = useCallback(async (clubId, clubData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await updateClubRequest(clubId, clubData, cookies.accessToken);
      
      if (response && response.code === 'SUCCESS') {
        const updatedClub = response.data;
        updateClub(clubId, updatedClub);
        return updatedClub;
      } else {
        throw new Error(response?.message || '클럽 수정에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err.message || '클럽 수정에 실패했습니다.';
      setError(errorMessage);
      console.error('클럽 수정 에러:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cookies.accessToken, updateClub]);

  // 클럽 삭제
  const deleteClub = useCallback(async (clubId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await deleteClubRequest(clubId, cookies.accessToken);
      
      if (response && response.code === 'SUCCESS') {
        // 클럽 목록에서 제거
        setClubs(prev => prev.filter(club => club.id !== clubId));
        
        // 현재 클럽이 삭제된 클럽이라면 초기화
        if (currentClub && currentClub.id === clubId) {
          resetClub();
        }
        
        return true;
      } else {
        throw new Error(response?.message || '클럽 삭제에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err.message || '클럽 삭제에 실패했습니다.';
      setError(errorMessage);
      console.error('클럽 삭제 에러:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cookies.accessToken, setClubs, currentClub, resetClub]);

  // 클럽 가입
  const joinClub = useCallback(async (clubId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await joinClubRequest(clubId, cookies.accessToken);
      
      if (response && response.code === 'SUCCESS') {
        const newMember = response.data;
        
        // 현재 클럽의 멤버 목록에 추가
        addMember(newMember);
        
        // 현재 클럽 정보 업데이트 (멤버 수 등)
        if (currentClub && currentClub.id === clubId) {
          const updatedClub = {
            ...currentClub,
            memberCount: (currentClub.memberCount || 0) + 1
          };
          setCurrentClub(updatedClub);
        }
        
        return newMember;
      } else {
        throw new Error(response?.message || '클럽 가입에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err.message || '클럽 가입에 실패했습니다.';
      setError(errorMessage);
      console.error('클럽 가입 에러:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cookies.accessToken, addMember, currentClub, setCurrentClub]);

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 클럽 초기화
  const resetClubData = useCallback(() => {
    resetClub();
    clearError();
  }, [resetClub, clearError]);

  return {
    // 상태
    clubs,
    currentClub,
    members,
    ceremonys,
    games,
    page,
    loading,
    error,
    
    // 액션
    fetchClubList,
    fetchAllClubs,
    fetchClubInfo,
    createClub,
    updateClubData,
    deleteClub,
    joinClub,
    clearError,
    resetClubData,
    reset
  };
};

export default useClub;
