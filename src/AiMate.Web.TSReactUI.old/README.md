# AiMate.Web.TSReactUI

A modern TypeScript + React web interface for AiMate, built with Vite, Tailwind CSS, and shadcn/ui components.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Visual Studio 2022** (17.8 or later) with the **Node.js development workload** (optional, for Visual Studio integration)

## Project Structure

```
AiMate.Web.TSReactUI/
├── components/          # React components
│   ├── ui/             # shadcn/ui components (Radix UI based)
│   └── figma/          # Figma-related components
├── styles/             # Global styles and CSS
├── utils/              # Utility functions and API stubs
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Project dependencies
```

## Getting Started

### 1. Install Dependencies

Navigate to the project directory and install the required npm packages:

```bash
cd src/AiMate.Web.TSReactUI
npm install
```

### 2. Development Server

Start the Vite development server with hot module replacement (HMR):

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

**Note:** The development server is configured to proxy API calls to `http://localhost:5000` (the .NET backend). Make sure the backend is running before making API requests.

### 3. Building for Production

To create an optimized production build:

```bash
npm run build
```

This will:
1. Run TypeScript compilation to check for type errors
2. Build the project using Vite
3. Output the production files to the `dist/` directory

### 4. Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## Visual Studio Integration

The project is integrated into the AiMate Visual Studio solution as an `.esproj` project.

### Opening in Visual Studio

1. Open the `AiMate.sln` solution file in Visual Studio 2022
2. The `AiMate.Web.TSReactUI` project should appear in the Solution Explorer
3. You can use Visual Studio's built-in tools for:
   - IntelliSense and code completion
   - Debugging TypeScript/JavaScript
   - npm package management
   - Running npm scripts

### Running from Visual Studio

- **Debug/Start**: The project is configured to run `npm run dev` when started
- **Build**: Building the project in Visual Studio will run the production build

## Technology Stack

### Core Framework
- **React 18.3** - UI library
- **TypeScript 5.5** - Type-safe JavaScript
- **Vite 5.4** - Fast build tool and dev server

### UI Components & Styling
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component collection built on:
  - **Radix UI** - Accessible component primitives
  - **Lucide React** - Icon library
- **class-variance-authority** - Variant styling utilities
- **tailwind-merge** - Tailwind class merging utility

### Additional Libraries
- **react-markdown** - Markdown rendering
- **sonner** - Toast notifications
- **recharts** - Charting library
- **date-fns** - Date utility library
- **cmdk** - Command menu component
- **vaul** - Drawer component

## Development Workflow

### Code Quality
- TypeScript strict mode is enabled for type safety
- Component architecture follows React best practices
- See `COMPONENT_ARCHITECTURE_SPEC.md` for detailed component guidelines
- See `MUDBLAZOR_CONVERSION_SPEC.md` for conversion guidelines from MudBlazor

### API Integration
- API calls are proxied to the .NET backend at `http://localhost:5000`
- API stub utilities are available in `utils/api-stubs.ts`
- All API routes use the `/api` prefix

### Path Aliases
The project uses `@` as an alias for the project root:

```typescript
import { Button } from "@/components/ui/button"
```

## Troubleshooting

### Port Already in Use
If port 5173 is already in use, you can change it in `vite.config.ts`:

```typescript
server: {
  port: 3000, // Change to your preferred port
  // ...
}
```

### Module Not Found Errors
Try deleting `node_modules` and reinstalling:

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
Ensure your IDE is using the workspace TypeScript version:
- In VS Code: `Ctrl+Shift+P` → "TypeScript: Select TypeScript Version" → "Use Workspace Version"

## Additional Documentation

- **Component Architecture**: See `COMPONENT_ARCHITECTURE_SPEC.md`
- **MudBlazor Conversion**: See `MUDBLAZOR_CONVERSION_SPEC.md`
- **Master Plan**: See `aiMate-Master-Plan.md`
- **Attributions**: See `Attributions.md`

## Contributing

When making changes to this project:

1. Follow the component architecture guidelines
2. Ensure TypeScript compilation passes (`npm run build`)
3. Test changes in both development and production builds
4. Update documentation as needed

## License

See the root `LICENSE` file for license information.
