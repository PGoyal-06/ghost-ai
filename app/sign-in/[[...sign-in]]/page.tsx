import { SignIn } from "@clerk/nextjs"
import { Network, Share2, FileText } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Network,
    title: "AI Architecture Generation",
    description: "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Share2,
    title: "Real-time Collaboration",
    description: "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileText,
    title: "Instant Spec Generation",
    description: "Export a complete Markdown technical spec directly from the canvas graph.",
  },
]

export default function SignInPage() {
  return (
    <div className="flex min-h-screen font-sans">
      <div className="hidden lg:flex lg:w-1/2 flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-elevated" />
        <div className="absolute inset-y-0 right-0 w-px bg-surface-border" />

        <div className="relative z-10 flex items-center gap-2.5 px-16 pt-10">
          <div className="h-8 w-8 rounded-full bg-brand flex items-center justify-center">
            <span className="text-xs font-bold text-white">G</span>
          </div>
          <span className="text-sm font-semibold text-copy-primary">Ghost AI</span>
        </div>

        <div className="relative z-10 flex flex-col justify-center flex-1 px-16">
          <h1 className="text-4xl font-bold tracking-tight text-copy-primary leading-tight max-w-sm">
            Design systems at the speed of thought.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-copy-secondary max-w-sm">
            Describe your architecture in plain English. Ghost AI maps it to a shared canvas your whole team can refine in real time.
          </p>
          <div className="mt-10 space-y-6 max-w-sm">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-accent-dim flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-copy-primary">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-copy-muted">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-base min-h-screen">
        <SignIn />
      </div>
    </div>
  )
}
