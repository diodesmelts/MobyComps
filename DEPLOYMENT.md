# Deployment Checklist

## Pre-Deployment Steps

- [ ] All environment variables set in Render dashboard
- [ ] Database URL is correctly configured
- [ ] Cloudinary credentials are set
- [ ] Stripe API keys are set
- [ ] Session secret is generated

## Render Deployment Steps

1. **Create a new web service**
   - [ ] Connect to GitHub repository
   - [ ] Set build command to `./build.sh`
   - [ ] Set start command to `npm run start`
   - [ ] Set Node.js environment

2. **Create PostgreSQL database**
   - [ ] Create a PostgreSQL database on Render
   - [ ] Link the database to your web service

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