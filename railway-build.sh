#!/bin/bash
# Railway build script

echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements_production.txt

echo "🗄️ Setting up database..."
python setup_database.py

echo "✅ Build complete!"
