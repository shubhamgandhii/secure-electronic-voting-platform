# SecureVote – Electronic Voting Platform

A web-based electronic voting platform designed to demonstrate secure voter authentication, controlled access, vote integrity, and automated security testing.

## Overview

SecureVote is an academic prototype that provides a digital interface for voter registration, login, candidate viewing, and vote submission. It also includes administrator functionality for candidate management and viewing election results.

The project demonstrates how web application security controls can be applied to an electronic voting workflow.

## Features

- **User Authentication:** Registration and login functionality.
- **Role-Based Access Control:** Restricts administrator-only operations.
- **Candidate Management:** Allows authorised administrators to manage candidates.
- **Vote Submission:** Provides a workflow for voters to cast their votes.
- **Vote Integrity:** Includes protection against duplicate voting for the same voter and election.
- **Input Validation:** Validates registration data and handles invalid requests.
- **Security Testing:** Automated tests for authentication, access control, validation, and duplicate-vote prevention.
- **Environment Configuration:** Uses environment variables for application configuration and secrets.

## Technology Stack

- **Frontend:** React, Vite, JavaScript, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** JSON Web Tokens (JWT)
- **Testing:** Automated security tests using the project's configured test tools
- **Version Control:** Git and GitHub

## Project Structure

```text
secure-electronic-voting-platform/
├── client/
│   ├── public/
│   └── src/
├── server/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── tests/
│   ├── db.js
│   └── server.js
├── .gitignore
├── package.json
└── package-lock.json
```

## Prerequisites

Before running the project, install:

- Node.js and npm
- MongoDB
- Git

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/shubhamgandhii/Secure-electronic-voting-platforms.git
cd Secure-electronic-voting-platforms
```

### 2. Install dependencies

Install the root dependencies:

```bash
npm install
```

Install the frontend dependencies:

```bash
cd client
npm install
cd ..
```

Install the backend dependencies:

```bash
cd server
npm install
cd ..
```

### 3. Configure environment variables

Create a local `.env` file inside the `server` directory. Configure the required values according to `server/db.js` and `server/server.js`.

Example:

```env
PORT=5000
JWT_SECRET=replace_with_a_secure_random_secret
MONGO_URI=mongodb://127.0.0.1:27017/securevote
```

Use the actual variable names expected by the application. Replace the example secret with a strong, private value. Never commit `.env` files, passwords, database credentials, or JWT secrets to GitHub.

### 4. Start the backend

From the project root:

```bash
cd server
npm start
```

If the backend uses a different script, check `server/package.json` and use the configured command.

### 5. Start the frontend

Open a second terminal:

```bash
cd client
npm run dev
```

Open the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

Ensure MongoDB is running and the backend environment variables are configured correctly before testing the application.

## Security Testing

The project includes automated security tests covering areas such as:

- Authentication token validation
- Access restrictions for voter and administrator roles
- Registration input validation
- Duplicate-vote prevention

Run the tests using the test command configured in `server/package.json`. Test results may vary depending on the database configuration and environment.

## Limitations

SecureVote is an academic prototype intended for learning and demonstration. It has not been established as suitable for conducting real public elections. Real-world election deployment would require independent security audits, stronger identity and eligibility verification, privacy and accessibility assessments, operational safeguards, and jurisdiction-specific legal compliance.

## Future Improvements

- Expand automated security and integration testing.
- Improve login rate-limiting verification.
- Strengthen error handling and input validation.
- Add further monitoring and audit capabilities.
- Conduct independent security testing.

## Disclaimer

This project is developed for educational and demonstration purposes only. It should not be used to conduct real elections or process real election data.

## License

A license has not yet been specified. Add an appropriate `LICENSE` file before distributing the project for reuse.
