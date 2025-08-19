import { useNavigate } from "react-router-dom";
import styles from "../css/components/BottomCategory.module.css";
import { MY_CLUB_PATH } from "../../constants";

function BottomCategory({ page }) {
    const navigator = useNavigate();

    const onClickBtnHandler = () => {
        navigator(MY_CLUB_PATH);
    };

    const getButtonColor = (buttonPage) => {
        return page === buttonPage ? "#000000" : "#a3a3a3";  // 선택된 버튼은 검은색, 나머지는 회색
    };

    return (
        <div className={styles.bottomCategory}>
            <div className={styles.categoryBox}>
                <i className="fa-solid fa-house" style={{color: getButtonColor(0)}}></i>
                <span style={{color: getButtonColor(0)}}>홈</span>
            </div>
            <div className={styles.categoryBox}>
                <i className="fa-solid fa-bowling-ball" style={{color: getButtonColor(1)}}></i>
                <span style={{color: getButtonColor(1)}}>검색</span>
            </div>
            <div className={styles.categoryBox} onClick={onClickBtnHandler}>
                <i className="fa-solid fa-users" style={{color: getButtonColor(2)}}></i>
                <span style={{color: getButtonColor(2)}}>내모임</span>
            </div>
            <div className={styles.categoryBox}>
                <i className="fa-solid fa-user" style={{color: getButtonColor(3)}}></i>
                <span style={{color: getButtonColor(3)}}>마이페이지</span>
            </div>
        </div>
    );
}

export default BottomCategory;
