# Cafe24 SSH 연결 테스트 스크립트 (PowerShell)
# 사용법: .\test-ssh-connection.ps1

Write-Host "=== Cafe24 SSH 연결 정보 확인 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  GitHub Secrets에서 다음 정보를 복사하여 입력하세요:" -ForegroundColor Yellow
Write-Host ""
Write-Host "GitHub 저장소 → Settings → Secrets and variables → Actions" -ForegroundColor White
Write-Host ""
Write-Host "필요한 Secrets:" -ForegroundColor Cyan
Write-Host "  - CAFE24_HOST" -ForegroundColor White
Write-Host "  - CAFE24_USERNAME" -ForegroundColor White
Write-Host "  - CAFE24_PASSWORD" -ForegroundColor White
Write-Host "  - CAFE24_PORT" -ForegroundColor White
Write-Host ""

$CAFE24_HOST = Read-Host "CAFE24_HOST를 입력하세요"
$CAFE24_USERNAME = Read-Host "CAFE24_USERNAME을 입력하세요"
$securePassword = Read-Host "CAFE24_PASSWORD를 입력하세요" -AsSecureString
$CAFE24_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))
$CAFE24_PORT = Read-Host "CAFE24_PORT를 입력하세요 (기본 22)"
if ([string]::IsNullOrWhiteSpace($CAFE24_PORT)) {
    $CAFE24_PORT = "22"
}

Write-Host ""
Write-Host "=== 입력된 정보 ===" -ForegroundColor Cyan
Write-Host "Host: $CAFE24_HOST" -ForegroundColor Green
Write-Host "Username: $CAFE24_USERNAME" -ForegroundColor Green
Write-Host "Port: $CAFE24_PORT" -ForegroundColor Green
Write-Host "Password: [숨김]" -ForegroundColor Gray
Write-Host ""

$CONFIRM = Read-Host "SSH 연결을 시도하시겠습니까? (y/N)"
if ($CONFIRM -ne "y" -and $CONFIRM -ne "Y") {
    Write-Host "취소되었습니다." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=== SSH 연결 시도 ===" -ForegroundColor Cyan

# SSH 연결 테스트 (Windows에서는 ssh 명령어 사용)
$sshCommand = "ssh -o StrictHostKeyChecking=no -p $CAFE24_PORT $CAFE24_USERNAME@$CAFE24_HOST `"echo '✅ SSH 연결 성공!' && hostname && whoami`""

# 비밀번호를 환경 변수로 전달하는 방법 (sshpass 대신)
# Windows에서는 sshpass가 없으므로, SSH 키를 사용하거나 수동으로 입력해야 합니다
Write-Host ""
Write-Host "⚠️  Windows에서는 비밀번호 자동 입력이 제한됩니다." -ForegroundColor Yellow
Write-Host "다음 명령어를 수동으로 실행하거나 SSH 키를 사용하세요:" -ForegroundColor Yellow
Write-Host ""
Write-Host "ssh -p $CAFE24_PORT $CAFE24_USERNAME@$CAFE24_HOST" -ForegroundColor Green
Write-Host ""
Write-Host "또는 Terminus에서 다음 정보로 접속하세요:" -ForegroundColor Cyan
Write-Host "  Host: $CAFE24_HOST" -ForegroundColor White
Write-Host "  Port: $CAFE24_PORT" -ForegroundColor White
Write-Host "  Username: $CAFE24_USERNAME" -ForegroundColor White
Write-Host "  Password: [위에서 입력한 비밀번호]" -ForegroundColor White

