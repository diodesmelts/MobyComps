# Full React Application Deployment Guide for MobyComps

This guide explains how to deploy the complete MobyComps application to Render with all functionality including:
- React frontend
- Express backend
- PostgreSQL database
- Stripe payment processing

## Prerequisites

1. A [Render.com](https://render.com) account
2. A PostgreSQL database (either through Render or another provider like Neon)
3. A Stripe account with API keys

## Required Environment Variables

Make sure to set these environment variables in your Render deployment:

- `DATABASE_URL`: Your PostgreSQL connection string
- `STRIPE_SECRET_KEY`: Your Stripe secret key (starts with `sk_`)
- `VITE_STRIPE_PUBLIC_KEY`: Your Stripe publishable key (starts with `pk_`)
- `NODE_ENV`: Set to `production`
- `SESSION_SECRET`: A random string for securing sessions

## Deployment Steps

1. Push your code to a GitHub repository

2. In the Render dashboard, create a new **Web Service**:
   - Connect your GitHub repository
   - Give your service a name
   - Set the **Build Command** to:
     ```
     chmod +x render-full-react.sh && ./render-full-react.sh
     ```
   - Set the **Start Command** to:
     ```
     chmod +x render-full-react-start.sh && ./render-full-react-start.sh
     ```
   - Set the **Environment Variables** mentioned above

3. Click **Create Web Service**

4. Wait for the build to complete (this may take a few minutes)

## Troubleshooting

If you encounter issues:

1. **Database connection errors**: 
   - Verify your DATABASE_URL is correct
   - Ensure your database is accessible from Render

2. **Stripe integration issues**:
   - Check that both Stripe environment variables are set correctly
   - Verify your Stripe account is properly configured

3. **Application not loading**:
   - Check the logs in the Render dashboard
   - Visit the `/health/check` endpoint for debugging information
   - Visit the `/debug-structure` endpoint to check if files are in the correct locations

## What's Happening Behind the Scenes

The deployment scripts (`render-full-react.sh` and `render-full-react-start.sh`) handle:

1. Installing dependencies
2. Building the React application with Vite
3. Creating a custom Express server that:
   - Serves the static React files
   - Connects to the PostgreSQL database
   - Integrates with Stripe for payments
   - Handles API requests
4. Starting the server on the port Render expects

## Testing Your Deployment

After deployment completes, your application should be accessible at:
`https://[your-service-name].onrender.com`

Verify that:
- The homepage loads with all styling and images
- Database functionality works (competitions display correctly)
- User authentication works
- The checkout process works with Stripe integration