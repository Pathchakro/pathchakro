# Agent Instructions & Project Rules

Welcome, Agent! Please follow these guidelines and conventions when working on **Pathchakro**:

## 1. Tech Stack & Architecture
- **Framework**: Next.js (App Router, using `src/app`)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Library**: shadcn/ui
- **Database**: MongoDB (Mongoose ORM)
- **State Management**: Redux Toolkit (`@reduxjs/toolkit` and `react-redux`)
- **Authentication**: NextAuth.js (`next-auth`)
- **Forms**: React Hook Form (`react-hook-form` + `@hookform/resolvers` + `zod`)

## 2. Coding Guidelines
- Maintain strict type safety across the application.
- Use Next.js App Router conventions (e.g., Server Components by default, `"use client"` only when necessary for hooks/interactivity).
- Ensure all DB actions use `dbConnect()` before querying/mutating models.
- When retrieving data that is passed from Server to Client Components, ensure it is fully serialized (e.g. converting `_id` and dates to strings).
- Retain existing code comments, formatting, and structures unless requested otherwise.

## 3. Best Practices
- **UI & UX Design**: Always use shadcn/ui components (`src/components/ui/`) for building interfaces to maintain a modern, consistent, and interactive style.
- **Performance**: Use React Server Components and data fetching with proper caching strategies.
- **Responsiveness**: Design UI components mobile-first using Tailwind's responsive utilities.
- **Accessibility (a11y)**: Use semantic HTML elements and proper ARIA labels.
- **Clean Code**: Follow modular architecture. Keep logic and UI components clean and readable.
