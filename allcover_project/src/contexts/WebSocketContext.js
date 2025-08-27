import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import { useCookies } from 'react-cookie';
import { ACCESS_TOKEN } from '../constants';

const WebSocketContext = createContext();

export const useWebSocketContext = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocketContext must be used within a WebSocketProvider');
    }
    return context;
};

export const WebSocketProvider = ({ children, gameId }) => {
    const [messageHandlers, setMessageHandlers] = useState(new Set());
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [cookies] = useCookies();
    const token = cookies[ACCESS_TOKEN];
    const [shouldConnect, setShouldConnect] = useState(false);
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const maxConnectionAttempts = 3;
    
    // 서버 환경에 따른 WebSocket URL 설정
    const ROOT_API_DOMAIN = process.env.REACT_APP_API_URL || 'https://pinpal.co.kr';
    
    // WebSocket URL 설정 (nginx 프록시 우선, 실패 시 직접 연결)
    const getWebSocketUrl = () => {
        if (!gameId) return null;
        
        // nginx WebSocket 프록시를 통한 연결 (우선 시도)
        const nginxWsUrl = `${ROOT_API_DOMAIN.replace('https', 'wss')}/scoreboard/${gameId}`;
        
        // 직접 포트 연결 (fallback)
        const directWsUrl = `ws://pinpal.co.kr:8000/scoreboard/${gameId}`;
        
        console.log('🔗 nginx WebSocket URL:', nginxWsUrl);
        console.log('🔗 직접 연결 URL:', directWsUrl);
        
        return nginxWsUrl;
    };
    
    const wsUrl = getWebSocketUrl();
    
    // WebSocket URL 디버깅
    console.log('🔗 WebSocket URL:', wsUrl);
    console.log('🔗 ROOT_API_DOMAIN:', ROOT_API_DOMAIN);
    console.log('🔗 gameId:', gameId);
    console.log('🔗 token:', token ? '있음' : '없음');

    // 서버 상태 확인 함수 (메모이제이션)
    const checkServerStatus = useCallback(async () => {
        try {
            console.log('🏥 서버 상태 확인 중:', `${ROOT_API_DOMAIN}/actuator/health`);
            const response = await fetch(`${ROOT_API_DOMAIN}/actuator/health`, {
                method: 'GET',
                mode: 'no-cors'
            });
            console.log('🏥 서버 상태 응답:', response.status, response.statusText);
            return true;
        } catch (error) {
            console.log('🏥 서버 상태 확인 실패:', error);
            return false;
        }
    }, [ROOT_API_DOMAIN]);

    // WebSocket 연결 시도 (메모이제이션)
    const attemptConnection = useCallback(async () => {
        if (gameId && token && connectionAttempts < maxConnectionAttempts) {
            console.log(`WebSocket 연결 시도 ${connectionAttempts + 1}/${maxConnectionAttempts}`);
            
            // 서버 상태 확인을 우회하고 바로 WebSocket 연결 시도
            console.log('🚀 서버 상태 확인 우회하고 WebSocket 연결을 시작합니다.');
            setShouldConnect(true);
            
            // 기존 서버 상태 확인 로직 (참고용)
            // const isServerReady = await checkServerStatus();
            // if (isServerReady) {
            //     console.log('✅ 서버가 준비되었습니다. WebSocket 연결을 시작합니다.');
            //     setShouldConnect(true);
            // } else {
            //     console.log('⏳ 서버가 아직 준비되지 않았습니다. 3초 후 다시 시도합니다.');
            //     setTimeout(() => {
            //         setConnectionAttempts(prev => prev + 1);
            //     }, 3000);
            // }
        }
    }, [gameId, token, connectionAttempts, maxConnectionAttempts]);

    // WebSocket 연결 시도 (한 번만 실행)
    useEffect(() => {
        if (gameId && token && !shouldConnect) {
            const timer = setTimeout(attemptConnection, 500); // 2초 → 0.5초로 단축
            return () => clearTimeout(timer);
        }
    }, [gameId, token, shouldConnect, attemptConnection]);

    // 메시지 핸들러 (메모이제이션)
    const handleMessage = useCallback((data, event) => {
        messageHandlers.forEach(handler => {
            try {
                handler(data, event);
            } catch (error) {
                console.error('메시지 핸들러 에러:', error);
            }
        });
    }, [messageHandlers]);

    // WebSocket 훅 사용
    const { 
        isConnected, 
        sendMessage, 
        connect, 
        disconnect 
    } = useWebSocket(shouldConnect ? wsUrl : null, {
        onMessage: handleMessage,
        onOpen: useCallback(() => {
            setConnectionStatus('connected');
            console.log('🎉 WebSocket 컨텍스트 연결 성공');
        }, []),
        onClose: useCallback(() => {
            setConnectionStatus('disconnected');
            console.log('🔌 WebSocket 컨텍스트 연결 종료');
        }, []),
        onError: useCallback(() => {
            setConnectionStatus('error');
            console.log('❌ WebSocket 컨텍스트 연결 에러');
        }, []),
        reconnectInterval: 3000,
        maxReconnectAttempts: 2,
        shouldReconnect: connectionAttempts < maxConnectionAttempts,
        token: token
    });

    // 메시지 핸들러 추가/제거 (메모이제이션)
    const addMessageHandler = useCallback((handler) => {
        setMessageHandlers(prev => new Set(prev).add(handler));
    }, []);

    const removeMessageHandler = useCallback((handler) => {
        setMessageHandlers(prev => {
            const newSet = new Set(prev);
            newSet.delete(handler);
            return newSet;
        });
    }, []);

    const value = {
        isConnected,
        connectionStatus,
        sendMessage,
        connect,
        disconnect,
        addMessageHandler,
        removeMessageHandler
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};
