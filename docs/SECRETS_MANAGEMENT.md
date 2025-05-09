# Secrets Management Guide for Render Deployment

This guide outlines how to securely manage API keys and secrets for the Prize Competition Platform when deploying to Render.

## Required Secrets

Your application requires the following secrets to function properly:

1. **DATABASE_URL** - PostgreSQL connection string
2. **SESSION_SECRET** - Secret key for encrypting sessions
3. **CLOUDINARY_CLOUD_NAME** - Your Cloudinary cloud name
4. **CLOUDINARY_API_KEY** - Your Cloudinary API key
5. **CLOUDINARY_API_SECRET** - Your Cloudinary API secret
6. **STRIPE_SECRET_KEY** - Your Stripe secret key
7. **STRIPE_PUBLISHABLE_KEY** - Your Stripe publishable key

## Setting Environment Variables in Render

1. Go to your web service in the Render dashboard
2. Click on the "Environment" tab
3. Add each secret as a key-value pair
4. Click "Save Changes"

Render will automatically restart your service with the new environment variables.

## Secret Rotation

For enhanced security, consider rotating your secrets periodically:

1. Generate new credentials/keys from the respective service dashboards (Stripe, Cloudinary)
2. Update the environment variables in Render
3. Deploy or restart your application to apply the changes

## Using the Render Blueprint

For automated deployment with pre-configured secrets, use the `render.yaml` file:

```yaml
services:
  - type: web
    name: prize-competition-platform
    env: node
    plan: standard
    buildCommand: ./build.sh
    startCommand: npm run start
    autoDeploy: true
    healthCheckPath: /health
    numInstances: 1
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: prize-competition-database
          property: connectionString
      - key: SESSION_SECRET
        generateValue: true
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: STRIPE_PUBLISHABLE_KEY
        sync: false
```

This configuration will prompt you for the necessary secrets during the deployment process and automatically link your database connection string.