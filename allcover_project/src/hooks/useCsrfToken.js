import { useState, useEffect, useCallback } from 'react';
import axios, { setCsrfToken as setAxiosCsrfToken } from '../apis/requestInterceptor';

// 서버 환경에 따른 API 도메인 설정
const ROOT_API_DOMAIN = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const useCsrfToken = () => {
    const [csrfToken, setCsrfToken] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchCsrfToken = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            // CSRF 토큰 요청 (Spring Security가 자동으로 쿠키에 설정)
            await axios.get(`${ROOT_API_DOMAIN}/api/auth/csrf-token`, {
                withCredentials: true // 쿠키 포함
            });
            
            // 쿠키에서 CSRF 토큰 읽기
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('XSRF-TOKEN='))
                ?.split('=')[1];
            
            if (token) {
                setCsrfToken(token); // 로컬 상태 설정
                setAxiosCsrfToken(token); // axios 인터셉터에 설정
                console.log('✅ CSRF 토큰 획득 (쿠키에서):', token);
            } else {
                console.warn('⚠️ CSRF 토큰을 쿠키에서 찾을 수 없습니다');
            }
        } catch (err) {
            console.error('❌ CSRF 토큰 획득 실패:', err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshCsrfToken = useCallback(() => {
        return fetchCsrfToken();
    }, [fetchCsrfToken]);

    // CSRF 토큰이 변경될 때마다 axios 인터셉터에 설정
    useEffect(() => {
        if (csrfToken) {
            setAxiosCsrfToken(csrfToken);
        }
    }, [csrfToken]);

    useEffect(() => {
        fetchCsrfToken();
    }, [fetchCsrfToken]);

    return {
        csrfToken,
        isLoading,
        error,
        refreshCsrfToken
    };
};

export default useCsrfToken;
