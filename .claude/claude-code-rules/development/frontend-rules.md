# Frontend Development Specific Rules

## Component Rules
1. Always use Server Components by default
2. Client Components only when needed (interactivity, browser APIs)
3. Implement proper hydration boundaries
4. Use ShadCN patterns consistently

## State Management
1. Zustand for global state
2. React Query for server state
3. React Hook Form for forms
4. Local state for component-specific needs

## Performance
1. Implement virtual scrolling for lists > 100 items
2. Use dynamic imports for heavy components
3. Optimize images with Next.js Image
4. Implement proper caching strategies