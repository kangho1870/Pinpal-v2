import { useState, useCallback } from 'react';

// 중복 요청 처리를 위한 커스텀 훅
export const useDuplicateRequestHandler = () => {
    const [loadingStates, setLoadingStates] = useState({});
    const [duplicateRequestCount, setDuplicateRequestCount] = useState({});

    // 로딩 상태 설정
    const setLoading = useCallback((key, isLoading) => {
        setLoadingStates(prev => ({ ...prev, [key]: isLoading }));
    }, []);

    // 중복 요청 카운트 증가
    const incrementDuplicateCount = useCallback((key) => {
        setDuplicateRequestCount(prev => {
            const currentCount = prev[key] || 0;
            return { ...prev, [key]: currentCount + 1 };
        });
    }, []);

    // 중복 요청 카운트 리셋
    const resetDuplicateCount = useCallback((key) => {
        setDuplicateRequestCount(prev => {
            const newState = { ...prev };
            delete newState[key];
            return newState;
        });
    }, []);

    // API 요청 래퍼 함수
    const handleApiRequest = useCallback(async (requestKey, apiCall, options = {}) => {
        const {
            showDuplicateAlert = true, // 중복 요청 시 알림 표시 여부
            duplicateMessage = '이미 진행 중인 요청입니다.', // 중복 요청 메시지
            onSuccess, // 성공 콜백
            onError, // 에러 콜백
            onDuplicate // 중복 요청 콜백
        } = options;

        try {
            // 로딩 상태 시작
            setLoading(requestKey, true);
            
            const result = await apiCall();
            
            // 중복 요청인 경우
            if (result.code === 'DUPLICATE_REQUEST') {
                incrementDuplicateCount(requestKey);
                
                if (showDuplicateAlert) {
                    // 중복 요청 횟수에 따라 다른 메시지 표시
                    const count = duplicateRequestCount[requestKey] || 1;
                    if (count === 1) {
                        alert(duplicateMessage);
                    } else if (count === 2) {
                        alert('잠시만 기다려주세요. 요청이 처리 중입니다.');
                    }
                    // 3번 이상은 조용히 무시
                }
                
                if (onDuplicate) {
                    onDuplicate(result);
                }
                
                return result;
            }
            
            // 중복 요청이 아닌 경우 카운트 리셋
            resetDuplicateCount(requestKey);
            
            // 성공 처리
            if (onSuccess) {
                onSuccess(result);
            }
            
            return result;
            
        } catch (error) {
            console.error('API 요청 오류:', error);
            
            if (onError) {
                onError(error);
            }
            
            throw error;
        } finally {
            // 로딩 상태 종료
            setLoading(requestKey, false);
        }
    }, [setLoading, incrementDuplicateCount, resetDuplicateCount, duplicateRequestCount]);

    return {
        loadingStates,
        duplicateRequestCount,
        setLoading,
        handleApiRequest,
        incrementDuplicateCount,
        resetDuplicateCount
    };
};
