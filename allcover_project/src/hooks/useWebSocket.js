import { useEffect, useRef, useCallback, useState } from 'react';
import { useCookies } from 'react-cookie';

const useWebSocket = (url, options = {}) => {
    const [cookies] = useCookies(['accessToken']);
    const {
        onMessage,
        onOpen,
        onClose,
        onError,
        reconnectInterval = 3000,
        maxReconnectAttempts = 5,
        shouldReconnect = true,
        token = null
    } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    
    const socketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const isConnectingRef = useRef(false);
    const shouldConnectRef = useRef(true);
    const urlRef = useRef(url);
    const tokenRef = useRef(token || cookies.accessToken);
    const isInitialMountRef = useRef(true);

    const connect = useCallback(() => {
        if (isConnectingRef.current || !url || !shouldConnectRef.current) {
            console.log('🔗 WebSocket 연결 시도 중단:', { 
                isConnecting: isConnectingRef.current, 
                hasUrl: !!url, 
                shouldConnect: shouldConnectRef.current 
            });
            return;
        }
        
        isConnectingRef.current = true;
        setConnectionStatus('connecting');

        try {
            // JWT 토큰을 쿼리 파라미터로 전달
            const currentToken = token || cookies.accessToken;
            const wsUrl = currentToken ? `${url}?token=${currentToken}` : url;
            
            const socket = new WebSocket(wsUrl);
            socketRef.current = socket;

            socket.onopen = (event) => {
                console.log('✅ WebSocket 연결 성공:', url);
                setIsConnected(true);
                setConnectionStatus('connected');
                reconnectAttemptsRef.current = 0;
                isConnectingRef.current = false;
                onOpen?.(event);
            };

            socket.onclose = (event) => {
                console.log('🔌 WebSocket 연결 종료:', { 
                    code: event.code, 
                    reason: event.reason, 
                    wasClean: event.wasClean 
                });
                setIsConnected(false);
                setConnectionStatus('disconnected');
                isConnectingRef.current = false;
                onClose?.(event);

                if (shouldReconnect && shouldConnectRef.current && 
                    reconnectAttemptsRef.current < maxReconnectAttempts && 
                    event.code !== 1000) {
                    
                    reconnectAttemptsRef.current++;
                    console.log(`🔄 재연결 시도 ${reconnectAttemptsRef.current}/${maxReconnectAttempts} (${reconnectInterval}ms 후)`);
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        if (shouldConnectRef.current) {
                            connect();
                        }
                    }, reconnectInterval);
                } else if (event.code === 1000) {
                    console.log('✅ WebSocket 정상 종료');
                } else {
                    console.log('❌ WebSocket 재연결 중단');
                }
            };

            socket.onerror = (error) => {
                console.error('❌ WebSocket 에러:', {
                    error: error,
                    readyState: socket.readyState,
                    url: socket.url
                });
                setConnectionStatus('error');
                isConnectingRef.current = false;
                onError?.(error);
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    // 새로운 백엔드 메시지 구조에 맞춰 처리
                    if (data.type) {
                        // 메시지 타입별 처리
                        switch (data.type) {
                            case 'SCOREBOARD_UPDATE':
                                break;
                            case 'MEMBER_JOIN':
                                break;
                            case 'GAME_START':
                                break;
                            case 'GAME_END':
                                break;
                            case 'ERROR':
                                break;
                            default:
                        }
                    } else {
                        // 백엔드에서 직접 배열을 보내는 경우
                        console.log('📨 직접 데이터 수신:', data);
                    }
                    
                    onMessage?.(data, event);
                } catch (error) {
                    onMessage?.(event.data, event);
                }
            };

        } catch (error) {
            console.error('WebSocket 연결 생성 실패:', error);
            setConnectionStatus('error');
            isConnectingRef.current = false;
            onError?.(error);
        }
    }, [url, token, cookies.accessToken, onMessage, onOpen, onClose, onError, reconnectInterval, maxReconnectAttempts, shouldReconnect]);

    const disconnect = useCallback(() => {
        shouldConnectRef.current = false;
        
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (socketRef.current) {
            socketRef.current.close(1000, 'Manual disconnect');
            socketRef.current = null;
        }

        setIsConnected(false);
        setConnectionStatus('disconnected');
        reconnectAttemptsRef.current = 0;
        isConnectingRef.current = false;
    }, []);

    const sendMessage = useCallback((message) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            const messageString = typeof message === 'string' ? message : JSON.stringify(message);
            socketRef.current.send(messageString);
            return true;
        } else {
            console.warn('⚠️ WebSocket이 연결되지 않았습니다. 메시지를 보낼 수 없습니다.');
            return false;
        }
    }, []);

    // 컴포넌트 마운트 시 연결
    useEffect(() => {
        console.log('🔗 useWebSocket 마운트 - URL:', url);
        shouldConnectRef.current = true;
        
        if (url && isInitialMountRef.current) {
            isInitialMountRef.current = false;
            connect();
        }

        return () => {
            console.log('🔌 useWebSocket 언마운트');
            shouldConnectRef.current = false;
            disconnect();
        };
    }, [url, connect, disconnect]);

    // URL 또는 토큰 변경 시 재연결 (연결 중이 아닐 때만)
    useEffect(() => {
        if (url && !isInitialMountRef.current && !isConnectingRef.current) {
            const hasUrlChanged = urlRef.current !== url;
            const hasTokenChanged = tokenRef.current !== (token || cookies.accessToken);
            
            if (hasUrlChanged || hasTokenChanged) {
                console.log('🔗 URL 또는 토큰 변경으로 인한 재연결');
                urlRef.current = url;
                tokenRef.current = token || cookies.accessToken;
                
                disconnect();
                setTimeout(() => {
                    if (shouldConnectRef.current) {
                        connect();
                    }
                }, 100);
            }
        }
    }, [url, token, cookies.accessToken, connect, disconnect]);

    return {
        isConnected,
        connectionStatus,
        sendMessage,
        connect,
        disconnect,
        socket: socketRef.current
    };
};

export default useWebSocket;
