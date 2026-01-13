# VS Code Setup for Soulmate Connect

This directory contains VS Code workspace configurations for the Soulmate Connect project.

## Quick Start

### Option 1: Open Workspace File (Recommended)
1. Open VS Code
2. File → Open Workspace from File
3. Select `soulmate-connect.code-workspace`
4. Install recommended extensions when prompted

### Option 2: Open Folder
1. Open VS Code
2. File → Open Folder
3. Select the root directory
4. Install recommended extensions when prompted

## What's Included

### 📁 Configuration Files

#### `settings.json`
Project-specific settings for:
- **Python**: Black formatter, Flake8 linter, type checking
- **TypeScript/React**: ESLint, Prettier, auto-imports
- **Tailwind CSS**: IntelliSense configuration
- **Editor**: Auto-save, format on save, rulers at 80/120 chars

#### `extensions.json`
Recommended extensions for:
- Python development (Pylance, Black, Flake8)
- React/TypeScript (ESLint, Prettier)
- Tailwind CSS IntelliSense
- MongoDB and Redis clients
- Docker support
- Git tools (GitLens, Git Graph)
- Code quality tools

#### `launch.json`
Debug configurations:
- **Python: FastAPI Backend** - Debug the FastAPI server
- **Python: Current File** - Debug any Python file
- **Python: Backend Tests** - Debug pytest tests
- **Chrome/Edge: Frontend** - Debug React app in browser
- **Full Stack** - Debug backend and frontend together

#### `tasks.json`
Common development tasks:
- Start backend/frontend servers
- Run tests
- Format and lint code
- Install dependencies
- Docker operations
- Combined tasks (start full stack, install all deps)

#### `soulmate-connect.code-workspace`
Multi-root workspace file with three folders:
- 🏠 Root - Project root
- 🐍 Backend (FastAPI) - Python backend
- ⚛️ Frontend (React) - React frontend

## Usage Guide

### Starting Development

#### Method 1: Using Tasks (Recommended)
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Run Task"
3. Select "Start Full Stack Development"

This starts both backend and frontend servers in split terminals.

#### Method 2: Using Debug
1. Press `F5` or go to Run and Debug panel
2. Select "Full Stack: Backend + Frontend"
3. Click Start Debugging

#### Method 3: Using Terminal
Open two terminals:
```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Running Tests

#### Backend Tests
- Press `Ctrl+Shift+P` → "Run Task" → "Backend: Run Tests"
- Or use debug configuration: "Python: Backend Tests"

#### Debugging Python
1. Set breakpoints in Python files
2. Press `F5` → Select "Python: FastAPI Backend"
3. Access API endpoints to trigger breakpoints

#### Debugging React
1. Set breakpoints in TypeScript files
2. Press `F5` → Select "Chrome: Frontend"
3. Browser opens with debugger attached

### Code Formatting

#### Auto-format on Save
Both Python (Black) and TypeScript (Prettier) are configured to format on save.

#### Manual Formatting
- Python: `Ctrl+Shift+P` → "Run Task" → "Backend: Format Code (Black)"
- TypeScript: `Shift+Alt+F` (or right-click → Format Document)

### Linting

#### Python (Flake8)
- Runs automatically as you type
- Manual run: `Ctrl+Shift+P` → "Run Task" → "Backend: Lint (Flake8)"

#### TypeScript (ESLint)
- Runs automatically as you type
- Manual run: `Ctrl+Shift+P` → "Run Task" → "Frontend: Lint"

### Installing Dependencies

#### Install All Dependencies
`Ctrl+Shift+P` → "Run Task" → "Install All Dependencies"

This installs both backend (pip) and frontend (npm) dependencies in parallel.

## Recommended Extensions

When you open the workspace, VS Code will prompt you to install recommended extensions. Here are the most important ones:

### Essential
- **Python** - Python language support
- **Pylance** - Fast Python language server
- **Black Formatter** - Python code formatter
- **ESLint** - JavaScript/TypeScript linter
- **Prettier** - Code formatter
- **Tailwind CSS IntelliSense** - Tailwind autocomplete

### Helpful
- **GitLens** - Enhanced Git capabilities
- **Error Lens** - Inline error messages
- **Todo Tree** - Track TODO comments
- **Material Icon Theme** - Better file icons
- **MongoDB for VS Code** - MongoDB client
- **Redis** - Redis client

### Optional
- **Docker** - Container management
- **REST Client** - Test API endpoints
- **Import Cost** - Show import sizes

## Tips & Tricks

### Multi-Cursor Editing
- `Alt+Click` - Add cursor
- `Ctrl+Alt+Up/Down` - Add cursor above/below
- `Ctrl+D` - Select next occurrence

### Quick Navigation
- `Ctrl+P` - Quick file open
- `Ctrl+Shift+P` - Command palette
- `Ctrl+T` - Go to symbol
- `F12` - Go to definition
- `Shift+F12` - Find all references

### Terminal Management
- `` Ctrl+` `` - Toggle terminal
- `Ctrl+Shift+5` - Split terminal
- `Alt+Up/Down` - Switch between terminals

### Python-Specific
- `F5` - Start debugging
- `F9` - Toggle breakpoint
- `F10` - Step over
- `F11` - Step into
- `Shift+F11` - Step out

### React-Specific
- Type `rafce` - Create React component (with ES7 snippets)
- Type `imr` - Import React
- `Ctrl+Space` - Trigger IntelliSense
- Hover over Tailwind classes for documentation

## Troubleshooting

### Python Virtual Environment Not Detected
1. Press `Ctrl+Shift+P`
2. Type "Python: Select Interpreter"
3. Choose the interpreter in `backend/.venv/bin/python`

### ESLint Not Working
1. Ensure you're in the frontend directory context
2. Check that `eslint.config.js` exists
3. Reload window: `Ctrl+Shift+P` → "Reload Window"

### TypeScript Errors
1. Use workspace version of TypeScript:
   - `Ctrl+Shift+P` → "TypeScript: Select TypeScript Version"
   - Choose "Use Workspace Version"

### Tasks Not Running
1. Check that you're in the workspace root
2. Verify paths in `tasks.json`
3. Check terminal output for errors

### Debug Not Working
1. Ensure services are not already running on ports 8000/5173
2. Check `.env` files exist and are configured
3. Verify Python/Node.js are installed and in PATH

## Keyboard Shortcuts

### Custom Shortcuts (Suggested)
Add these to your keybindings.json:

```json
{
  "key": "ctrl+shift+r",
  "command": "workbench.action.tasks.runTask",
  "args": "Start Full Stack Development"
},
{
  "key": "ctrl+shift+t",
  "command": "workbench.action.tasks.runTask",
  "args": "Backend: Run Tests"
}
```

## Environment Setup

### Backend (.env)
Create `backend/.env`:
```env
JWT_SECRET_KEY=your-secret-key
MONGODB_URL=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=http://localhost:5173
```

### Frontend (.env)
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Docker Support

### Using Docker Tasks
- **Start**: `Ctrl+Shift+P` → "Run Task" → "Docker: Build and Start Services"
- **Stop**: `Ctrl+Shift+P` → "Run Task" → "Docker: Stop Services"

### Docker Debugging
Services started via docker-compose can be debugged by:
1. Exposing debug ports in `docker-compose.yml`
2. Using "Attach to Remote" debug configurations

## Additional Resources

- [VS Code Python Documentation](https://code.visualstudio.com/docs/python/python-tutorial)
- [VS Code TypeScript Documentation](https://code.visualstudio.com/docs/typescript/typescript-tutorial)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## Support

For issues specific to:
- **Backend**: See `backend/README.md`
- **Frontend**: See `frontend/README.md`
- **Integration**: See `INTEGRATION.md`
- **Setup**: See `SETUP_GUIDE.md`

---

*Last updated: January 13, 2026*
