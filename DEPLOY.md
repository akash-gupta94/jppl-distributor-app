# Deployment Guide - JPPL Distributor App

## ✅ Database Already Configured!

Your database credentials have been set up:
- **Server**: smaacsync.smaac.in
- **Database**: jppl-dealer-app
- **User**: jppl-dealer-app-user
- **Connection String**: Already configured in `.env`

## Quick Deploy to Vercel (5 minutes)

### Step 1: Install Dependencies & Setup Database

Open terminal in the project folder and run:

```bash
# Install dependencies
npm install

# Push database schema (creates all tables)
npm run db:push

# Seed initial data (admin, levels, categories, sample scheme)
npm run db:seed
```

**Expected output:**
```
🌱 Starting database seed...
✅ Admin user created: admin@jppl.com
✅ Distributor levels created
✅ Item categories created
✅ Sample scheme created
✅ Sample distributor created: +919876543210
🎉 Database seeding completed successfully!
```

### Step 2: Test Locally (Optional)

```bash
npm run dev
```

Open http://localhost:3000 and verify:
- Landing page loads
- Admin login works (admin@jppl.com / admin123)
- Distributor login works (9876543210 / OTP: 123456)

Press `Ctrl+C` to stop the server.

### Step 3: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - JPPL Distributor App"

# Create GitHub repository (go to github.com/new)
# Then link and push:
git remote add origin https://github.com/YOUR_USERNAME/jppl-distributor-app.git
git branch -M main
git push -u origin main
```

**Important:** The `.env` file is in `.gitignore` and won't be pushed (for security).

### Step 4: Deploy to Vercel

#### A. Install Vercel CLI (if not installed)

```bash
npm install -g vercel
```

#### B. Login to Vercel

```bash
vercel login
```

#### C. Deploy

```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → jppl-distributor-app (or your choice)
- **Directory?** → ./ (current directory)
- **Override settings?** → No

#### D. Add Environment Variables

During deployment or after, add these environment variables in Vercel:

**Via CLI (Recommended):**
```bash
# Add all environment variables
vercel env add DATABASE_URL production
# When prompted, paste: postgresql://jppl-dealer-app-user:A7fKx9LmQ2vPzR8uT4yWbH3Nc@smaacsync.smaac.in:5432/jppl-dealer-app

vercel env add SESSION_SECRET production
# When prompted, paste: jppl-prod-7k9Lx4mQz2vPR8uT6yWbH3NcA5fJ1gDsE9h

vercel env add ADMIN_EMAIL production
# When prompted, paste: admin@jppl.com

vercel env add ADMIN_PASSWORD production
# When prompted, paste: admin123

vercel env add NEXT_PUBLIC_APP_NAME production
# When prompted, paste: JPPL Distributor Portal

vercel env add NEXT_PUBLIC_COMPANY_NAME production
# When prompted, paste: JPP and Company General Politics Private Limited
```

**Or via Vercel Dashboard:**
1. Go to your project on vercel.com
2. Settings → Environment Variables
3. Add each variable:
   - `DATABASE_URL` = `postgresql://jppl-dealer-app-user:A7fKx9LmQ2vPzR8uT4yWbH3Nc@smaacsync.smaac.in:5432/jppl-dealer-app`
   - `SESSION_SECRET` = `jppl-prod-7k9Lx4mQz2vPR8uT6yWbH3NcA5fJ1gDsE9h`
   - `ADMIN_EMAIL` = `admin@jppl.com`
   - `ADMIN_PASSWORD` = `admin123`
   - `NEXT_PUBLIC_APP_NAME` = `JPPL Distributor Portal`
   - `NEXT_PUBLIC_COMPANY_NAME` = `JPP and Company General Politics Private Limited`

#### E. Redeploy

After adding environment variables:

```bash
vercel --prod
```

### Step 5: Your App is Live! 🎉

Vercel will give you a URL like: `https://jppl-distributor-app.vercel.app`

**Test your live app:**
- Visit the URL
- Login as admin: admin@jppl.com / admin123
- Login as distributor: 9876543210 / OTP: 123456

## Alternative: Deploy via Vercel Dashboard

### 1. Push to GitHub (as in Step 3 above)

### 2. Import in Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. **Framework Preset**: Next.js (auto-detected)
5. **Build Command**: Leave as default (`next build`)
6. **Output Directory**: Leave as default (`.next`)
7. Add Environment Variables (see Step 4D above)
8. Click "Deploy"

### 3. Wait for deployment (2-3 minutes)

Your app will be live at `https://your-project-name.vercel.app`

## Custom Domain (Optional)

### Add your own domain:

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add domain (e.g., `distributor.jppl.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

## Post-Deployment Checklist

✅ **Test all features:**
- [ ] Admin login works
- [ ] Distributor OTP login works
- [ ] Admin dashboard loads
- [ ] Distributor dashboard shows data
- [ ] Database connection is working

✅ **Security:**
- [ ] Change admin password from default
- [ ] Environment variables are set correctly
- [ ] `.env` file is NOT in GitHub
- [ ] HTTPS is enabled (automatic on Vercel)

✅ **Data:**
- [ ] Admin user exists (admin@jppl.com)
- [ ] 8 distributor levels created
- [ ] 5 item categories created
- [ ] Sample scheme exists
- [ ] Sample distributor exists (+919876543210)

## Useful Vercel Commands

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# View logs
vercel logs

# List deployments
vercel ls

# Remove deployment
vercel rm <deployment-url>
```

## Update Your App

When you make changes:

```bash
# Commit changes
git add .
git commit -m "Your changes"
git push

# Vercel will auto-deploy from GitHub
# Or manually trigger:
vercel --prod
```

## Database Migrations

If you change the database schema:

```bash
# Locally test first
npm run db:push

# Then deploy to Vercel
# The build process will run prisma generate automatically
```

## Monitoring

**View logs:**
- Vercel Dashboard → Your Project → Logs
- Or: `vercel logs`

**Performance:**
- Vercel Dashboard → Analytics (if enabled)

## Troubleshooting

### Deployment fails

**Check:**
- All environment variables are set
- DATABASE_URL is correct
- No syntax errors in code

**View build logs:**
```bash
vercel logs --follow
```

### Database connection fails

**Verify:**
```bash
# Test locally first
npm run db:push
```

If it works locally, environment variables might not be set in Vercel.

### 500 Internal Server Error

- Check Vercel logs
- Verify DATABASE_URL in Vercel environment variables
- Ensure database is accessible from Vercel's servers

## Support

**Vercel Documentation:** https://vercel.com/docs
**Next.js Deployment:** https://nextjs.org/docs/deployment

---

## Quick Summary

```bash
# 1. Setup database
npm install
npm run db:push
npm run db:seed

# 2. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main

# 3. Deploy to Vercel
vercel
# Add environment variables
vercel --prod

# Done! 🚀
```

Your JPPL Distributor App will be live at: `https://your-project.vercel.app`
