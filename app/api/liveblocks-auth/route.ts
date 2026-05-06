import { currentUser } from "@clerk/nextjs/server"
import { getLiveblocks, getCursorColor } from "@/lib/liveblocks"
import { getAccessibleProject, getCurrentProjectIdentity } from "@/lib/project-access"

export async function POST(request: Request) {
  // 1. Require Clerk authentication
  const identity = await getCurrentProjectIdentity()

  if (!identity) {
    return new Response("Unauthorized", { status: 401 })
  }

  // Parse the room (project ID) from the request body
  const body = await request.json() as { room?: string }
  const roomId = body.room

  if (!roomId || typeof roomId !== "string") {
    return new Response("Missing room", { status: 400 })
  }

  // 2. Verify project access using the existing access helper
  const project = await getAccessibleProject(roomId, identity)

  if (!project) {
    return new Response("Forbidden", { status: 403 })
  }

  const liveblocks = getLiveblocks()

  // 3. Ensure the Liveblocks room exists (create only if needed)
  await liveblocks.getOrCreateRoom(roomId, {
    defaultAccesses: [],
  })

  // 4. Get user details for session metadata
  const user = await currentUser()
  const userName = user?.fullName ?? user?.firstName ?? "Anonymous"
  const userAvatar = user?.imageUrl ?? ""
  const cursorColor = getCursorColor(identity.userId)

  // Create a session token with user metadata
  const session = liveblocks.prepareSession(identity.userId, {
    userInfo: {
      name: userName,
      avatar: userAvatar,
      cursorColor,
    },
  })

  // Grant full access to the requested room
  session.allow(roomId, session.FULL_ACCESS)

  // Authorize and return the token
  const { body: responseBody, status } = await session.authorize()
  return new Response(responseBody, { status })
}
