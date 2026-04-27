@echo off
echo Starting Blockchain Vehicle Management System...
echo ===============================================

:: 1. Start the Hardhat Local Node
echo [1/4] Starting Hardhat Node...
start "Blockchain Node" cmd /k "cd blockchain && npx hardhat node"

:: Wait for 5 seconds to ensure the node is fully initialized
echo Waiting for the blockchain node to initialize...
timeout /t 5 /nobreak > nul

:: 2. Deploy Smart Contracts
echo [2/4] Deploying Smart Contracts...
start "Contract Deployment" cmd /k "cd blockchain && npx hardhat ignition deploy ignition\modules\VehicleRegistry.js --network localhost --reset"

:: 3. Start FastAPI Backend
:: Note: We use activate.bat here because this is a Command Prompt instance, not PowerShell
echo [3/4] Starting FastAPI Backend...
start "FastAPI Backend" cmd /k "cd backend && call venv\Scripts\activate.bat && uvicorn main:app --reload"

:: 4. Start React Frontend
echo [4/4] Starting React Frontend...
start "React Frontend" cmd /k "cd frontend && npm run dev"

echo ===============================================
echo All servers have been launched in separate windows!
echo You can safely close this main window.