# Women's Wellness Buddy - Backend

This is the backend API for the Women's Wellness Buddy, built with Express.js, TypeScript, and Drizzle ORM.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Build
```bash
npm run build
```

### Start Production
```bash
npm start
```

## 🚀 Deployment to Railway

### Option 1: Deploy via Railway CLI
1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Deploy: `railway up`

### Option 2: Deploy via GitHub
1. Push your code to GitHub
2. Connect your repository to Railway
3. Railway will automatically detect the configuration and deploy

### Environment Variables
Set these environment variables in your Railway project:
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

## 📁 Project Structure
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
└── dist/                 # Build output
```

## 🛠️ Tech Stack
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js + Firebase Admin
- **AI**: OpenAI GPT
- **Vector Database**: Pinecone
- **File Storage**: Firebase Storage
- **PDF Generation**: Puppeteer
- **Session Management**: Express Session

## 🔧 API Endpoints

### Health Check
- `GET /health` - Health check endpoint

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Nutrition & Meal Planning
- `POST /api/nutrition/analyze` - Analyze nutrition data
- `POST /api/meals/generate` - Generate meal plans
- `GET /api/meals/:id` - Get meal plan
- `POST /api/meals/:id/evaluate` - Evaluate meal plan

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/feedback` - Submit feedback

## 🗄️ Database

### Migrations
```bash
npm run db:push
```

### Schema
The database schema is defined in `../shared/schema.ts` and includes:
- Users table
- Meal plans table
- Feedback table
- Evaluation metrics table 