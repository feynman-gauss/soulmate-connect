import os
import sys

# Add the directory containing this file to sys.path
# This ensures that the 'app' module can be imported
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from app.main import app

# This file is used by Vercel serverless functions to mount the FastAPI application.
# Since it is located at api/index.py, Vercel will attempt to serve it when routes are rewritten to it.
