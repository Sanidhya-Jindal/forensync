#!/bin/bash

# Exit on error
set -o errexit

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements_face_recognition.txt

# Create necessary directories
mkdir -p photos/missing_persons
mkdir -p photos/unidentified_bodies
mkdir -p qdrant_data

# Initialize database
python setup_database.py

echo "Build completed successfully!"
