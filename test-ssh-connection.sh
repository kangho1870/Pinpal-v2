#!/bin/bash

# Cafe24 SSH 연결 테스트 스크립트
# 사용법: ./test-ssh-connection.sh

echo "=== Cafe24 SSH 연결 정보 확인 ==="
echo ""
echo "⚠️  GitHub Secrets에서 다음 정보를 복사하여 아래 변수에 입력하세요:"
echo ""
echo "GitHub 저장소 → Settings → Secrets and variables → Actions"
echo ""
echo "필요한 Secrets:"
echo "  - CAFE24_HOST"
echo "  - CAFE24_USERNAME"
echo "  - CAFE24_PASSWORD"
echo "  - CAFE24_PORT"
echo ""
read -p "CAFE24_HOST를 입력하세요: " CAFE24_HOST
read -p "CAFE24_USERNAME을 입력하세요: " CAFE24_USERNAME
read -sp "CAFE24_PASSWORD를 입력하세요: " CAFE24_PASSWORD
echo ""
read -p "CAFE24_PORT를 입력하세요 (기본 22): " CAFE24_PORT
CAFE24_PORT=${CAFE24_PORT:-22}

echo ""
echo "=== 입력된 정보 ==="
echo "Host: $CAFE24_HOST"
echo "Username: $CAFE24_USERNAME"
echo "Port: $CAFE24_PORT"
echo "Password: [숨김]"
echo ""

read -p "SSH 연결을 시도하시겠습니까? (y/N): " CONFIRM
if [[ $CONFIRM != "y" && $CONFIRM != "Y" ]]; then
    echo "취소되었습니다."
    exit 0
fi

echo ""
echo "=== SSH 연결 시도 ==="
sshpass -p "$CAFE24_PASSWORD" ssh -o StrictHostKeyChecking=no -p "$CAFE24_PORT" "$CAFE24_USERNAME@$CAFE24_HOST" "echo '✅ SSH 연결 성공!' && hostname && whoami"

