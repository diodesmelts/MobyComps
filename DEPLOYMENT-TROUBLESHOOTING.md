# MobyComps Deployment Troubleshooting Guide

This guide provides solutions to common issues that might arise when deploying the MobyComps application to Render or other cloud platforms.

## Blank Screen After Deployment

If you're seeing a blank screen after deployment, but the server logs show that the server is running, try these troubleshooting steps:

### 1. Check Server Logs

First, check the server logs in the Render dashboard for any errors. Look for messages about:
- Server startup
- Static file serving
- Build process failures

### 2. Access Diagnostic Endpoints

The deployment includes several diagnostic endpoints that can help identify issues:

- `/health` - Basic health check endpoint
- `/health/check` - Detailed server information including file structure
- `/debug-structure` - Directory structure visualization

### 3. Check Build Process

Ensure the build scripts executed properly:

1. Check that the React app was built with `npx vite build`
2. Verify that build files were copied to `dist/public/`
3. Confirm the Express server is running and serving static files

### 4. Verify Environment Variables

Make sure all required environment variables are set:

- `DATABASE_URL` - For database connectivity
- `STRIPE_SECRET_KEY` - For payment processing (server-side)
- `VITE_STRIPE_PUBLIC_KEY` - For Stripe Elements (client-side)

### 5. Check for CORS Issues

If you see errors in your browser console about CORS, make sure the server's CORS settings are properly configured.

### 6. Deployment Commands

If you need to redeploy, make sure you're using these commands:

- Build Command: `chmod +x render-full-react.sh && ./render-full-react.sh`
- Start Command: `chmod +x render-full-react-start.sh && ./render-full-react-start.sh`

### 7. Manual Fix for Missing Assets

If assets are not being served correctly, you may need to manually upload them to the `dist/public/assets` directory after deployment.

## Database Connection Issues

If you're experiencing database connection problems:

1. Check that your `DATABASE_URL` environment variable is correctly set
2. Verify that the database is accessible from the deployment server
3. Check that the database schema matches what the application expects

## Stripe Integration Issues

If payments are not working:

1. Ensure both `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLIC_KEY` are set
2. Verify that the Stripe API version is set to "2023-10-16" in the code
3. Make sure your Stripe account is active and properly configured

## Advanced Troubleshooting

If none of the above solutions work, try these advanced steps:

1. Try deploying with the simplified server version first (render-direct.sh)
2. Check network requests in your browser's developer tools
3. Try accessing the site from different browsers or devices
4. Clear your browser cache and try again
5. Add additional logging to the server code to identify where the issue might be occurring

## Still Having Issues?

If you're still encountering problems:

1. Review the deployment guide thoroughly
2. Check for any recent changes in the codebase that might affect deployment
3. Contact support with detailed information about the issue and steps you've taken

Remember to include relevant logs and error messages when seeking assistance.