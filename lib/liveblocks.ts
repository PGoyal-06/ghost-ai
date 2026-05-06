import { Liveblocks } from "@liveblocks/node"

/**
 * Fixed palette of cursor colors — each user is deterministically
 * assigned one color based on their user ID.
 */
const CURSOR_COLORS = [
  "#FF6166", // red
  "#52A8FF", // blue
  "#BF7AF0", // purple
  "#FF990A", // orange
  "#F75F8F", // pink
  "#62C073", // green
  "#0AC7B4", // teal
  "#FBBF24", // amber
  "#00C8D4", // cyan (brand)
  "#8B82FF", // indigo
] as const

/**
 * Cached Liveblocks node client singleton.
 * Uses lazy initialization to avoid crashing at import time when
 * the secret key is missing (e.g. during `next build`).
 */
const globalForLiveblocks = globalThis as unknown as {
  liveblocks: Liveblocks | undefined
}

export function getLiveblocks(): Liveblocks {
  if (!globalForLiveblocks.liveblocks) {
    const secret = process.env.LIVEBLOCKS_SECRET_KEY
    if (!secret) {
      throw new Error(
        "LIVEBLOCKS_SECRET_KEY is not set. Add it to .env.local."
      )
    }
    globalForLiveblocks.liveblocks = new Liveblocks({ secret })
  }
  return globalForLiveblocks.liveblocks
}

/**
 * Deterministically maps a user ID to a consistent cursor color
 * from the fixed palette. The same user ID always returns the
 * same color.
 */
export function getCursorColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i)
    hash |= 0 // Convert to 32-bit integer
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}
