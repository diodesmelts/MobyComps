# MobyComps Deployment Guide

This document provides a comprehensive overview of the different deployment options for the MobyComps application.

## Overview of Deployment Options

We've created multiple deployment approaches, each with different tradeoffs:

1. **Full React Deployment (Recommended)** - Complete application with all functionality
2. **Direct Node.js Deployment** - Simplified approach with fewer dependencies
3. **Static HTML Fallback** - Bare-bones option if other approaches fail

## Option 1: Full React Deployment (Recommended)

This is the recommended approach as it deploys the complete application with all functionality.

### Scripts Used:
- `render-full-react.sh` - Builds the application
- `render-full-react-start.sh` - Starts the application

### Setup Instructions:
1. In Render dashboard, create a web service
2. Build Command: `chmod +x render-full-react.sh && ./render-full-react.sh`
3. Start Command: `chmod +x render-full-react-start.sh && ./render-full-react-start.sh`
4. Set environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `STRIPE_SECRET_KEY`: Stripe secret key
   - `VITE_STRIPE_PUBLIC_KEY`: Stripe publishable key
   - `NODE_ENV`: Set to `production`
   - `SESSION_SECRET`: Random string for session security

### Technical Details:
- Builds the React frontend with Vite
- Creates a custom Express server that serves the React app
- Includes PostgreSQL database integration
- Includes Stripe payment processing
- Properly handles client-side routing

### Full Instructions:
See [FULL-REACT-RENDER-DEPLOYMENT.md](./FULL-REACT-RENDER-DEPLOYMENT.md)

## Option 2: Direct Node.js Deployment

A more simplified approach that still preserves most functionality.

### Scripts Used:
- `render-direct.sh` - Builds the application
- `render-direct-start.sh` - Starts the application

### Setup Instructions:
1. In Render dashboard, create a web service
2. Build Command: `chmod +x render-direct.sh && ./render-direct.sh`
3. Start Command: `chmod +x render-direct-start.sh && ./render-direct-start.sh`
4. Set environment variables (same as Option 1)

### Technical Details:
- Uses a simpler build process
- May have limitations with some frontend features
- Still supports database and Stripe integration

### Full Instructions:
See [DIRECT-RENDER-DEPLOYMENT.md](./DIRECT-RENDER-DEPLOYMENT.md)

## Option 3: Static HTML Fallback

A last-resort option if other approaches don't work. This provides a static HTML version without full React functionality.

### Scripts Used:
- `render-super-direct.sh` - Builds a static version
- `render-super-direct-start.sh` - Starts a minimal server

### Setup Instructions:
1. In Render dashboard, create a web service
2. Build Command: `chmod +x render-super-direct.sh && ./render-super-direct.sh`
3. Start Command: `chmod +x render-super-direct-start.sh && ./render-super-direct-start.sh`
4. Environment variables are not required for this basic deployment

### Technical Details:
- Simply serves static HTML files
- No dynamic functionality
- No database integration
- No payment processing
- Limited user experience

## Troubleshooting Deployment Issues

If you encounter issues with deployment:

1. **Check Render Logs:**
   - Look at build logs for errors
   - Look at runtime logs for execution issues

2. **Test Endpoints:**
   - `/health` - Should return a simple status check
   - `/health/check` - Provides detailed system information
   - `/debug-structure` - Shows file structure information

3. **Database Issues:**
   - Verify your DATABASE_URL is correct
   - Ensure your IP is whitelisted if using external database
   - Check database server status

4. **Stripe Integration:**
   - Verify API keys are correct
   - Test in Stripe dashboard that webhooks are correctly set up
   - Use Stripe test mode for development

## Getting Help

If you need further assistance, please refer to:

- [Render.com Documentation](https://render.com/docs)
- [React Deployment Best Practices](https://create-react-app.dev/docs/deployment/)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Stripe API Documentation](https://stripe.com/docs/api)

## Maintaining Your Deployment

Once deployed, here are some best practices:

1. **Regular Backups:**
   - Set up automated database backups
   - Export important data periodically

2. **Monitoring:**
   - Set up Render alerts for application downtime
   - Monitor application performance

3. **Updates:**
   - Keep dependencies updated
   - Apply security patches promptly
   - Test in development before updating production