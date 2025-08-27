import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { ACCESS_TOKEN, HOME_PATH, ROOT_PATH } from './constants';
import { handleOAuth2Callback, getCurrentUserRequest } from './apis';
import useSignInStore from './stores/useSignInStore';
import Main from './mobile/routes/Main';
import Home from './mobile/routes/Home';
import Scoreboard from './mobile/routes/Scoreboard';
import Auth from './mobile/routes/Auth';
import AddClub from './mobile/routes/AddClub';
import './App.css';
import MyClub from './mobile/routes/MyClub';
import MyClubs from './mobile/routes/MyClubs';

function Index() {
  const { signInUser, login } = useSignInStore();
  const [cookies, setCookie, removeCookie] = useCookies();
  const navigator = useNavigate();

  useEffect(() => {
    const accessToken = cookies[ACCESS_TOKEN];
    if (!accessToken) {
      // 토큰이 없으면 로그아웃 상태로 설정
      console.log('🔍 Index: 토큰이 없습니다. 로그인 상태 확인 필요');
    } else {
      console.log('🔍 Index: 토큰이 있습니다:', accessToken);
      // 토큰이 있으면 서버에서 사용자 정보 조회
      getCurrentUserRequest(accessToken)
        .then((userInfo) => {
          if (userInfo && userInfo.id) {
            login(userInfo);
            console.log('🔍 Index: 서버에서 사용자 정보 조회 완료:', userInfo);
          }
        })
        .catch((error) => {
          console.error('🔍 Index: 사용자 정보 조회 실패:', error);
          // 토큰이 유효하지 않으면 쿠키 삭제
          removeCookie(ACCESS_TOKEN);
        });
    }
  }, [cookies, login, removeCookie]);

  return (
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/home" element={<Home />} />
      <Route path="/my-clubs" element={<MyClubs />} />
      <Route path="/club/:clubId" element={<MyClub />} />
      <Route path="/scoreboard" element={<Scoreboard />} />
      <Route path="/sns-success" element={<SnsSuccess />} />
      <Route path="/oauth2/callback/:provider" element={<SnsSuccess />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/add-club" element={<AddClub />} />
    </Routes>
  );
}



function SnsSuccess() {
  const [queryParam] = useSearchParams();
  const accessToken = queryParam.get('access_token');
  const expiration = queryParam.get('expiration');
  const code = queryParam.get('code');
  const state = queryParam.get('state');
  
  // 사용자 정보 파라미터 추가 (URL 디코딩)
  const userId = queryParam.get('userId');
  const userName = queryParam.get('userName') ? decodeURIComponent(queryParam.get('userName')) : null;
  const userEmail = queryParam.get('userEmail') ? decodeURIComponent(queryParam.get('userEmail')) : null;
  const profileImageUrl = queryParam.get('profileImageUrl') ? decodeURIComponent(queryParam.get('profileImageUrl')) : null;
  const role = queryParam.get('role');
  
  const [cookies, setCookie] = useCookies();
  const navigator = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const { login } = useSignInStore();

  useEffect(() => {
    console.log('🔍 SnsSuccess useEffect 실행');
    console.log('🔍 URL 파라미터 확인:', { accessToken, expiration, userId, userName, userEmail, profileImageUrl, role });
    
    // 이미 처리 중이면 중복 실행 방지
    if (isProcessing) {
      console.log('⚠️ 이미 처리 중입니다.');
      return;
    }

    // 세션 스토리지에서 처리 상태 확인
    const processingKey = 'oauth2_processing';
    if (sessionStorage.getItem(processingKey)) {
      console.log('⚠️ 이미 OAuth2 처리가 진행 중입니다.');
      return;
    }

    // 이미 토큰이 있으면 홈으로 이동
    if (cookies[ACCESS_TOKEN]) {
      setIsProcessing(true);
      sessionStorage.removeItem(processingKey);
      navigator(HOME_PATH);
      return;
    }

    // OAuth2 콜백 처리 (code와 state가 있는 경우)
    if (code && state) {
      setIsProcessing(true);
      sessionStorage.setItem(processingKey, 'true');
      
      try {
        // 새로운 OAuth2 콜백 처리 함수 사용
        handleOAuth2Callback('kakao', code, state).then((response) => {
          if (response && response.code === 'SUCCESS') {
            const { accessToken: newToken, expiration: newExpiration } = response.data;
            const expires = new Date(Date.now() + (Number(newExpiration) * 1000));
            setCookie(ACCESS_TOKEN, newToken, { path: ROOT_PATH, expires });
            console.log('OAuth2 토큰 저장 완료');
            
            // URL에서 토큰 파라미터 제거하고 홈으로 이동
            window.history.replaceState({}, document.title, window.location.pathname);
            sessionStorage.removeItem(processingKey);
            navigator(HOME_PATH);
          } else {
            console.error('OAuth2 콜백 처리 실패:', response);
            sessionStorage.removeItem(processingKey);
            navigator(ROOT_PATH);
          }
        }).catch((error) => {
          console.error('OAuth2 콜백 처리 중 오류:', error);
          sessionStorage.removeItem(processingKey);
          navigator(ROOT_PATH);
        });
      } catch (error) {
        console.error('OAuth2 콜백 처리 중 오류:', error);
        sessionStorage.removeItem(processingKey);
        navigator(ROOT_PATH);
      }
      return;
    }

    // 기존 방식 (accessToken과 expiration이 직접 URL에 있는 경우)
    if (accessToken && expiration) {
      setIsProcessing(true);
      sessionStorage.setItem(processingKey, 'true');
      
      try {
        const expires = new Date(Date.now() + (Number(expiration) * 1000));
        setCookie(ACCESS_TOKEN, accessToken, { path: ROOT_PATH, expires });
        console.log('OAuth2 토큰 저장 완료');
        
        // 사용자 정보가 URL 파라미터로 전달된 경우 store에 저장
        if (userId && userName && userEmail) {
          const userInfo = {
            id: userId,
            name: userName,
            email: userEmail,
            profileImageUrl: profileImageUrl || '',
            role: role || 'USER'
          };
          login(userInfo);
          console.log('사용자 정보 store 저장 완료:', userInfo);
        } else {
          // 사용자 정보가 없는 경우 - OAuth2 로그인에서는 항상 URL 파라미터로 전달됨
          console.log('URL에 사용자 정보가 없습니다. OAuth2 로그인에 문제가 있을 수 있습니다.');
        }
        
        // URL에서 토큰 파라미터 제거하고 홈으로 이동
        window.history.replaceState({}, document.title, window.location.pathname);
        sessionStorage.removeItem(processingKey);
        navigator(HOME_PATH);
      } catch (error) {
        console.error('토큰 저장 중 오류:', error);
        sessionStorage.removeItem(processingKey);
        navigator(ROOT_PATH);
      }
    } else {
      console.warn('토큰 또는 만료시간이 없습니다. accessToken:', accessToken, 'expiration:', expiration);
      sessionStorage.removeItem(processingKey);
      navigator(ROOT_PATH);
    }
  }, [accessToken, expiration, code, state, setCookie, navigator, isProcessing, cookies]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div>로그인 처리 중...</div>
      <div style={{ fontSize: '14px', color: '#666' }}>
        잠시만 기다려주세요.
      </div>
    </div>
  );
}

function App() {
  const { signInUser, login } = useSignInStore();
  const [cookies, setCookie, removeCookie] = useCookies();
  const navigator = useNavigate();



  useEffect(() => {
    const accessToken = cookies[ACCESS_TOKEN];
    if (!accessToken) {
      // 토큰이 없으면 로그아웃 상태로 설정하되, 기존 사용자 정보는 유지
      // login(null) 호출하지 않음 - OAuth2 로그인 후 사용자 정보가 URL 파라미터로 전달됨
      console.log('🔍 App: 토큰이 없습니다. 로그인 상태 확인 필요');
    } else {
      console.log('🔍 App: 토큰이 있습니다:', accessToken);
    }
    // OAuth2 로그인 후에는 사용자 정보가 URL 파라미터로 전달되므로 API 호출 불필요
  }, [cookies]);

  function setScreenSize() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  useEffect(() => {
    setScreenSize();
    const handleResize = () => {
      setScreenSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <Index />;
}

export default App;
