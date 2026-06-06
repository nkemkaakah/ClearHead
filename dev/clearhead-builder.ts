import { Agent, CursorAgentError } from "@cursor/sdk";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const STATE_PATH = ".clearhead/agent-state.json";
const MODEL_PLANNER = "claude-sonnet-4-6";
const MODEL_CODER = "composer-2";
const MANUS_DOCS = [
  "https://open.manus.ai/docs/llms.txt",
  "https://open.manus.ai/docs/v2/introduction",
  "https://open.manus.ai/docs/v2/agents-overview",
  "https://open.manus.ai/docs/v2/task.create",
  "https://open.manus.ai/docs/v2/task.sendMessage",
  "https://open.manus.ai/docs/v2/webhooks-overview",
  "https://open.manus.ai/docs/v2/rate-limits",
];

type StepStatus = "pending" | "in_progress" | "done" | "blocked";
type Verdict = "pass" | "fail";

type Step = {
  id: string;
  title: string;
  status: StepStatus;
  acceptance_criteria: string[];
  required_evidence: {
    changed_files_any_of: string[];
    tests_must_pass: boolean;
  };
  test_command?: string;
  depends_on: string[];
  tags?: string[];
};

type AgentState = {
  version: number;
  product_md_path: string;
  workflow: {
    default_test_command: string;
    required_files: string[];
  };
  steps: Step[];
  next_step_id: string | null;
  agent_id: string | null;
  last_run: {
    started_at: string | null;
    finished_at: string | null;
    status: string;
    run_id: string | null;
    planned_step_id: string | null;
    changed_files: string[];
    test: {
      command: string | null;
      exit_code: number | null;
      summary: string | null;
    };
    verifier: {
      verdict: Verdict | null;
      missing_evidence: string[];
    };
    notes: string | null;
  };
};

const cwd = process.cwd();
const args = new Set(process.argv.slice(2));
const statusOnly = args.has("--status");
const verifyOnly = args.has("--verify-only");

function sh(command: string): string {
  return execSync(command, {
    cwd,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

function debugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
): void {
  // #region agent log
  fetch("http://127.0.0.1:7427/ingest/e5334926-ddeb-4b24-b70c-161f34280cd4", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "1bf094",
    },
    body: JSON.stringify({
      sessionId: "1bf094",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

function getRepoChangedFiles(): {
  all: string[];
  diffTracked: string[];
  staged: string[];
  untracked: string[];
} {
  const diffTracked = sh("git diff --name-only").split("\n").filter(Boolean);
  const staged = sh("git diff --cached --name-only").split("\n").filter(Boolean);
  const untracked = sh("git ls-files --others --exclude-standard")
    .split("\n")
    .filter(Boolean);
  const all = [...new Set([...diffTracked, ...staged, ...untracked])];
  return { all, diffTracked, staged, untracked };
}

function loadState(): AgentState {
  return JSON.parse(readFileSync(STATE_PATH, "utf8")) as AgentState;
}

function saveState(state: AgentState): void {
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
}

function runTest(command: string): { exitCode: number; output: string } {
  try {
    const output = execSync(command, {
      cwd,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { exitCode: 0, output };
  } catch (error: unknown) {
    const err = error as { status?: number; stdout?: string; stderr?: string };
    return {
      exitCode: err.status ?? 1,
      output: `${err.stdout ?? ""}${err.stderr ?? ""}`,
    };
  }
}

function globToRegex(pattern: string): RegExp {
  const regexBody = pattern
    .split("**")
    .map((segment) =>
      segment
        .split("*")
        .map((part) => part.replace(/[.+^${}()|[\]\\]/g, "\\$&"))
        .join("[^/]*"),
    )
    .join(".*");
  return new RegExp(`^${regexBody}$`);
}

function matchesPattern(file: string, pattern: string): boolean {
  return globToRegex(pattern).test(file);
}

function matchesAnyPattern(files: string[], patterns: string[]): boolean {
  if (patterns.length === 0) {
    return files.length > 0;
  }
  return files.some((file) => patterns.some((pattern) => matchesPattern(file, pattern)));
}

function getNextStep(state: AgentState): Step | null {
  if (state.next_step_id) {
    const explicit = state.steps.find((step) => step.id === state.next_step_id);
    if (explicit && explicit.status !== "done") {
      return explicit;
    }
  }

  return (
    state.steps.find((step) => step.status !== "done" && step.depends_on.every((dep) => {
      const dependency = state.steps.find((candidate) => candidate.id === dep);
      return dependency?.status === "done";
    })) ?? null
  );
}

function printStatus(state: AgentState): void {
  console.log("ClearHead build steps:\n");
  for (const step of state.steps) {
    const marker =
      step.status === "done" ? "[x]" : step.id === state.next_step_id ? "[>]" : "[ ]";
    console.log(`${marker} ${step.id}: ${step.title} (${step.status})`);
  }
  console.log(`\nNext: ${state.next_step_id ?? "none"}`);
  console.log(`Last run: ${state.last_run.status}`);
}

function finalizeStepVerification(
  state: AgentState,
  step: Step,
  options: { agentId: string | null; runId: string | null; verifierNotes: string | null },
): Verdict {
  const repoFiles = getRepoChangedFiles();
  const allChanged = repoFiles.all;
  // #region agent log
  debugLog("H1", "clearhead-builder.ts:evidence", "repo file evidence snapshot", {
    diffTrackedCount: repoFiles.diffTracked.length,
    stagedCount: repoFiles.staged.length,
    untrackedCount: repoFiles.untracked.length,
    allChangedCount: allChanged.length,
    sampleUntracked: repoFiles.untracked.slice(0, 5),
  });
  // #endregion

  const testCommand = step.test_command ?? state.workflow.default_test_command;
  const test = runTest(testCommand);
  const fileEvidenceOk = matchesAnyPattern(
    allChanged,
    step.required_evidence.changed_files_any_of,
  );
  const testsOk = !step.required_evidence.tests_must_pass || test.exitCode === 0;
  const verifierPass = testsOk && fileEvidenceOk && allChanged.length > 0;
  const verdict: Verdict = verifierPass ? "pass" : "fail";

  // #region agent log
  debugLog("H1", "clearhead-builder.ts:verdict-inputs", "verification gate inputs", {
    stepId: step.id,
    fileEvidenceOk,
    testsOk,
    testExitCode: test.exitCode,
    verifierPass,
    allChangedCount: allChanged.length,
    verifyOnly,
  });
  // #endregion

  state.agent_id = options.agentId;
  state.last_run = {
    started_at: state.last_run.started_at,
    finished_at: new Date().toISOString(),
    status: verdict === "pass" ? "success" : "failed",
    run_id: options.runId,
    planned_step_id: step.id,
    changed_files: allChanged,
    test: {
      command: testCommand,
      exit_code: test.exitCode,
      summary: test.output.slice(0, 1000),
    },
    verifier: {
      verdict,
      missing_evidence:
        verdict === "fail"
          ? [
              ...(allChanged.length === 0 ? ["no repo file changes detected"] : []),
              ...(!fileEvidenceOk ? ["required file patterns not matched"] : []),
              ...(!testsOk ? ["tests did not pass"] : []),
            ]
          : [],
    },
    notes: options.verifierNotes,
  };

  if (verdict === "pass") {
    step.status = "done";
    const next = getNextStep({ ...state, next_step_id: null });
    state.next_step_id = next?.id ?? null;
    console.log(`\nStep ${step.id} passed. Next: ${state.next_step_id ?? "none"}`);
  } else {
    step.status = "in_progress";
    state.next_step_id = step.id;
    console.log(`\nStep ${step.id} failed verification. Re-run to retry.`);
    if (state.last_run.verifier.missing_evidence.length > 0) {
      console.log("Missing evidence:", state.last_run.verifier.missing_evidence.join(", "));
    }
  }

  saveState(state);
  printStatus(state);
  return verdict;
}

function manusPreflight(step: Step): string {
  if (!step.tags?.includes("manus")) {
    return "";
  }

  return `
Manus preflight (required before wiring runtime logic):
- Read current Manus v2 docs before changing lib/manus/ or app/api/ Manus routes
- Docs: ${MANUS_DOCS.join("\n- ")}
- Manus is runtime support only; crisis override stays hardcoded with zero AI
`;
}

async function main(): Promise<void> {
  const state = loadState();

  for (const file of state.workflow.required_files) {
    if (!existsSync(file)) {
      throw new Error(`Missing required file: ${file}`);
    }
  }

  if (statusOnly) {
    printStatus(state);
    return;
  }

  if (verifyOnly) {
    const step = getNextStep(state);
    if (!step) {
      printStatus(state);
      console.log("\nAll steps complete.");
      return;
    }

    console.log(`Verifying step: ${step.id} — ${step.title}\n`);
    state.last_run.started_at = new Date().toISOString();
    state.last_run.status = "running";
    state.last_run.planned_step_id = step.id;
    step.status = "in_progress";
    saveState(state);

    finalizeStepVerification(state, step, {
      agentId: state.agent_id,
      runId: null,
      verifierNotes: "verify-only rerun",
    });
    return;
  }

  if (!process.env.CURSOR_API_KEY) {
    throw new Error("Missing CURSOR_API_KEY. Set it in your environment or .env.local.");
  }

  const product = readFileSync(state.product_md_path, "utf8");
  const step = getNextStep(state);

  if (!step) {
    printStatus(state);
    console.log("\nAll steps complete.");
    return;
  }

  console.log(`Running step: ${step.id} — ${step.title}\n`);
  state.last_run.started_at = new Date().toISOString();
  state.last_run.status = "running";
  state.last_run.planned_step_id = step.id;
  step.status = "in_progress";
  saveState(state);

  const agent = state.agent_id
    ? await Agent.resume(state.agent_id, {
        apiKey: process.env.CURSOR_API_KEY,
        model: { id: MODEL_CODER },
        local: { cwd },
      })
    : await Agent.create({
        apiKey: process.env.CURSOR_API_KEY,
        model: { id: MODEL_CODER },
        local: { cwd },
      });

  try {
    // --- Planner pass (thinking model) ---
    const typecheckOutput = runTest("npm run typecheck");
    const buildOutput = runTest("npm run build");
    const gitStatus = sh("git status --short");

    const plannerPrompt = `
You are the PLANNER for ClearHead. Study the repo and prepare a precise implementation plan.
DO NOT edit any files. DO NOT write code. Output a plan only.

Step to plan: ${step.id} — ${step.title}

Acceptance criteria:
${step.acceptance_criteria.map((criterion) => `- ${criterion}`).join("\n")}

Hard constraints:
- No login; session-based flow only
- Crisis override is always-on, hardcoded (999, 116 123, SHOUT 85258), zero AI
- Copy-ready message and check-in are mandatory
- Language rules: "support check" not "triage"; "support route" not "diagnosis"
- Manus is runtime only; Cursor SDK is engineering only
${manusPreflight(step)}

Current repo state:
- git status: ${gitStatus || "clean"}
- typecheck exit: ${typecheckOutput.exitCode}${typecheckOutput.exitCode !== 0 ? `\n- typecheck errors:\n${typecheckOutput.output.slice(0, 2000)}` : ""}
- build exit: ${buildOutput.exitCode}${buildOutput.exitCode !== 0 ? `\n- build errors:\n${buildOutput.output.slice(0, 2000)}` : ""}

Product spec:
${product}

Output a concise implementation plan: which files to create/edit, what each must contain, and any existing errors to fix first.
`;

    console.log("Planning with thinking model…");
    const planRun = await agent.send(plannerPrompt, { model: { id: MODEL_PLANNER } });
    const planResult = await planRun.wait();
    if (planResult.status === "error") {
      throw new Error(`Planner run failed: ${planResult.id}`);
    }

    // --- Implementer pass (composer model) ---
    const implementPrompt = `
You are the IMPLEMENTER for ClearHead. Follow the plan above and write the code.

Step: ${step.id} — ${step.title}

Acceptance criteria:
${step.acceptance_criteria.map((criterion) => `- ${criterion}`).join("\n")}

Instructions:
1. Implement only this step with minimal, focused changes
2. Fix any typecheck/build errors identified in the plan first
3. Do not mark other steps done
4. After edits, return JSON only:
{
  "summary": "what you changed",
  "changed_files": ["..."],
  "risks": ["..."]
}
`;

    console.log("Implementing with Composer…");

    const implRun = await agent.send(implementPrompt, { model: { id: MODEL_CODER } });
    const implResult = await implRun.wait();
    if (implResult.status === "error") {
      throw new Error(`Implementer run failed: ${implResult.id}`);
    }

    finalizeStepVerification(state, step, {
      agentId: agent.agentId,
      runId: implResult.id,
      verifierNotes: null,
    });
  } finally {
    await agent[Symbol.asyncDispose]();
  }
}

main().catch((error: unknown) => {
  if (error instanceof CursorAgentError) {
    console.error("Cursor startup/config error:", error.message);
    process.exit(1);
  }

  console.error(error);
  process.exit(2);
});
