# Finance App Backend

A production-ready backend for a finance management application built with NestJS, TypeORM, and PostgreSQL.

## Features

- JWT Authentication with access and refresh tokens
- User registration and login
- CRUD operations for accounts, transactions, budgets, goals, etc.
- Transaction accounting with balance updates
- Security: helmet, CORS, rate limiting, validation
- Swagger API documentation
- Database migrations with TypeORM

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with bcrypt hashing
- **Validation**: class-validator
- **Security**: helmet, CORS, rate limiting
- **Documentation**: Swagger/OpenAPI

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the values in `.env` as needed.

3. Start PostgreSQL database:
   ```bash
   docker-compose up postgres -d
   ```

4. Run migrations:
   ```bash
   npm run migration:run
   ```


5. (Optional) Seed the database with demo/development data:
   ```bash
   npm run seed
   ```
   This will populate the database with sample/demo data for development/testing only. It is NOT run automatically during app startup or in production.

6. Start the application:
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3000` and Swagger docs at `http://localhost:3000/api`.

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user profile

### Accounts
- `GET /accounts` - Get all user accounts
- `POST /accounts` - Create new account
- `GET /accounts/:id` - Get account by ID
- `PUT /accounts/:id` - Update account
- `DELETE /accounts/:id` - Delete account

### Transactions
- `GET /transactions` - Get all user transactions
- `POST /transactions` - Create new transaction
- `GET /transactions/:id` - Get transaction by ID
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction

## Database Schema

The application uses the following entities:
- User
- Account
- Transaction
- IncomeSource
- Budget
- BudgetCategory
- Goal
- NotificationItem

## Security

- Passwords are hashed with bcrypt
- JWT tokens with short-lived access tokens and long-lived refresh tokens
- Refresh tokens stored as hashes in database
- HttpOnly, Secure cookies for refresh tokens
- Helmet for security headers
- CORS configured for frontend origin
- Rate limiting on auth endpoints
- Request size limits
- Input validation with class-validator

## Development

- `npm run start:dev` - Start in development mode with hot reload
- `npm run build` - Build the application
- `npm run test` - Run tests
- `npm run lint` - Lint the code

## Deployment

Use Docker Compose for production:

```bash
docker-compose up
```

This starts both PostgreSQL and the NestJS application.
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
