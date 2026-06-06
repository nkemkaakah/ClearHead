const MANUS_BASE_URL = "https://api.manus.ai";
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60_000;

type ManusApiSuccess<T> = { ok: true } & T;

type ManusApiFailure = {
  ok: false;
  error?: { code?: string; message?: string };
};

export type ManusEvent = {
  type: string;
  status_update?: {
    agent_status?: "running" | "stopped" | "waiting" | "error";
  };
  structured_output_result?: {
    success: boolean;
    value: unknown;
    error: string | null;
  };
};

function getApiKey(): string {
  const apiKey = process.env.MANUS_API_KEY;
  if (!apiKey) {
    throw new Error("MANUS_API_KEY is not configured");
  }
  return apiKey;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class ManusApiError extends Error {
  readonly code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "ManusApiError";
    this.code = code;
  }
}

async function manusFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<ManusApiSuccess<T>> {
  const response = await fetch(`${MANUS_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-manus-api-key": getApiKey(),
      ...options?.headers,
    },
  });

  const data = (await response.json()) as ManusApiSuccess<T> | ManusApiFailure;

  if (!data.ok) {
    const message = data.error?.message ?? "Unknown Manus API error";
    throw new ManusApiError(message, data.error?.code);
  }

  return data;
}

export async function createTask(
  content: string,
  schema: object,
): Promise<string> {
  const result = await manusFetch<{ task_id: string }>("/v2/task.create", {
    method: "POST",
    body: JSON.stringify({
      message: { content },
      structured_output_schema: schema,
    }),
  });

  return result.task_id;
}

type AgentStatus = "running" | "stopped" | "waiting" | "error";

function getLatestAgentStatus(events: ManusEvent[]): AgentStatus | undefined {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.type === "status_update" && event.status_update?.agent_status) {
      return event.status_update.agent_status;
    }
  }
  return undefined;
}

export async function pollUntilStopped(taskId: string): Promise<ManusEvent[]> {
  const startedAt = Date.now();
  const allEvents: ManusEvent[] = [];
  let cursor: string | undefined;

  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    const params = new URLSearchParams({
      task_id: taskId,
      order: "asc",
    });

    if (cursor) {
      params.set("cursor", cursor);
    }

    let result: ManusApiSuccess<{
      messages: ManusEvent[];
      has_more: boolean;
      next_cursor?: string;
    }>;

    try {
      result = await manusFetch(`/v2/task.listMessages?${params.toString()}`);
    } catch (error) {
      // Newly created tasks can take ~1s before listMessages sees them.
      if (error instanceof ManusApiError && error.code === "not_found") {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }
      throw error;
    }

    allEvents.push(...result.messages);

    const agentStatus = getLatestAgentStatus(allEvents);
    if (agentStatus === "stopped" || agentStatus === "error") {
      return allEvents;
    }

    if (result.has_more && result.next_cursor) {
      cursor = result.next_cursor;
      continue;
    }

    cursor = undefined;
    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error("Manus task timed out after 60 seconds");
}
