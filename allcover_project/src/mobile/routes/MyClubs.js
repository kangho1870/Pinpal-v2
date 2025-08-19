import { useEffect, useState, useRef, useCallback } from "react";
import styles from "../css/routes/MyClub.module.css";
import useSignInStore from "../../stores/useSignInStore";
import { useCookies } from "react-cookie";
import { ACCESS_TOKEN } from "../../constants";
import { useNavigate } from "react-router-dom";
import { onClickBackBtn } from "../../hooks";
import { getMyClubsRequest } from "../../apis";
import Loading from "../components/loading/Loading";

function MyClubs() {
    const { signInUser } = useSignInStore();
    const [loading, setLoading] = useState(false);
    const [myClubs, setMyClubs] = useState([]);
    const navigator = useNavigate();
    const [cookies] = useCookies();
    const token = cookies[ACCESS_TOKEN];
    const isMounted = useRef(true);

    const loadMyClubs = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getMyClubsRequest(token);
            console.log('🔍 내 클럽 목록 응답:', response);
            
            if (response && Array.isArray(response)) {
                if (isMounted.current) {
                    setMyClubs(response);
                }
            } else if (response && response.code === 'ERROR') {
                alert(response.message || '클럽 목록을 불러오는데 실패했습니다.');
            } else {
                alert('클럽 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('내 클럽 목록 로드 실패:', error);
            alert('클럽 목록을 불러오는데 실패했습니다.');
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [token]);

    useEffect(() => {
        isMounted.current = true;
        if (token && signInUser) {
            loadMyClubs();
        }
        return () => { isMounted.current = false; };
    }, [token, signInUser, loadMyClubs]);

    const handleClubClick = (clubId) => {
        navigator(`/club/${clubId}`);
    };

    const handleCreateClub = () => {
        navigator('/add-club');
    };

    return (
        <>
            <div className={styles.container}>
                <div className={styles.top}>
                    <div className={styles.clubTitle}>
                        <div className={styles.topCategory} onClick={() => onClickBackBtn(navigator)}>
                            <i className="fa-solid fa-chevron-left"></i>
                        </div>
                        <span className={styles.clubNameTitle}>내 모임</span>
                        <div className={styles.topCategory}></div>
                    </div>
                </div>
                
                <div className={styles.contextArea}>
                    {myClubs.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <i className="fa-solid fa-users"></i>
                            </div>
                            <h3>가입한 클럽이 없습니다</h3>
                            <p>새로운 클럽에 가입하거나 클럽을 만들어보세요!</p>
                            <div className={styles.emptyActions}>
                                <button 
                                    className={styles.createClubBtn}
                                    onClick={handleCreateClub}
                                >
                                    클럽 만들기
                                </button>
                                <button 
                                    className={styles.browseClubsBtn}
                                    onClick={() => navigator('/home')}
                                >
                                    클럽 둘러보기
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.clubList}>
                            {myClubs.map((userClub) => (
                                <div 
                                    key={userClub.club.id} 
                                    className={styles.clubItem}
                                    onClick={() => handleClubClick(userClub.club.id)}
                                >
                                    <div className={styles.clubInfo}>
                                        <h3 className={styles.clubName}>{userClub.club.name}</h3>
                                        <p className={styles.clubDescription}>
                                            {userClub.club.description || '설명이 없습니다.'}
                                        </p>
                                        <div className={styles.clubMeta}>
                                            <span className={styles.clubRole}>
                                                {userClub.role === 'MASTER' ? '클럽장' : 
                                                 userClub.role === 'STAFF' ? '운영진' : '멤버'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.clubArrow}>
                                        <i className="fa-solid fa-chevron-right"></i>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {loading && <Loading></Loading>}
        </>
    );
}

export default MyClubs;
