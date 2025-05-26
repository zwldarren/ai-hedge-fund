@echo off
REM AI Hedge Fund Web Application Setup and Runner (Windows)
REM This script makes it easy for non-technical users to run the full web application

setlocal EnableDelayedExpansion

REM Colors for output (Windows doesn't support colors in basic cmd, but we'll use echo)
set "INFO=[INFO]"
set "SUCCESS=[SUCCESS]"
set "WARNING=[WARNING]"
set "ERROR=[ERROR]"

REM Function to check if a command exists
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo %ERROR% Node.js is not installed. Please install from https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo %ERROR% npm is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

where python >nul 2>&1
if %errorlevel% neq 0 (
    where python3 >nul 2>&1
    if !errorlevel! neq 0 (
        echo %ERROR% Python is not installed. Please install from https://python.org/
        pause
        exit /b 1
    )
)

where poetry >nul 2>&1
if %errorlevel% neq 0 (
    echo %WARNING% Poetry is not installed.
    echo %INFO% Poetry is required to manage Python dependencies for this project.
    echo.
    set /p install_poetry="Would you like to install Poetry automatically? (y/N): "
    if /i "!install_poetry!"=="y" (
        echo %INFO% Installing Poetry...
        python -m pip install poetry
        if !errorlevel! neq 0 (
            echo %ERROR% Failed to install Poetry automatically.
            echo %ERROR% Please install Poetry manually from https://python-poetry.org/
            pause
            exit /b 1
        )
        echo %SUCCESS% Poetry installed successfully!
        echo %INFO% Refreshing environment...
        REM Refresh the PATH for this session
        call refreshenv >nul 2>&1 || echo %WARNING% Could not refresh environment. You may need to restart your terminal.
    ) else (
        echo %ERROR% Poetry is required to run this application.
        echo %ERROR% Please install Poetry from https://python-poetry.org/ and run this script again.
        pause
        exit /b 1
    )
)

REM Check if we're in the right directory
if not exist "frontend" (
    echo %ERROR% This script must be run from the app\ directory
    echo %ERROR% Please navigate to the app\ directory and run: run.bat
    pause
    exit /b 1
)

if not exist "backend" (
    echo %ERROR% This script must be run from the app\ directory
    echo %ERROR% Please navigate to the app\ directory and run: run.bat
    pause
    exit /b 1
)

echo.
echo %INFO% AI Hedge Fund Web Application Setup
echo %INFO% This script will install dependencies and start both frontend and backend services
echo.

REM Check for .env file
if not exist "..\\.env" (
    if exist "..\\.env.example" (
        echo %WARNING% No .env file found. Creating from .env.example...
        copy "..\\.env.example" "..\\.env"
        echo %WARNING% Please edit the .env file in the root directory to add your API keys:
        echo %WARNING%   - OPENAI_API_KEY=your-openai-api-key
        echo %WARNING%   - GROQ_API_KEY=your-groq-api-key
        echo %WARNING%   - FINANCIAL_DATASETS_API_KEY=your-financial-datasets-api-key
        echo.
    ) else (
        echo %ERROR% No .env or .env.example file found in the root directory.
        echo %ERROR% Please create a .env file with your API keys.
        pause
        exit /b 1
    )
) else (
    echo %SUCCESS% Environment file (.env) found!
)

REM Install backend dependencies
echo %INFO% Installing backend dependencies...
cd backend

poetry check >nul 2>&1
if %errorlevel% equ 0 (
    echo %SUCCESS% Backend dependencies already installed!
) else (
    echo %INFO% Installing Python dependencies with Poetry...
    poetry install
    if %errorlevel% neq 0 (
        echo %ERROR% Failed to install backend dependencies
        pause
        exit /b 1
    )
    echo %SUCCESS% Backend dependencies installed!
)

cd ..

REM Install frontend dependencies
echo %INFO% Installing frontend dependencies...
cd frontend

if exist "node_modules" (
    echo %SUCCESS% Frontend dependencies already installed!
) else (
    echo %INFO% Installing Node.js dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo %ERROR% Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo %SUCCESS% Frontend dependencies installed!
)

cd ..

REM Start services
echo %INFO% Starting the AI Hedge Fund web application...
echo %INFO% This will start both the backend API and frontend web interface
echo %INFO% Press Ctrl+C to stop both services
echo.

REM Start backend in background
echo %INFO% Starting backend server...
cd backend
start /b poetry run uvicorn main:app --reload
cd ..

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in background
echo %INFO% Starting frontend development server...
cd frontend
start /b npm run dev
cd ..

REM Wait a moment for frontend to start
timeout /t 5 /nobreak >nul

echo %INFO% Opening web browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo.
echo %SUCCESS% AI Hedge Fund web application is now running!
echo %SUCCESS% Browser should open automatically to http://localhost:5173
echo.
echo %INFO% Frontend (Web Interface): http://localhost:5173
echo %INFO% Backend (API): http://localhost:8000
echo %INFO% API Documentation: http://localhost:8000/docs
echo.
echo %INFO% Press any key to stop both services...
pause >nul

REM Kill background processes (Windows way)
taskkill /f /im "uvicorn.exe" >nul 2>&1
taskkill /f /im "node.exe" >nul 2>&1

echo %SUCCESS% Services stopped. Goodbye!
pause 