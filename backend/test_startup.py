#!/usr/bin/env python
"""Test if the FastAPI app can start without errors"""
import sys
import asyncio

async def main():
    try:
        # Test all imports work
        print("Testing imports...")
        from app.main import app
        from app.config import settings
        print(f"✓ App imported successfully")
        print(f"✓ App title: {app.title}")
        print(f"✓ App version: {app.version}")
        print(f"✓ Total routes: {len(app.routes)}")

        # List all routes
        print("\nAvailable routes:")
        for route in app.routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                methods = ", ".join(route.methods) if route.methods else "WS"
                print(f"  {methods:20} {route.path}")

        print("\n✓ All imports successful - backend is ready!")
        print("\nTo start the server, run:")
        print("  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload")
        return 0
    except Exception as e:
        print(f"✗ Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

