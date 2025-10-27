# Alloprof API

Games API for Alloprof applications.

## Table of contents

- [Alloprof API games](#alloprof-games-api)
  - [Table of contents](#table-of-contents)
  - [Stack](#stack)
  - [Getting started](#getting-started)
  - [Running the project in development mode](#running-the-project-in-development-mode)
  - [Testing with Jest](#testing-with-jest)
  - [Debugging the application](#debugging-the-application)
  - [Building the application](#building-the-application)
  - [Running in production](#running-in-production)
  - [Environment variables and configurations](#environment-variables-and-configurations)
    - [.env](#env)
    - [tsconfig.json](#tsconfigjson)
    - [jest.config.js](#jestconfigjs)
  - [Project architecture and adding new router](#project-architecture-and-adding-new-router)
  - [Adding new endpoint or route](#adding-new-endpoint-or-route)
    - [Create a folder to encapsulate your endpoint's feature](#create-a-folder-to-encapsulate-your-endpoints-feature)
    - [Add route to the main app](#add-route-to-the-main-app)
  - [Writing tests with Jest and Supertest](#writing-tests-with-jest-and-supertest)
  - [Convention about tests](#convention-about-tests)

## Stack

- nodejs 22.11+
- npm 10.9+
- typescript is preferred, javascript is not disabled
- jest for tests
- express to serve requests

## Getting started

```bash
mv .env.example .env
npm install
```

## Running the project in development mode

```bash
npm run dev
```

## Testing with Jest

If you have the jest extension for vscode, tests results will be accessible through the interface. Jest extension ID for vscode: Orta.vscode-jest

If not, you can launch the tests in watch mode like so:

```bash
npm run test
```

## Debugging the application

It is possible to use the VSCode debugger and use breakpoints in the editor. Simply put a breakpoint and use Run and Debug while selecting `src/index.ts` file in the editor.

Otherwise, it's possible to create a `.vscode/launch.json` file, here's an example:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Launch API games",
            "skipFiles": [
                "<node_internals>/**"
            ],
            "program": "${workspaceFolder}/src/index.ts",
            "outFiles": [
                "${workspaceFolder}/**/*.js"
            ]
        }
    ]
}
```

## Building the application

Output will be in the `dist` folder

```bash
npm run build
```

## Running in production

Using nodejs, run the `index.js` in the `dist` folder.

```bash
node dist/index.js
```

## Environment variables and configurations

### .env

```bash
API_NAME='api-games' # The name of the API used by the logger. It's used to identify the application in StackDriver.
BUNYAN_LOGGING='false' # Setting this to 'true' will enable Google Cloud Logging. 'false' should be used in local development
LOG_LEVEL='info' # Default log level, production should be set to 'error'
ENABLE_REQUEST_LOGGING='true' # This setting will enable or disable requests logging.
PORT='8200' # Default port for application serving
BASE_PATH='/' # Default path to be used. This setting assumes that this application will be part of a greater proxy environment and that the service will be used along other applications.
```

### tsconfig.json

Basic TypeScript configuration.

### jest.config.js

Basic Jest configuration.

## Project architecture and adding new router

Here's the project folder tree:

```
├── coverage        <--- jest's code coverage report (not committed to repository)
├── dist            <--- output folder when building the application (not committed to repository)
├── src
│   ├── __tests__   <--- tests for app and config
│   ├── logger      <--- bunyan logger tool
│   │   ├── __tests__   <--- tests for logger
|   ├── status      <--- /status route used to query application's current status
│   │   ├── __tests__   <--- tests for status endpoint
|   ├── app.ts      <--- define and support new routes there
|   ├── config.ts   <--- application configurations, based on .env
|   └── index.ts    <--- application entry point
├── .env.example
├── .gitignore
├── jest.config.js
├── package.json
├── README.md
└── tsconfig.json
````

## Adding new endpoint or route

To add a new endpoint:

### Create a folder to encapsulate your endpoint's feature

```typescript
// src/my-new-endpoint-router/my-new-endpoint-router.ts
import express from 'express'

const router = express.Router()

router.get('/', (_req, res) => {
  res.status(200).send('Hello world!')
})

export { router as myNewEndpointRouter }
```

### Add route to the main app
```typescript
// src/app.ts
...
import { myNewEndpointRouter } from './my-new-endpoint-router/my-new-endpoint-router'
...
app.use('/my-new-endpoint', myNewEndpointRouter)
...
```

## Writing tests with Jest and Supertest

The project comes with a test suit based on [Jest](https://github.com/jestjs/jest) and [SuperTest](https://github.com/ladjs/supertest).

Jest is used to run the tests and get feedback. SuperTest fills the gap when it comes to HTTP testing.

## Convention about tests

- Tests should be placed in a folder named `__tests__` along side the files or module it wants to test. 
- It is advised to run tests along when developing using either `npm run test` or using the Jest's vscode extension.
- Code structure should prefer dependency injection to facilitate mocking and general code reusability.
