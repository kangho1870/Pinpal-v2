import { useEffect } from "react";
import styles from"../css/components/RankingBoard.module.css";

function RankingBoard() {
    
    return (
        <>
            <div className={styles.main}>
                <div className={styles.scoreCardBox}>
                    <div className={styles.scoreCardList}>
                        <div className={styles.scoreCardTitle}>
                            <h3>1</h3>
                        </div>
                        <div className={`${styles.scoreCard} ${styles.scoreCardTitle}`}>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>군</span>
                                </div>
                                <div>
                                    <h2>2군</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>이름</span>
                                </div>
                                <div>
                                    <h2>강호</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>점수</span>
                                </div>
                                <div className={styles.scoreBox}>
                                    <div className={styles.scoreInfo}>
                                        <div className={styles.score}>
                                            <span>1Game</span>
                                            <p>200</p>
                                        </div>
                                        <div className={styles.score}>
                                            <span>2Game</span>
                                            <p>210</p>
                                        </div>
                                    </div>
                                    <div className={styles.scoreInfo}>
                                        <div className={styles.score}>
                                            <span>3Game</span>
                                            <p>180</p>
                                        </div>
                                        <div className={styles.score}>
                                            <span>4Game</span>
                                            <p>190</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>평균</span>
                                </div>
                                <div>
                                    <h2>210</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>총점</span>
                                </div>
                                <div>
                                    <h2>780</h2>
                                </div>
                            </div>
                        </div>
                        <div className={styles.scoreCardTitle}>
                            <h3>-50</h3>
                        </div>
                    </div>
                    <div className={styles.scoreCardList}>
                        <div className={styles.scoreCardTitle}>
                            <h3>2</h3>
                        </div>
                        <div className={`${styles.scoreCard} ${styles.scoreCardTitle}`}>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>군</span>
                                </div>
                                <div>
                                    <h2>2군</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>이름</span>
                                </div>
                                <div>
                                    <h2>강호</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>점수</span>
                                </div>
                                <div className={styles.scoreBox}>
                                    <div className={styles.scoreInfo}>
                                        <div className={styles.score}>
                                            <span>1Game</span>
                                            <p>200</p>
                                        </div>
                                        <div className={styles.score}>
                                            <span>2Game</span>
                                            <p>210</p>
                                        </div>
                                    </div>
                                    <div className={styles.scoreInfo}>
                                        <div className={styles.score}>
                                            <span>3Game</span>
                                            <p>180</p>
                                        </div>
                                        <div className={styles.score}>
                                            <span>4Game</span>
                                            <p>190</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>평균</span>
                                </div>
                                <div>
                                    <h2>210</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>총점</span>
                                </div>
                                <div>
                                    <h2>780</h2>
                                </div>
                            </div>
                        </div>
                        <div className={styles.scoreCardTitle}>
                            <h3>-50</h3>
                        </div>
                    </div>
                    <div className={styles.scoreCardList}>
                        <div className={styles.scoreCardTitle}>
                            <h3>3</h3>
                        </div>
                        <div className={`${styles.scoreCard} ${styles.scoreCardTitle}`}>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>군</span>
                                </div>
                                <div>
                                    <h2>2군</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>이름</span>
                                </div>
                                <div>
                                    <h2>강호</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>점수</span>
                                </div>
                                <div className={styles.scoreBox}>
                                    <div className={styles.scoreInfo}>
                                        <div className={styles.score}>
                                            <span>1Game</span>
                                            <p>200</p>
                                        </div>
                                        <div className={styles.score}>
                                            <span>2Game</span>
                                            <p>210</p>
                                        </div>
                                    </div>
                                    <div className={styles.scoreInfo}>
                                        <div className={styles.score}>
                                            <span>3Game</span>
                                            <p>180</p>
                                        </div>
                                        <div className={styles.score}>
                                            <span>4Game</span>
                                            <p>190</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>평균</span>
                                </div>
                                <div>
                                    <h2>210</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>총점</span>
                                </div>
                                <div>
                                    <h2>780</h2>
                                </div>
                            </div>
                        </div>
                        <div className={styles.scoreCardTitle}>
                            <h3>-40</h3>
                        </div>
                    </div>
                    <div className={styles.scoreCardList}>
                        <div className={styles.scoreCardTitle}>
                            <h3>4</h3>
                        </div>
                        <div className={`${styles.scoreCard} ${styles.scoreCardTitle}`}>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>군</span>
                                </div>
                                <div>
                                    <h2>3군</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>이름</span>
                                </div>
                                <div>
                                    <h2>ooo</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>점수</span>
                                </div>
                                <div className={styles.scoreBox}>
                                    <div className={styles.scoreInfo}>
                                        <div className={styles.score}>
                                            <span>1Game</span>
                                            <p>200</p>
                                        </div>
                                        <div className={styles.score}>
                                            <span>2Game</span>
                                            <p>210</p>
                                        </div>
                                    </div>
                                    <div className={styles.scoreInfo}>
                                        <div className={styles.score}>
                                            <span>3Game</span>
                                            <p>180</p>
                                        </div>
                                        <div className={styles.score}>
                                            <span>4Game</span>
                                            <p>190</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>평균</span>
                                </div>
                                <div>
                                    <h2>210</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>총점</span>
                                </div>
                                <div>
                                    <h2>780</h2>
                                </div>
                            </div>
                        </div>
                        <div className={styles.scoreCardTitle}>
                            <h3>-70</h3>
                        </div>
                    </div>
                    <div className={styles.scoreCardList}>
                        <div className={styles.scoreCardTitle}>
                            <h3>5</h3>
                        </div>
                        <div className={`${styles.scoreCard} ${styles.scoreCardTitle}`}>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>군</span>
                                </div>
                                <div>
                                    <h2>3군</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>이름</span>
                                </div>
                                <div>
                                    <h2>ooo</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>점수</span>
                                </div>
                                <div className={styles.scoreBox}>
                                    <div className={styles.scoreInfo}>
                                        <div className={styles.score}>
                                            <span>1Game</span>
                                            <p>200</p>
                                        </div>
                                        <div className={styles.score}>
                                            <span>2Game</span>
                                            <p>210</p>
                                        </div>
                                    </div>
                                    <div className={styles.scoreInfo}>
                                        <div className={styles.score}>
                                            <span>3Game</span>
                                            <p>180</p>
                                        </div>
                                        <div className={styles.score}>
                                            <span>4Game</span>
                                            <p>190</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>평균</span>
                                </div>
                                <div>
                                    <h2>210</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>총점</span>
                                </div>
                                <div>
                                    <h2>780</h2>
                                </div>
                            </div>
                        </div>
                        <div className={styles.scoreCardTitle}>
                            <h3>-70</h3>
                        </div>
                    </div>
                    <div className={styles.scoreCardList}>
                        <div className={styles.scoreCardTitle}>
                            <h3>6</h3>
                        </div>
                        <div className={`${styles.scoreCard} ${styles.scoreCardTitle}`}>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>군</span>
                                </div>
                                <div>
                                    <h2>3군</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>이름</span>
                                </div>
                                <div>
                                    <h2>ooo</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>점수</span>
                                </div>
                                <div className={styles.scoreBox}>
                                    <div className={styles.scoreInfo}>
                                        <div className={styles.score}>
                                            <span>1Game</span>
                                            <p>200</p>
                                        </div>
                                        <div className={styles.score}>
                                            <span>2Game</span>
                                            <p>210</p>
                                        </div>
                                    </div>
                                    <div className={styles.scoreInfo}>
                                        <div className={styles.score}>
                                            <span>3Game</span>
                                            <p>180</p>
                                        </div>
                                        <div className={styles.score}>
                                            <span>4Game</span>
                                            <p>190</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>평균</span>
                                </div>
                                <div>
                                    <h2>210</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>총점</span>
                                </div>
                                <div>
                                    <h2>780</h2>
                                </div>
                            </div>
                        </div>
                        <div className={styles.scoreCardTitle}>
                            <h3>-70</h3>
                        </div>
                    </div>
                    <div className={styles.scoreCardList}>
                        <div className={styles.scoreCardTitle}>
                            <h3>7</h3>
                        </div>
                        <div className={`${styles.scoreCard} ${styles.scoreCardTitle}`}>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>군</span>
                                </div>
                                <div>
                                    <h2>3군</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>이름</span>
                                </div>
                                <div>
                                    <h2>ooo</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>점수</span>
                                </div>
                                <div className={styles.scoreBox}>
                                    <div className={styles.scoreInfo}>
                                        <div className={styles.score}>
                                            <span>1Game</span>
                                            <p>200</p>
                                        </div>
                                        <div className={styles.score}>
                                            <span>2Game</span>
                                            <p>210</p>
                                        </div>
                                    </div>
                                    <div className={styles.scoreInfo}>
                                        <div className={styles.score}>
                                            <span>3Game</span>
                                            <p>180</p>
                                        </div>
                                        <div className={styles.score}>
                                            <span>4Game</span>
                                            <p>190</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>평균</span>
                                </div>
                                <div>
                                    <h2>210</h2>
                                </div>
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.subTitle}>
                                    <span>총점</span>
                                </div>
                                <div>
                                    <h2>780</h2>
                                </div>
                            </div>
                        </div>
                        <div className={styles.scoreCardTitle}>
                            <h3>-70</h3>
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.modalArea}>
                <div className={styles.modalBox}>
                    <div className={styles.modal}>
                        <i class="fa-solid fa-ranking-star"></i>
                        <span>사이드 순위</span>
                    </div>
                </div>
                <div className={styles.modalBox}>
                    <div className={styles.modal}>
                        <i class="fa-solid fa-plus-minus"></i>
                        <span>점수 입력</span>
                    </div>
                </div>
            </div>
        </>
    )
}

export default RankingBoard;