#!/bin/bash

# Cafe24 서버 초기 설정 스크립트 (Nginx 없이)

echo "🚀 Cafe24 서버 초기 설정을 시작합니다..."

# 1. Node.js 설치
echo "📦 Node.js 설치..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 프론트엔드 디렉토리 생성
echo "📁 프론트엔드 디렉토리 생성..."
mkdir -p ~/pinpal-frontend
chmod 755 ~/pinpal-frontend

# 3. serve 패키지 설치
echo "🌐 serve 패키지 설치..."
npm install -g serve

# 4. 방화벽 설정
echo "🔥 방화벽 설정..."
sudo ufw allow 22    # SSH
sudo ufw allow 80    # Spring Boot 백엔드
sudo ufw allow 3000  # React 프론트엔드
sudo ufw allow 5432  # PostgreSQL (내부용)
sudo ufw --force enable

# 5. 로그 디렉토리 생성
echo "📝 로그 디렉토리 생성..."
mkdir -p ~/logs
chmod 755 ~/logs

# 6. 배포 스크립트 생성
echo "📜 배포 스크립트 생성..."
cat > deploy.sh << 'EOF'
#!/bin/bash

echo "🚀 Pinpal 배포 시작..."

# 최신 이미지 pull
docker pull kangho1870/pinpal:latest

# 기존 컨테이너 중지/삭제
docker stop pinpal-backend || true
docker rm pinpal-backend || true

# 새 컨테이너 실행
docker run -d \
  --name pinpal-backend \
  --restart unless-stopped \
  -p 80:80 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/pinpal \
  -e SPRING_DATASOURCE_USERNAME=pinpal_user \
  -e SPRING_DATASOURCE_PASSWORD=your_password \
  -e JWT_SECRET=your_jwt_secret \
  -e KAKAO_CLIENT_ID=your_kakao_client_id \
  -e KAKAO_CLIENT_SECRET=your_kakao_client_secret \
  kangho1870/pinpal:latest

# 컨테이너 상태 확인
echo "📊 컨테이너 상태:"
docker ps

echo "📋 최근 로그:"
docker logs pinpal-backend --tail 20

echo "✅ 배포 완료!"
EOF

chmod +x deploy.sh

# 7. 모니터링 스크립트 생성
echo "📊 모니터링 스크립트 생성..."
cat > monitor.sh << 'EOF'
#!/bin/bash

echo "📊 Pinpal 시스템 모니터링"
echo "=========================="

echo "🐳 Docker 컨테이너 상태:"
docker ps

echo ""
echo "💾 시스템 리소스:"
free -h

echo ""
echo "💿 디스크 사용량:"
df -h

echo ""
echo "📋 백엔드 로그 (최근 10줄):"
docker logs pinpal-backend --tail 10

echo ""
echo "🌐 프론트엔드 프로세스:"
ps aux | grep serve

echo ""
echo "📊 포트 사용 현황:"
netstat -tlnp | grep -E ':(3000|80|5432)'
EOF

chmod +x monitor.sh

echo ""
echo "🎉 서버 초기 설정이 완료되었습니다!"
echo ""
echo "📋 다음 단계:"
echo "1. deploy.sh 스크립트에서 환경변수를 실제 값으로 수정"
echo "2. PostgreSQL 데이터베이스 설정"
echo "3. GitHub Secrets 설정"
echo "4. main 브랜치에 푸시하여 자동 배포 테스트"
echo ""
echo "🔧 유용한 명령어:"
echo "- 배포: ./deploy.sh"
echo "- 모니터링: ./monitor.sh"
echo "- 로그 확인: docker logs -f pinpal-backend"
echo "- 프론트엔드 로그: tail -f ~/logs/frontend.log"
echo ""
echo "🌐 서비스 포트:"
echo "- 프론트엔드: http://your-server-ip:3000"
echo "- 백엔드 API: http://your-server-ip:80"
echo "- PostgreSQL: localhost:5432"
