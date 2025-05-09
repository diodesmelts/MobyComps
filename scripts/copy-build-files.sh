#!/bin/bash

# Exit on error
set -e

echo "🔄 Copying build files from dist/public to server/public..."

# Source and destination directories
SRC_DIR="dist/public"
DEST_DIR="server/public"

# Check if source directory exists
if [ -d "$SRC_DIR" ]; then
  # Create destination directory if it doesn't exist
  mkdir -p "$DEST_DIR"
  
  # Copy all files and directories
  cp -r "$SRC_DIR"/* "$DEST_DIR"
  
  echo "✅ Files copied successfully."
else
  echo "❌ Error: Source directory $SRC_DIR not found. Make sure the build has completed."
  exit 1
fi