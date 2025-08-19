import { create } from "zustand";

const useClubStore = create(
    (set, get) => ({
      // 클럽 관련 상태
      clubs: [],
      currentClub: null,
      members: [],
      ceremonys: [],
      games: [],
      page: 1,
      
      // 클럽 목록 관리
      setClubs: (clubs) => set({ clubs }),
      addClub: (newClub) => set((state) => ({ 
        clubs: [...state.clubs, newClub] 
      })),
      updateClub: (clubId, updatedClub) => set((state) => ({
        clubs: state.clubs.map(club => 
          club.id === clubId ? updatedClub : club
        ),
        currentClub: state.currentClub?.id === clubId ? updatedClub : state.currentClub
      })),
      
      // 현재 클럽 관리
      setCurrentClub: (club) => set({ currentClub: club }),
      
      // 멤버 관리
      setMembers: (members) => set({ members }),
      addMember: (newMember) => set((state) => ({ 
        members: [...state.members, newMember] 
      })),
      updateMember: (memberId, updatedMember) => set((state) => ({
        members: state.members.map(member => 
          member.id === memberId ? updatedMember : member
        )
      })),
      removeMember: (memberId) => set((state) => ({
        members: state.members.filter(member => member.id !== memberId)
      })),
      
      // 행사 관리
      setCeremonys: (ceremonys) => set({ ceremonys }),
      addCeremony: (newCeremony) => set((state) => ({ 
        ceremonys: [...state.ceremonys, newCeremony] 
      })),
      
      // 게임 관리
      setGames: (games) => set({ games }),
      addGame: (newGame) => set((state) => ({ 
        games: [...state.games, newGame] 
      })),
      updateGame: (gameId, updatedGame) => set((state) => ({
        games: state.games.map(game => 
          game.id === gameId ? updatedGame : game
        )
      })),
      
      // 페이지 관리
      setPage: (page) => set({ page }),
      
      // 클럽 초기화
      resetClub: () => set({ 
        currentClub: null, 
        members: [], 
        ceremonys: [], 
        games: [] 
      }),
      
      // 전체 초기화
      reset: () => set({ 
        clubs: [], 
        currentClub: null, 
        members: [], 
        ceremonys: [], 
        games: [], 
        page: 1 
      }),
    })
  );

export default useClubStore;
