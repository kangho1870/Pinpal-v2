# Cafe24 SSH 접속 설정 가이드

## 1. Cafe24 관리자 페이지에서 확인할 정보
- SSH 사용자명 (username)
- SSH 비밀번호 (password)
- SSH 포트 (기본 22, 다를 수 있음)
- 서버 IP 주소 (211.37.173.106)

## 2. Terminus 설정 방법

### 기본 설정
- **Host**: pinpal.co.kr (또는 211.37.173.106)
- **Port**: 22 (cafe24에서 제공한 포트 확인)
- **Username**: root (cafe24에서 제공한 실제 사용자명 확인)
- **Password**: cafe24 관리자 페이지에서 확인한 비밀번호

### SSH 키 기반 인증 설정 (권장)

#### Windows에서 SSH 키 생성
```powershell
# PowerShell에서 실행
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
# 파일 위치: C:\Users\rkdgh\.ssh\id_rsa (개인키), id_rsa.pub (공개키)
```

#### 공개키를 서버에 등록
1. 공개키 내용 복사: `cat C:\Users\rkdgh\.ssh\id_rsa.pub`
2. Terminus에서 비밀번호로 한 번 접속 성공 후:
   ```bash
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   echo "여기에_공개키_내용_붙여넣기" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

#### Terminus에서 SSH 키 사용
- **Private Key**: C:\Users\rkdgh\.ssh\id_rsa 파일 선택
- **Password**: 비워두거나 키 비밀번호만 입력

## 3. 문제 해결 체크리스트

- [ ] cafe24 관리자 페이지에서 SSH 비밀번호 확인/재설정
- [ ] 사용자명이 "root"가 맞는지 확인
- [ ] 포트가 22가 맞는지 확인
- [ ] 비밀번호에 특수문자, 대소문자 정확히 입력
- [ ] cafe24 서버의 SSH 서비스가 활성화되어 있는지 확인
- [ ] 방화벽에서 SSH 포트(22)가 열려있는지 확인

## 4. 대안: PuTTY 사용
Windows에서 PuTTY를 사용하여 접속 시도:
- Host: pinpal.co.kr
- Port: 22
- Connection type: SSH
- Username: root (또는 cafe24에서 제공한 사용자명)

