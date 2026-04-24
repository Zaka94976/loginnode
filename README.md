# loginnode

Node.js OTP authentication API for login flows.

## Features

- Express-based REST API
- OTP send and verify endpoints
- JWT token generation
- Redis support for OTP storage
- Email and mock OTP providers
- Ready for Azure DevOps deployment

## Requirements

- Node.js 20+
- npm
- Redis (optional, depending on provider and environment)

## Install

```bash
npm install
```

## Run

```bash
npm start
```

For development:

```bash
npm run dev
```

## Environment

Copy `.env.example` to `.env` and update the values for your environment.

## Main Files

- `src/index.js` - app entry point
- `main_todoappbest.yml` - Azure DevOps pipeline

## License

MIT
