# Deployment Instructions for Moby Comps

This document provides instructions for deploying the Moby Comps platform to a production environment using [Render](https://render.com/).

## Deployment Overview

The application is structured as a monorepo with the following directories:

- `client/`: React frontend
- `server/`: Express API backend
- `shared/`: Shared TypeScript types and schemas

For production deployment, we use a **single Web Service** approach on Render, where:

1. The frontend is built into static files
2. The Express server serves both the API and static files

## Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment setting | `production` |
| `PORT` | Port the server listens on (set by Render) | `10000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:port/database?sslmode=require` |
| `SESSION_SECRET` | Secret for session cookies | `your-very-long-secret-key` |
| `CORS_ORIGIN` | Frontend origin for CORS (if separate) | `https://your-app.com` |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key | `pk_live_...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` |

## Render Deployment Configuration

### Web Service Settings

- **Build Command**:  
  ```bash
  cd client && npm install --include=dev && npm run build && cd ../server && npm install
  ```
  
  **Note**: This is different from the default `build` script in package.json. You must use this exact command in your Render settings.

- **Start Command**:  
  ```bash
  cd server && npm run start
  ```

### Advanced Options

- Set Environment Variables as listed above
- Configure Health Check Path: `/api/health` 
- Add any required secrets

## Database Configuration 

The application uses PostgreSQL with the Drizzle ORM. Ensure your `DATABASE_URL` includes:

- SSL mode for production: `?sslmode=require`
- Appropriate connection limits
- Correct user permissions

## Client-Side Environment

The client-side uses Vite's environment variable system with the `VITE_` prefix:

- All frontend environment variables must start with `VITE_`
- These are injected at build time, not runtime

## Post-Deployment Verification

1. Visit your deployed application URL
2. Verify API endpoints function via `/api/health`
3. Test user authentication flows
4. Confirm Stripe integration works properly
5. Verify database connections

## Troubleshooting

### Common Issues

1. **"Not Found" errors for static assets**:  
   Check that the build output is in the correct directory structure.

2. **CORS errors**:  
   Ensure `CORS_ORIGIN` is properly set and that cookies use `sameSite: 'none'` in production.

3. **Database connection issues**:  
   Verify the `DATABASE_URL` is correct and includes SSL settings.

4. **Session/cookie problems**:  
   Make sure `SESSION_SECRET` is set and session configuration uses secure settings.

### Logs

You can view application logs in the Render dashboard or via the Render CLI.

## Development vs Production Files

The application uses different entry points for development and production:

- Development: `server/index.dev.ts` - API only, works with Vite's dev server for frontend
- Production: `server/index.prod.ts` - API + static file serving from build directory

This separation ensures optimal development experience while providing proper production deployment.

## Local Development

For local development, we provide several convenience scripts:

### Full Development Environment

To run both the API server and client development server:

```bash
./dev.sh
```

This script starts both the server (port 5000) and client (port 3000) in development mode, with proper cleanup on exit.

### API Server Only

To run just the API server:

```bash
cd server && npm run dev
```

### Client Development Server Only

To run just the client development server:

```bash
./client-dev.sh
```

or

```bash
cd client && npm run dev
```

### Development Proxy Configuration

The client's Vite development server is configured with a proxy that forwards all `/api` requests to the server running on port 5000. This means you can access the full application at http://localhost:3000 during development.