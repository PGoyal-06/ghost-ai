import { auth as triggerAuth } from "@trigger.dev/sdk"

export async function createRunPublicToken(runId: string) {
  return triggerAuth.createPublicToken({
    scopes: {
      read: {
        runs: [runId],
      },
    },
    expirationTime: "1h",
  })
}
