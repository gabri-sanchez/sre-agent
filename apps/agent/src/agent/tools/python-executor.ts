import { spawn } from "child_process";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Execute Python code in a subprocess
 * Note: In production, this would use Daytona sandbox for isolation
 */
async function executePythonCode(code: string): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const proc = spawn("python3", ["-c", code], {
      timeout: 10000, // 10 second max
      env: {
        ...process.env,
        PYTHONDONTWRITEBYTECODE: "1",
      },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code ?? 1,
      });
    });

    proc.on("error", (err) => {
      resolve({
        stdout: "",
        stderr: `Failed to execute Python: ${err.message}`,
        exitCode: 1,
      });
    });
  });
}

export const pythonExecutorTool = tool(
  async ({ code }) => {
    console.log("Executing Python diagnostic:", code.substring(0, 100) + "...");

    const result = await executePythonCode(code);

    let output = "";
    if (result.stdout) {
      output += `Output:\n${result.stdout}`;
    }
    if (result.stderr) {
      output += `\nErrors:\n${result.stderr}`;
    }
    if (!output) {
      output = result.exitCode === 0 ? "Completed successfully (no output)" : "Failed with no output";
    }

    return output;
  },
  {
    name: "execute_python",
    description:
      "Execute Python code to diagnose issues. Use for DB checks, API tests, config validation. Keep code simple and focused.",
    schema: z.object({
      code: z.string().describe("Python code to execute"),
    }),
  }
);
