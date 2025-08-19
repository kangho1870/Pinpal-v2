import { useNavigate } from "react-router-dom";
import styles from "../css/components/HeaderCategory.module.css";

function HeaderCategory() {
    const navigator = useNavigate();

    return (
        <>
            <div className={styles.mainBox}>
                <div>
                    <img src={require("../../imges/headerCategory-img/logo.png")} className={styles.logoBtn} alt="로고"></img>
                </div>
                <div>
                    PinPal
                </div>
                <div className={styles.categoryBox}>
                                    <img src={require("../../imges/headerCategory-img/scoreboard.png")} className={styles.categoryBtn} alt="스코어보드"></img>
                <img src={require("../../imges/headerCategory-img/my.png")} className={styles.categoryBtn} alt="내 정보"></img>
                </div>
            </div>
        </>
    )
}

export default HeaderCategory;