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
    // nginx WebSocket 프록시를 통한 연결
    const wsUrl = gameId ? `${ROOT_API_DOMAIN.replace('https', 'wss')}/scoreboard/${gameId}` : null;

    // 서버 상태 확인 함수 (메모이제이션)
    const checkServerStatus = useCallback(async () => {
        try {
            await fetch(`${ROOT_API_DOMAIN}/actuator/health`, {
                method: 'GET',
                mode: 'no-cors'
            });
            return true;
        } catch (error) {
            return false;
        }
    }, [ROOT_API_DOMAIN]);

    // WebSocket 연결 시도 (메모이제이션)
    const attemptConnection = useCallback(async () => {
        if (gameId && token && connectionAttempts < maxConnectionAttempts) {
            console.log(`WebSocket 연결 시도 ${connectionAttempts + 1}/${maxConnectionAttempts}`);
            
            const isServerReady = await checkServerStatus();
            
            if (isServerReady) {
                console.log('✅ 서버가 준비되었습니다. WebSocket 연결을 시작합니다.');
                setShouldConnect(true);
            } else {
                console.log('⏳ 서버가 아직 준비되지 않았습니다. 3초 후 다시 시도합니다.');
                setTimeout(() => {
                    setConnectionAttempts(prev => prev + 1);
                }, 3000);
            }
        }
    }, [gameId, token, connectionAttempts, maxConnectionAttempts, checkServerStatus]);

    // WebSocket 연결 시도 (한 번만 실행)
    useEffect(() => {
        if (gameId && token && !shouldConnect) {
            const timer = setTimeout(attemptConnection, 2000);
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
