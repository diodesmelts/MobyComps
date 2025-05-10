# MobyComps Deployment Guide V2

This updated guide provides instructions for deploying the MobyComps Prize Competition platform to Render, with special focus on ensuring the React frontend is properly built and served.

## Prerequisites

Before deploying, make sure you have:

1. A Render account
2. A PostgreSQL database provisioned on Render or Neon
3. A Stripe account with API keys for payment processing

## Environment Variables

Set the following environment variables in your Render dashboard:

- `DATABASE_URL` - Your PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Stripe secret key (starts with `sk_`)
- `VITE_STRIPE_PUBLIC_KEY` - Stripe publishable key (starts with `pk_`)
- `NODE_ENV` - Set to `production`

## Deployment Instructions

### Option 1: Standard Deployment (Recommended)

This approach provides the most reliable deployment with proper handling of React build files.

#### Build Command:
```
chmod +x render-full-react-build.sh && ./render-full-react-build.sh
```

#### Start Command:
```
chmod +x render-full-react-start-debug.sh && ./render-full-react-start-debug.sh
```

### Option 2: Alternative Deployment

If the standard deployment doesn't work, try this alternative approach.

#### Build Command:
```
chmod +x render-full-react.sh && ./render-full-react.sh
```

#### Start Command:
```
chmod +x render-full-react-start.sh && ./render-full-react-start.sh
```

## Troubleshooting

If you encounter a blank screen or see a placeholder HTML page instead of your React app:

1. Access the `/health/check` endpoint to view server information and debug details
2. Access the `/debug-structure` endpoint to see the directory structure
3. Check the server logs in your Render dashboard for clues about what went wrong

Common issues:

1. **Missing build files**: Ensure the build script is properly copying files to the `dist/public` directory
2. **Incorrect directory structure**: The React app should be in `dist/public` with `index.html` at its root
3. **Environment variable issues**: Make sure all required environment variables are set
4. **Asset path problems**: Assets should be in `dist/public/assets`

## Checking your deployment

After deploying, verify that:

1. The homepage shows your React-based competition listing
2. API endpoints are working (try `/api/competitions`)
3. Static assets are loading properly (images, CSS, etc.)
4. Database connections are established (/health/check will show this)

## Additional Resources

If you need more help, refer to:

- `DEPLOYMENT-TROUBLESHOOTING.md` for detailed troubleshooting steps
- Render documentation at https://render.com/docs
- Your server logs in the Render dashboard
- The diagnostic endpoints at `/health/check` and `/debug-structure`