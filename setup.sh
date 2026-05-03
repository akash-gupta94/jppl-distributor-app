#!/bin/bash

echo "=================================================="
echo "  JPPL Distributor App - Setup Script"
echo "=================================================="
echo ""

# Check if Node.js is installed
echo "1. Checking Node.js..."
if command -v node &> /dev/null
then
    NODE_VERSION=$(node -v)
    echo "   ✅ Node.js is installed: $NODE_VERSION"
else
    echo "   ❌ Node.js is not installed"
    echo "   Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
echo "2. Checking npm..."
if command -v npm &> /dev/null
then
    NPM_VERSION=$(npm -v)
    echo "   ✅ npm is installed: $NPM_VERSION"
else
    echo "   ❌ npm is not installed"
    exit 1
fi

# Install dependencies
echo ""
echo "3. Installing dependencies..."
npm install
if [ $? -eq 0 ]; then
    echo "   ✅ Dependencies installed successfully"
else
    echo "   ❌ Failed to install dependencies"
    exit 1
fi

# Check if .env exists
echo ""
echo "4. Checking .env file..."
if [ -f .env ]; then
    echo "   ✅ .env file exists"

    # Check if DATABASE_URL is configured
    if grep -q "DATABASE_URL=\"postgresql://username:password" .env; then
        echo ""
        echo "   ⚠️  WARNING: Database URL needs to be configured!"
        echo ""
        echo "   Please update the DATABASE_URL in .env file with your PostgreSQL credentials:"
        echo "   DATABASE_URL=\"postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/jppl_distributor_db\""
        echo ""
        read -p "   Have you set up PostgreSQL and updated DATABASE_URL? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]
        then
            echo ""
            echo "   Please configure your database first. Here's how:"
            echo ""
            echo "   Option 1: Local PostgreSQL"
            echo "   - Install PostgreSQL from https://www.postgresql.org/download/"
            echo "   - Create database: createdb jppl_distributor_db"
            echo "   - Update DATABASE_URL in .env"
            echo ""
            echo "   Option 2: Cloud Database (Recommended)"
            echo "   - Neon: https://neon.tech (Free PostgreSQL)"
            echo "   - Supabase: https://supabase.com (Free PostgreSQL)"
            echo "   - Copy connection string to DATABASE_URL in .env"
            echo ""
            exit 1
        fi
    fi
else
    echo "   ❌ .env file not found"
    exit 1
fi

# Try to push database schema
echo ""
echo "5. Setting up database..."
npm run db:push
if [ $? -eq 0 ]; then
    echo "   ✅ Database schema created"
else
    echo "   ❌ Failed to create database schema"
    echo ""
    echo "   Common issues:"
    echo "   - PostgreSQL is not running"
    echo "   - DATABASE_URL is incorrect"
    echo "   - Database doesn't exist"
    echo ""
    echo "   Please check your database connection and try again."
    exit 1
fi

# Seed the database
echo ""
echo "6. Seeding database with initial data..."
npm run db:seed
if [ $? -eq 0 ]; then
    echo "   ✅ Database seeded successfully"
else
    echo "   ⚠️  Database seeding failed (you can do this manually later)"
fi

echo ""
echo "=================================================="
echo "  ✅ Setup Complete!"
echo "=================================================="
echo ""
echo "You can now start the development server:"
echo ""
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo ""
echo "Default login credentials:"
echo "  Admin: admin@jppl.com / admin123"
echo "  Distributor: 9876543210 / OTP: 123456"
echo ""
echo "=================================================="
