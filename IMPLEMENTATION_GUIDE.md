# JPPL Distributor App - Implementation Guide

## Architecture Overview

This application follows a modern full-stack architecture using Next.js 14 with the App Router pattern.

### Tech Stack Rationale

**Frontend:**
- **Next.js 14**: Server-side rendering, API routes, and excellent developer experience
- **React 18**: Component-based UI with hooks
- **TypeScript**: Type safety and better IDE support
- **Tailwind CSS**: Utility-first CSS for rapid UI development

**Backend:**
- **Next.js API Routes**: Serverless functions co-located with frontend
- **Prisma ORM**: Type-safe database access with excellent migrations
- **PostgreSQL**: Robust relational database for complex data relationships

**Authentication:**
- **Iron Session**: Secure, encrypted cookie-based sessions
- **bcryptjs**: Password hashing for admin accounts
- **Mock OTP**: Placeholder for SMS integration (Twilio/Firebase ready)

## Core Concepts

### 1. Distributor Levels

The system supports 7-8 distributor levels with different priorities:
- Platinum Plus (L1) - Highest tier
- Platinum (L2)
- Gold Plus (L3)
- Gold (L4)
- Silver Plus (L5)
- Silver (L6)
- Bronze (L7)
- Starter (L8) - Entry level

Each level can have different:
- Quarterly targets (Q1, Q2, Q3, Q4)
- Yearly targets
- Reward amounts
- Payment terms (credit days)

### 2. Scheme Management

**Schemes** are time-bound reward programs with:
- Start and end dates (e.g., April 1 - March 31)
- Multiple concurrent schemes support
- 4-5 scheme levels that map to distributor levels
- Quarterly and yearly targets per level
- Fixed reward amounts (not percentage-based)

**Scheme Levels** define:
```typescript
{
  q1Target: 5000000,      // Q1 sales target
  q1Reward: 100000,       // Fixed reward if achieved
  q2Target: 6000000,
  q2Reward: 120000,
  // ... Q3, Q4, yearly
  timelyPaymentRequired: true,
  maxCreditDays: 30
}
```

### 3. Invoice & Payment Flow

```
Invoice Creation → Items with Categories → Payments → Target Calculation
```

**Invoice:**
- Has multiple line items
- Each item belongs to a category
- Categories have different weightages
- Total amount = sum of all items

**Weighted Achievement Calculation:**
```typescript
// Example: Premium products (1.5x weightage) contribute more to targets
const weightedSales = items.reduce((sum, item) => 
  sum + (item.amount * item.category.weightage), 0
);
```

**Payment Tracking:**
- Multiple payments per invoice
- Credit days calculation (invoice date → payment date)
- Payment status: UNPAID, PARTIAL, PAID
- Timely payment affects quarterly target achievement

### 4. Achievement Calculation

**Quarterly Achievement:**
- Sum of all invoices in quarter date range
- Weighted by item categories
- Payment timeline considered
- Reward granted if: `achieved >= target && timely payment`

**Yearly Achievement:**
- Sum of all quarterly sales
- Full financial year (April - March)
- Separate reward structure

### 5. Financial Year & Quarters

Indian financial year (April to March):
- Q1: April - June
- Q2: July - September
- Q3: October - December
- Q4: January - March

All calculations use this fiscal calendar.

## Database Design Principles

### Relationships

```
DistributorLevel
  ├── Distributors (many)
  └── SchemeLevels (many)

Scheme
  ├── SchemeLevels (many)
  └── Achievements (many)

Distributor
  ├── Invoices (many)
  ├── SalesEntries (many)
  ├── Achievements (many)
  └── OTPSessions (many)

Invoice
  ├── InvoiceItems (many)
  └── Payments (many)

InvoiceItem
  └── ItemCategory (one)
```

### Key Indexes

- `Invoice.invoiceDate` - Fast date range queries
- `Invoice.distributorId` - Distributor invoice lookup
- `OTPSession.phone + expiresAt` - Fast OTP verification
- `Achievement.distributorId + schemeId` - Unique per period

## API Design Patterns

### Authentication Middleware

```typescript
// Protect routes
const session = await requireAuth('admin'); // or 'distributor'
```

### Error Handling

```typescript
try {
  // Operation
  return NextResponse.json({ data });
} catch (error: any) {
  return NextResponse.json(
    { error: error.message || 'Operation failed' },
    { status: error.message === 'Unauthorized' ? 401 : 500 }
  );
}
```

### Pagination Pattern

```typescript
const page = parseInt(searchParams.get('page') || '1');
const limit = parseInt(searchParams.get('limit') || '20');
const skip = (page - 1) * limit;

const [items, total] = await Promise.all([
  prisma.model.findMany({ skip, take: limit }),
  prisma.model.count()
]);

return {
  items,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  }
};
```

## Extending the System

### Adding a New Admin Feature

1. **Create API Route:**
```typescript
// src/app/api/admin/my-feature/route.ts
import { requireAuth } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  await requireAuth('admin');
  // Your logic
}
```

2. **Create UI Page:**
```typescript
// src/app/admin/my-feature/page.tsx
'use client';
import Navbar from '@/components/Navbar';

export default function MyFeaturePage() {
  // Your component
}
```

3. **Add to Dashboard:**
Update `src/app/admin/dashboard/page.tsx` to add a link.

### Adding a New Distributor Level

1. **Update Seed File:**
```typescript
// prisma/seed.ts
const distributorLevels = [
  { name: 'VIP', code: 'L0', priority: 0 },
  // ... existing levels
];
```

2. **Run Migration:**
```bash
npm run db:seed
```

### Adding a New Item Category

Similar to distributor levels:

```typescript
// prisma/seed.ts
const itemCategories = [
  { 
    name: 'Special Products', 
    code: 'CAT6', 
    weightage: 2.0  // Higher weightage
  },
];
```

### Customizing Reward Logic

Current logic is in `src/app/api/distributor/dashboard/route.ts`.

To add complex calculations:

```typescript
// Example: Progressive rewards
const calculateReward = (achieved: number, target: number, baseReward: number) => {
  const percentage = (achieved / target) * 100;
  
  if (percentage >= 100) return baseReward;
  if (percentage >= 90) return baseReward * 0.8;
  if (percentage >= 80) return baseReward * 0.6;
  return 0;
};
```

### Integrating Real OTP Service

**Twilio Example:**

```typescript
// src/lib/otp.ts
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendOTP(phone: string): Promise<{ success: boolean; otp?: string }> {
  const otp = generateOTP();
  
  await client.messages.create({
    body: `Your JPPL OTP is: ${otp}. Valid for 5 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
  
  return { success: true, otp };
}
```

## Performance Optimizations

### Database Query Optimization

1. **Use `include` wisely:**
```typescript
// Good: Only include what you need
const distributor = await prisma.distributor.findUnique({
  where: { id },
  include: {
    distributorLevel: true,
    invoices: {
      take: 10,  // Limit
      orderBy: { invoiceDate: 'desc' },
    },
  },
});

// Bad: Over-fetching
const distributor = await prisma.distributor.findUnique({
  where: { id },
  include: {
    invoices: {
      include: {
        items: {
          include: {
            itemCategory: true
          }
        },
        payments: true
      }
    }
  },
});
```

2. **Use aggregations:**
```typescript
// Efficient
const total = await prisma.invoice.aggregate({
  where: { distributorId },
  _sum: { totalAmount: true },
});

// Less efficient
const invoices = await prisma.invoice.findMany({ where: { distributorId } });
const total = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
```

### Caching Strategy

For frequently accessed data:

```typescript
// Example: Cache distributor levels
import { unstable_cache } from 'next/cache';

export const getDistributorLevels = unstable_cache(
  async () => {
    return await prisma.distributorLevel.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
    });
  },
  ['distributor-levels'],
  { revalidate: 3600 } // 1 hour
);
```

## Security Best Practices

### 1. Input Validation

Use Zod for runtime validation:

```typescript
import { z } from 'zod';

const distributorSchema = z.object({
  phone: z.string().regex(/^[+]?[0-9]{10,12}$/),
  name: z.string().min(3).max(100),
  email: z.string().email().optional(),
  distributorLevelId: z.string().cuid(),
});

// In API route
const data = distributorSchema.parse(await request.json());
```

### 2. Rate Limiting

For OTP endpoints:

```typescript
// Simple in-memory rate limiter
const attempts = new Map<string, number>();

export function checkRateLimit(phone: string): boolean {
  const count = attempts.get(phone) || 0;
  if (count >= 3) return false;
  
  attempts.set(phone, count + 1);
  setTimeout(() => attempts.delete(phone), 15 * 60 * 1000); // 15 min
  
  return true;
}
```

### 3. SQL Injection Prevention

Prisma automatically prevents SQL injection, but if using raw queries:

```typescript
// Safe
await prisma.$queryRaw`
  SELECT * FROM "Distributor" WHERE phone = ${phone}
`;

// Unsafe (don't do this)
await prisma.$queryRawUnsafe(
  `SELECT * FROM "Distributor" WHERE phone = '${phone}'`
);
```

## Testing Strategy

### Unit Tests (Recommended to add)

```typescript
// Example: utils.test.ts
import { getQuarter, calculateCreditDays } from '@/lib/utils';

describe('getQuarter', () => {
  it('returns Q1 for April', () => {
    expect(getQuarter(new Date('2024-04-15'))).toBe('Q1');
  });
  
  it('returns Q4 for March', () => {
    expect(getQuarter(new Date('2024-03-15'))).toBe('Q4');
  });
});
```

### Integration Tests

```typescript
// Example: Test invoice creation API
describe('POST /api/admin/invoices', () => {
  it('creates invoice successfully', async () => {
    const response = await fetch('/api/admin/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoiceNumber: 'INV-001',
        distributorId: 'dist123',
        // ... more data
      }),
    });
    
    expect(response.status).toBe(201);
  });
});
```

## Deployment Checklist

- [ ] Set strong `SESSION_SECRET` (32+ random characters)
- [ ] Change default admin password
- [ ] Set up production database with backups
- [ ] Configure environment variables in Vercel
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Run database migrations and seed
- [ ] Test OTP integration (if using real SMS)
- [ ] Set up error monitoring (Sentry)
- [ ] Configure domain name
- [ ] Test all user flows (admin & distributor)
- [ ] Set up automated backups
- [ ] Document any custom configurations

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
npx prisma db execute --stdin <<< "SELECT 1"

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database in GUI
npx prisma studio
```

### Session Issues

- Clear cookies and restart browser
- Check `SESSION_SECRET` is set
- Verify session cookie is being set (browser DevTools)

### OTP Not Working

- Check phone number format (+91XXXXXXXXXX)
- Verify OTP hasn't expired (5 minutes)
- In development, check console for mock OTP
- Ensure distributor exists with that phone number

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
npx prisma generate

# Rebuild
npm run build
```

## Support

For questions or issues:
1. Check this guide and README.md
2. Review database schema in `prisma/schema.prisma`
3. Check API routes in `src/app/api/`
4. Contact development team

---

**Happy coding! 🚀**
