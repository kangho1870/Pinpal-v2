import { useNavigate } from "react-router-dom";
import styles from "../css/routes/AddClub.module.css";
import { onClickBackBtn } from "../../hooks";
import { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import useSignInStore from "../../stores/useSignInStore";
import { addClubRequest } from "../../apis";
import { useCookies } from "react-cookie";
import { ACCESS_TOKEN, MY_CLUB_PATH, ROOT_PATH } from "../../constants";
import TextEditor from "../components/textEditor/TextEditor";

export default function AddClub() {
    const navigator = useNavigate();
    const { signInUser, updateUserInfo } = useSignInStore();
    const memberId = signInUser?.id || null;
    const [cookies] = useCookies();
    const token = cookies[ACCESS_TOKEN];
    const [place, setPlace] = useState("");
    const [clubName, setClubName] = useState("");
    const [clubDescription, setClubDescription] = useState("");

    // 세션 스토리지 정리 함수
    const clearOAuth2Session = () => {
        sessionStorage.removeItem('oauth2_request_in_progress');
        sessionStorage.removeItem('oauth2_processing');
        console.log('🔍 OAuth2 세션 스토리지 정리 완료');
    };

    // 컴포넌트 마운트 시 세션 스토리지 정리 및 사용자 정보 확인
    useEffect(() => {
        clearOAuth2Session();
        
        console.log('🔍 AddClub 컴포넌트 마운트');
        console.log('🔍 현재 사용자 정보:', signInUser);
        console.log('🔍 현재 토큰:', token);
        console.log('🔍 세션 스토리지 상태:', {
            oauth2_request_in_progress: sessionStorage.getItem('oauth2_request_in_progress'),
            oauth2_processing: sessionStorage.getItem('oauth2_processing')
        });
    }, [signInUser, token]);

    const handleEditorChange = (content) => {
        setClubDescription(content);
    };

    const addClubResponse = (responseBody) => {
        console.log('🔍 클럽 생성 응답:', responseBody);

        // responseBody가 null이거나 undefined인 경우 처리
        if (!responseBody) {
            alert('서버에 문제가 있습니다.');
            return;
        }

        // 백엔드에서 ClubRespDto를 직접 반환하는 경우 (HTTP 201 Created)
        if (responseBody.id && responseBody.name) {
            console.log('🔍 클럽 생성 성공:', responseBody);
            alert('클럽을 성공적으로 개설하였습니다.');
            
            // 클럽 생성 후 홈으로 이동하여 클럽 목록 새로고침
            navigator('/home');
            
            // 홈 페이지 로드 후 클럽 목록 새로고침
            setTimeout(() => {
                if (window.refreshClubList) {
                    window.refreshClubList();
                }
            }, 100);
            return;
        }

        // 기존 응답 구조 (code 필드가 있는 경우) - fallback
        const message = 
        responseBody.code === 'AF' ? '잘못된 접근입니다.' :
        responseBody.code === 'DBE' ? '서버에 문제가 있습니다.' :
        responseBody.code === 'SJC' ? '취소 처리되었습니다.' : 
        responseBody.code === 'SU' ? '클럽을 개설하였습니다.' : '알 수 없는 오류가 발생했습니다.';

        const isSuccessed = responseBody.code === 'SU' || responseBody.code === 'SJC';
        if (!isSuccessed) {
            alert(message);
            return;
        }
        
        // 클럽 생성 성공 시 사용자 정보 업데이트
        if (responseBody.code === 'SU') {
            const { id, clubId, clubRole, memberProfile } = responseBody;
            updateUserInfo({
                id,
                clubId,
                clubRole,
                memberProfile
            });
        }
        
        alert(message);
        navigator('/home');
    }

    const addClub = () => {
        // 필수 필드 검증
        if (!clubName.trim()) {
            alert('클럽 이름을 입력해주세요.');
            return;
        }
        
        // 사용자 정보 및 토큰 검증
        if (!signInUser || !memberId) {
            console.log('🔍 사용자 정보 확인:', { signInUser, memberId });
            alert('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
            navigator('/');
            return;
        }

        if (!token) {
            console.log('🔍 토큰 확인:', token);
            alert('로그인이 필요합니다.');
            navigator('/');
            return;
        }

        const dto = {
            place: place,
            clubName: clubName,
            clubDescription: clubDescription
        }
        console.log('🔍 클럽 생성 요청 데이터:', dto);
        console.log('🔍 현재 사용자 ID:', memberId);
        console.log('🔍 현재 사용자 정보:', signInUser);
        console.log('🔍 현재 토큰:', token);
        addClubRequest(dto, token).then(addClubResponse);
    }

    return (
        <>
            <div className={styles.container}>
                <div className={styles.top}>
                    <div className={styles.topCategory} onClick={() => onClickBackBtn(navigator)}><i class="fa-solid fa-chevron-left"></i></div>
                    <h5 className={styles.topCategoryTitle}>클럽 개설</h5>
                </div>
                <div className={styles.contents}>
                    <div className={styles.inputBox}>
                        <p>지역</p>
                        <input className={styles.inputText} onChange={(e) => setPlace(e.target.value)} placeholder="지역을 입력해 주세요." />
                    </div>
                    <div className={styles.inputBox}>
                        <p>클럽명</p>
                        <input className={styles.inputText} onChange={(e) => setClubName(e.target.value)} placeholder="클럽 이름" />
                    </div>
                    <div className={styles.inputBox}>
                        <p>클럽 소개</p>
                    </div>
                    <TextEditor handleEditorChange={handleEditorChange}></TextEditor>
                </div>
                <div className={styles.clubAddBtnBox}>
                    <button className={styles.clubAddBtn} onClick={addClub}>클럽 만들기</button>
                </div>
            </div>
        </>
    )
}
