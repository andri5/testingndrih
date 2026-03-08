#!/bin/bash

echo ""
echo "🔷======================================================"
echo "🔷 Test Execution Application - Automated Test Suite"
echo "🔷======================================================"
echo ""

# Check services
echo "📊 Checking service status..."
echo ""

# Backend
if curl -s http://localhost:5000/api/auth/me -H "Authorization: Bearer test" > /dev/null 2>&1; then
  echo "✅ Backend (port 5000) - Running"
else
  echo "❌ Backend (port 5000) - Not responding"
fi

# Frontend
if curl -s http://localhost:3000 | grep -q "<!DOCTYPE" > /dev/null 2>&1; then
  echo "✅ Frontend (port 3000) - Running"
else
  echo "❌ Frontend (port 3000) - Not responding"
fi

# Docker
if docker ps | grep -q "testingndri" > /dev/null 2>&1; then
  echo "✅ Database (PostgreSQL) - Running"
else
  echo "❌ Database (PostgreSQL) - Not running"
fi

echo ""
echo "🧪 Running Frontend UI Tests..."
echo ""

node tests/ui-test.js

echo ""
echo "📊 Test Report Available:"
echo ""
echo "   📄 Complete Test Report: TEST_REPORT.md"
echo "   📖 Quick Start Guide: QUICK_START.md"
echo "   ⚙️  Make Commands: Makefile (for Linux/Mac)"
echo ""

echo "🔷======================================================"
echo "🔷 ✅ All Automated Tests Completed!"
echo "🔷======================================================"
echo ""
