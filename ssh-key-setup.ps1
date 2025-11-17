# Cafe24 SSH 키 기반 인증 설정 스크립트
# PowerShell에서 실행: .\ssh-key-setup.ps1

Write-Host "🔑 SSH 키 생성 및 설정을 시작합니다..." -ForegroundColor Cyan

# 1. SSH 키 생성
$sshDir = "$env:USERPROFILE\.ssh"
$privateKeyPath = "$sshDir\id_rsa_cafe24"
$publicKeyPath = "$sshDir\id_rsa_cafe24.pub"

# .ssh 디렉토리 확인
if (-not (Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
    Write-Host "✅ .ssh 디렉토리 생성 완료" -ForegroundColor Green
}

# 기존 키 확인
if (Test-Path $privateKeyPath) {
    Write-Host "⚠️  기존 키가 이미 존재합니다: $privateKeyPath" -ForegroundColor Yellow
    $overwrite = Read-Host "덮어쓰시겠습니까? (y/N)"
    if ($overwrite -ne "y") {
        Write-Host "❌ 취소되었습니다." -ForegroundColor Red
        exit
    }
}

# SSH 키 생성
Write-Host "`n🔐 SSH 키를 생성합니다..." -ForegroundColor Cyan
ssh-keygen -t rsa -b 4096 -f $privateKeyPath -N '""' -C "cafe24-pinpal-server"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SSH 키 생성 완료!" -ForegroundColor Green
} else {
    Write-Host "❌ SSH 키 생성 실패" -ForegroundColor Red
    exit 1
}

# 공개키 내용 표시
Write-Host "`n📋 공개키 내용 (서버에 등록해야 합니다):" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Gray
$publicKey = Get-Content $publicKeyPath
Write-Host $publicKey -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor Gray

# 클립보드에 복사
$publicKey | Set-Clipboard
Write-Host "`n✅ 공개키가 클립보드에 복사되었습니다!" -ForegroundColor Green

Write-Host "`n📝 다음 단계:" -ForegroundColor Cyan
Write-Host "1. Cafe24 관리자 페이지에서 SSH 비밀번호로 한 번 접속" -ForegroundColor White
Write-Host "2. 다음 명령어를 서버에서 실행:" -ForegroundColor White
Write-Host "   mkdir -p ~/.ssh" -ForegroundColor Yellow
Write-Host "   chmod 700 ~/.ssh" -ForegroundColor Yellow
Write-Host "   echo '$publicKey' >> ~/.ssh/authorized_keys" -ForegroundColor Yellow
Write-Host "   chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Yellow
Write-Host "`n3. Terminus에서 Private Key 경로 설정:" -ForegroundColor White
Write-Host "   $privateKeyPath" -ForegroundColor Yellow

Write-Host "`n💡 팁: 공개키는 클립보드에 복사되어 있습니다. 서버에 붙여넣기만 하면 됩니다!" -ForegroundColor Green

