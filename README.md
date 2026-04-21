# FinArm - Personal Finance Management App

A full-stack personal finance management application built with React, TypeScript, Vite, NestJS, TypeORM, and PostgreSQL.

## Features

- **User Authentication**: Secure JWT-based authentication with refresh tokens stored in HttpOnly cookies
- **Account Management**: Create and manage multiple accounts (cash, bank, credit cards)
- **Transaction Tracking**: Record income, expenses, and transfers with automatic balance updates
- **Budgeting**: Set budgets with categories and track spending
- **Goals**: Set financial goals and track progress
- **Income Sources**: Track recurring income
- **Notifications**: Get notified about important financial events
- **Multi-currency Support**: Support for AMD, USD, EUR
- **Responsive UI**: Modern, responsive interface with i18n support (English, Armenian, Russian)
- **API Documentation**: Swagger/OpenAPI documentation

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Zustand (state management)
- React Router
- React Hook Form + Zod
- Recharts (charts)
- i18next (internationalization)
- Tailwind CSS (styling)

### Backend
- NestJS + TypeScript
- TypeORM + PostgreSQL
- JWT Authentication
- bcrypt (password hashing)
- Helmet, CORS, Rate Limiting
- Swagger/OpenAPI

### DevOps
- Docker & Docker Compose
- PostgreSQL
- Automated migrations and seeding

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL (for local development)

## Quick Start with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd finarm
```

2. Copy environment files:
```bash
cp backend/.env.example backend/.env
cp .env.example .env
```

3. Start the application:
```bash
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api

## Local Development

### Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

### Frontend Setup

```bash
cp .env.example .env
npm install
npm run dev
```

### Database Setup

For local development, you can use the Docker PostgreSQL:

```bash
docker-compose up postgres -d
```

Or set up your own PostgreSQL instance and update the DATABASE_URL in backend/.env.

### Running Migrations and Seeding

```bash
cd backend
npm run migration:run
npm run seed
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user profile

### Accounts
- `GET /accounts` - List user accounts
- `POST /accounts` - Create account
- `GET /accounts/:id` - Get account details
- `PATCH /accounts/:id` - Update account
- `DELETE /accounts/:id` - Delete account

### Transactions
- `GET /transactions` - List transactions (with filters)
- `POST /transactions` - Create transaction
- `PATCH /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction

### Income Sources
- `GET /income-sources` - List income sources
- `POST /income-sources` - Create income source
- `PATCH /income-sources/:id` - Update income source
- `DELETE /income-sources/:id` - Delete income source

### Budgets
- `GET /budgets` - List budgets
- `POST /budgets` - Create budget
- `PATCH /budgets/:id` - Update budget
- `DELETE /budgets/:id` - Delete budget
- `GET /budgets/:id/categories` - List budget categories
- `POST /budgets/:id/categories` - Create budget category
- `PATCH /budgets/:id/categories/:categoryId` - Update budget category
- `DELETE /budgets/:id/categories/:categoryId` - Delete budget category

### Goals
- `GET /goals` - List goals
- `POST /goals` - Create goal
- `PATCH /goals/:id` - Update goal
- `DELETE /goals/:id` - Delete goal
- `POST /goals/:id/contribute` - Contribute to goal

### Notifications
- `GET /notifications` - List notifications
- `GET /notifications/unread` - List unread notifications
- `PATCH /notifications/:id/read` - Mark as read
- `DELETE /notifications/:id` - Delete notification

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Short-lived access tokens + long-lived refresh tokens
- **HttpOnly Cookies**: Refresh tokens stored securely in HttpOnly cookies
- **CORS**: Configured for frontend origin
- **Helmet**: Security headers
- **Rate Limiting**: Login and registration endpoints protected
- **Input Validation**: Comprehensive validation with class-validator
- **SQL Injection Protection**: TypeORM parameterized queries

## Testing

### Backend Tests
```bash
cd backend
npm run test
```

### Frontend Tests
```bash
npm run test
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/finance_app
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
FRONTEND_ORIGIN=http://localhost:5173
COOKIE_SECURE=false
PORT=3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
```

## Project Structure

```
finarm/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── accounts/       # Accounts module
│   │   ├── transactions/   # Transactions module
│   │   ├── budgets/        # Budgets module
│   │   ├── goals/          # Goals module
│   │   ├── income-sources/ # Income sources module
│   │   ├── notifications/  # Notifications module
│   │   ├── entities/       # TypeORM entities
│   │   ├── migrations/     # Database migrations
│   │   └── ...
│   └── ...
├── src/                    # React frontend
│   ├── api/                # API client
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── store.ts            # Zustand store
│   └── ...
├── docker-compose.yml      # Docker orchestration
└── ...
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
