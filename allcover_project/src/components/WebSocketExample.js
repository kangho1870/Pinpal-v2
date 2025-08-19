import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const WebSocketExample = ({ gameId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  
  // WebSocket 연결 (JWT 토큰은 자동으로 쿠키에서 가져옴)
  const { isConnected, connectionStatus, sendMessage } = useWebSocket(
    `ws://localhost:8000/ws/scoreboard/${gameId}`,
    {
      onMessage: (data) => {
        console.log('WebSocket 메시지 수신:', data);
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          type: 'received', 
          data, 
          timestamp: new Date().toLocaleTimeString() 
        }]);
      },
      onOpen: () => {
        console.log('WebSocket 연결됨');
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          type: 'system', 
          message: 'WebSocket 연결됨', 
          timestamp: new Date().toLocaleTimeString() 
        }]);
      },
      onClose: () => {
        console.log('WebSocket 연결 끊어짐');
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          type: 'system', 
          message: 'WebSocket 연결 끊어짐', 
          timestamp: new Date().toLocaleTimeString() 
        }]);
      },
      onError: (error) => {
        console.error('WebSocket 에러:', error);
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          type: 'error', 
          message: 'WebSocket 에러 발생', 
          timestamp: new Date().toLocaleTimeString() 
        }]);
      }
    }
  );

  const handleSendMessage = () => {
    if (inputMessage.trim() && isConnected) {
      const message = {
        type: 'CHAT',
        payload: {
          message: inputMessage,
          gameId: gameId,
          timestamp: new Date().toISOString()
        }
      };
      
      if (sendMessage(message)) {
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          type: 'sent', 
          data: message, 
          timestamp: new Date().toLocaleTimeString() 
        }]);
        setInputMessage('');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="websocket-example" style={{ padding: '20px' }}>
      <h3>WebSocket 실시간 채팅</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <span>연결 상태: </span>
        <span style={{ 
          color: isConnected ? 'green' : 'red',
          fontWeight: 'bold'
        }}>
          {connectionStatus}
        </span>
      </div>
      
      <div style={{ 
        height: '300px', 
        border: '1px solid #ccc', 
        overflowY: 'auto', 
        padding: '10px',
        marginBottom: '10px',
        backgroundColor: '#f9f9f9'
      }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: '5px' }}>
            <span style={{ color: '#666', fontSize: '12px' }}>
              {msg.timestamp}
            </span>
            <span style={{ 
              color: msg.type === 'sent' ? 'blue' : 
                     msg.type === 'received' ? 'green' : 
                     msg.type === 'error' ? 'red' : 'gray',
              fontWeight: msg.type === 'system' ? 'bold' : 'normal'
            }}>
              {msg.type === 'system' ? msg.message : 
               msg.type === 'error' ? msg.message :
               JSON.stringify(msg.data)}
            </span>
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="메시지를 입력하세요..."
          disabled={!isConnected}
          style={{
            flex: 1,
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!isConnected || !inputMessage.trim()}
          style={{
            padding: '8px 16px',
            backgroundColor: isConnected ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isConnected ? 'pointer' : 'not-allowed'
          }}
        >
          전송
        </button>
      </div>
    </div>
  );
};

export default WebSocketExample;
