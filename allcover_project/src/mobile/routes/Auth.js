import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"
import { idCheckRequest, signUpRequest } from "../../apis";
import { ROOT_PATH } from "../../constants";
import styles from "../css/routes/Auth.module.css";

export default function Auth() {
    const [queryParam] = useSearchParams();
    const snsId = queryParam.get("snsId");
    const joinPath = queryParam.get("joinPath");
    const accountEmail = queryParam.get("accountEmail");
    const [path, setPath] = useState("로그인");
    useEffect(() => {
        if(snsId && joinPath && accountEmail) setPath("회원가입");
    }, [snsId, joinPath, accountEmail]);
    return (
        <div>
            {path === "로그인" && <SignIn />}
            {path === "회원가입" && <SignUp />}
        </div>
    )
};

function SignUp() {
    const [queryParam] = useSearchParams();
    const snsId = queryParam.get("snsId");
    const joinPath = queryParam.get("joinPath");
    const profileImageUrl = queryParam.get("profileImageUrl");
    const accountEmail = queryParam.get("accountEmail");
    const navigator = useNavigate();
    const isSnsSignUp = snsId !== null && joinPath !== null;
    const [name, setName] = useState("");
    const [birth, setBirth] = useState("");
    const [email, setEmail] = useState(accountEmail || "");
    const [gender, setGender] = useState(0);
    const [idMessage, setIdMessage] = useState("");
    const [birthMessage, setBirthMessage] = useState("");
    const [idMessageError, setIdMessageError] = useState(false);
    const [birthMessageError, setBirthMessageError] = useState(false);
    const [matchedId, setMatchedId] = useState(false);
    const [matchedBirth, setMatchedBirth] = useState(false);
    const [idCheckBtnStatus, setIdCheckBtnStatus] = useState(false);
    const signUpRequestCheck = name && (isSnsSignUp ? true : matchedId) && matchedBirth && (gender === 0 || gender === 1) && snsId && joinPath;

    // SNS 로그인인 경우 이메일 유효성 자동 통과
    useEffect(() => {
        if (isSnsSignUp && accountEmail) {
            const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            const isMatched = pattern.test(accountEmail);
            setMatchedId(isMatched);
            if (isMatched) {
                setIdMessage('사용 가능한 이메일 입니다.');
            }
        }
    }, [isSnsSignUp, accountEmail]);

    const handleIdInputChange = (event) => {
        const { value } = event.target;
        setEmail(value);
        const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const isMatched = pattern.test(value);
        const message = (isMatched || !value) ? "" : "올바른 이메일 주소를 입력하세요."
        setIdMessage(message);
        setIdMessageError(!isMatched);
        setMatchedId(isMatched);
    };
    const handleNameInputChange = (event) => {
        setName(event.target.value);
    };
    const handleBirthInputChange = (event) => {
        const { value } = event.target;
        setBirth(value);
        const pattern = /^(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$/;
        const isMatched = pattern.test(value);
        const message = (isMatched || !value) ? "" : "YYYYMMDD 형식으로 입력하세요."
        setBirthMessage(message);
        setBirthMessageError(!isMatched);
        setMatchedBirth(isMatched);
    };
    const signUpResponse = (responseBody) => {
        if (responseBody === undefined || responseBody === null || responseBody === "" || 
            (typeof responseBody === 'object' && Object.keys(responseBody).length === 0)) {
                navigator(ROOT_PATH);
                return;
        } else {
            setIdMessage('서버에 문제가 있습니다.');
        }
    };
    const signUpBtnClickHandler = () => {
        if(!signUpRequestCheck) return;
        const requestBody = {
            name,
            email,
            birth,
            gender,
            joinPath: joinPath ? joinPath : "home",
            snsId,
            profileImageUrl
        };
        signUpRequest(requestBody).then(signUpResponse);
    };
    const idCheckResponse = (responseBody) => {
        const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const isMatched = pattern.test(email);
        if(!isMatched) {
            return;
        }
        console.log('ID 체크 응답 (값):', responseBody);
        console.log('ID 체크 응답 (타입):', typeof responseBody);
        console.log('ID 체크 응답 (JSON):', JSON.stringify(responseBody));
        
        // 백엔드에서 성공적으로 응답하면 responseBody는 undefined, null, 빈 문자열, 또는 빈 객체
        // 에러가 발생하면 responseBody는 에러 객체
        if (responseBody === undefined || responseBody === null || responseBody === "" || 
            (typeof responseBody === 'object' && Object.keys(responseBody).length === 0)) {
            setIdMessage('사용 가능한 아이디입니다.');
        } else {
            setIdMessage('서버에 문제가 있습니다.');
        }
    };
    const idCheck = () => {
        if(!email) return;
        const id = { userEmail: email}
        idCheckRequest(id).then(idCheckResponse);
    }
    return (
        <div className={styles.signUpContainer}>
            <div className={styles.topBox}>
                <p className={styles.title}>추가정보 입력</p>
            </div>
            <div className={styles.addInformationContainer}>
                <div className={styles.addInformationBox}>
                    <span className={styles.informationTitle}>아이디(이메일)</span>
                    <div className={styles.emailBox}>
                        <input
                            className={styles.signUpInput}
                            placeholder="이메일 주소"
                            type="text" 
                            value={email} 
                            onChange={handleIdInputChange}
                            readOnly={isSnsSignUp}
                        />
                        <button 
                            className={styles.emailCheckBtn} 
                            onClick={idCheck} 
                            disabled={!matchedId || isSnsSignUp}
                        >
                            중복확인
                        </button>
                    </div>
                    <span className={`${styles.okMessage} ${idMessage === "사용 가능한 아이디입니다." ? styles.okMessage : ""}`}>{idMessage}</span>
                </div>
                <div className={styles.addInformationBox}>
                    <span className={styles.informationTitle}>이름</span>
                    <input
                        className={styles.signUpInput}
                        placeholder="이름"
                        type="text" 
                        value={name} 
                        onChange={handleNameInputChange} 
                    />
                </div>
                <div className={styles.addInformationBox}>
                    <span className={styles.informationTitle}>생년월일</span>
                    <input
                        className={styles.signUpInput}
                        placeholder="8자리 (19970405)"
                        type="text" 
                        value={birth} 
                        onChange={handleBirthInputChange} 
                    />
                    {birthMessageError && 
                        <span className={styles.message}>{birthMessage}</span>
                    }
                </div>
                <div className={styles.addInformationBox}>
                    <span className={styles.informationTitle}>성별</span>
                    <div className={styles.btnBox}>
                        <button className={`${styles.btn} ${gender === 0 ? styles.selectedBtn : ""}`} onClick={() => setGender(0)}>남자</button>
                        <button className={`${styles.btn} ${gender === 1 ? styles.selectedBtn : ""}`} onClick={() => setGender(1)}>여자</button>
                    </div>
                </div>
            </div>
            <div className={styles.signUpBtnBox}>
                <button className={styles.signUpBtn} onClick={signUpBtnClickHandler}>시작하기</button>
            </div>
        </div>
    );
}

function SignIn() {
    return (
        <div>
            로그인
        </div>
    )
}