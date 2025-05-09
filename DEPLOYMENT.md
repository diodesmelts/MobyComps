# Deployment Checklist

Use this checklist to ensure your application is ready for deployment to Render.

## Pre-Deployment Checklist

### Environment Variables
- [ ] Create all required environment variables in Render dashboard
- [ ] Double-check the `VITE_API_URL` format (no trailing slash)
- [ ] Ensure `DATABASE_URL` includes `?sslmode=require` for production
- [ ] Generate a strong `SESSION_SECRET` for production
- [ ] Verify Stripe keys match environment (test/live)

### Database
- [ ] Verify database connection with SSL enabled
- [ ] Run migrations via build command or manually
- [ ] Check if database initialization scripts are necessary

### Frontend
- [ ] Build succeeds locally with `npm run build`
- [ ] All API calls use environment variables for API URL
- [ ] Static assets compile correctly
- [ ] Check for hardcoded URLs or environment-specific code

### Backend
- [ ] CORS configuration allows frontend domain
- [ ] Sessions configured for cross-domain if needed
- [ ] Port configuration uses `process.env.PORT`
- [ ] Database SSL mode enabled for production
- [ ] Verify API endpoints use absolute URLs when needed

### Security
- [ ] Remove any test credentials from codebase
- [ ] Check for exposed secrets in code history
- [ ] Ensure secure cookie settings for production
- [ ] Set appropriate CSP headers if needed

## Post-Deployment Verification

- [ ] Test authentication flow
- [ ] Verify database connections and queries
- [ ] Test Stripe payment processing
- [ ] Verify session persistence
- [ ] Check image uploading to Cloudinary
- [ ] Test all CRUD operations

## Render.com Specific Settings

### Web Service (Backend)
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`
- Auto-Deploy: Enabled
- Branch: main

### Static Site (Frontend-only option)
- Build Command: `npm install && npm run build`
- Publish Directory: `dist/public`
- Auto-Deploy: Enabled
- Branch: main

### PostgreSQL Database
- Connection Pooling: Enabled
- SSL Mode: Required

## Troubleshooting Common Issues

1. **CORS errors**: Check CORS configuration and make sure `CORS_ORIGIN` is set correctly
2. **Database connection failures**: Verify SSL settings and connection string
3. **Session issues**: Check cookie settings and cross-domain configuration
4. **API 404 errors**: Ensure proper API URL formatting in frontend
5. **Blank page after deploy**: Check browser console for JavaScript errors

## Rollback Plan

If deployment fails or critical issues are found:
1. Revert to previous version in Render dashboard
2. Verify database integrity
3. Check logs for errors
4. Fix issues in development and redeploy