# Docker Deployment Guide for MobyComps Platform

This guide explains how to deploy the MobyComps Prize Competition Platform using Docker on Render.

## Overview

The Docker deployment approach packages the entire application, including all dependencies, into a consistent environment. This resolves build issues that can occur in Render's standard Node.js environment.

## Deployment Steps

### 1. Connect Your Repository to Render

1. Log in to your Render account
2. Go to "Dashboard" and click on "New +"
3. Select "Web Service"
4. Connect your GitHub repository
5. Select the repository containing this application

### 2. Configure the Web Service

- **Name**: prize-competition-platform (or your preferred name)
- **Environment**: Docker
- **Region**: Choose the region closest to your users
- **Branch**: main (or your default branch)
- **Plan**: Standard (or choose based on your needs)

### 3. Set Required Environment Variables

Render will automatically load most environment variables from the `render.yaml` file, but you'll need to set the following secrets:

- **CLOUDINARY_CLOUD_NAME**: Your Cloudinary cloud name
- **CLOUDINARY_API_KEY**: Your Cloudinary API key
- **CLOUDINARY_API_SECRET**: Your Cloudinary API secret
- **STRIPE_SECRET_KEY**: Your Stripe secret key
- **STRIPE_PUBLISHABLE_KEY**: Your Stripe publishable key

### 4. Create the Database

Render will automatically create a PostgreSQL database based on the configuration in `render.yaml`. You don't need to set up the database separately.

### 5. Deploy the Application

1. Click "Create Web Service"
2. Render will automatically:
   - Build the Docker image
   - Start the container
   - Connect it to the PostgreSQL database
   - Perform health checks

## Troubleshooting

### Health Check Failures

If the health check at `/health` is failing:

1. Go to the "Logs" tab in Render
2. Check for error messages related to database connections or environment variables
3. Verify that all required environment variables are set
4. Try redeploying the service

### Database Connection Issues

If the application can't connect to the database:

1. Make sure the database is provisioned and running
2. Check that the `DATABASE_URL` environment variable is correctly set
3. Verify that the application has access to the database by checking the IP allowlist

### Static File Serving Issues

If the frontend isn't loading correctly:

1. Check that the build process completed successfully
2. Verify that the static files were properly copied into the Docker image
3. Examine the application logs for any file path issues

## Verification

After deployment, verify that the following endpoints are working:

- `/` - The home page
- `/health` - The health check endpoint
- `/api/competitions` - The competitions API endpoint

## Additional Resources

- [Render Docker Deployment Documentation](https://render.com/docs/docker)
- [Render PostgreSQL Documentation](https://render.com/docs/databases)
- [Docker Documentation](https://docs.docker.com/)