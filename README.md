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

## Azure App Service

For Azure App Service on Windows, set the app setting `WEBSITE_NODE_DEFAULT_VERSION`
to a supported Node.js runtime that matches this project. The app uses modern Node
syntax and will fail to start on older iisnode defaults.

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
