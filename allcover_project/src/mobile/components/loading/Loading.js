import Spinner from '../../../imges/loading-img/Ball@1x-0.7s-200px-200px.gif';
import styles from '../../components/loading/Loading.module.css';


export default function Loading() {
    return (
        <div className={styles.loadingContainer}>
            <div className={styles.loadingModal}>
                <img src={Spinner}></img>
            </div>
        </div>
    )
}