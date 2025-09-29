import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
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
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const maxConnectionAttempts = 3;
    
    // STOMP 클라이언트 참조
    const stompClientRef = useRef(null);
    const subscriptionRef = useRef(null);
    
    // 서버 환경에 따른 WebSocket URL 설정
    const ROOT_API_DOMAIN = process.env.REACT_APP_API_URL || 'https://pinpal.co.kr';
    
    // STOMP WebSocket URL 설정 (SockJS 사용)
    const getStompWebSocketUrl = () => {
        if (!gameId) return null;
        
        // SockJS는 HTTP/HTTPS URL 사용
        const stompUrl = `${ROOT_API_DOMAIN}/ws`;
        
        console.log('🔗 STOMP SockJS URL:', stompUrl);
        console.log('🔗 ROOT_API_DOMAIN:', ROOT_API_DOMAIN);
        console.log('🔗 gameId:', gameId);
        console.log('🔗 token:', token ? '있음' : '없음');
        
        return stompUrl;
    };
    
    const stompUrl = getStompWebSocketUrl();

    // STOMP 클라이언트 연결 함수
    const connectStomp = useCallback(() => {
        if (!gameId || !token || !stompUrl) {
            console.log('❌ STOMP 연결 조건이 충족되지 않음:', { gameId, token: !!token, stompUrl });
            return;
        }

        if (stompClientRef.current && stompClientRef.current.connected) {
            console.log('✅ STOMP 클라이언트가 이미 연결되어 있습니다.');
            return;
        }

        console.log(`🔗 STOMP 연결 시도 ${connectionAttempts + 1}/${maxConnectionAttempts}`);

        // STOMP 클라이언트 생성 (SockJS 사용)
        const client = new Client({
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: (str) => {
                console.log('🔍 STOMP Debug:', str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            // SockJS 사용 설정
            webSocketFactory: () => {
                // SockJS를 사용하여 연결 (토큰을 쿼리 파라미터로 전달)
                const sockJsUrl = token ? `${stompUrl}?token=${token}` : stompUrl;
                console.log('🔗 SockJS 연결 URL:', sockJsUrl);
                
                const sockJs = new SockJS(sockJsUrl, null, {
                    // Nginx 설정 수정 후 모든 전송 방식 활성화
                    transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
                    timeout: 10000, // 10초 타임아웃
                    sessionId: () => Math.random().toString(36).substring(2, 15) // 세션 ID 생성
                });
                
                // SockJS 이벤트 리스너 추가
                sockJs.onopen = () => {
                    console.log('✅ SockJS 연결 성공');
                };
                
                sockJs.onclose = (event) => {
                    console.log('❌ SockJS 연결 종료:', event);
                };
                
                sockJs.onerror = (error) => {
                    console.error('❌ SockJS 연결 오류:', error);
                    console.log('연결이 안 돼');
                };
                
                return sockJs;
            }
        });

        // 연결 성공 시
        client.onConnect = (frame) => {
            console.log('✅ STOMP 연결 성공:', frame);
            setConnectionStatus('connected');
            setConnectionAttempts(0);

            // 스코어보드 구독
            if (gameId) {
                const subscription = client.subscribe(`/sub/scoreboard/${gameId}`, (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        console.log('📨 STOMP 메시지 수신:', data);
                        
                        // 등록된 핸들러들에게 메시지 전달
                        messageHandlers.forEach(handler => {
                            try {
                                handler(data, message);
                            } catch (error) {
                                console.error('메시지 핸들러 에러:', error);
                            }
                        });
                    } catch (error) {
                        console.error('STOMP 메시지 파싱 에러:', error);
                    }
                });
                
                subscriptionRef.current = subscription;
                console.log(`📡 스코어보드 구독 완료: /sub/scoreboard/${gameId}`);
                
                // 초기 데이터 요청
                requestInitialData();
            }
        };

        // 연결 실패 시
        client.onStompError = (frame) => {
            console.error('❌ STOMP 연결 에러:', frame);
            setConnectionStatus('error');
            
            if (connectionAttempts < maxConnectionAttempts) {
                console.log(`🔄 ${3000 * (connectionAttempts + 1)}ms 후 재연결 시도...`);
                setTimeout(() => {
                    setConnectionAttempts(prev => prev + 1);
                }, 3000 * (connectionAttempts + 1)); // 지수 백오프
            } else {
                console.error('❌ 최대 재연결 시도 횟수 초과');
            }
        };

        // 연결 해제 시
        client.onDisconnect = () => {
            console.log('🔌 STOMP 연결 해제');
            setConnectionStatus('disconnected');
        };

        // 클라이언트 활성화
        client.activate();
        stompClientRef.current = client;
    }, [gameId, token, stompUrl, connectionAttempts, maxConnectionAttempts, messageHandlers]);

    // STOMP 연결 시도 (gameId나 token 변경 시)
    useEffect(() => {
        if (gameId && token) {
            const timer = setTimeout(connectStomp, 500);
            return () => clearTimeout(timer);
        }
    }, [gameId, token, connectStomp]);

    // 토큰 변경 시 연결 상태 초기화
    useEffect(() => {
        if (token) {
            console.log('🔐 토큰 변경 감지, STOMP 연결 상태 초기화');
            disconnectStomp();
            setConnectionStatus('disconnected');
            setConnectionAttempts(0);
        }
    }, [token]);

    // STOMP 연결 해제 함수
    const disconnectStomp = useCallback(() => {
        if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
            console.log('📡 STOMP 구독 해제');
        }
        
        if (stompClientRef.current && stompClientRef.current.connected) {
            stompClientRef.current.deactivate();
            console.log('🔌 STOMP 연결 해제');
        }
        
        stompClientRef.current = null;
        setConnectionStatus('disconnected');
    }, []);

    // STOMP 메시지 전송 함수
    const sendStompMessage = useCallback((destination, message) => {
        if (!stompClientRef.current || !stompClientRef.current.connected) {
            console.error('❌ STOMP 클라이언트가 연결되지 않았습니다.');
            return false;
        }
        
        try {
            stompClientRef.current.publish({
                destination: destination,
                body: JSON.stringify(message)
            });
            console.log('📤 STOMP 메시지 전송:', { destination, message });
            return true;
        } catch (error) {
            console.error('❌ STOMP 메시지 전송 실패:', error);
            return false;
        }
    }, []);

    // 초기 데이터 요청
    const requestInitialData = useCallback(() => {
        if (!gameId || !stompClientRef.current || !stompClientRef.current.connected) {
            console.log('❌ 초기 데이터 요청 조건이 충족되지 않음:', { 
                gameId, 
                connected: stompClientRef.current?.connected 
            });
            return;
        }

        const requestMessage = {
            gameId: gameId,
            timestamp: Date.now()
        };

        const success = sendStompMessage('/pub/requestInitialData', requestMessage);
        if (success) {
            console.log('📤 초기 데이터 요청 전송:', requestMessage);
        } else {
            console.error('❌ 초기 데이터 요청 전송 실패');
        }
    }, [gameId, sendStompMessage]);

    // 인증된 메시지 전송 (STOMP 방식)
    const sendAuthenticatedMessage = useCallback((message) => {
        if (!token) {
            console.error('❌ 토큰이 없어서 메시지를 전송할 수 없습니다.');
            return false;
        }
        
        // 메시지에 토큰 정보 추가
        const authenticatedMessage = {
            ...message,
            token: token,
            timestamp: Date.now()
        };
        
        // STOMP destination 결정
        let destination = '/pub/';
        if (message.action) {
            switch (message.action) {
                case 'updateTeamNumber':
                    destination = '/pub/updateTeam';
                    break;
                case 'updateTeam':
                    destination = '/pub/updateTeam';
                    break;
                case 'updateGrade':
                    destination = '/pub/updateGrade';
                    break;
                case 'updateScore':
                    destination = '/pub/updateScore';
                    break;
                case 'joinSide':
                    destination = '/pub/joinSide';
                    break;
                case 'updateSide':
                    destination = '/pub/joinSide';
                    break;
                case 'confirm':
                    destination = '/pub/confirm';
                    break;
                case 'updateConfirm':
                    destination = '/pub/confirm';
                    break;
                case 'scoreCounting':
                    destination = '/pub/scoreCounting';
                    break;
                case 'updateScoreCounting':
                    destination = '/pub/scoreCounting';
                    break;
                case 'startCardDraw':
                    destination = '/pub/startCardDraw';
                    break;
                case 'selectCard':
                    destination = '/pub/selectCard';
                    break;
                case 'resetCardDraw':
                    destination = '/pub/resetCardDraw';
                    break;
                case 'updateAvg':
                    destination = '/pub/updateAvg';
                    break;
                default:
                    destination = '/pub/default';
            }
        }
        
        console.log('🔐 인증된 STOMP 메시지 전송:', { destination, message: authenticatedMessage });
        return sendStompMessage(destination, authenticatedMessage);
    }, [token, sendStompMessage]);

    // STOMP 연결 상태 확인
    const isConnected = stompClientRef.current && stompClientRef.current.connected;

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

    // 컴포넌트 언마운트 시 STOMP 연결 정리
    useEffect(() => {
        return () => {
            disconnectStomp();
        };
    }, [disconnectStomp]);

    const value = {
        isConnected,
        connectionStatus,
        sendMessage: sendStompMessage,
        sendAuthenticatedMessage,
        connect: connectStomp,
        disconnect: disconnectStomp,
        addMessageHandler,
        removeMessageHandler,
        requestInitialData,
        token
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};
