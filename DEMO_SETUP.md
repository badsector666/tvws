# TVWS Demo Repository Setup Guide

## 📋 Overview

This guide will help you set up the **tvws-demo** repository with all the example files moved from the main tvws library.

## 🚀 Quick Setup

### 1. Clone the Demo Repository
```bash
git clone https://github.com/badsector666/tvws-demo.git
cd tvws-demo
```

### 2. Create Project Structure

Create the following directory structure:
```
tvws-demo/
├── index.html              # Main demo page (from /tmp/example.html)
├── script.js               # Demo logic (from /tmp/script.js) 
├── main.css                # Styles (create below)
├── package.json            # Dependencies (create below)
├── vite.config.js          # Build config (create below)
└── README.md               # Demo documentation (create below)
```

### 3. Create package.json
```json
{
  "name": "tvws-demo",
  "version": "1.0.0",
  "type": "module",
  "description": "TVWS TradingView WebSocket Library Demo",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@types/node": "^20.0.0"
  },
  "dependencies": {
    "tvws": "latest"
  }
}
```

### 4. Create main.css
```css
/* Main Styles for TVWS Demo */

@import "./tailwind.css";

/* Custom utilities */
.alert {
  border-left-width: 4px;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.alert.success {
  background-color: rgb(240 253 244);
  border-left-color: rgb(34 197 94);
  color: rgb(21 128 61);
}

.alert.error {
  background-color: rgb(254 242 242);
  border-left-color: rgb(239 68 68);
  color: rgb(185 28 28);
}

.alert.info {
  background-color: rgb(239 246 255);
  border-left-color: rgb(59 130 246);
  color: rgb(29 78 216);
}

.alert.warning {
  background-color: rgb(254 252 232);
  border-left-color: rgb(245 158 11);
  color: rgb(180 83 9);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: auto;
  white-space: nowrap;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  line-height: 1.4;
  margin: 0.125rem;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-primary {
  background: linear-gradient(135deg, rgb(59 130 246) 0%, rgb(29 78 216) 100%);
  color: white;
}

.btn-success {
  background: linear-gradient(135deg, rgb(34 197 94) 0%, rgb(21 128 61) 100%);
  color: white;
}

.btn-secondary {
  background: linear-gradient(135deg, rgb(107 114 128) 0%, rgb(55 65 81) 100%);
  color: white;
}

.btn-outline {
  background: transparent;
  border: 2px solid rgb(59 130 246);
  color: rgb(59 130 246);
}

.form-control {
  width: 100%;
  padding: 0.5rem 1rem;
  border: 1px solid rgb(209 213 219);
  border-radius: 0.25rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* Add additional styles as needed from the original example */
```

### 5. Create tailwind.css
```css
/* Tailwind CSS Base */
@import "tailwindcss/base";
@import "tailwindcss/components"; 
@import "tailwindcss/utilities";
```

### 6. Create vite.config.js
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
```

### 7. Create README.md
```markdown
# TVWS Demo Repository

Live demo and examples for the [tvws](https://github.com/badsector666/tvws) TradingView WebSocket library.

## 🚀 Quick Start

```bash
git clone https://github.com/badsector666/tvws-demo.git
cd tvws-demo
npm install
npm run dev
```

Visit http://localhost:5173

## 📋 Features Demonstrated

- **WebSocket Connection** - Connect to TradingView endpoints
- **Authentication** - Optional session-based authentication
- **Multiple Symbols** - Query multiple trading pairs
- **Timeframes** - Support for all TradingView timeframes
- **Real-time Data** - Live market data streaming
- **Error Handling** - Comprehensive error management
- **Performance Metrics** - Connection and data performance

## 🛠️ Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production  
npm run preview  # Preview production build
```

## 📚 Learn More

- **Main Library**: https://github.com/badsector666/tvws
- **Documentation**: https://github.com/badsector666/tvws#readme
- **NPM Package**: https://www.npmjs.com/package/tvws
```

### 8. Install Dependencies and Run
```bash
npm install
npm run dev
```

## 📁 File Contents

The extracted files are available at:
- `index.html` - From `/tmp/example.html` (extracted from git history)
- `script.js` - From `/tmp/script.js` (extracted from git history)
- `main.css`, `tailwind.css`, `package.json`, `vite.config.js` - Created above

## 🌐 Deployment

The demo can be deployed to:
- **GitHub Pages**: `npm run build` and deploy `dist/` folder
- **Netlify**: Connect repository and use `npm run build`
- **Vercel**: Connect repository and use `npm run build`

## 🤝 Contributing

Feel free to submit issues and enhancement requests!