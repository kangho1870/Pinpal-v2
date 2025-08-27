import axios from 'axios';

// 진행 중인 요청을 추적하는 Map
const pendingRequests = new Map();

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
    
    return `${method?.toUpperCase() || 'GET'}:${url}${sortedParams ? `?${sortedParams}` : ''}${requestData ? `:${requestData}` : ''}`;
};

// 요청 인터셉터 - 중복 요청 방지
axios.interceptors.request.use(
    (config) => {
        const requestKey = generateRequestKey(config);
        
        // 이미 진행 중인 동일한 요청이 있는지 확인
        if (pendingRequests.has(requestKey)) {
            console.log('🚫 중복 요청 방지:', requestKey);
            
            // 중복 요청인 경우 Promise.reject로 요청 취소
            const error = new Error('중복 요청이 감지되었습니다.');
            error.isDuplicateRequest = true;
            error.requestKey = requestKey;
            return Promise.reject(error);
        }
        
        // 새로운 요청을 pendingRequests에 추가
        pendingRequests.set(requestKey, true);
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
                    message: '이미 진행 중인 요청입니다.' 
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

// 현재 진행 중인 요청 목록을 확인하는 함수 (디버깅용)
export const getPendingRequests = () => {
    return Array.from(pendingRequests.keys());
};

export default axios;
