import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCookies } from "react-cookie";
import { ACCESS_TOKEN, HOME_PATH, ROOT_PATH } from "../../constants";
import { oauth2SignIn } from "../../apis";
import styles from "../css/routes/Main.module.css";

function Main() {
    const navigator = useNavigate();
    const [searchParams] = useSearchParams();
    const [cookies] = useCookies([ACCESS_TOKEN]);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // 페이지 로드 시 이전 OAuth2 상태 정리
        const oauth2RequestKey = 'oauth2_request_in_progress';
        const oauth2ProcessingKey = 'oauth2_processing';
        sessionStorage.removeItem(oauth2RequestKey);
        sessionStorage.removeItem(oauth2ProcessingKey);
        
        // 이미 리다이렉트 중이면 중복 실행 방지
        if (isRedirecting) return;

        // 컴포넌트 마운트 시 세션 스토리지 정리
        sessionStorage.removeItem('oauth2_request_in_progress');
        sessionStorage.removeItem('oauth2_processing');
        console.log('🔍 Main 컴포넌트 마운트 - 세션 스토리지 정리 완료');

        const accessToken = cookies[ACCESS_TOKEN];
        const snsSuccess = searchParams.get('access_token');
        
        // OAuth2 성공 후 토큰이 URL에 있으면 SnsSuccess 컴포넌트에서 처리하도록 함
        if (snsSuccess && !accessToken) {
            // SnsSuccess 컴포넌트에서 처리하므로 여기서는 아무것도 하지 않음
            return;
        }
        
        // 기존 토큰이 있으면 홈으로
        if (accessToken) {
            setIsRedirecting(true);
            navigator(HOME_PATH);
            return;
        }
        
        // 토큰이 없으면 루트로
        if (!accessToken && !snsSuccess) {
            setIsRedirecting(true);
            navigator(ROOT_PATH);
        }
    }, [cookies, navigator, searchParams, isRedirecting]);

    const authBtnClickHandler = async (sns) => {
        console.log('🔵 OAuth2 로그인 버튼 클릭됨:', sns);
        
        // 이미 로딩 중이면 중복 요청 방지
        if (isLoading) {
            console.log('⚠️ 이미 로딩 중입니다.');
            return;
        }
        
        // 세션 스토리지에서 OAuth2 요청 상태 확인 및 정리
        const oauth2RequestKey = 'oauth2_request_in_progress';
        const oauth2ProcessingKey = 'oauth2_processing';
        
        // 이전 요청 상태 정리
        sessionStorage.removeItem(oauth2RequestKey);
        sessionStorage.removeItem(oauth2ProcessingKey);
        
        console.log('🚀 OAuth2 로그인 시작...');
        setIsLoading(true);
        sessionStorage.setItem(oauth2RequestKey, 'true');
        
        try {
            const currentOrigin = window.location.origin;
            console.log('📍 현재 Origin:', currentOrigin);
            
            // 현재 접속 주소를 sessionStorage에 저장 (세션 종료 시 자동 삭제)
            sessionStorage.setItem('redirectUri', currentOrigin);
            
            // OAuth2 요청 전에 짧은 지연 시간 (속도 제한 방지)
            console.log('⏳ 잠시 대기 중...');
            await new Promise(resolve => setTimeout(resolve, 500)); // 0.5초로 단축
            
            console.log('🔗 OAuth2 리다이렉트 시작...');
            // 새로운 API 함수 사용
            oauth2SignIn(sns, currentOrigin);
        } catch (error) {
            console.error('❌ OAuth2 요청 중 오류:', error);
            setIsLoading(false);
            sessionStorage.removeItem(oauth2RequestKey);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.mainBox}>
                <div className={styles.logoBox}>
                    <img className={styles.logo} src={require("../../imges/login-img/logo.png")} alt="logo" />
                </div>
                <div className={styles.authBox}>
                    <button 
                        className={`${styles.authBtn} ${isLoading ? styles.loading : ''}`} 
                        onClick={() => authBtnClickHandler('kakao')}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <img className={styles.authImg} src={require("../../imges/login-img/kakao.png")} alt="kakao" />
                                <span>로그인 중...</span>
                            </>
                        ) : (
                            <>
                                <img className={styles.authImg} src={require("../../imges/login-img/kakao.png")} alt="kakao" />
                                <span>카카오로 계속하기</span>
                            </>
                        )}
                    </button>
                    <button 
                        className={styles.authBtn} 
                        onClick={() => authBtnClickHandler('guest')}
                        disabled={isLoading}
                    >
                        <span>Guest로 계속하기</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Main;