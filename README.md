
# RockSynq App

This project is a modern web application built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**. It features fast development, hot module replacement, and a clean codebase with ESLint integration.

## Features

- ⚡️ Fast development with Vite
- 🧑‍💻 Built using React and TypeScript
- 🎨 Styled with Tailwind CSS
- 🛡️ Linting with ESLint

## Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)
- npm

### Installation

Clone the repository and install dependencies:

```bash
git clone <your-repo-url>
cd rocksynq-app
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the app.

### Build

To build the app for production:

```bash
npm run build
```

### Lint

To lint your code:

```bash
npm run lint
```

## Project Structure

- `src/` - Main source code
  - `components/` - React components
  - `models/` - Data models
  - `views/` - View logic
  - `abi/` - Contract ABIs
  - `assets/` - Static assets
- `public/` - Static files
- `index.html` - Main HTML file
- `vite.config.ts` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration

## Tailwind CSS Setup

Tailwind CSS is configured via `tailwind.config.js` and integrated with PostCSS. If you encounter issues, ensure you have installed both `tailwindcss` and `@tailwindcss/postcss`:

```bash
npm install -D tailwindcss @tailwindcss/postcss autoprefixer
```

## ESLint

ESLint is set up for both JavaScript and TypeScript. You can expand the configuration for stricter or more type-aware rules as needed.

## License

MIT
