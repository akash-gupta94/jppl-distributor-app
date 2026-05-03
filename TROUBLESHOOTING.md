# Troubleshooting Guide

## Localhost Not Working?

Follow these steps to diagnose and fix the issue.

## Step 1: Check Prerequisites

### A. Node.js installed?
```bash
node -v
```
Should show v18.x.x or higher. If not, install from [nodejs.org](https://nodejs.org/)

### B. npm installed?
```bash
npm -v
```
Should show version number. Comes with Node.js.

## Step 2: Install Dependencies

In the project folder:
```bash
npm install
```

**Common errors:**
- `npm: command not found` → Install Node.js
- `EACCES permission denied` → Run with sudo or fix npm permissions
- Network errors → Check internet connection

## Step 3: Configure Database

### Option 1: Use Neon (Easiest - Free Cloud PostgreSQL)

1. Go to [neon.tech](https://neon.tech)
2. Sign up (free)
3. Create a new project
4. Copy the connection string
5. Update `.env`:
   ```env
   DATABASE_URL="postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

### Option 2: Use Supabase (Also Free)

1. Go to [supabase.com](https://supabase.com)
2. Create account and new project
3. Go to Settings → Database
4. Copy "Connection string" → "Nodejs"
5. Update `.env` with the connection string

### Option 3: Local PostgreSQL

**Install PostgreSQL:**

**Mac:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from [postgresql.org](https://www.postgresql.org/download/windows/)

**Create Database:**
```bash
# Mac/Linux
createdb jppl_distributor_db

# Or use psql
psql postgres
CREATE DATABASE jppl_distributor_db;
\q
```

**Update .env:**
```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/jppl_distributor_db"
```

Replace:
- `YOUR_USERNAME` - your PostgreSQL username (default: `postgres`)
- `YOUR_PASSWORD` - your PostgreSQL password

## Step 4: Set Up Database Schema

```bash
npm run db:push
```

**Common errors:**

### Error: "Can't reach database server"
- PostgreSQL is not running
- DATABASE_URL is incorrect
- Firewall blocking connection

**Fix:**
```bash
# Check if PostgreSQL is running (Mac/Linux)
ps aux | grep postgres

# Start PostgreSQL (Mac)
brew services start postgresql@15

# Start PostgreSQL (Linux)
sudo systemctl start postgresql

# Check PostgreSQL status (Linux)
sudo systemctl status postgresql
```

### Error: "Authentication failed"
- Wrong username/password in DATABASE_URL
- User doesn't exist

**Fix:**
```bash
# Reset PostgreSQL password (Mac/Linux)
psql postgres
ALTER USER postgres PASSWORD 'newpassword';
\q
```

### Error: "Database does not exist"
Create the database first:
```bash
createdb jppl_distributor_db
```

## Step 5: Seed the Database

```bash
npm run db:seed
```

This creates:
- Admin user
- Distributor levels
- Item categories
- Sample scheme
- Sample distributor

**If seeding fails:** You can skip this and add data manually through the admin panel.

## Step 6: Start Development Server

```bash
npm run dev
```

Should see:
```
  ▲ Next.js 14.2.3
  - Local:        http://localhost:3000
  - Environments: .env

 ✓ Ready in 2.3s
```

**Common errors:**

### Port 3000 already in use

**Fix:**
```bash
# Kill process on port 3000 (Mac/Linux)
lsof -ti:3000 | xargs kill

# Or use different port
PORT=3001 npm run dev
```

**Windows:**
```cmd
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Module not found errors

**Fix:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Prisma Client errors

**Fix:**
```bash
npx prisma generate
npm run dev
```

## Step 7: Open in Browser

Go to: [http://localhost:3000](http://localhost:3000)

Should see the landing page with two login options.

## Common Issues & Solutions

### Issue: "Cannot connect to database"

**Solution:**
1. Check DATABASE_URL in `.env`
2. Ensure PostgreSQL is running
3. Test connection:
   ```bash
   npx prisma db execute --stdin <<< "SELECT 1"
   ```

### Issue: "Invalid credentials" when logging in

**Admin:**
- Default: `admin@jppl.com` / `admin123`
- Check if you ran `npm run db:seed`

**Distributor:**
- Default phone: `9876543210` or `+919876543210`
- Default OTP: `123456` (mock in development)

### Issue: Blank page or 404 errors

**Solution:**
1. Stop the server (Ctrl+C)
2. Delete `.next` folder:
   ```bash
   rm -rf .next
   ```
3. Restart:
   ```bash
   npm run dev
   ```

### Issue: Styles not loading

**Solution:**
```bash
# Rebuild
npm run build
npm run dev
```

### Issue: Database schema out of sync

**Solution:**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or just push schema again
npm run db:push
```

## Quick Setup Script

We've created a setup script that does everything for you:

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

**Manual steps if script doesn't work:**
1. `npm install`
2. Update DATABASE_URL in `.env`
3. `npm run db:push`
4. `npm run db:seed`
5. `npm run dev`

## Still Having Issues?

### Check these files exist:
- `package.json`
- `.env`
- `prisma/schema.prisma`
- `src/app/page.tsx`

### Check Node.js version:
```bash
node -v  # Should be v18 or higher
```

### Check if all dependencies installed:
```bash
ls node_modules | wc -l  # Should show 300+ packages
```

### View detailed logs:
```bash
npm run dev -- --debug
```

### Test database connection:
```bash
npx prisma studio
```
Should open a GUI at http://localhost:5555

## Getting Help

If you're still stuck, check:
1. Your DATABASE_URL is correct
2. PostgreSQL is running
3. Node.js 18+ is installed
4. All dependencies are installed (`npm install`)
5. `.env` file exists with proper values

## Emergency Reset

If nothing works, start fresh:

```bash
# Backup .env if you have custom settings
cp .env .env.backup

# Clean everything
rm -rf node_modules package-lock.json .next

# Reinstall
npm install

# Push schema
npm run db:push

# Seed
npm run db:seed

# Start
npm run dev
```

---

**Need more help?** Check the error message carefully - it usually tells you exactly what's wrong!
