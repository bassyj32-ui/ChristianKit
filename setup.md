# Project Setup Guide

## Prerequisites

Before setting up this project, you need to install Node.js and npm.

### Installing Node.js

1. **Download Node.js**:
   - Go to [https://nodejs.org/](https://nodejs.org/)
   - Download the LTS (Long Term Support) version
   - Choose the Windows installer (.msi) for your system architecture

2. **Install Node.js**:
   - Run the downloaded installer
   - Follow the installation wizard
   - Make sure to check "Add to PATH" during installation
   - Complete the installation

3. **Verify Installation**:
   - Open a new PowerShell window
   - Run: `node --version`
   - Run: `npm --version`

## Project Setup

Once Node.js is installed, follow these steps:

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Git Hooks
```bash
npm run prepare
```

### 3. Verify Setup

#### Test Development Server
```bash
npm run dev
```
This should start the development server at `http://localhost:5173`

#### Test Build Process
```bash
npm run build
```
This should create a `dist` folder with the production build

#### Test Linting
```bash
npm run lint
```
This should run ESLint and show any code quality issues

#### Test Formatting
```bash
npm run format:check
```
This should check if all code is properly formatted

#### Test Test Runner
```bash
npm test
```
This should start Vitest in watch mode

### 4. Optional: Install Additional Tools

#### Install Prettier Extension (VS Code)
- Open VS Code
- Go to Extensions (Ctrl+Shift+X)
- Search for "Prettier - Code formatter"
- Install the extension

#### Install ESLint Extension (VS Code)
- Go to Extensions (Ctrl+Shift+X)
- Search for "ESLint"
- Install the extension

## Troubleshooting

### Common Issues

1. **"npm is not recognized"**
   - Node.js is not installed or not in PATH
   - Restart your terminal after installing Node.js
   - Check if Node.js is in your system PATH

2. **Permission Errors**
   - Run PowerShell as Administrator
   - Or use `npm install --global` for global packages

3. **Port Already in Use**
   - The dev server might be using port 5173
   - Kill any existing processes or change the port in `vite.config.ts`

4. **TypeScript Errors**
   - Make sure all dependencies are installed
   - Run `npm run build` to check for TypeScript compilation errors

### Alternative Package Managers

If you prefer other package managers:

#### Using Yarn
```bash
npm install -g yarn
yarn install
yarn dev
```

#### Using pnpm
```bash
npm install -g pnpm
pnpm install
pnpm dev
```

## Next Steps

After successful setup:

1. **Start Development**: `npm run dev`
2. **Write Tests**: Add tests in `src/**/*.test.tsx`
3. **Customize**: Modify Tailwind config, add new components
4. **Deploy**: Use `npm run build` and deploy the `dist` folder

## Project Structure

```
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   ├── index.css        # Global styles with Tailwind
│   └── test/
│       └── setup.ts     # Test environment setup
├── public/              # Static assets
├── index.html           # HTML entry point
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
├── .eslintrc.cjs        # ESLint configuration
├── .prettierrc          # Prettier configuration
├── .husky/              # Git hooks
├── package.json         # Dependencies and scripts
└── README.md            # Project documentation
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Generate coverage report
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code
- `npm run format:check` - Check formatting
- `npm run prepare` - Set up Husky hooks






## Prerequisites

Before setting up this project, you need to install Node.js and npm.

### Installing Node.js

1. **Download Node.js**:
   - Go to [https://nodejs.org/](https://nodejs.org/)
   - Download the LTS (Long Term Support) version
   - Choose the Windows installer (.msi) for your system architecture

2. **Install Node.js**:
   - Run the downloaded installer
   - Follow the installation wizard
   - Make sure to check "Add to PATH" during installation
   - Complete the installation

3. **Verify Installation**:
   - Open a new PowerShell window
   - Run: `node --version`
   - Run: `npm --version`

## Project Setup

Once Node.js is installed, follow these steps:

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Git Hooks
```bash
npm run prepare
```

### 3. Verify Setup

#### Test Development Server
```bash
npm run dev
```
This should start the development server at `http://localhost:5173`

#### Test Build Process
```bash
npm run build
```
This should create a `dist` folder with the production build

#### Test Linting
```bash
npm run lint
```
This should run ESLint and show any code quality issues

#### Test Formatting
```bash
npm run format:check
```
This should check if all code is properly formatted

#### Test Test Runner
```bash
npm test
```
This should start Vitest in watch mode

### 4. Optional: Install Additional Tools

#### Install Prettier Extension (VS Code)
- Open VS Code
- Go to Extensions (Ctrl+Shift+X)
- Search for "Prettier - Code formatter"
- Install the extension

#### Install ESLint Extension (VS Code)
- Go to Extensions (Ctrl+Shift+X)
- Search for "ESLint"
- Install the extension

## Troubleshooting

### Common Issues

1. **"npm is not recognized"**
   - Node.js is not installed or not in PATH
   - Restart your terminal after installing Node.js
   - Check if Node.js is in your system PATH

2. **Permission Errors**
   - Run PowerShell as Administrator
   - Or use `npm install --global` for global packages

3. **Port Already in Use**
   - The dev server might be using port 5173
   - Kill any existing processes or change the port in `vite.config.ts`

4. **TypeScript Errors**
   - Make sure all dependencies are installed
   - Run `npm run build` to check for TypeScript compilation errors

### Alternative Package Managers

If you prefer other package managers:

#### Using Yarn
```bash
npm install -g yarn
yarn install
yarn dev
```

#### Using pnpm
```bash
npm install -g pnpm
pnpm install
pnpm dev
```

## Next Steps

After successful setup:

1. **Start Development**: `npm run dev`
2. **Write Tests**: Add tests in `src/**/*.test.tsx`
3. **Customize**: Modify Tailwind config, add new components
4. **Deploy**: Use `npm run build` and deploy the `dist` folder

## Project Structure

```
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   ├── index.css        # Global styles with Tailwind
│   └── test/
│       └── setup.ts     # Test environment setup
├── public/              # Static assets
├── index.html           # HTML entry point
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
├── .eslintrc.cjs        # ESLint configuration
├── .prettierrc          # Prettier configuration
├── .husky/              # Git hooks
├── package.json         # Dependencies and scripts
└── README.md            # Project documentation
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Generate coverage report
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code
- `npm run format:check` - Check formatting
- `npm run prepare` - Set up Husky hooks





