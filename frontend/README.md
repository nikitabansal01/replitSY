# Women's Wellness Buddy - Frontend

This is the frontend application for the Women's Wellness Buddy, built with React, TypeScript, and Vite.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build
```bash
npm run build
```

## 🚀 Deployment to Vercel

### Option 1: Deploy via Vercel CLI
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

### Option 2: Deploy via GitHub
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Vercel will automatically detect the Vite configuration and deploy

### Environment Variables
Set these environment variables in your Vercel project:
- `VITE_API_URL`: Your Railway backend URL (e.g., `https://your-app.railway.app`)

## 📁 Project Structure
```
frontend/
├── src/                 # Source code
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── lib/            # Utility functions
│   ├── hooks/          # Custom React hooks
│   └── context/        # React context providers
├── shared/             # Shared types and schemas
├── attached_assets/    # Static assets
├── public/             # Public assets
└── dist/               # Build output
```

## 🛠️ Tech Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: React Query
- **Routing**: Wouter
- **Forms**: React Hook Form + Zod 