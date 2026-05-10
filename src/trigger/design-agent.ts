import { task } from "@trigger.dev/sdk";
import {
  applyDesignPlan,
  clearDesignAgentPresence,
  getDesignCanvasSnapshot,
  getDesignPlanFocus,
  planDesignActions,
  prepareDesignAgentRoom,
  publishDesignStatus,
  setDesignAgentPresence,
} from "@/lib/ai/design-agent";

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

export interface DesignAgentOutput {
  prompt: string;
  roomId: string;
  startedAt: string;
  completedAt: string;
  summary: string;
  appliedActionCount: number;
  skippedActionCount: number;
  nodeCount: number;
  edgeCount: number;
}

export const designAgent = task({
  id: "design-agent",
  run: async (payload: DesignAgentPayload): Promise<DesignAgentOutput> => {
    const startedAt = new Date().toISOString();

    await prepareDesignAgentRoom(payload.roomId);
    await setDesignAgentPresence(payload.roomId, {
      cursor: { x: 40, y: 40 },
      thinking: true,
    });
    await publishDesignStatus(
      payload.roomId,
      "start",
      "Ghost AI started processing your design request."
    );

    try {
      const snapshot = await getDesignCanvasSnapshot(payload.roomId);

      await publishDesignStatus(
        payload.roomId,
        "processing",
        "Ghost AI is interpreting the prompt and planning canvas changes."
      );

      const plan = await planDesignActions(payload.prompt, snapshot);
      const planFocus = getDesignPlanFocus(snapshot, plan.actions);

      await setDesignAgentPresence(payload.roomId, {
        cursor: planFocus,
        thinking: true,
      });
      await publishDesignStatus(
        payload.roomId,
        "processing",
        `Ghost AI is applying ${plan.actions.length} planned canvas changes.`
      );

      const applied = await applyDesignPlan(payload.roomId, plan.actions);

      if (applied.appliedActionCount === 0) {
        throw new Error("Design plan did not produce any applicable canvas changes.");
      }

      const completedAt = new Date().toISOString();
      const completionMessage =
        applied.skippedActionCount > 0
          ? `Ghost AI completed ${applied.appliedActionCount} canvas changes and skipped ${applied.skippedActionCount}.`
          : `Ghost AI completed ${applied.appliedActionCount} canvas changes.`;

      await publishDesignStatus(payload.roomId, "complete", completionMessage);

      return {
        prompt: payload.prompt,
        roomId: payload.roomId,
        startedAt,
        completedAt,
        summary: plan.summary,
        appliedActionCount: applied.appliedActionCount,
        skippedActionCount: applied.skippedActionCount,
        nodeCount: applied.nodes.length,
        edgeCount: applied.edges.length,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Ghost AI failed to update the collaborative design.";

      await publishDesignStatus(
        payload.roomId,
        "error",
        `Ghost AI could not complete the design update: ${message}`
      );

      throw error;
    } finally {
      await clearDesignAgentPresence(payload.roomId);
    }
  },
});
