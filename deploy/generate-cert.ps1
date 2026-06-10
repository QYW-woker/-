# =============================================
# 自签名 HTTPS 证书生成脚本
# 以管理员身份运行 PowerShell 执行此脚本
# =============================================

param(
    [string]$ServerIP = ""
)

# 自动获取本机IP（若未传参）
if (-not $ServerIP) {
    $ServerIP = (Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.*" } |
        Select-Object -First 1).IPAddress
}

if (-not $ServerIP) {
    Write-Error "无法获取本机IP，请手动传入: .\generate-cert.ps1 -ServerIP 192.168.1.100"
    exit 1
}

Write-Host "正在为 IP: $ServerIP 生成证书..." -ForegroundColor Cyan

# 目标目录
$CertsDir = "$PSScriptRoot\..\backend\certs"
New-Item -ItemType Directory -Force -Path $CertsDir | Out-Null

# 生成自签名证书
$cert = New-SelfSignedCertificate `
    -DnsName $ServerIP, "localhost" `
    -IPAddress $ServerIP, "127.0.0.1" `
    -CertStoreLocation "Cert:\LocalMachine\My" `
    -NotAfter (Get-Date).AddYears(10) `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -HashAlgorithm SHA256 `
    -KeyUsage DigitalSignature, KeyEncipherment `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")

# 导出 PEM 格式证书（cert.pem）
$certBase64 = [Convert]::ToBase64String($cert.RawData, 'InsertLineBreaks')
$certPem = "-----BEGIN CERTIFICATE-----`n$certBase64`n-----END CERTIFICATE-----"
Set-Content -Path "$CertsDir\cert.pem" -Value $certPem -Encoding ASCII

# 导出私钥（key.pem）
$tempPfxPath = "$env:TEMP\photograph_temp.pfx"
$tempPwd = ConvertTo-SecureString -String "TempPassword123!" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath $tempPfxPath -Password $tempPwd | Out-Null

# 用 OpenSSL 从 PFX 提取私钥（需要 OpenSSL 或 Git Bash）
$opensslPaths = @(
    "C:\Program Files\Git\usr\bin\openssl.exe",
    "C:\Program Files (x86)\Git\usr\bin\openssl.exe",
    "openssl"
)

$opensslFound = $false
foreach ($opensslPath in $opensslPaths) {
    try {
        & $opensslPath version 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            & $opensslPath pkcs12 -in $tempPfxPath -nocerts -nodes -out "$CertsDir\key.pem" -passin pass:TempPassword123! 2>$null
            $opensslFound = $true
            break
        }
    } catch {}
}

Remove-Item $tempPfxPath -ErrorAction SilentlyContinue

if (-not $opensslFound) {
    Write-Warning "未找到 OpenSSL，私钥导出失败。"
    Write-Host ""
    Write-Host "请安装 Git for Windows（含 OpenSSL）后重新运行此脚本：" -ForegroundColor Yellow
    Write-Host "  https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "或手动运行以下命令生成证书（需要 OpenSSL）：" -ForegroundColor Yellow
    Write-Host "  openssl req -x509 -newkey rsa:2048 -keyout backend\certs\key.pem -out backend\certs\cert.pem -days 3650 -nodes -subj `"/CN=$ServerIP`"" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "证书生成成功！" -ForegroundColor Green
Write-Host "  cert.pem -> $CertsDir\cert.pem" -ForegroundColor Green
Write-Host "  key.pem  -> $CertsDir\key.pem" -ForegroundColor Green
Write-Host ""
Write-Host "请更新 backend\.env 中的 PUBLIC_URL：" -ForegroundColor Cyan
Write-Host "  PUBLIC_URL=https://${ServerIP}:4000" -ForegroundColor Yellow
