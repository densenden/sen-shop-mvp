// Helper to get environment variables in both frontend (Vite) and backend (Node.js)
export function getEnvVar(name: string): string | undefined {
  if (typeof window !== 'undefined' && typeof import.meta !== 'undefined') {
    // Frontend (Vite)
    return (import.meta.env as any)[name]
  } else if (typeof process !== 'undefined') {
    // Backend (Node.js)
    return process.env[name]
  }
  return undefined
} 