import Link from "next/link"
import { LockKeyhole } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"

export function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-6">
      <div className="flex max-w-md flex-col items-center rounded-3xl border border-surface-border bg-surface px-8 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-dim text-brand">
          <LockKeyhole className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-xl font-semibold text-copy-primary">Access denied</h1>
        <p className="mt-2 text-sm leading-relaxed text-copy-muted">
          This workspace is unavailable or you do not have permission to open it.
        </p>
        <Link
          href="/editor"
          className={buttonVariants({
            variant: "outline",
            className: "mt-6 border-surface-border bg-elevated text-copy-primary hover:bg-subtle",
          })}
        >
          Back to Projects
        </Link>
      </div>
    </div>
  )
}
