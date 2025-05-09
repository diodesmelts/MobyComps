#!/bin/bash

# Color codes for better readability
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print welcome message
echo -e "${CYAN}======================================="
echo -e "  MOBY COMPS CLIENT DEVELOPMENT"
echo -e "=======================================${NC}"
echo -e "${YELLOW}Starting client...${NC}"

# Start the client
echo -e "${GREEN}Starting client dev server...${NC}"
cd client && npm run dev