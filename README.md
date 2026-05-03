# JPPL Distributor Management System

A comprehensive web application for managing distributors, schemes, sales tracking, and reward management for JPP and Company General Politics Private Limited.

## Features

### Admin Module
- **Distributor Management**: Create, update, and manage distributors across 7-8 different levels
- **Scheme Management**: Create and manage reward schemes with multiple levels and durations
- **Invoice Management**: Create invoices with 4-5 item categories and different weightages
- **Payment Tracking**: Record and track payments against invoices
- **Sales Entry**: Date-wise sales data entry with automatic quarterly and yearly totaling
- **Reward Configuration**: Set fixed-amount rewards per distributor level and achievement category
- **Reports & Analytics**: Track distributor performance and achievements

### Distributor Portal
- **OTP-based Login**: Secure phone number-based authentication with OTP
- **Dashboard**: View quarterly and yearly targets with progress tracking
- **Achievement Tracking**: Real-time visibility of sales achievements
- **Reward Display**: View potential and earned rewards
- **Invoice History**: View pending and paid invoices
- **Payment Status**: Track payment timelines and credit days

## Technical Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Iron Session for session management
- **OTP**: Mock implementation (ready for Twilio/Firebase integration)
- **Deployment**: Optimized for Vercel

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

## Installation

### 1. Clone or extract the project

```bash
cd jppl-distributor-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/jppl_distributor_db"

# Session Secret (generate a random 32+ character string)
SESSION_SECRET="your-super-secret-key-change-this-in-production"

# Admin Credentials
ADMIN_EMAIL="admin@jppl.com"
ADMIN_PASSWORD="admin123"

# App Configuration
NEXT_PUBLIC_APP_NAME="JPPL Distributor Portal"
NEXT_PUBLIC_COMPANY_NAME="JPP and Company General Politics Private Limited"
```

### 4. Database Setup

```bash
# Push the Prisma schema to your database
npm run db:push

# Seed the database with initial data
npm run db:seed
```

The seed script will create:
- Admin user (admin@jppl.com / admin123)
- 8 distributor levels (Platinum Plus to Starter)
- 5 item categories with different weightages
- Sample scheme (Annual Scheme 2024-25)
- Sample distributor (+919876543210)

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Credentials

### Admin Login
- Email: `admin@jppl.com`
- Password: `admin123`

### Distributor Login
- Phone: `+919876543210` or `9876543210`
- OTP: `123456` (mock OTP in development)

## Project Structure

```
jppl-distributor-app/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding script
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── dashboard/     # Admin dashboard
│   │   │   └── login/         # Admin login page
│   │   ├── distributor/
│   │   │   ├── dashboard/     # Distributor dashboard
│   │   │   └── login/         # Distributor OTP login
│   │   ├── api/
│   │   │   ├── auth/          # Authentication routes
│   │   │   ├── admin/         # Admin API routes
│   │   │   └── distributor/   # Distributor API routes
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   └── Navbar.tsx         # Navigation component
│   └── lib/
│       ├── prisma.ts          # Prisma client
│       ├── session.ts         # Session management
│       ├── otp.ts             # OTP service
│       └── utils.ts           # Utility functions
├── .env.example               # Environment variables template
├── package.json               # Dependencies
├── tailwind.config.js         # Tailwind configuration
└── tsconfig.json              # TypeScript configuration
```

## Database Schema

### Key Models

- **Admin**: Administrator users
- **DistributorLevel**: 7-8 distributor tiers (Platinum, Gold, Silver, etc.)
- **Distributor**: Dealer/distributor accounts
- **Scheme**: Reward schemes with duration-based targets
- **SchemeLevel**: Targets and rewards per distributor level
- **Invoice**: Sales invoices with items
- **InvoiceItem**: Invoice line items with category weightages
- **Payment**: Payment records against invoices
- **ItemCategory**: Product categories with different weightages
- **Achievement**: Quarterly and yearly achievement tracking
- **OTPSession**: OTP verification sessions

## API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/distributor/send-otp` - Send OTP to distributor
- `POST /api/auth/distributor/verify-otp` - Verify OTP and login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Check current session

### Admin APIs
- `GET /api/admin/distributors` - List all distributors
- `POST /api/admin/distributors` - Create distributor
- `PUT /api/admin/distributors/[id]` - Update distributor
- `DELETE /api/admin/distributors/[id]` - Delete (soft) distributor
- `GET /api/admin/schemes` - List schemes
- `POST /api/admin/schemes` - Create scheme
- `GET /api/admin/invoices` - List invoices
- `POST /api/admin/invoices` - Create invoice
- `POST /api/admin/payments` - Record payment

### Distributor APIs
- `GET /api/distributor/dashboard` - Get dashboard data with targets, achievements, and rewards

### Utility APIs
- `GET /api/levels` - Get all distributor levels
- `GET /api/categories` - Get all item categories

## Deployment on Vercel

### 1. Push code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Set up PostgreSQL database

You can use:
- **Vercel Postgres**: Built-in PostgreSQL database
- **Neon**: Free PostgreSQL hosting
- **Supabase**: PostgreSQL with additional features
- **Railway**: Easy PostgreSQL deployment

### 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `NEXT_PUBLIC_APP_NAME`
   - `NEXT_PUBLIC_COMPANY_NAME`

4. Deploy!

### 4. Run database migrations

After deployment, run:

```bash
# Using Vercel CLI
vercel env pull
npm run db:push
npm run db:seed
```

Or set up automatic migrations in your deployment pipeline.

## OTP Integration

The app currently uses a **mock OTP system** for development. To integrate with a real SMS provider:

### Twilio Integration

1. Install Twilio SDK:
```bash
npm install twilio
```

2. Add to `.env`:
```env
OTP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

3. Update `src/lib/otp.ts` - uncomment the Twilio integration code in the `sendOTP` function.

### Firebase Integration

1. Install Firebase:
```bash
npm install firebase-admin
```

2. Add Firebase credentials to `.env`

3. Update `src/lib/otp.ts` with Firebase phone authentication

## Customization

### Adding More Distributor Levels

Edit `prisma/seed.ts` to add more levels:

```typescript
const distributorLevels = [
  { name: 'Diamond', code: 'L0', description: 'Elite distributor', priority: 0 },
  // ... add more levels
];
```

### Adding More Item Categories

Update the seed file with additional categories:

```typescript
const itemCategories = [
  { name: 'New Category', code: 'CAT6', description: 'Description', weightage: 1.0 },
  // ...
];
```

### Configuring Reward Calculation

Rewards are **fixed amounts** configured per scheme level. Edit in the admin panel or seed file:

```typescript
q1Reward: 100000,  // Fixed amount for Q1
q2Reward: 120000,  // Fixed amount for Q2
// ...
```

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database commands
npm run db:push     # Push schema to database
npm run db:studio   # Open Prisma Studio (GUI)
npm run db:seed     # Seed database with initial data

# Linting
npm run lint
```

## Security Considerations

1. **Session Secret**: Use a strong, random 32+ character string for `SESSION_SECRET`
2. **Admin Password**: Change the default admin password immediately
3. **HTTPS**: Always use HTTPS in production
4. **Environment Variables**: Never commit `.env` files to version control
5. **OTP Security**: Implement rate limiting on OTP endpoints in production
6. **Database**: Use connection pooling and secure database credentials

## Support & Maintenance

### Database Backups

Set up regular backups of your PostgreSQL database:

```bash
# Manual backup
pg_dump -U username -d jppl_distributor_db > backup_$(date +%Y%m%d).sql

# Restore
psql -U username -d jppl_distributor_db < backup_20241231.sql
```

### Monitoring

Consider adding:
- Error tracking (Sentry)
- Analytics (Google Analytics, Plausible)
- Uptime monitoring (UptimeRobot)
- Performance monitoring (Vercel Analytics)

## Future Enhancements

- [ ] Excel/PDF export for reports
- [ ] Email notifications for achievements
- [ ] SMS notifications via Twilio
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Bulk import/export of data
- [ ] Mobile app (React Native)
- [ ] Real-time updates with WebSockets

## License

Proprietary - JPP and Company General Politics Private Limited

## Contact

For support or inquiries, contact the development team.

---

**Built with ❤️ for JPPL Distributors**
