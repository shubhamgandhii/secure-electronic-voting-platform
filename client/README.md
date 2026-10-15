# SecureVote – Secure Electronic Voting Platform

## 1. Project Overview

SecureVote is a web-based electronic voting platform designed to provide a secure and user-friendly voting experience. The application allows voters to log in, view election candidates, and submit their votes. It also provides administrative functionality for candidate management and election result viewing.

The project demonstrates authentication, role-based access control, password hashing, duplicate-vote prevention, and security testing.

## 2. Technologies Used

### Frontend
- React.js
- Vite
- JavaScript
- HTML and CSS

### Backend
- Node.js
- Express.js
- REST API

### Database
- MongoDB
- Mongoose

### Security
- JSON Web Tokens (JWT)
- bcryptjs password hashing
- Role-based authorization
- Login rate limiting
- Unique database index for voter-election records

## 3. Main Features

### User Authentication
- Voter registration and login.
- Password hashing using bcryptjs.
- JWT-based authentication.
- Validation of protected API requests.
- Login rate limiting to help reduce repeated login attempts.

### Voter Features
- View available election candidates.
- Submit a vote.
- Check voting status.
- Prevent a voter from submitting multiple votes in the same election.

### Administrator Features
- Add election candidates.
- View election results.
- Access administrative functions restricted to authorized users.

### Security Features
- Authentication middleware for protected routes.
- Role-based access control for administrator operations.
- Unique voter and election database index.
- MongoDB transactions for vote submission.
- Restricted access to election results.
- Automated security tests using Node.js's built-in test runner.

## 4. Project Structure

```text
secure-electronic-voting-platform/
├── client/
│   └── src/
│       └── App.jsx
├── server/
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Candidate.js
│   │   └── Vote.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── candidateRoutes.js
│   │   └── voteRoutes.js
│   ├── tests/
│   │   └── security.test.js
│   ├── db.js
│   ├── server.js
│   ├── .env
│   └── package.json
└── README.md
```

## 5. Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB Community Server
- Git (optional)

MongoDB must be configured as a replica set for the transaction-based voting functionality.

## 6. Installation and Setup

### Step 1: Clone or Download the Project

Download the project or clone the repository using Git.

### Step 2: Install Frontend Dependencies

Open a terminal in the project folder and run:

```bash
cd client
npm install
```

### Step 3: Install Backend Dependencies

Open another terminal and run:

```bash
cd server
npm install
```

### Step 4: Configure Environment Variables

Create or update `server/.env` with the following settings:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/securevote
JWT_SECRET=replace_with_a_long_random_secret
```

Use a strong, private JWT secret. Never publish the real `.env` file or commit secrets to GitHub.

### Step 5: Start MongoDB

Ensure the MongoDB service is running and the configured replica set is initialized.

### Step 6: Start the Backend

From the `server` directory, run:

```bash
npm start
```

The backend should be available at:

http://localhost:5000

### Step 7: Start the Frontend

From the `client` directory, run:

```bash
npm run dev
```

Open the local URL shown in the terminal, normally:

http://localhost:5173

## 7. API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend health |
| GET | `/api/db-status` | Check database connection |
| GET | `/api/auth/test` | Test authentication routes |
| POST | `/api/auth/register` | Register a voter |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/candidates` | Retrieve candidates |
| POST | `/api/candidates` | Add a candidate (admin only) |
| POST | `/api/votes` | Submit a vote |
| GET | `/api/votes/status` | Check voting status |
| GET | `/api/votes/results` | Retrieve results (admin only) |

Protected endpoints require a valid JWT in the Authorization header:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

## 8. Security Testing

Run the backend security tests from the `server` directory:

```bash
npm test
```

The current test suite contains five tests:

1. Reject requests without an authentication token.
2. Reject invalid authentication tokens.
3. Deny voters access to administrator-only election results.
4. Verify that the vote model declares a unique voter-election index.
5. Verify that the MongoDB unique index rejects duplicate records for the same voter and election.

The latest test run completed successfully with **5 tests passed and 0 failed**.

Note: These tests cover selected authentication and database protections. They do not constitute a complete security audit or a full end-to-end test of every voting API operation.

## 9. Future Enhancements

- Add comprehensive automated integration tests.
- Improve audit logging and monitoring.
- Introduce stronger administrative account management.
- Add deployment configuration and production security hardening.
- Perform additional usability and accessibility testing.

## 10. Disclaimer

SecureVote is an educational project demonstrating web development and selected security controls. It has not been independently audited or certified for real-world elections. A production election system would require extensive security reviews, privacy safeguards, operational controls, and independent verification.
