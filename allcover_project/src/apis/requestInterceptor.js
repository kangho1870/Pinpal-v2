import axios from 'axios';

// 진행 중인 요청을 추적하는 Map (타임스탬프 포함)
const pendingRequests = new Map();

// 요청 타임아웃 (3초로 단축)
const REQUEST_TIMEOUT = 3000;

// 새로고침 감지 플래그
let isRefreshing = false;
let pageLoadTime = Date.now(); // 페이지 로드 시간

// 최소 요청 간격 (밀리초)
const MIN_REQUEST_INTERVAL = 100;

// 요청을 식별하는 고유 키 생성 함수
const generateRequestKey = (config) => {
    const { method, url, params, data } = config;
    
    // URL 파라미터를 정렬하여 일관된 키 생성
    const sortedParams = params ? Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&') : '';
    
    // 요청 본문을 문자열로 변환 (객체인 경우)
    const requestData = data ? (typeof data === 'object' ? JSON.stringify(data) : data) : '';
    
    // HTTP 메서드를 포함하여 더 정확한 키 생성
    return `${method?.toUpperCase() || 'GET'}:${url}${sortedParams ? `?${sortedParams}` : ''}${requestData ? `:${requestData}` : ''}`;
};

// 요청 인터셉터 - 중복 요청 방지
axios.interceptors.request.use(
    (config) => {
        const requestKey = generateRequestKey(config);
        const currentTime = Date.now();
        
        // 페이지 로드 후 2초 이내의 요청은 중복 요청 방지 비활성화
        if (currentTime - pageLoadTime < 2000) {
            console.log('🔄 페이지 로드 후 2초 이내 - 중복 요청 방지 비활성화:', requestKey);
            // 페이지 로드 직후에는 기존 요청을 제거하고 새로운 요청 허용
            pendingRequests.delete(requestKey);
            pendingRequests.set(requestKey, currentTime);
            console.log('📤 페이지 로드 직후 요청 시작:', requestKey);
            config.requestKey = requestKey;
            return config;
        }
        
        // 정상 상황에서만 중복 요청 방지 적용
        if (pendingRequests.has(requestKey)) {
            const requestTime = pendingRequests.get(requestKey);
            
            // 타임아웃된 요청인지 확인
            if (currentTime - requestTime > REQUEST_TIMEOUT) {
                console.log('⏰ 타임아웃된 요청 제거:', requestKey);
                pendingRequests.delete(requestKey);
            } else {
                // 특정 API 패턴에 대한 예외 처리
                const isMembersApi = config.url.includes('/members') && !config.url.includes('/export');
                const isGetRequest = config.method?.toUpperCase() === 'GET';
                
                // 멤버 목록 API의 GET 요청은 더 관대하게 처리
                if (isMembersApi && isGetRequest) {
                    console.log('✅ 멤버 목록 GET 요청 - 기존 요청 제거 후 새 요청 허용:', requestKey);
                    pendingRequests.delete(requestKey);
                } else {
                    // 최소 요청 간격 확인 (너무 빠른 연속 요청만 차단)
                    if (currentTime - requestTime < MIN_REQUEST_INTERVAL) {
                        console.log('🚫 너무 빠른 연속 요청 방지:', requestKey);
                        
                        // 중복 요청인 경우 Promise.reject로 요청 취소
                        const error = new Error('너무 빠른 연속 요청이 감지되었습니다.');
                        error.isDuplicateRequest = true;
                        error.requestKey = requestKey;
                        return Promise.reject(error);
                    } else {
                        // 최소 간격이 지났다면 기존 요청을 제거하고 새로운 요청 허용
                        console.log('✅ 최소 간격 지남 - 기존 요청 제거 후 새 요청 허용:', requestKey);
                        pendingRequests.delete(requestKey);
                    }
                }
            }
        }
        
        // 새로운 요청을 pendingRequests에 추가 (타임스탬프 포함)
        pendingRequests.set(requestKey, currentTime);
        console.log('📤 요청 시작:', requestKey);
        
        // config에 requestKey 추가 (응답 인터셉터에서 사용)
        config.requestKey = requestKey;
        
        return config;
    },
    (error) => {
        console.error('❌ 요청 인터셉터 에러:', error);
        return Promise.reject(error);
    }
);

// 응답 인터셉터 - 요청 완료 후 pendingRequests에서 제거
axios.interceptors.response.use(
    (response) => {
        const requestKey = response.config.requestKey;
        
        if (requestKey) {
            pendingRequests.delete(requestKey);
            console.log('✅ 요청 완료:', requestKey);
        }
        
        return response;
    },
    (error) => {
        const requestKey = error.config?.requestKey;
        
        if (requestKey) {
            pendingRequests.delete(requestKey);
            console.log('❌ 요청 실패:', requestKey);
        }
        
        // 중복 요청 에러인 경우 특별 처리
        if (error.isDuplicateRequest) {
            console.log('🔄 중복 요청 무시됨:', error.requestKey);
            // 중복 요청은 사용자에게 알리지 않고 조용히 무시
            return Promise.resolve({ 
                data: { 
                    code: 'DUPLICATE_REQUEST', 
                    message: '너무 빠른 연속 요청입니다. 잠시 후 다시 시도해주세요.' 
                } 
            });
        }
        
        return Promise.reject(error);
    }
);

// 수동으로 특정 요청을 pendingRequests에서 제거하는 함수
export const removePendingRequest = (requestKey) => {
    if (pendingRequests.has(requestKey)) {
        pendingRequests.delete(requestKey);
        console.log('🗑️ 수동으로 요청 제거:', requestKey);
    }
};

// 현재 진행 중인 모든 요청을 취소하는 함수
export const cancelAllPendingRequests = () => {
    const requestKeys = Array.from(pendingRequests.keys());
    requestKeys.forEach(key => {
        pendingRequests.delete(key);
    });
    console.log('🚫 모든 진행 중인 요청 취소됨:', requestKeys.length, '개');
};

// 새로고침 시 모든 요청을 정리하는 함수
export const clearAllPendingRequests = () => {
    const requestKeys = Array.from(pendingRequests.keys());
    requestKeys.forEach(key => {
        pendingRequests.delete(key);
    });
    console.log('🧹 새로고침으로 인한 모든 요청 정리됨:', requestKeys.length, '개');
};

// 페이지 언로드 시 모든 요청 정리
window.addEventListener('beforeunload', () => {
    clearAllPendingRequests();
});

// 페이지 숨김 시에도 정리 (모바일에서 앱 전환 시)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        clearAllPendingRequests();
    }
});

// 새로고침 감지 및 요청 정리
window.addEventListener('beforeunload', () => {
    console.log('🔄 페이지 언로드 감지 - 새로고침 상태 설정');
    isRefreshing = true;
    clearAllPendingRequests();
});

// 페이지 로드 시 새로고침 상태 초기화
window.addEventListener('load', () => {
    console.log('🔄 페이지 로드 감지 - 새로고침 상태 초기화');
    pageLoadTime = Date.now(); // 페이지 로드 시간 업데이트
    clearAllPendingRequests();
    isRefreshing = false;
});

// 페이지 숨김 시에도 새로고침 상태 설정 (모바일에서 앱 전환 시)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        console.log('🔄 페이지 숨김 감지 - 새로고침 상태 설정');
        isRefreshing = true;
        clearAllPendingRequests();
    }
});

// 주기적으로 타임아웃된 요청들을 정리 (10초마다)
setInterval(() => {
    const currentTime = Date.now();
    const timeoutKeys = [];
    
    pendingRequests.forEach((timestamp, key) => {
        if (currentTime - timestamp > REQUEST_TIMEOUT) {
            timeoutKeys.push(key);
        }
    });
    
    timeoutKeys.forEach(key => {
        pendingRequests.delete(key);
        console.log('⏰ 주기적 정리로 타임아웃 요청 제거:', key);
    });
    
    if (timeoutKeys.length > 0) {
        console.log('🧹 주기적 정리 완료:', timeoutKeys.length, '개 요청 제거');
    }
}, 10000);

// 현재 진행 중인 요청 목록을 확인하는 함수 (디버깅용)
export const getPendingRequests = () => {
    return Array.from(pendingRequests.keys());
};

export default axios;
