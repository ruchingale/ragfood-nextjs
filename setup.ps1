# Quick Setup Script for Windows PowerShell
# Run this in PowerShell as Administrator (if needed for Ollama)

Write-Host "🚀 Setting up Food RAG System..." -ForegroundColor Green

# Check if Node.js is installed
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if Ollama is installed
Write-Host "Checking Ollama..." -ForegroundColor Yellow
try {
    ollama list | Out-Null
    Write-Host "✅ Ollama is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama not found. Please install from https://ollama.ai/" -ForegroundColor Red
    Write-Host "After installing Ollama, run this script again." -ForegroundColor Yellow
    exit 1
}

# Install npm dependencies
Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Download Ollama models
Write-Host "Downloading Ollama models (this may take several minutes)..." -ForegroundColor Yellow
Write-Host "Downloading mxbai-embed-large..." -ForegroundColor Cyan
ollama pull mxbai-embed-large
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Embedding model downloaded" -ForegroundColor Green
} else {
    Write-Host "⚠️ Failed to download embedding model" -ForegroundColor Yellow
}

Write-Host "Downloading llama3.2..." -ForegroundColor Cyan
ollama pull llama3.2
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ LLM model downloaded" -ForegroundColor Green
} else {
    Write-Host "⚠️ Failed to download LLM model" -ForegroundColor Yellow
}

# Copy example environment file
Write-Host "Setting up environment configuration..." -ForegroundColor Yellow
if (!(Test-Path ".env.local")) {
    Copy-Item ".env.simple.example" ".env.local"
    Write-Host "✅ Created .env.local from simple example" -ForegroundColor Green
} else {
    Write-Host "⚠️ .env.local already exists, skipping" -ForegroundColor Yellow
}

# Test Ollama connection
Write-Host "Testing Ollama connection..." -ForegroundColor Yellow
try {
    $testResponse = ollama run llama3.2 "Say 'Setup test successful!'" 2>$null
    if ($testResponse -match "successful") {
        Write-Host "✅ Ollama is working correctly" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Ollama test returned unexpected response" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Could not test Ollama connection" -ForegroundColor Yellow
}

# Check for existing development server
Write-Host "Checking for existing development servers..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "⚠️ Found existing Node.js processes:" -ForegroundColor Yellow
    $nodeProcesses | Format-Table Id, ProcessName, StartTime
    Write-Host "You may want to stop these before starting the dev server" -ForegroundColor Yellow
} else {
    Write-Host "✅ No existing Node.js processes found" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Setup complete! Next steps:" -ForegroundColor Green
Write-Host "1. Start the development server: npm run dev" -ForegroundColor White
Write-Host "2. Open browser to http://localhost:3000 (or 3001 if 3000 is busy)" -ForegroundColor White
Write-Host "3. Click 'Embed New Items' to load food data" -ForegroundColor White
Write-Host "4. Ask questions like 'What fruits are yellow and sweet?'" -ForegroundColor White
Write-Host ""
Write-Host "📖 For detailed instructions, see LOCAL_SETUP.md" -ForegroundColor Cyan
Write-Host "🔧 To use different configurations, copy from .env.*.example files" -ForegroundColor Cyan
