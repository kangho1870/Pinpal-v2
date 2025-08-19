import React, { useState } from 'react';
import { useClub } from '../hooks/useClub';

const ClubJoinExample = ({ clubId }) => {
  const { joinClub, loading, error, clearError } = useClub();
  const [successMessage, setSuccessMessage] = useState('');

  const handleJoinClub = async () => {
    try {
      clearError();
      setSuccessMessage('');
      
      const newMember = await joinClub(clubId);
      setSuccessMessage('클럽 가입이 완료되었습니다!');
      
      console.log('새로 가입한 멤버:', newMember);
      
      // 성공 후 추가 작업 (예: 페이지 이동, 모달 닫기 등)
      
    } catch (err) {
      console.error('클럽 가입 실패:', err);
      // 에러는 useClub 훅에서 자동으로 처리됨
    }
  };

  return (
    <div className="club-join-example">
      <h3>클럽 가입</h3>
      
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="success-message" style={{ color: 'green', marginBottom: '10px' }}>
          {successMessage}
        </div>
      )}
      
      <button 
        onClick={handleJoinClub} 
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '가입 중...' : '클럽 가입하기'}
      </button>
    </div>
  );
};

export default ClubJoinExample;
