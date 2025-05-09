# Moby Competitions Platform

A dynamic online prize competition platform delivering an engaging and modern user experience for ticket reservations and competition entries.

## Project Overview

- Frontend: React with TypeScript, TailwindCSS, and shadcn/ui components
- Backend: Node.js/Express with TypeScript
- Database: PostgreSQL with Drizzle ORM
- Payment Processing: Stripe
- Image Storage: Cloudinary
- Authentication: Passport.js with session-based auth

## Development

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Fill in the required values in .env

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

## Deployment

This application is configured for deployment on Render.com:

### Option 1: Separate Frontend and Backend (Recommended)

#### Backend Web Service
1. Create a new "Web Service" on Render
2. Connect your GitHub repository
3. Configure the service:
   - Name: `moby-competitions-api`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Environment Variables: Configure all variables from `.env.example`

#### Frontend Static Site
1. Create a new "Static Site" on Render
2. Connect your GitHub repository
3. Configure the site:
   - Name: `moby-competitions-web`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist/public`
   - Environment Variables: Configure `VITE_API_URL` to point to your backend service
   
### Option 2: Combined Deployment

1. Create a new "Web Service" on Render
2. Connect your GitHub repository
3. Configure the service:
   - Name: `moby-competitions`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Environment Variables: Configure all variables from `.env.example`

### Database Setup
1. Create a "PostgreSQL" database on Render
2. Connect your database with the `DATABASE_URL` environment variable
3. Run migrations: 
   - For automatic migrations, add `npm run db:push` to the build command
   - For manual migrations, run via Render Shell

## Environment Variables

Required environment variables for production:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=your_postgres_connection_string
SESSION_SECRET=your_secure_session_secret
VITE_API_URL=your_backend_url
STRIPE_SECRET_KEY=your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

See `.env.example` for a complete list of environment variables.