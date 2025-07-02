# ⭐ TrueStar Browser Extension

Browser extension for detecting potentially fake product reviews using AI-powered analysis.

## Overview

This extension analyzes product reviews on Amazon and provides insights about review authenticity and reliability.

## Architecture

- **Framework**: Svelte 5 + TypeScript
- **Build Tool**: Vite with CRXJS plugin
- **Extension**: Manifest V3
- **UI Components**: shadcn-svelte + Tailwind CSS
- **Testing**: Vitest + Svelte Testing Library

## Development

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build extension
yarn build

# Run tests
yarn test

# Type checking
yarn check

# Linting
yarn lint
```

## Building for Production

```bash
# Build the extension
yarn build

# Output will be in dist/ directory
```

Load the unpacked extension from the `dist` directory in your browser's extension management page.

## Project Structure

- `src/` - Source code
  - `content/` - Content scripts
  - `popup/` - Extension popup UI
  - `lib/` - Shared utilities and components
- `public/` - Static assets
- `manifest.json` - Extension manifest configuration
