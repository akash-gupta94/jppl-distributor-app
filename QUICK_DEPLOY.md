# 🚀 Quick Deploy to Vercel - 3 Simple Steps

## ✅ Database is already configured!
Your PostgreSQL database credentials are set in `.env`

---

## Step 1️⃣: Setup Database (2 minutes)

Open terminal in this folder and run:

```bash
chmod +x deploy-setup.sh
./deploy-setup.sh
```

Or manually:
```bash
npm install
npm run db:push
npm run db:seed
```

**What this does:**
- Installs dependencies
- Creates database tables
- Seeds initial data (admin, levels, categories, sample scheme)

---

## Step 2️⃣: Push to GitHub (1 minute)

```bash
git init
git add .
git commit -m "JPPL Distributor App - Initial Deploy"
```

Create a new repository on [GitHub](https://github.com/new), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/jppl-distributor-app.git
git branch -M main
git push -u origin main
```

---

## Step 3️⃣: Deploy to Vercel (2 minutes)

### Option A: CLI (Recommended)

```bash
# Install Vercel CLI if needed
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables (copy from VERCEL_ENV_VARS.txt)
vercel env add DATABASE_URL production
vercel env add SESSION_SECRET production
vercel env add ADMIN_EMAIL production
vercel env add ADMIN_PASSWORD production
vercel env add NEXT_PUBLIC_APP_NAME production
vercel env add NEXT_PUBLIC_COMPANY_NAME production

# Deploy to production
vercel --prod
```

### Option B: Dashboard

1. Go to [vercel.com](https://vercel.com/new)
2. Import your GitHub repository
3. Add environment variables from `VERCEL_ENV_VARS.txt`
4. Click Deploy

---

## 🎉 Done!

Your app will be live at: `https://your-project-name.vercel.app`

**Test it:**
- Admin: admin@jppl.com / admin123
- Distributor: 9876543210 / OTP: 123456

---

## 📋 Environment Variables Quick Reference

See `VERCEL_ENV_VARS.txt` for all the values to add in Vercel.

**Required variables:**
- DATABASE_URL
- SESSION_SECRET  
- ADMIN_EMAIL
- ADMIN_PASSWORD
- NEXT_PUBLIC_APP_NAME
- NEXT_PUBLIC_COMPANY_NAME

---

## 🔧 Troubleshooting

**Database connection fails:**
```bash
npm run db:push
```
If this works, your database is fine. Add DATABASE_URL to Vercel.

**Build fails on Vercel:**
- Check all environment variables are added
- Redeploy: `vercel --prod`

**Need detailed help?**
See `DEPLOY.md` for comprehensive deployment guide.

---

## 📞 Support

Check these files:
- `DEPLOY.md` - Detailed deployment instructions
- `VERCEL_ENV_VARS.txt` - Environment variables to copy
- `README.md` - Full documentation

---

**Total Time:** ~5 minutes
**Result:** Live production app on Vercel! 🚀
