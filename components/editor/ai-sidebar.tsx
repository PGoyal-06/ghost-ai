import { useState } from "react"
import { Bot, X, Send, FileText, Download } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [input, setInput] = useState("")

  const starterChips = [
    "Design an e-commerce backend",
    "Create a chat app architecture",
    "Build a CI/CD pipeline",
  ]

  return (
    <aside
      className={cn(
        "fixed bottom-0 right-0 top-12 z-40 flex w-full max-w-sm flex-col border-l border-surface-border bg-base/95 shadow-2xl backdrop-blur-md transition-transform duration-200 ease-in-out md:max-w-md",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Bot size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-copy-primary">AI Workspace</h2>
            <p className="text-xs text-copy-muted">Collaborate with Ghost AI</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-copy-muted hover:text-copy-primary">
          <X size={18} />
        </Button>
      </div>

      <Tabs defaultValue="architect" className="flex flex-1 flex-col overflow-hidden">
        <div className="px-5 pt-4">
          <TabsList className="w-full">
            <TabsTrigger 
              value="architect" 
              className="flex-1 data-active:bg-accent data-active:text-white text-copy-muted"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger 
              value="specs" 
              className="flex-1 data-active:bg-accent data-active:text-white text-copy-muted"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* AI Architect Tab */}
        <TabsContent value="architect" className="mt-0 flex flex-1 flex-col overflow-hidden outline-none">
          <ScrollArea className="flex-1 px-5 py-4">
            <div className="flex h-full flex-col justify-center items-center text-center py-10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Bot size={24} />
              </div>
              <h3 className="mb-2 text-sm font-medium text-copy-primary">How can I help you build?</h3>
              <p className="mb-6 max-w-[250px] text-xs text-copy-muted">
                Describe the architecture or feature you want to create, and I'll generate the initial diagram.
              </p>
              
              <div className="flex w-full max-w-[280px] flex-col gap-2">
                {starterChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setInput(chip)}
                    className="rounded-lg bg-subtle px-3 py-2 text-left text-xs font-medium text-accent-text transition-colors hover:bg-subtle/80"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
            {/* Future: user and assistant messages */}
          </ScrollArea>

          <div className="border-t border-surface-border p-4">
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message AI Architect..."
                className="min-h-[72px] max-h-[160px] resize-none border-surface-border bg-elevated pr-12 text-copy-primary placeholder:text-copy-muted"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    // handle submit in the future
                    if (input.trim()) {
                      setInput("")
                    }
                  }
                }}
              />
              <Button 
                size="icon" 
                className="absolute bottom-2 right-2 h-8 w-8 bg-accent text-white hover:bg-accent/90"
              >
                <Send size={14} />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Specs Tab */}
        <TabsContent value="specs" className="mt-0 flex flex-1 flex-col overflow-hidden p-5 outline-none">
          <div className="mb-6 flex items-center justify-between">
             <p className="text-sm text-copy-muted">Project Specifications</p>
             <Button className="h-8 bg-accent px-3 text-xs text-white hover:bg-accent/90">
                Generate Spec
             </Button>
          </div>

          <div className="rounded-xl border border-surface-border bg-elevated p-4">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-dim text-accent-text">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-copy-primary">Architecture Spec v1</h4>
                  <p className="text-xs text-copy-muted">Generated just now</p>
                </div>
              </div>
            </div>
            <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-copy-muted">
              This document outlines the core architecture and technical requirements for the proposed system, including data models and API endpoints.
            </p>
            <Button variant="outline" size="sm" className="w-full gap-2 border-surface-border text-copy-muted" disabled>
              <Download size={14} />
              Download PDF
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  )
}
