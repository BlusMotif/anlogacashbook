# 🚀 Deployment Checklist for Render

## Pre-Deployment Checklist

### ✅ Code Quality

- [ ] Run `npm run lint` - No ESLint errors
- [ ] Run `npm run build` - Build completes successfully
- [ ] Test app locally with `npm run preview`
- [ ] Test all routes and functionality

### ✅ Firebase Configuration

- [ ] Firebase project is properly configured
- [ ] Authentication is enabled
- [ ] Realtime Database rules are set
- [ ] Environment variables are configured in Render

### ✅ Files & Configuration

- [ ] `render.yaml` exists and is properly configured
- [ ] `public/_redirects` exists for SPA routing
- [ ] All static assets are in `public/` folder
- [ ] No sensitive data in version control

### ✅ Git & Repository

- [ ] All changes are committed: `git add . && git commit -m "message"`
- [ ] Changes are pushed to main branch: `git push origin main`
- [ ] Repository is connected to Render

## Render Deployment Steps

### 1. Create/Update Static Site

1. Go to [render.com](https://render.com)
2. Navigate to your static site or create new one
3. Ensure these settings:
   - **Runtime**: Static
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`

### 2. Environment Variables

Add these environment variables in Render dashboard:

```bash
# Firebase Configuration (if needed)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### 3. Deploy

1. Click "Manual Deploy" → "Deploy latest commit"
2. Wait for build to complete
3. Check the deployment logs for any errors

## Post-Deployment Testing

### ✅ Functionality Tests

- [ ] Homepage loads correctly
- [ ] Login page works
- [ ] Authentication flows work
- [ ] Dashboard loads
- [ ] All routes are accessible
- [ ] Mobile responsiveness works

### ✅ SPA Routing Tests

- [ ] Direct links work (e.g., `/dashboard`)
- [ ] Page refresh works on any route
- [ ] Browser back/forward buttons work
- [ ] No "Page Not Found" errors

### ✅ Performance Tests

- [ ] App loads within 3 seconds
- [ ] Images and assets load properly
- [ ] No console errors
- [ ] Mobile performance is acceptable

## Troubleshooting

### "Page Not Found" Errors

1. Check if `_redirects` file exists in `public/` and `dist/`
2. Verify `render.yaml` routing configuration
3. Clear browser cache and try incognito mode
4. Check Render deployment logs

### Build Failures

1. Check Node.js version compatibility
2. Verify all dependencies are installed
3. Check for TypeScript/ESLint errors
4. Ensure build commands are correct

### Firebase Issues

1. Verify Firebase configuration
2. Check environment variables in Render
3. Ensure Firebase security rules are correct
4. Test Firebase connection locally first

## Emergency Rollback

If deployment fails:

1. Go to Render dashboard
2. Find previous working deployment
3. Click "Promote" or redeploy from that commit
4. Investigate issues before retrying

## Performance Monitoring

After deployment:

- Monitor Render analytics
- Check for runtime errors in browser console
- Test on different devices/browsers
- Monitor Firebase usage and costs

---

**Last Updated**: November 1, 2025
**App**: Anloga Ambulance Cashbook System