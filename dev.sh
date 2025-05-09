#!/bin/bash

# Color codes for better readability
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print welcome message
echo -e "${CYAN}======================================="
echo -e "  MOBY COMPS DEVELOPMENT ENVIRONMENT"
echo -e "=======================================${NC}"
echo -e "${YELLOW}Starting both server and client...${NC}"

# Start the server in the background
echo -e "${GREEN}Starting API server on port 5000...${NC}"
cd server && npm run dev &
SERVER_PID=$!

# Wait a bit for server to initialize
sleep 2

# Start the client
echo -e "${GREEN}Starting client on port 3000...${NC}"
cd ../client && npm run dev &
CLIENT_PID=$!

# Function to handle exit
cleanup() {
    echo -e "${YELLOW}Shutting down development environment...${NC}"
    if [ -n "$SERVER_PID" ]; then
        echo -e "${RED}Stopping server (PID: $SERVER_PID)${NC}"
        kill $SERVER_PID
    fi
    if [ -n "$CLIENT_PID" ]; then
        echo -e "${RED}Stopping client (PID: $CLIENT_PID)${NC}"
        kill $CLIENT_PID
    fi
    echo -e "${GREEN}Development environment shutdown complete.${NC}"
    exit 0
}

# Register the cleanup function for different signals
trap cleanup SIGINT SIGTERM EXIT

# Keep the script running
echo -e "${CYAN}Development environment is running.${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all processes.${NC}"
wait