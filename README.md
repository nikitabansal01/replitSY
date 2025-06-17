# Women's Wellness Buddy

A comprehensive wellness application designed specifically for women, featuring AI-powered nutrition guidance, meal planning, and wellness tracking.

## 🏗️ Project Structure

This project is organized as a monorepo with separate frontend and backend applications:

```
├── frontend/           # React + Vite frontend (deploy to Vercel)
├── backend/            # Express.js backend (deploy to Railway)
├── shared/             # Shared types and schemas
└── README.md           # This file
```

## 🚀 Quick Start

### Frontend (Vercel)
```bash
cd frontend
npm install
npm run dev
```

### Backend (Railway)
```bash
cd backend
npm install
npm run dev
```

## 🚀 Deployment

### Frontend Deployment (Vercel)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Deploy using Vercel CLI:**
   ```bash
   npm i -g vercel
   vercel login
   vercel --prod
   ```

3. **Or deploy via GitHub:**
   - Push your code to GitHub
   - Connect your repository to Vercel
   - Vercel will automatically detect the Vite configuration

4. **Set Environment Variables in Vercel:**
   - `VITE_API_URL`: Your Railway backend URL

### Backend Deployment (Railway)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Deploy using Railway CLI:**
   ```bash
   npm i -g @railway/cli
   railway login
   railway init
   railway up
   ```

3. **Or deploy via GitHub:**
   - Push your code to GitHub
   - Connect your repository to Railway
   - Railway will automatically detect the configuration

4. **Set Environment Variables in Railway:**
   - `DATABASE_URL`: PostgreSQL connection string
   - `OPENAI_API_KEY`: OpenAI API key
   - `FIREBASE_PROJECT_ID`: Firebase project ID
   - `FIREBASE_PRIVATE_KEY`: Firebase private key
   - `FIREBASE_CLIENT_EMAIL`: Firebase client email
   - `SUPABASE_URL`: Supabase URL
   - `SUPABASE_ANON_KEY`: Supabase anonymous key
   - `PINECONE_API_KEY`: Pinecone API key
   - `PINECONE_ENVIRONMENT`: Pinecone environment
   - `SESSION_SECRET`: Session secret for authentication

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: React Query
- **Routing**: Wouter
- **Forms**: React Hook Form + Zod

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js + Firebase Admin
- **AI**: OpenAI GPT
- **Vector Database**: Pinecone
- **File Storage**: Firebase Storage
- **PDF Generation**: Puppeteer
- **Session Management**: Express Session

## 📁 Detailed Structure

### Frontend (`/frontend`)
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
├── package.json        # Frontend dependencies
├── vite.config.ts      # Vite configuration
├── tailwind.config.ts  # Tailwind configuration
├── tsconfig.json       # TypeScript configuration
├── vercel.json         # Vercel deployment config
└── README.md           # Frontend documentation
```

### Backend (`/backend`)
```
backend/
├── index.ts              # Main server entry point
├── routes.ts             # API routes
├── db.ts                 # Database configuration
├── nutritionist.ts       # Nutritionist AI logic
├── adaptive-meal-planner.ts # Meal planning logic
├── evaluation-metrics.ts # Evaluation system
├── pdf-generator.ts      # PDF generation
├── storage.ts            # File storage
├── admin-auth.ts         # Admin authentication
├── firebase-admin.ts     # Firebase configuration
├── migrations/           # Database migrations
├── package.json          # Backend dependencies
├── tsconfig.json         # TypeScript configuration
├── railway.json          # Railway deployment config
└── README.md             # Backend documentation
```

## 🔧 Development Workflow

1. **Clone the repository**
2. **Set up both frontend and backend:**
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../backend
   npm install
   ```

3. **Start development servers:**
   ```bash
   # Frontend (Terminal 1)
   cd frontend
   npm run dev
   
   # Backend (Terminal 2)
   cd backend
   npm run dev
   ```

4. **Access the application:**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

## 🔗 API Integration

The frontend communicates with the backend through the API. Make sure to:

1. Set the `VITE_API_URL` environment variable in your frontend deployment
2. Configure CORS in your backend to allow requests from your frontend domain
3. Ensure all environment variables are properly set in both deployments

## 📝 Environment Variables

### Frontend (Vercel)
- `VITE_API_URL`: Backend API URL

### Backend (Railway)
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Firebase private key
- `FIREBASE_CLIENT_EMAIL`: Firebase client email
- `SUPABASE_URL`: Supabase URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `PINECONE_API_KEY`: Pinecone API key
- `PINECONE_ENVIRONMENT`: Pinecone environment
- `SESSION_SECRET`: Session secret for authentication

## 🚀 Deployment Checklist

### Before Deployment
- [ ] All environment variables are configured
- [ ] Database migrations are ready
- [ ] API endpoints are tested
- [ ] Frontend builds successfully
- [ ] Backend builds successfully

### After Deployment
- [ ] Frontend is accessible
- [ ] Backend health check passes
- [ ] API endpoints are responding
- [ ] Database connection is working
- [ ] Environment variables are properly set

## 📚 Documentation

- [Frontend Documentation](./frontend/README.md)
- [Backend Documentation](./backend/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both frontend and backend
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
