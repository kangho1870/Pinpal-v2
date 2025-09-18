import { create } from "zustand";

const useScoreboardStore = create(
    (set, get) => ({
      // 멤버 관련 상태
      members: [],
      
      // 모달 상태
      gradeModal: false,
      teamModal: false,
      confirmModal: false,
      sideJoinUserModal: false,
      sideRankingModal: false,
      scoreInputModal: false,
      
      // 페이지 및 네비게이션
      page: 0,
      navTitle: ['대기실', '점수표', '팀전', '시상'],
      
      // 팀 관련 상태
      team1stMember: {},
      
      // 핸디캡 관련 상태
      femaleHandicap: 0,
      
      // 카드뽑기 관련 상태
      cardDrawData: null,
      selectedCards: {},
      showCardDrawModal: false,
      
      // 멤버 관리
      setMembers: (members) => {
        set({ members });
      },
      addMember: (newMember) => set((state) => ({ 
        members: [...state.members, newMember] 
      })),
      updateMember: (memberId, updatedMember) => set((state) => ({
        members: state.members.map(member => 
          member.id === memberId || member.memberId === memberId ? updatedMember : member
        )
      })),
      
      // 특정 사용자의 팀 번호만 업데이트 (STOMP 방식)
      updateMemberTeamNumber: (userId, teamNumber) => set((state) => {
        const updatedMembers = state.members.map(member => {
          if (member.memberId === userId) {
            return { ...member, teamNumber };
          }
          return member;
        });
        return { members: updatedMembers };
      }),
      
      // 여러 사용자의 팀 번호를 배치로 업데이트
      batchUpdateMemberTeamNumbers: (updates) => set((state) => {
        const updatedMembers = state.members.map(member => {
          // 해당 사용자의 업데이트 정보 찾기
          const update = updates.find(u => u.userId === member.memberId);
          if (update) {
            return { ...member, teamNumber: update.teamNumber };
          }
          return member;
        });
        return { members: updatedMembers };
      }),
      
      // 모든 멤버의 팀 번호를 0으로 초기화
      resetAllTeamNumbers: () => set((state) => {
        const updatedMembers = state.members.map(member => ({
          ...member,
          teamNumber: 0
        }));
        return { members: updatedMembers };
      }),
      
      // 여러 사용자의 등급을 배치로 업데이트
      batchUpdateMemberGrades: (updates) => set((state) => {
        const updatedMembers = state.members.map(member => {
          // 해당 사용자의 업데이트 정보 찾기
          const update = updates.find(u => u.userId === member.memberId);
          if (update) {
            return { ...member, grade: update.grade };
          }
          return member;
        });
        return { members: updatedMembers };
      }),
      
      // 특정 사용자의 점수 업데이트
      updateMemberScore: (userId, score1, score2, score3, score4) => set((state) => {
        const updatedMembers = state.members.map(member => {
          if (member.memberId === userId) {
            return { 
              ...member, 
              game1: score1, 
              game2: score2, 
              game3: score3, 
              game4: score4 
            };
          }
          return member;
        });
        return { members: updatedMembers };
      }),
      
      // 특정 사용자의 사이드 게임 상태 업데이트
      updateMemberSideStatus: (userId, sideType) => set((state) => {
        const updatedMembers = state.members.map(member => {
          if (member.memberId === userId) {
            let updatedMember = { ...member };
            if (sideType === 'grade1') {
              updatedMember.sideGrade1 = !member.sideGrade1;
            } else if (sideType === 'avg') {
              updatedMember.sideAvg = !member.sideAvg;
            }
            return updatedMember;
          }
          return member;
        });
        return { members: updatedMembers };
      }),
      
      // 특정 사용자의 참석 확정 상태 업데이트
      updateMemberConfirmedStatus: (userId, confirmed) => set((state) => {
        const updatedMembers = state.members.map(member => {
          if (member.memberId === userId) {
            return { ...member, confirmedJoin: confirmed };
          }
          return member;
        });
        return { members: updatedMembers };
      }),
      removeMember: (memberId) => set((state) => ({
        members: state.members.filter(member => 
          member.id !== memberId && member.memberId !== memberId
        )
      })),
      clearMembers: () => set({ members: [] }),
      resetMembers: () => set({ members: [] }),
      
      // 모달 토글
      toggleGradeModal: () => set((state) => ({ gradeModal: !state.gradeModal })),
      toggleTeamModal: () => set((state) => ({ teamModal: !state.teamModal })),
      toggleConfirmModal: () => set((state) => ({ confirmModal: !state.confirmModal })),
      toggleSideJoinUserModal: () => set((state) => ({ sideJoinUserModal: !state.sideJoinUserModal })),
      toggleSideRankingModal: () => set((state) => ({ sideRankingModal: !state.sideRankingModal })),
      toggleScoreInputModal: () => set((state) => ({ scoreInputModal: !state.scoreInputModal })),
      
      // 페이지 관리
      setPage: (index) => set({ page: index }),
      
      // 팀 관리
      setTeam1stMember: (data) => set({ team1stMember: data }),
      
      // 핸디캡 관리
      setFemaleHandicap: (handicap) => set({ femaleHandicap: handicap }),
      
      // 카드뽑기 관련 액션
      setCardDrawData: (cardDrawData) => {
        set({ cardDrawData });
      },
      
      setSelectedCards: (selectedCards) => {
        set({ selectedCards });
      },
      
      setShowCardDrawModal: (show) => {
        set({ showCardDrawModal: show });
      },
      
      // 스코어보드 초기화
      resetScoreboard: () => set({
        members: [],
        gradeModal: false,
        teamModal: false,
        confirmModal: false,
        sideJoinUserModal: false,
        sideRankingModal: false,
        scoreInputModal: false,
        page: 0,
        team1stMember: {},
        femaleHandicap: 0,
        cardDrawData: null,
        selectedCards: {},
        showCardDrawModal: false
      }),
      
      // 전체 초기화
      reset: () => set({
        members: [],
        gradeModal: false,
        teamModal: false,
        confirmModal: false,
        sideJoinUserModal: false,
        sideRankingModal: false,
        scoreInputModal: false,
        page: 0,
        navTitle: ['대기실', '점수표', '팀전', '시상'],
        team1stMember: {},
        femaleHandicap: 0
      }),
    })
  );

export default useScoreboardStore;
