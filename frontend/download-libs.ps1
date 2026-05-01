# PowerShell script to download required libraries for offline use
# Run this script with PowerShell (right-click -> "Run with PowerShell")

Write-Host "Downloading required libraries for Interview Tracker..." -ForegroundColor Green

$libsDir = ".\libs"
if (-not (Test-Path $libsDir)) {
    New-Item -ItemType Directory -Path $libsDir | Out-Null
}

$files = @{
    "react.development.js" = "https://cdn.staticfile.org/react/18.2.0/umd/react.development.js"
    "react-dom.development.js" = "https://cdn.staticfile.org/react-dom/18.2.0/umd/react-dom.development.js"
    "material-ui.development.js" = "https://cdn.staticfile.org/@mui/material/5.15.15/umd/material-ui.development.js"
    "emotion-react.umd.min.js" = "https://cdn.staticfile.org/@emotion/react/11.11.4/dist/emotion-react.umd.min.js"
    "emotion-styled.umd.min.js" = "https://cdn.staticfile.org/@emotion/styled/11.11.0/dist/emotion-styled.umd.min.js"
    "babel.min.js" = "https://cdn.staticfile.org/babel-standalone/7.21.0/babel.min.js"
}

foreach ($file in $files.GetEnumerator()) {
    $outputPath = Join-Path $libsDir $file.Key
    Write-Host "Downloading $($file.Key)..." -NoNewline
    try {
        Invoke-WebRequest -Uri $file.Value -OutFile $outputPath -TimeoutSec 30
        Write-Host " ✓" -ForegroundColor Green
    } catch {
        Write-Host " ✗ (Error: $($_.Exception.Message))" -ForegroundColor Red
        # Try alternative CDN
        Write-Host "  Trying alternative CDN..." -ForegroundColor Yellow
        try {
            # Alternative CDN sources
            $altUrls = @(
                "https://unpkg.com/react@18/umd/react.development.js",
                "https://cdn.jsdelivr.net/npm/react@18/umd/react.development.js",
                "https://cdn.bootcss.com/react/18.2.0/umd/react.development.js"
            )
            foreach ($url in $altUrls) {
                try {
                    Invoke-WebRequest -Uri $url -OutFile $outputPath -TimeoutSec 30
                    Write-Host "  Downloaded from alternative source" -ForegroundColor Green
                    break
                } catch {
                    continue
                }
            }
        } catch {
            Write-Host "  Failed to download from all sources" -ForegroundColor Red
        }
    }
}

Write-Host "`nDownload completed!" -ForegroundColor Green
Write-Host "Libraries saved to: $((Get-Item $libsDir).FullName)" -ForegroundColor Cyan
Write-Host "`nYou can now open index.html offline." -ForegroundColor Cyan
Read-Host "Press Enter to exit"