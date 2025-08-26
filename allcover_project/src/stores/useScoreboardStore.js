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
      
      // 멤버 관리
      setMembers: (members) => {
        console.log('🔄 setMembers 호출:', members);
        console.log('🔄 이전 members:', get().members);
        set({ members });
        console.log('🔄 업데이트된 members:', get().members);
      },
      addMember: (newMember) => set((state) => ({ 
        members: [...state.members, newMember] 
      })),
      updateMember: (memberId, updatedMember) => set((state) => ({
        members: state.members.map(member => 
          member.id === memberId || member.memberId === memberId ? updatedMember : member
        )
      })),
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
        femaleHandicap: 0
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
