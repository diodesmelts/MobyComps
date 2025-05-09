# Render Blueprint Deployment Guide

This guide explains how to use the Render Blueprint (render.yaml) for quick deployment of the Prize Competition Platform.

## One-Click Deployment

Render provides a feature called "Blueprints" that allows for one-click deployment of your entire application stack, including the web service and database.

### Steps for One-Click Deployment

1. **Fork the Repository**: 
   - First, fork this repository to your own GitHub account

2. **Set Up Render Blueprint**:
   - Log in to your Render account
   - Go to "Blueprints" in the dashboard
   - Click "New Blueprint Instance"
   - Connect your GitHub account if not already connected
   - Select the forked repository
   - Render will automatically detect the `render.yaml` file

3. **Configure Services**:
   - The blueprint will create two services:
     - A web service (`prize-competition-platform`)
     - A PostgreSQL database (`prize-competition-database`)
   - You'll be prompted to enter values for environment variables marked as `sync: false`:
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`
     - `STRIPE_SECRET_KEY`
     - `STRIPE_PUBLISHABLE_KEY`
   - Render will automatically generate a value for `SESSION_SECRET`
   - The `DATABASE_URL` will be automatically linked from the created database

4. **Apply the Blueprint**:
   - Click "Apply Blueprint"
   - Render will create and configure all services automatically
   - The initial build and deployment will begin

5. **Verify Deployment**:
   - Once deployment is complete, you can access your application at the provided URL
   - Check the health endpoint at `/health` to confirm everything is working
   - Follow the post-deployment checks from the DEPLOYMENT.md file

## Updating the Blueprint

If you make changes to your `render.yaml` file:

1. Commit and push the changes to your repository
2. In Render dashboard, navigate to your blueprint
3. Click "Update Blueprint"
4. Render will apply the changes to your services

## Tearing Down

If you need to remove all services created by the blueprint:

1. Go to your blueprint in the Render dashboard
2. Click "Delete Blueprint"
3. Confirm deletion - this will remove all services created by the blueprint