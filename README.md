# Pinpal-2 Project

## 🚀 로컬 개발 환경 설정

### 1. 백엔드 실행 (Spring Boot)

```bash
# 프로젝트 루트 디렉토리에서
./gradlew bootRun --args='--spring.profiles.active=dev'
```

또는

```bash
# 환경변수 설정 후 실행
export SPRING_PROFILES_ACTIVE=dev
./gradlew bootRun
```

### 2. 프론트엔드 실행 (React)

```bash
# allcover_project 디렉토리에서
cd allcover_project

# 환경변수 설정
export REACT_APP_API_URL=http://localhost:8000
export REACT_APP_WS_URL=ws://localhost:8000

# 개발 서버 실행
npm start
```

### 3. 환경별 설정

#### 로컬 개발 (dev 프로필)
- **백엔드 포트**: 8000
- **프론트엔드 포트**: 3000
- **데이터베이스**: localhost:5432
- **API URL**: http://localhost:8000

#### 서버 배포 (prod 프로필)
- **백엔드 포트**: 80
- **프론트엔드 포트**: 3000
- **데이터베이스**: 서버 PostgreSQL
- **API URL**: http://211.37.173.106

### 4. 환경변수 설정

#### 로컬 개발용 (.env.local 파일 생성)
```bash
# allcover_project/.env.local
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
```

#### 서버 배포용
```bash
# GitHub Secrets 또는 서버 환경변수
REACT_APP_API_URL=http://211.37.173.106
REACT_APP_WS_URL=ws://211.37.173.106
```

## 📁 프로젝트 구조

```
pinpal-2/
├── src/main/resources/
│   ├── application.yml          # 기본 설정
│   ├── application-dev.yml      # 로컬 개발용
│   └── application-prod.yml     # 서버 배포용
└── allcover_project/
    ├── src/apis/index.js        # API 설정
    └── .env.local              # 로컬 환경변수 (생성 필요)
```

## 🔧 주요 설정

### 백엔드 프로필
- **dev**: 로컬 개발용 (포트 8000, 디버그 로그)
- **prod**: 서버 배포용 (포트 80, 프로덕션 로그)

### 프론트엔드 환경변수
- **REACT_APP_API_URL**: 백엔드 API 서버 주소
- **REACT_APP_WS_URL**: WebSocket 서버 주소
