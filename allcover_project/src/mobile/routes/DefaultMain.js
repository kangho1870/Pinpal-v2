import { span } from "framer-motion/client";
import styles from "../css/routes/DefaultMain.module.css";
import { useEffect, useRef, useState, useCallback } from "react";
import AddClub from "./AddClub";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, CLUB_DETAIL_PATH } from "../../constants";
import { getClubList } from "../../apis";
import { useCookies } from "react-cookie";


function DefaultMain({ setLoading }) {
    const [clubList, setClubList] = useState([]);
    const [addClubModal, setAddClubModal] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [cookies] = useCookies();
    const token = cookies[ACCESS_TOKEN];
    const navigator = useNavigate();
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    
    const elementRef = useRef(null); 
    const observerRef = useRef(null);

    const goToClub = (clubId) => {
        navigator(`/club/${clubId}`);
    };

    const getClubListResponse = useCallback((responseBody) => {
        console.log('🔍 클럽 목록 응답:', responseBody);

        // responseBody가 null이거나 undefined인 경우 처리
        if (!responseBody) {
            alert('서버에 문제가 있습니다.');
            setIsLoading(false);
            setLoading(false);
            return;
        }

        // 백엔드 페이지네이션 응답 구조 처리 (content, hasNext 등이 있는 경우)
        if (responseBody.content !== undefined) {
            console.log('🔍 페이지네이션 응답 처리');
            const { content: newClubs, hasNext } = responseBody;
            
            if (newClubs && Array.isArray(newClubs)) {
                // 더보기 상태 설정 (클럽이 5개 미만이거나 hasNext가 false면 더 이상 없음)
                if (newClubs.length < 5 || !hasNext) {
                    setHasMore(false);
                }
                
                // 클럽 목록에 추가
                setClubList((prevClubList) => [...prevClubList, ...newClubs]);
                setPage((prevPage) => prevPage + 1);
                setIsLoading(false);
                setLoading(false);
                return;
            }
        }

        // 기존 응답 구조 (code 필드가 있는 경우) - fallback
        const message = 
        responseBody.code === 'AF' ? '잘못된 접근입니다.' :
        responseBody.code === 'DBE' ? '서버에 문제가 있습니다.' :
        responseBody.code === 'SJC' ? '취소 처리되었습니다.' : 
        responseBody.code === 'SU' ? '데이터를 성공적으로 불러왔습니다.' : '알 수 없는 오류가 발생했습니다.';

        const isSuccessed = responseBody.code === 'SU' || responseBody.code === 'SJC';

        if (!isSuccessed) {
            alert(message);
            setIsLoading(false);
            setLoading(false);
            return; 
        }
        
        const { clubList: newClubs } = responseBody;

        if(newClubs == null || newClubs.length < 5) {
            setHasMore(false);
        }

        setClubList((prevClubList) => [...prevClubList, ...newClubs]);
        setPage((prevPage) => prevPage + 1);
        setIsLoading(false);
        setLoading(false);
    }, [setLoading, setIsLoading, setHasMore, setClubList, setPage]);

    const getClubListRequest = useCallback(() => {
        getClubList(page, token).then(getClubListResponse);
    }, [page, token, getClubListResponse]);

    const onIntersection = useCallback((entries) => {
        const firstEntry = entries[0];
        
        if (firstEntry.isIntersecting && hasMore && cookies[ACCESS_TOKEN] && !isLoading && isInitialized) {
            setLoading(true);
            setIsLoading(true);
            getClubListRequest();
        }
    }, [hasMore, cookies, setLoading, isLoading, isInitialized, getClubListRequest]);

    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new window.IntersectionObserver(onIntersection);
        if (elementRef.current) {
          observerRef.current.observe(elementRef.current);
        }
    
     // 컴포넌트가 언마운트되거나 더 이상 관찰할 필요가 없을 때(observer를 해제할 때)반환.
        return () => {
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        };
    }, [onIntersection]);

    // 초기화 후 첫 번째 API 호출 (한 번만 실행)
    useEffect(() => {
        if (cookies[ACCESS_TOKEN] && !isInitialized) {
            console.log('🔍 DefaultMain 초기 API 호출');
            setIsInitialized(true);
            setLoading(true);
            setIsLoading(true);
            getClubListRequest();
        }
    }, [cookies]); // 의존성을 최소화하여 중복 실행 방지

    // 클럽 목록 새로고침 함수
    const refreshClubList = () => {
        console.log('🔍 클럽 목록 새로고침');
        setClubList([]); // 기존 목록 초기화
        setPage(1); // 페이지 초기화
        setHasMore(true); // 더보기 상태 초기화
        setIsLoading(true);
        setLoading(true);
        // 페이지가 1로 초기화되었으므로 첫 번째 페이지부터 다시 요청
        getClubList(1, token).then(getClubListResponse);
    };

    // 전역에서 refreshClubList 함수를 사용할 수 있도록 window 객체에 등록
    useEffect(() => {
        window.refreshClubList = refreshClubList;
        return () => {
            delete window.refreshClubList;
        };
    }, []);
    return (
        <div className={styles.section}>
            <div className={styles.bannerArea}>
                <div className={styles.bannerBox}>
                    배너
                </div>
            </div>
            <div className={styles.categoryArea}>
                <ul className={styles.categoryMainBox}>
                    <li className={styles.categoryBox}>
                        <span className={styles.categoryImgSpan}>
                            <img src={require("../../imges/home-img/board.png")} className={styles.categoryImg} alt="커뮤니티 아이콘"></img>
                        </span>
                        <span>커뮤니티</span>
                    </li>
                    <li className={styles.categoryBox}>
                        <span className={styles.categoryImgSpan}>
                            <img src={require("../../imges/home-img/board.png")} className={styles.categoryImg} alt="커뮤니티 아이콘"></img>
                        </span>
                        <span>커뮤니티</span>
                    </li>
                    <li className={styles.categoryBox}>
                        <span className={styles.categoryImgSpan}>
                            <img src={require("../../imges/home-img/board.png")} className={styles.categoryImg} alt="커뮤니티 아이콘"></img>
                        </span>
                        <span>커뮤니티</span>
                    </li>
                    <li className={styles.categoryBox}>
                        <span className={styles.categoryImgSpan}>
                            <img src={require("../../imges/home-img/board.png")} className={styles.categoryImg} alt="커뮤니티 아이콘"></img>
                        </span>
                        <span>커뮤니티</span>
                    </li>
                    <li className={styles.categoryBox}>
                        <span className={styles.categoryImgSpan}>
                            <img src={require("../../imges/home-img/board.png")} className={styles.categoryImg} alt="커뮤니티 아이콘"></img>
                        </span>
                        <span>커뮤니티</span>
                    </li>
                    <li className={styles.categoryBox}>
                        <span className={styles.categoryImgSpan}>
                            <img src={require("../../imges/home-img/board.png")} className={styles.categoryImg} alt="커뮤니티 아이콘"></img>
                        </span>
                        <span>커뮤니티</span>
                    </li>
                    <li className={styles.categoryBox}>
                        <span className={styles.categoryImgSpan}>
                            <img src={require("../../imges/home-img/board.png")} className={styles.categoryImg} alt="커뮤니티 아이콘"></img>
                        </span>
                        <span>커뮤니티</span>
                    </li>
                    <li className={styles.categoryBox}>
                        <span className={styles.categoryImgSpan}>
                            <img src={require("../../imges/home-img/board.png")} className={styles.categoryImg} alt="커뮤니티 아이콘"></img>
                        </span>
                        <span>커뮤니티</span>
                    </li>
                    <li className={styles.categoryBox}>
                        <span className={styles.categoryImgSpan}>
                            <img src={require("../../imges/home-img/board.png")} className={styles.categoryImg} alt="커뮤니티 아이콘"></img>
                        </span>
                        <span>커뮤니티</span>
                    </li>
                    <li className={styles.categoryBox}>
                        <span className={styles.categoryImgSpan}>
                            <img src={require("../../imges/home-img/board.png")} className={styles.categoryImg} alt="커뮤니티 아이콘"></img>
                        </span>
                        <span>커뮤니티</span>
                    </li>
                    <li className={styles.categoryBox}>
                        <span className={styles.categoryBox}>
                            <img src={require("../../imges/home-img/board.png")} className={styles.categoryImg} alt="커뮤니티 아이콘"></img>
                        </span>
                        <span>커뮤니티</span>
                    </li>
                    <li className={styles.categoryBox}>
                        <span className={styles.categoryImgSpan}>
                            <img src={require("../../imges/home-img/board.png")} className={styles.categoryImg} alt="커뮤니티 아이콘"></img>
                        </span>
                        <span>커뮤니티</span>
                    </li>
                    <li className={styles.categoryBox}>
                        <span className={styles.categoryImgSpan}>
                            <img src={require("../../imges/home-img/board.png")} className={styles.categoryImg} alt="커뮤니티 아이콘"></img>
                        </span>
                        <span>커뮤니티</span>
                    </li>
                    <li className={styles.categoryBox}>
                        <span className={styles.categoryImgSpan}>
                            <img src={require("../../imges/home-img/board.png")} className={styles.categoryImg} alt="커뮤니티 아이콘"></img>
                        </span>
                        <span>커뮤니티</span>
                    </li>
                    <li className={styles.categoryBox}>
                        <span className={styles.categoryImgSpan}>
                            <img src={require("../../imges/home-img/board.png")} className={styles.categoryImg} alt="커뮤니티 아이콘"></img>
                        </span>
                        <span>커뮤니티</span>
                    </li>
                    <li className={styles.categoryBox}>
                        <span className={styles.categoryImgSpan}>
                            <img src={require("../../imges/home-img/board.png")} className={styles.categoryImg} alt="커뮤니티 아이콘"></img>
                        </span>
                        <span>커뮤니티</span>
                    </li>
                    <li className={styles.categoryBox}>
                        <span className={styles.categoryImgSpan}>
                            <img src={require("../../imges/home-img/board.png")} className={styles.categoryImg} alt="커뮤니티 아이콘"></img>
                        </span>
                        <span>커뮤니티</span>
                    </li>
                    <li className={styles.categoryBox}>
                        <span className={styles.categoryImgSpan}>
                            <img src={require("../../imges/home-img/board.png")} className={styles.categoryImg}></img>
                        </span>
                        <span>커뮤니티</span>
                    </li>
                    <li className={styles.categoryBox}>
                        <span className={styles.categoryImgSpan}>
                            <img src={require("../../imges/home-img/board.png")} className={styles.categoryImg}></img>
                        </span>
                        <span>커뮤니티</span>
                    </li>
                    <li className={styles.categoryBox}>
                        <span className={styles.categoryImgSpan}>
                            <img src={require("../../imges/home-img/board.png")} className={styles.categoryImg}></img>
                        </span>
                        <span>커뮤니티</span>
                    </li>
                </ul>
            </div>
            <div className={styles.line}></div>
            <div className={styles.contentArea}>
                <p>신규 클럽</p>
                {clubList && clubList.length > 0 ? (
                    clubList.map((club, i) => (
                        <div className={styles.contentBox} key={club.id || i}>
                            <div className={styles.clubContainer} onClick={() => goToClub(club.id)}>
                                <img className={styles.clubLogo} src={require("../../imges/headerCategory-img/logo.png")} alt="club logo" />
                                <div className={styles.clubDescription}>
                                    <p>{club.name}</p>
                                    <span className={styles.clubDescriptionFont} dangerouslySetInnerHTML={{ __html: club.description }}></span>
                                    <div className={styles.clubPlace}>
                                        <div className={styles.clubPlaceBox}>부산/진구</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        등록된 클럽이 없습니다.
                    </div>
                )}
                {hasMore && (
                    <div ref={elementRef} style={{ textAlign: 'center' }}></div>
                )}
            </div>
        </div>
    )
}

export default DefaultMain;