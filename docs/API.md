# API Reference

The browser currently targets `http://localhost:5000/api`. Protected routes use an `Authorization: Bearer <token>` header. JSON endpoints accept `Content-Type: application/json`.

## Authentication

### `POST /auth/register`

Create a voter account. Registration always assigns the `voter` role; clients cannot request an administrator role.

```json
{
  "name": "Example Voter",
  "email": "voter@example.com",
  "password": "a password of 12 or more characters"
}
```

Success: `201`, with `success`, `message`, and a public `user` object (`id`, `name`, `email`, `role`). Common errors: `400` invalid or missing input, `409` duplicate email, `500` registration failure.

### `POST /auth/login`

```json
{
  "email": "voter@example.com",
  "password": "the account password"
}
```

Success: `200`, with a short-lived `token` and public user data. Invalid credentials return `401`; invalid input returns `400`; exceeding the login rate limit returns `429`.

### `GET /auth/test`

Unauthenticated route availability check. Returns `200` when the auth router responds.

## Candidates

### `GET /candidates`

Requires any valid token. Returns `200` with `success`, `count`, and a name-sorted `candidates` array containing the fields selected by the route: name, party, description, election ID, and document ID. Missing or invalid authentication returns `401`.

### `POST /candidates`

Requires a valid admin token. Creates a candidate using `name` and `party` (required), with optional `description` and `electionId`.

```json
{
  "name": "Example Candidate",
  "party": "Example Party",
  "description": "Candidate information",
  "electionId": "college-election-2026"
}
```

Success: `201`. Invalid fields return `400`; a non-admin receives `403`; persistence errors return `500`.

## Voting

### `POST /votes`

Requires a valid voter token and a candidate ID belonging to the configured election.

```json
{
  "candidateId": "MongoDB candidate ObjectId"
}
```

Success: `201`. Invalid candidate ID returns `400`; no matching candidate returns `404`; an account that cannot vote or a duplicate vote returns `409`; unexpected failures return `500`. The election ID is selected by the server, not the request body.

### `GET /votes/status`

Requires a valid token. Returns `200` with `hasVoted`. A missing account returns `404`.

### `GET /votes/results`

Requires an admin token. Returns `200` with the configured `electionId`, `totalVotes`, and candidate result rows (`id`, `name`, `party`, `totalVotes`). It does not return voter identifiers. Non-admin users receive `403`.

## Operational checks

- `GET /api/health` returns API process status.
- `GET /api/db-status` returns `200` when MongoDB is connected and `503` otherwise.

The API currently uses a fixed local CORS origin and the frontend contains local API URLs. Configure both deliberately before deployment. For data-flow and trust-boundary context, see [Architecture](ARCHITECTURE.md); for security limits, see [Security Notes](SECURITY.md).
