import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen font-sans">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-elevated" />
        <div className="absolute inset-y-0 right-0 w-px bg-surface-border" />
        <div className="relative z-10 max-w-xs">
          <span className="text-2xl font-bold tracking-tight text-brand">Ghost AI</span>
          <p className="mt-4 text-sm leading-relaxed text-copy-secondary">
            Real-time collaborative system design, powered by AI.
          </p>
          <ul className="mt-10 space-y-4 text-sm text-copy-muted">
            <li>Generate system architectures from plain English</li>
            <li>Real-time collaborative canvas with live cursors</li>
            <li>Export to a structured Markdown technical spec</li>
          </ul>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-base min-h-screen">
        <SignUp />
      </div>
    </div>
  )
}
