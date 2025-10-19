#!/bin/bash

# Startup script for ML Prediction Service
# This script starts the Python Flask ML service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting ML Prediction Service...${NC}"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.8 or higher.${NC}"
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1-2)
echo -e "${GREEN}✓ Found Python $PYTHON_VERSION${NC}"

# Check if required files exist
ML_SERVICE_FILE="../services/ml_service.py"
MODEL_FILE="../../loan_default_model_20251006.joblib"
SCALER_FILE="../../scaler_20251006.joblib"
COLUMNS_FILE="../../model_columns.json"

if [ ! -f "$ML_SERVICE_FILE" ]; then
    echo -e "${RED}❌ ML service file not found: $ML_SERVICE_FILE${NC}"
    exit 1
fi

if [ ! -f "$MODEL_FILE" ]; then
    echo -e "${RED}❌ Model file not found: $MODEL_FILE${NC}"
    exit 1
fi

if [ ! -f "$SCALER_FILE" ]; then
    echo -e "${RED}❌ Scaler file not found: $SCALER_FILE${NC}"
    exit 1
fi

if [ ! -f "$COLUMNS_FILE" ]; then
    echo -e "${RED}❌ Columns file not found: $COLUMNS_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All required files found${NC}"

# Check if required Python packages are installed
echo -e "${YELLOW}📦 Checking Python dependencies...${NC}"

REQUIRED_PACKAGES=("flask" "flask_cors" "joblib" "scikit-learn" "numpy" "pandas")
MISSING_PACKAGES=()

for package in "${REQUIRED_PACKAGES[@]}"; do
    if ! python3 -c "import ${package//-/_}" 2>/dev/null; then
        MISSING_PACKAGES+=("$package")
    fi
done

if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Missing packages: ${MISSING_PACKAGES[*]}${NC}"
    echo -e "${YELLOW}Installing missing packages...${NC}"
    
    for package in "${MISSING_PACKAGES[@]}"; do
        echo -e "${YELLOW}Installing $package...${NC}"
        python3 -m pip install "$package" --quiet
    done
    
    echo -e "${GREEN}✓ All dependencies installed${NC}"
else
    echo -e "${GREEN}✓ All dependencies already installed${NC}"
fi

# Set environment variables
export ML_SERVICE_PORT=${ML_SERVICE_PORT:-5001}
export MODEL_PATH=${MODEL_PATH:-"../../loan_default_model_20251006.joblib"}
export SCALER_PATH=${SCALER_PATH:-"../../scaler_20251006.joblib"}
export COLUMNS_PATH=${COLUMNS_PATH:-"../../model_columns.json"}
export FLASK_ENV=${FLASK_ENV:-"development"}

echo -e "${GREEN}🌐 Starting Flask ML service on port $ML_SERVICE_PORT...${NC}"
echo -e "${YELLOW}Model: $MODEL_PATH${NC}"
echo -e "${YELLOW}Scaler: $SCALER_PATH${NC}"
echo -e "${YELLOW}Columns: $COLUMNS_PATH${NC}"

# Start the ML service
cd "$(dirname "$ML_SERVICE_FILE")"
python3 ml_service.py

# This line will only be reached if the service stops
echo -e "${RED}ML service stopped${NC}"
