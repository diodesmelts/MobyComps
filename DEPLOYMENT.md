# Deployment Checklist

## Pre-Deployment Steps

- [ ] All environment variables set in Render dashboard
- [ ] Database URL is correctly configured
- [ ] Cloudinary credentials are set
- [ ] Stripe API keys are set
- [ ] Session secret is generated

## Render Deployment Steps

1. **Create a new web service**
   - [ ] Log in to your Render dashboard (https://dashboard.render.com/)
   - [ ] Click "New" and select "Web Service"
   - [ ] Connect your GitHub repository
   - [ ] Choose the repository with your code
   - [ ] Name your web service "prize-competition-platform" (or your preferred name)
   - [ ] Set the Environment to "Node"
   - [ ] Set the Region closest to your target audience
   - [ ] Set build command to `./build.sh`
   - [ ] Set start command to `npm run start`
   - [ ] Select instance type (at least Standard plan recommended for production)

2. **Create PostgreSQL database**
   - [ ] From your Render dashboard, click "New" and select "PostgreSQL"
   - [ ] Name your database "prize-competition-database" (or your preferred name)
   - [ ] Choose PostgreSQL version 15 (or latest stable)
   - [ ] Select the region closest to your web service
   - [ ] Choose an appropriate plan (at least Starter for production)
   - [ ] Click "Create Database"
   - [ ] Once created, find the "Internal Database URL" in the database dashboard
   - [ ] Use this URL as the DATABASE_URL environment variable in your web service

3. **Set environment variables**
   - [ ] Copy all environment variables from `.env.example`
   - [ ] Set proper values for all environment variables

4. **Deploy the application**
   - [ ] Trigger deployment from Render dashboard
   - [ ] Check build logs for any errors
   - [ ] Verify application is running with health check endpoint (`/health`)

5. **Post-Deployment Checks**
   - [ ] Verify user registration works
   - [ ] Verify login functionality
   - [ ] Verify competitions display correctly
   - [ ] Verify image uploads work
   - [ ] Verify payment processing works
   - [ ] Verify admin functionality

## Troubleshooting

If you encounter issues during deployment:

1. Check the build logs in Render dashboard
2. Verify all environment variables are set correctly
3. Check the application logs for runtime errors
4. Verify database connection is working
5. Make sure Cloudinary and Stripe services are properly configured