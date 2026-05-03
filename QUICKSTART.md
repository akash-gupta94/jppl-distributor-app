# Quick Start Guide

Get the JPPL Distributor App running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Terminal/Command prompt

## Step-by-Step Setup

### 1. Navigate to project directory

```bash
cd jppl-distributor-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create .env file

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 4. Configure your database

Edit `.env` and update the `DATABASE_URL`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/jppl_distributor_db"
```

**Quick PostgreSQL Setup (if needed):**

```bash
# Create database
createdb jppl_distributor_db

# Your DATABASE_URL will be:
# DATABASE_URL="postgresql://your_username:your_password@localhost:5432/jppl_distributor_db"
```

### 5. Set up database

```bash
# Push schema to database
npm run db:push

# Seed with initial data
npm run db:seed
```

### 6. Start development server

```bash
npm run dev
```

### 7. Open in browser

Go to [http://localhost:3000](http://localhost:3000)

## Default Login Credentials

### Admin Portal
- URL: http://localhost:3000/admin/login
- Email: `admin@jppl.com`
- Password: `admin123`

### Distributor Portal  
- URL: http://localhost:3000/distributor/login
- Phone: `9876543210` (or `+919876543210`)
- OTP: `123456` (mock OTP in development)

## What's Been Created?

After seeding, your database contains:

✅ **1 Admin User** - Full access to admin portal

✅ **8 Distributor Levels**
- Platinum Plus (L1)
- Platinum (L2)
- Gold Plus (L3)
- Gold (L4)
- Silver Plus (L5)
- Silver (L6)
- Bronze (L7)
- Starter (L8)

✅ **5 Item Categories**
- Premium Products (1.5x weightage)
- Standard Products (1.0x weightage)
- Value Products (0.8x weightage)
- Seasonal Products (1.2x weightage)
- New Launch (1.3x weightage)

✅ **1 Sample Scheme**
- Annual Scheme 2024-25
- With targets for top 5 distributor levels

✅ **1 Sample Distributor**
- Phone: +919876543210
- Level: Gold Plus
- Active and ready to login

## Next Steps

1. **Explore Admin Dashboard**
   - Login as admin
   - View all sections
   - Create new distributors, schemes, invoices

2. **Test Distributor Portal**
   - Login as sample distributor
   - View targets and achievements
   - Check dashboard features

3. **Customize Data**
   - Edit `prisma/seed.ts` to add your own data
   - Run `npm run db:seed` again

4. **Configure for Production**
   - Change admin password
   - Set strong SESSION_SECRET
   - Set up production database
   - Deploy to Vercel (see README.md)

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm start               # Start production server

# Database
npm run db:push         # Push schema changes
npm run db:studio       # Open database GUI
npm run db:seed         # Seed data

# Utilities
npm run lint            # Run linter
```

## Troubleshooting

### "Database connection failed"
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Test connection: `psql -U username -d jppl_distributor_db`

### "Module not found"
- Run `npm install` again
- Delete `node_modules` and run `npm install`

### "Prisma Client not found"
- Run `npx prisma generate`

### Port 3000 already in use
- Kill the process: `lsof -ti:3000 | xargs kill`
- Or use different port: `PORT=3001 npm run dev`

## Need Help?

Check these files:
- `README.md` - Comprehensive documentation
- `IMPLEMENTATION_GUIDE.md` - Technical details and architecture
- `prisma/schema.prisma` - Database schema

## Video Tutorial (Recommended)

Coming soon! Follow these steps for now.

---

**You're all set! Happy distributing! 🎉**
