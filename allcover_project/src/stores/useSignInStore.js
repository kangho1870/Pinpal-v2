import { create } from "zustand";

const useSignInStore = create((set) => ({
  isLoggedIn: false,
  signInUser: null, // 초기 상태: 로그인 사용자 없음
  
  login: (signInUser) =>
    set({
      isLoggedIn: true,
      signInUser,
    }), // 사용자 상태 업데이트
    
  updateUserInfo: (userInfo) =>
    set((state) => ({
      ...state,
      signInUser: { ...state.signInUser, ...userInfo },
    })), // 사용자 정보 부분 업데이트
    
  logOut: () =>
    set({
      isLoggedIn: false,
      signInUser: null,
    }),
}));

export default useSignInStore;