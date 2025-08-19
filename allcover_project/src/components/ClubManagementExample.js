import React, { useState, useEffect } from 'react';
import { useClub } from '../hooks/useClub';

const ClubManagementExample = () => {
  const { 
    fetchAllClubs, 
    createClub, 
    updateClubData, 
    deleteClub, 
    clubs, 
    loading, 
    error, 
    clearError 
  } = useClub();
  
  const [cursor, setCursor] = useState(new Date().toISOString());
  const [hasNext, setHasNext] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: ''
  });
  const [editingClub, setEditingClub] = useState(null);

  // 클럽 목록 로드
  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      clearError();
      const result = await fetchAllClubs(cursor);
      if (result) {
        setHasNext(result.hasNext);
        setCursor(result.nextCursor);
      }
    } catch (err) {
      console.error('클럽 목록 로드 실패:', err);
    }
  };

  // 클럽 생성
  const handleCreateClub = async (e) => {
    e.preventDefault();
    try {
      clearError();
      await createClub(formData);
      setFormData({ name: '', description: '', location: '' });
      loadClubs(); // 목록 새로고침
    } catch (err) {
      console.error('클럽 생성 실패:', err);
    }
  };

  // 클럽 수정
  const handleUpdateClub = async (e) => {
    e.preventDefault();
    try {
      clearError();
      await updateClubData(editingClub.id, formData);
      setEditingClub(null);
      setFormData({ name: '', description: '', location: '' });
      loadClubs(); // 목록 새로고침
    } catch (err) {
      console.error('클럽 수정 실패:', err);
    }
  };

  // 클럽 삭제
  const handleDeleteClub = async (clubId) => {
    if (window.confirm('정말로 이 클럽을 삭제하시겠습니까?')) {
      try {
        clearError();
        await deleteClub(clubId);
        loadClubs(); // 목록 새로고침
      } catch (err) {
        console.error('클럽 삭제 실패:', err);
      }
    }
  };

  // 수정 모드 시작
  const startEdit = (club) => {
    setEditingClub(club);
    setFormData({
      name: club.name || '',
      description: club.description || '',
      location: club.location || ''
    });
  };

  // 수정 모드 취소
  const cancelEdit = () => {
    setEditingClub(null);
    setFormData({ name: '', description: '', location: '' });
  };

  return (
    <div className="club-management-example" style={{ padding: '20px' }}>
      <h2>클럽 관리</h2>
      
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      
      {/* 클럽 생성/수정 폼 */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>{editingClub ? '클럽 수정' : '새 클럽 생성'}</h3>
        <form onSubmit={editingClub ? handleUpdateClub : handleCreateClub}>
          <div style={{ marginBottom: '10px' }}>
            <label>클럽명: </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{ width: '200px', padding: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>설명: </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ width: '300px', padding: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>위치: </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              style={{ width: '200px', padding: '5px' }}
            />
          </div>
          <div>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: loading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                marginRight: '10px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '처리 중...' : (editingClub ? '수정' : '생성')}
            </button>
            {editingClub && (
              <button 
                type="button" 
                onClick={cancelEdit}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* 클럽 목록 */}
      <div>
        <h3>클럽 목록</h3>
        {clubs.length === 0 ? (
          <p>등록된 클럽이 없습니다.</p>
        ) : (
          <div>
            {clubs.map((club) => (
              <div 
                key={club.id} 
                style={{ 
                  border: '1px solid #ddd', 
                  padding: '10px', 
                  marginBottom: '10px', 
                  borderRadius: '5px',
                  backgroundColor: editingClub?.id === club.id ? '#f8f9fa' : 'white'
                }}
              >
                <h4>{club.name}</h4>
                <p><strong>설명:</strong> {club.description || '설명 없음'}</p>
                <p><strong>위치:</strong> {club.location || '위치 없음'}</p>
                <p><strong>멤버 수:</strong> {club.memberCount || 0}명</p>
                <div style={{ marginTop: '10px' }}>
                  <button 
                    onClick={() => startEdit(club)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      marginRight: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    수정
                  </button>
                  <button 
                    onClick={() => handleDeleteClub(club.id)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
            
            {hasNext && (
              <button 
                onClick={loadClubs}
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
                {loading ? '로딩 중...' : '더 보기'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubManagementExample;

