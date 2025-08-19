import { useState, useCallback } from 'react';
import { useCookies } from 'react-cookie';
import { signInRequest, signUpRequest } from '../apis';

const useAuth = () => {
  const [cookies, setCookie, removeCookie] = useCookies(['accessToken', 'refreshToken']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // 로그인
  const signIn = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await signInRequest(credentials);
      
      if (response && response.code === 'SUCCESS') {
        const { accessToken, refreshToken, user: userData } = response.data;
        
        // 토큰을 쿠키에 저장
        setCookie('accessToken', accessToken, { 
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 3600 // 1시간
        });
        
        if (refreshToken) {
          setCookie('refreshToken', refreshToken, { 
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 604800 // 7일
          });
        }
        
        setUser(userData);
        return userData;
      } else {
        throw new Error(response?.message || '로그인에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err.message || '로그인에 실패했습니다.';
      setError(errorMessage);
      console.error('로그인 에러:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setCookie]);

  // 회원가입
  const signUp = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await signUpRequest(userData);
      
      if (response && response.code === 'SUCCESS') {
        return response.data;
      } else {
        throw new Error(response?.message || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err.message || '회원가입에 실패했습니다.';
      setError(errorMessage);
      console.error('회원가입 에러:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 로그아웃
  const signOut = useCallback(() => {
    removeCookie('accessToken', { path: '/' });
    removeCookie('refreshToken', { path: '/' });
    setUser(null);
    setError(null);
  }, [removeCookie]);

  // 토큰 갱신
  const refreshToken = useCallback(async () => {
    if (!cookies.refreshToken) {
      throw new Error('리프레시 토큰이 없습니다.');
    }
    
    try {
      // 새로운 백엔드에서는 별도의 토큰 갱신 엔드포인트가 있을 수 있음
      // 현재는 기본적인 구조만 제공
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: cookies.refreshToken }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const { accessToken, refreshToken: newRefreshToken } = data;
        
        setCookie('accessToken', accessToken, { 
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 3600
        });
        
        if (newRefreshToken) {
          setCookie('refreshToken', newRefreshToken, { 
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 604800
          });
        }
        
        return accessToken;
      } else {
        throw new Error('토큰 갱신에 실패했습니다.');
      }
    } catch (err) {
      console.error('토큰 갱신 에러:', err);
      signOut();
      throw err;
    }
  }, [cookies.refreshToken, setCookie, signOut]);

  // 사용자 정보 설정
  const setUserInfo = useCallback((userData) => {
    setUser(userData);
  }, []);

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 인증 상태 확인
  const isAuthenticated = useCallback(() => {
    return !!cookies.accessToken && !!user;
  }, [cookies.accessToken, user]);

  return {
    // 상태
    user,
    loading,
    error,
    isAuthenticated: isAuthenticated(),
    
    // 액션
    signIn,
    signUp,
    signOut,
    refreshToken,
    setUserInfo,
    clearError,
    
    // 토큰
    accessToken: cookies.accessToken,
    refreshToken: cookies.refreshToken
  };
};

export default useAuth;

