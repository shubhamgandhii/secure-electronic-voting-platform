# Security Notes and Review Boundaries

SecureVote is an academic demonstration. The controls below describe the checked-in implementation; they do not establish that the application is suitable for a real election.

## Controls currently implemented

| Area | Current behavior | Evidence |
| --- | --- | --- |
| Password storage | Registration hashes passwords with bcrypt; the user model excludes the password field from ordinary queries. | `server/routes/authRoutes.js`, `server/models/User.js` |
| Login abuse | Login has a five-attempt, fifteen-minute rate limit using the middleware’s default in-memory store. | `server/routes/authRoutes.js` |
| API authentication | Protected routes require a bearer JWT verified against a secret, issuer, audience, and expiry. Tokens are issued for fifteen minutes. | `server/middleware/authMiddleware.js`, `server/routes/authRoutes.js` |
| Role checks | Candidate creation and results access check for the `admin` role on the server. | `server/routes/candidateRoutes.js`, `server/routes/voteRoutes.js` |
| Input constraints | Registration and candidate creation validate required values and documented length limits. Candidate IDs are validated before vote submission. | `server/routes/authRoutes.js`, `server/routes/candidateRoutes.js`, `server/routes/voteRoutes.js` |
| Duplicate voting | Vote submission checks and updates `hasVoted` in a transaction; MongoDB also enforces a unique voter/election index. | `server/routes/voteRoutes.js`, `server/models/Vote.js` |
| Error responses | JSON parser failures, oversized bodies, and unexpected application errors receive controlled JSON responses. | `server/server.js`, `server/middleware/errorMiddleware.js` |

## Important limitations

- `Vote` stores a voter reference and candidate reference together. Result responses omit voter IDs, but the database representation does not provide ballot anonymity from database operators.
- The rate limit is in-memory and applies to a process. It does not coordinate limits across multiple server instances and is not a durable account lockout system.
- JWT role claims represent the role at token issuance. The middleware does not reload the user record on every request, so role changes do not revoke already-issued tokens before expiry.
- The configured CORS origin is a local Vite URL. Deployment needs an intentional origin configuration and deployment-specific review.
- Registration creates voters. The repository does not define a production-grade administrator provisioning or identity-verification process.
- The application has no independent ballot-verification protocol, end-to-end cryptographic tally, election audit log, eligibility proof, election lifecycle management, or operational recovery procedure.
- The test suite checks application behavior and selected MongoDB constraints. It is not a penetration test, formal verification, or independent security audit.

## Review priorities for any deployment work

1. Define and independently review voter eligibility, administrator provisioning, election lifecycle, and recovery procedures.
2. Decide whether ballot secrecy is required and redesign the stored vote model and tally process accordingly.
3. Specify token revocation and administrator-role change behavior.
4. Select a shared rate-limit store and configure proxy handling for the real deployment topology.
5. Set production CORS origins, TLS termination, secret management, database access controls, backups, monitoring, and incident response.
6. Obtain independent security, privacy, accessibility, and jurisdiction-specific legal review.

These items are review priorities, not features that the current code already provides. See [Architecture](ARCHITECTURE.md) and [API Reference](API.md) for the corresponding component and route descriptions.
