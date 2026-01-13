# Frontend Setup with HeroUI

You want to use **HeroUI** (https://www.heroui.com/) - a React UI library, not the Go Hero template engine.

## Architecture

- **Backend**: Go (Goji) - API server
- **Frontend**: React + HeroUI - Separate frontend application

## Setup Options

### Option 1: Separate Frontend (Recommended)

Create a separate React app that communicates with your Go API:

```
matcha/
├── backend/          # Go API server (current code)
│   ├── main.go
│   ├── handlers/
│   └── ...
└── frontend/         # React + HeroUI app
    ├── package.json
    ├── src/
    └── ...
```

### Option 2: Integrated (Serve React from Go)

Build React app and serve static files from Go server.

## Quick Start with HeroUI

1. **Create React app** (in a `frontend/` directory):
   ```bash
   cd matcha
   npx create-next-app@latest frontend
   # or
   npx create-react-app frontend
   ```

2. **Install HeroUI**:
   ```bash
   cd frontend
   npx heroui-cli@latest init
   ```

3. **Configure Tailwind** (HeroUI requires Tailwind CSS):
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

4. **Update `tailwind.config.js`**:
   ```js
   const { heroui } = require("@heroui/react");
   
   module.exports = {
     content: [
       "./src/**/*.{js,ts,jsx,tsx}",
     ],
     theme: {
       extend: {},
     },
     plugins: [
       heroui({
         themes: {
           light: {
             colors: {
               primary: "#e91e63", // Matcha pink
             },
           },
           dark: {
             colors: {
               primary: "#e91e63",
             },
           },
         },
       }),
     ],
   };
   ```

5. **Wrap app with HeroUIProvider**:
   ```jsx
   // src/App.jsx or _app.tsx
   import { HeroUIProvider } from "@heroui/react";
   
   function App() {
     return (
       <HeroUIProvider>
         {/* Your app components */}
       </HeroUIProvider>
     );
   }
   ```

## API Communication

Your React app will call your Go API:

```jsx
// Example: Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:8080/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};
```

## Next Steps

1. Convert Go handlers to return JSON instead of HTML
2. Create API routes (e.g., `/api/login`, `/api/profile`)
3. Build React components with HeroUI
4. Connect frontend to backend API

Would you like me to:
- Set up the React + HeroUI frontend structure?
- Convert handlers to API endpoints (JSON responses)?
- Both?

