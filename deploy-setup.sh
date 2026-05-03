#!/bin/bash

echo "=================================================="
echo "  JPPL Distributor App - Deployment Setup"
echo "=================================================="
echo ""
echo "Database: jppl-dealer-app @ smaacsync.smaac.in"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Step 1: Install dependencies
echo "Step 1/3: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Step 2: Push database schema
echo "Step 2/3: Creating database schema..."
echo "Connecting to: smaacsync.smaac.in/jppl-dealer-app"
npm run db:push
if [ $? -ne 0 ]; then
    echo "❌ Failed to create database schema"
    echo ""
    echo "Common issues:"
    echo "- Database server is not accessible"
    echo "- Firewall blocking connection"
    echo "- Invalid credentials"
    echo ""
    echo "Please verify database connection and try again."
    exit 1
fi
echo "✅ Database schema created"
echo ""

# Step 3: Seed database
echo "Step 3/3: Seeding initial data..."
npm run db:seed
if [ $? -ne 0 ]; then
    echo "⚠️  Seeding failed (you can add data manually via admin panel)"
    echo ""
else
    echo "✅ Database seeded successfully"
    echo ""
    echo "Initial data created:"
    echo "  - 1 Admin user (admin@jppl.com / admin123)"
    echo "  - 8 Distributor levels (Platinum Plus → Starter)"
    echo "  - 5 Item categories with weightages"
    echo "  - 1 Sample scheme (FY 2024-25)"
    echo "  - 1 Sample distributor (+919876543210)"
    echo ""
fi

echo "=================================================="
echo "  ✅ Setup Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Test locally (optional):"
echo "   npm run dev"
echo "   Open: http://localhost:3000"
echo ""
echo "2. Deploy to Vercel:"
echo "   vercel"
echo ""
echo "   Don't forget to add environment variables in Vercel:"
echo "   - DATABASE_URL"
echo "   - SESSION_SECRET"
echo "   - ADMIN_EMAIL"
echo "   - ADMIN_PASSWORD"
echo ""
echo "   See DEPLOY.md for detailed instructions"
echo ""
echo "=================================================="
