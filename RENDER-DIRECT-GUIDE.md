# MobyComps Direct Render Deployment Guide

This guide provides a simplified approach to deploying MobyComps directly on Render (without Docker).

## Pre-deployment Preparation

1. Make sure all your code is committed to GitHub
2. Ensure you have:
   - `render-build.sh` - Build script
   - `render-start.sh` - Runtime start script
   - `render.yaml` - Render configuration
   - `client/index.production.html` - Production template

## Deployment Steps

### Option 1: Using the Blueprint (Recommended)

1. Log in to your [Render Dashboard](https://dashboard.render.com/)
2. Click the "New +" button and select "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and create the service
5. Confirm the setup and click "Apply"
6. Add your environment variables:
   - `DATABASE_URL`: Your Neon PostgreSQL URL
   - `STRIPE_SECRET_KEY`: If you're using Stripe payments
   - Any other environment variables your app needs

### Option 2: Manual Web Service Setup

1. Log in to your [Render Dashboard](https://dashboard.render.com/)
2. Click the "New +" button and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `mobycomps` (or your preferred name)
   - **Environment**: `Node`
   - **Region**: Choose the region closest to your users
   - **Branch**: Your main branch (usually `main`)
   - **Build Command**: `./render-build.sh`
   - **Start Command**: `./render-start.sh`
   - **Plan**: Select the appropriate plan for your needs
5. Add all necessary environment variables
6. Click "Create Web Service"

## After Deployment

1. Wait for the build to complete (this may take a few minutes)
2. Render will provide a URL for your application (e.g., `https://mobycomps.onrender.com`)
3. Open the URL in your browser to verify your app is running correctly

## Troubleshooting

If your app isn't working as expected:

1. Check the build logs in the Render dashboard
2. Look for any errors in the application logs
3. Use the health check endpoint `/health/check` to verify the server is running
4. Try the debug endpoints:
   - `/debug-html` - Simple HTML test page
   - `/debug-structure` - Directory listing

## Maintenance and Updates

To update your application:

1. Push your changes to GitHub
2. Render will automatically detect the changes and rebuild your app
3. Monitor the build logs to ensure everything deploys correctly

## Custom Domain Setup

1. In your Render dashboard, go to your service
2. Click on "Settings" and then "Custom Domain"
3. Follow the instructions to add and verify your domain

## Important Notes

- The build process may take several minutes, especially for the first deployment
- Node.js 20.x is used by default (specified in `render.yaml`)
- All static assets will be served from `/assets` on your deployment URL
- Database migrations will run automatically during the build process