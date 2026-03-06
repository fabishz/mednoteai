# MedNoteAI - Frontend

A modern, enterprise-grade medical notes management application built with React and TypeScript. MedNoteAI streamlines clinical documentation, patient management, and medical reporting for healthcare professionals.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Building](#building)
- [Testing](#testing)
- [Project Structure Details](#project-structure-details)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **Dashboard**: Comprehensive overview with KPIs, recent activity, and analytics
- **Patient Management**: Track and manage patient information efficiently
- **Medical Notes**: Create, edit, and organize medical notes with rich text support
- **Voice Notes**: Capture clinical observations by speaking - automatically transcribed to text with original audio preserved
- **Audio Archive**: All voice notes are saved in both text and audio formats for complete clinical documentation
- **Reports Generation**: Generate detailed medical reports and analytics
- **User Authentication**: Secure login and registration with password recovery
- **Settings Management**: Customizable user preferences and application settings
- **Responsive Design**: Mobile-friendly interface that works across all devices
- **Dark Mode Support**: Built-in theme switching for comfortable viewing
- **Real-time Notifications**: Toast notifications for user actions and updates

### 🎙️ Voice Notes Capability

MedNoteAI includes advanced voice recording and transcription features:

- **Voice Recording**: Record clinical observations and patient interactions directly from your browser
- **Real-time Transcription**: Speech is automatically converted to text for instant documentation
- **Dual Format Storage**: Notes are saved as both transcribed text and original audio files
- **Audio Playback**: Review recorded sessions by playing back the original audio
- **Speech Recognition**: Powered by modern speech-to-text APIs for accurate medical terminology recognition
- **Hands-free Documentation**: Reduce typing and capture information naturally while examining patients
- **Audio Quality**: High-quality audio compression for efficient storage without compromising clarity

## 🛠️ Tech Stack

### Frontend Framework
- **React 18.3** - UI library for building interactive interfaces
- **TypeScript 5.8** - Type-safe JavaScript for enhanced developer experience
- **Vite 5.4** - Lightning-fast build tool and dev server

### UI & Styling
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **shadcn/ui** - High-quality, reusable React components
- **Radix UI** - Unstyled, accessible component library
- **Lucide React** - Beautiful, consistent icon set

### State Management & Data Fetching
- **TanStack Query 5.83** - Powerful server state management
- **React Router DOM 6.30** - Client-side routing

### Forms & Validation
- **React Hook Form 7.61** - Performant, flexible form management
- **Zod 3.25** - TypeScript-first schema validation

### Animations & Interactions
- **Framer Motion 12.34** - Production-ready animation library
- **Embla Carousel** - Lightweight carousel component library

### Utilities
- **next-themes** - Theme management for dark mode
- **date-fns 3.6** - Modern date utility library
- **sonner** - Toast notification system
- **clsx & tailwind-merge** - Conditional class name utilities

### Audio & Speech Recognition
- **Web Audio API** - Native browser audio recording and processing
- **Web Speech API** - Speech-to-text recognition for voice notes transcription
- **AudioContext** - High-level audio control and processing
- **MediaRecorder API** - Recording audio streams in various formats

### Development Tools
- **ESLint** - Code quality and style enforcement
- **Vitest 3.2** - Unit testing framework
- **Testing Library** - React component testing utilities

## 📁 Project Structure

```
carenote-pro/
├── src/
│   ├── components/
│   │   ├── DashboardLayout.tsx    # Main layout wrapper
│   │   ├── NavLink.tsx            # Navigation link component
│   │   └── ui/                    # shadcn/ui components
│   ├── pages/
│   │   ├── Dashboard.tsx          # Main dashboard view
│   │   ├── Patients.tsx           # Patient management
│   │   ├── Notes.tsx              # Medical notes view
│   │   ├── Reports.tsx            # Reports generation
│   │   ├── Settings.tsx           # User settings
│   │   ├── Login.tsx              # Login page
│   │   ├── Register.tsx           # Registration page
│   │   ├── ForgotPassword.tsx     # Password recovery
│   │   ├── LandingPage.tsx        # Landing page
│   │   ├── Index.tsx              # Home page
│   │   └── NotFound.tsx           # 404 page
│   ├── contexts/
│   │   └── AuthContext.tsx        # Authentication context
│   ├── hooks/
│   │   ├── use-mobile.tsx         # Mobile detection hook
│   │   ├── use-theme.ts           # Theme management hook
│   │   └── use-toast.ts           # Toast notification hook
│   ├── lib/
│   │   ├── mockData.ts            # Mock data for development
│   │   └── utils.ts               # Utility functions
│   ├── test/
│   │   ├── example.test.ts        # Example unit tests
│   │   └── setup.ts               # Test configuration
│   ├── App.tsx                    # Root component with routing
│   ├── main.tsx                   # Application entry point
│   └── index.css                  # Global styles
├── public/
│   └── robots.txt                 # SEO robots file
├── vite.config.ts                 # Vite configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
├── eslint.config.js               # ESLint rules
├── package.json                   # Project dependencies
└── README.md                       # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16.x or higher (recommended: 18.x or 20.x)
- **npm** 8.x or **pnpm** 8.x (pnpm recommended for faster installation)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd carenote-pro
   ```

2. **Install dependencies**
   ```bash
   # Using npm
   npm install

   # Or using pnpm (recommended)
   pnpm install

   # Or using bun
   bun install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:8080`

## 💻 Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Build for development environment
npm run build:dev

# Preview production build locally
npm run preview

# Run linting checks
npm run lint

# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch
```

### Development Workflow

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and ensure they follow the code style:
   ```bash
   npm run lint
   ```

3. Test your changes:
   ```bash
   npm run test
   ```

4. Commit and push your changes:
   ```bash
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

5. Create a Pull Request on GitHub

### Code Style

This project uses ESLint for code quality and styling. Configuration is in `eslint.config.js`. Run `npm run lint` before committing.

### Component Development

- Use functional components with hooks
- Keep components small and focused on a single responsibility
- Use TypeScript for type safety
- Follow the existing naming conventions
- Document complex logic with comments

## 🏗️ Building

### Production Build

```bash
npm run build
```

The optimized production build will be generated in the `dist/` directory.

### Development Build

```bash
npm run build:dev
```

For debugging purposes, you can build with development mode enabled.

### Preview Build

```bash
npm run preview
```

Preview the production build locally before deployment.

## 🧪 Testing

### Running Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode during development
npm run test:watch
```

### Writing Tests

Test files should be placed in the `src/test/` directory with a `.test.ts` or `.test.tsx` extension.

Example:
```typescript
import { describe, it, expect } from 'vitest';

describe('Component', () => {
  it('should render correctly', () => {
    expect(true).toBe(true);
  });
});
```

## 🏛️ Project Structure Details

### Pages
- **Dashboard**: Overview with KPIs, charts, and recent activity
- **Patients**: Patient list, search, and management interface
- **Notes**: Medical notes creation and management with voice recording capability
- **Reports**: Report generation and analytics
- **Settings**: User preferences and application configuration
- **Login/Register**: Authentication pages
- **ForgotPassword**: Password recovery flow

### Components
- **DashboardLayout**: Main layout with sidebar and header
- **NavLink**: Navigation links with active state styling
- **UI Components**: Reusable shadcn/ui components for forms, dialogs, tables, etc.

### Contexts
- **AuthContext**: Global authentication state and user information

### Hooks
- **useAuth**: Access authentication context
- **useTheme**: Theme switching functionality
- **useToast**: Trigger toast notifications
- **useMobile**: Detect mobile viewport

### Utilities
- **utils.ts**: Common utility functions (className merging, formatting, etc.)
- **mockData.ts**: Mock data for development and testing

## 🔐 Authentication

The application uses React Context for authentication state management. Protected routes require user authentication and will redirect to the login page if the user is not authenticated.

## 🎨 Theming

The application supports light and dark modes using `next-themes`. Theme switching is available in the Settings page and can be accessed programmatically using the `useTheme` hook.

## 🎙️ Voice Notes Implementation

### How Voice Notes Work

1. **Recording**: Users can click the voice record button in the Notes page to start capturing audio
2. **Real-time Transcription**: As audio is recorded, the Web Speech API converts speech to text in real-time
3. **Dual Storage**: The system automatically saves:
   - **Text Format**: Transcribed medical notes for easy searching and editing
   - **Audio Format**: Original audio file for verification and compliance purposes
4. **Playback & Review**: Users can play back the original audio recording alongside the transcribed text
5. **Editing**: Transcribed text can be edited to correct any recognition errors or add context

### Technical Architecture

- **Frontend Audio Handling**: Uses `MediaRecorder` API to capture audio from the user's microphone
- **Speech Recognition**: Integrates with Web Speech API (with fallback to cloud-based services)
- **Audio Encoding**: Records in WebM or MP3 format with configurable quality settings
- **Storage**: Audio files are uploaded to the backend storage system
- **Metadata**: Records timestamps, duration, and speaker information with each voice note

### Privacy & Compliance

- All audio recordings are stored securely on the server
- Audio files can be deleted with associated transcript
- Compliance with HIPAA and medical data regulations
- Optional end-to-end encryption for sensitive recordings

## 🚀 Deployment

The application can be deployed to any modern hosting platform that supports Node.js-based applications. Here are some recommended options:

### Common Deployment Platforms

- **Cloud Platforms**: AWS, Google Cloud, Azure
- **Container Platforms**: Docker, Kubernetes
- **Traditional Hosting**: Any server with Node.js support

### Environment Variables

Create a `.env.local` file for local development:
```
VITE_API_URL=<your-api-url>
VITE_APP_NAME=MedNoteAI
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Guidelines

- Use TypeScript for all new code
- Write meaningful commit messages
- Update documentation for new features
- Ensure all tests pass before submitting PR
- Follow the existing code style and conventions

## 📄 License

This project is part of the MedNoteAI suite. All rights reserved.

## 🤝 Support

For issues, questions, or suggestions, please open an issue on the GitHub repository.

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Router Documentation](https://reactrouter.com)
