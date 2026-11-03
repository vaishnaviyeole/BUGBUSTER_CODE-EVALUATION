
const { spawn } = require("child_process");
const { randomUUID } = require("crypto");

const MAX_CODE_LENGTH = 50_000;
const MAX_INPUT_LENGTH = 10_000;
const MAX_OUTPUT_LENGTH = 30_000;
const DOCKER_TIMEOUT_MS = 20_000;

const ALLOWED_LANGUAGES = ["cpp", "java", "python"];

const runCode = (req, res) => {
  const { language, code, input = "" } = req.body || {};

  // Validate language
  if (!ALLOWED_LANGUAGES.includes(language)) {
    return res.status(400).json({
      status: "error",
      output: "",
      error: "Choose C++, Java, or Python.",
    });
  }

  // Validate source code
  if (typeof code !== "string" || !code.trim()) {
    return res.status(400).json({
      status: "error",
      output: "",
      error: "Code cannot be empty.",
    });
  }

  if (code.length > MAX_CODE_LENGTH) {
    return res.status(413).json({
      status: "error",
      output: "",
      error: "Code is too large. Maximum size is 50,000 characters.",
    });
  }

  // Validate custom input
  if (typeof input !== "string" || input.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({
      status: "error",
      output: "",
      error: "Input must be text of at most 10,000 characters.",
    });
  }

  const containerName = `bugbuster-run-${randomUUID()}`;

  const args = [
    "run",
    "--rm",
    "--name", containerName,
    "-i",
    "--network", "none",
    "--memory=256m",
    "--memory-swap=256m",
    "--cpus=0.5",
    "--pids-limit=32",
    "--read-only",
    "--tmpfs", "/tmp:rw,exec,nosuid,size=64m,uid=10001,gid=10001",
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges",
    "--user", "10001:10001",
    "bugbuster-code-runner:1.0",
  ];

  let child;
  let stdout = "";
  let stderr = "";
  let timedOut = false;
  let outputTooLarge = false;
  let finished = false;

  const finishWithError = (status, message, httpStatus = 500) => {
    if (finished || res.headersSent) return;
    finished = true;

    return res.status(httpStatus).json({
      status,
      output: "",
      error: message,
    });
  };

  try {
    child = spawn("docker", args, { stdio: ["pipe", "pipe", "pipe"] });
  } catch {
    return finishWithError(
      "error",
      "Could not start Docker. Check that Docker Desktop is running."
    );
  }

  const timeout = setTimeout(() => {
    timedOut = true;
    child.kill();

    // Stop the named container if the Docker CLI was killed while it ran.
    const stop = spawn("docker", ["stop", "--time", "1", containerName], {
      stdio: "ignore",
    });
    stop.on("error", () => {});
  }, DOCKER_TIMEOUT_MS);

  const appendOutput = (current, chunk) => {
    const remaining = MAX_OUTPUT_LENGTH - current.length;

    if (chunk.length > remaining) {
      outputTooLarge = true;
      child.kill();
      return current + chunk.toString().slice(0, Math.max(0, remaining));
    }

    return current + chunk.toString();
  };

  child.stdout.on("data", (chunk) => {
    stdout = appendOutput(stdout, chunk);
  });

  child.stderr.on("data", (chunk) => {
    stderr = appendOutput(stderr, chunk);
  });

  child.on("error", () => {
    clearTimeout(timeout);
    finishWithError(
      "error",
      "Could not launch Docker. Check Docker Desktop and try again."
    );
  });

  child.on("close", (exitCode) => {
    clearTimeout(timeout);

    if (finished || res.headersSent) return;
    finished = true;

    if (timedOut) {
      return res.status(200).json({
        status: "timeout",
        output: "",
        error: "Execution exceeded the time limit.",
      });
    }

    if (outputTooLarge) {
      return res.status(200).json({
        status: "error",
        output: stdout,
        error: "Output limit exceeded.",
      });
    }

    let result;

    try {
      result = JSON.parse(stdout);
    } catch {
      console.error("Docker runner error:", stderr);

      return res.status(500).json({
        status: "error",
        output: "",
        error: "The code runner could not return a valid result.",
      });
    }

    // A non-zero Docker exit code may indicate an infrastructure problem.
    if (exitCode !== 0 && !result.status) {
      console.error("Docker runner error:", stderr);

      return res.status(500).json({
        status: "error",
        output: "",
        error: "Docker execution failed.",
      });
    }

    return res.status(200).json(result);
  });

  child.stdin.on("error", () => {
    // The child may close stdin early; its close event handles the response.
  });

  child.stdin.end(JSON.stringify({ language, code, input }));
};

module.exports = { runCode };
