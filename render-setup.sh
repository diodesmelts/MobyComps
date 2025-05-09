#!/bin/bash
set -e  # Exit immediately if a command fails

echo "Setting up project for Render deployment..."

# Create an .npmrc file to use legacy peer deps (helps with some compatibility issues)
echo "legacy-peer-deps=true" > .npmrc

# Create Procfile for Render (alternative to start script)
echo "web: cd server && npm start" > Procfile

# Make sure the client's vite.config.ts is ready for production build
# (already set up in your existing config)

echo "Setup completed! Your project is now ready for deployment on Render."
echo ""
echo "To deploy on Render:"
echo "1. Use build command: cd client && npm install && npm run build && cd ../server && npm install"
echo "2. Use start command: cd server && npm start"
echo "3. Set Node version to 18 in a .node-version file"
echo ""
echo "Make sure to set these environment variables in the Render dashboard:"
echo "- NODE_ENV: production"
echo "- DATABASE_URL: Your Neon database URL"
echo "- STRIPE_SECRET_KEY: Your Stripe secret key"
echo "- VITE_STRIPE_PUBLIC_KEY: Your Stripe public key"