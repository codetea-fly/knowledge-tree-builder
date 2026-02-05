# AGENTS.md

## Commands
- `npm run dev` - Start development server (Vite)
- `npm run build` - Production build
- `npm run lint` - Run ESLint
- No test framework configured

## Architecture
- **Framework**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui components (src/components/ui/), Radix primitives, Tailwind CSS
- **State**: React Context (src/context/), TanStack Query for async
- **Routing**: react-router-dom
- **Structure**: src/pages/ (routes), src/components/ (UI), src/types/ (TypeScript types), src/hooks/ (custom hooks)

## Code Style
- Use `@/*` path alias for imports from src/
- Functional components with arrow functions
- Types in src/types/; main domain types: `KnowledgeTree`, `ProcessDomain`, `RelatedDomain`
- Follow existing component patterns in src/components/
- Use shadcn/ui components from src/components/ui/ for UI elements
- Tailwind for styling; use `cn()` from src/lib/utils for class merging
- ESLint with react-hooks and react-refresh plugins; unused vars allowed
