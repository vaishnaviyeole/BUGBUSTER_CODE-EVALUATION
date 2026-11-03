
import json
import os
import shutil
import subprocess
import sys
import tempfile
import re

MAX_OUTPUT = 20000
COMPILE_TIMEOUT = 10
RUN_TIMEOUT = 3

ENV = {
    "PATH": "/usr/local/bin:/usr/bin:/bin",
    "HOME": "/tmp",
    "LANG": "C.UTF-8",
    "LC_ALL": "C.UTF-8",
}


def limited(text):
    if len(text) > MAX_OUTPUT:
        return text[:MAX_OUTPUT] + "\n[Output truncated]"
    return text


def main():
    try:
        request = json.load(sys.stdin)
    except Exception:
        print(json.dumps({
            "status": "error",
            "output": "",
            "error": "Invalid runner request."
        }))
        return

    language = request.get("language")
    code = request.get("code")
    stdin_data = request.get("input", "")

    if language not in ("cpp", "java", "python"):
        result = {
            "status": "error",
            "output": "",
            "error": "Unsupported language."
        }
        print(json.dumps(result))
        return

    if not isinstance(code, str) or not code.strip():
        print(json.dumps({
            "status": "error",
            "output": "",
            "error": "Code cannot be empty."
        }))
        return

    if not isinstance(stdin_data, str):
        print(json.dumps({
            "status": "error",
            "output": "",
            "error": "Input must be text."
        }))
        return

    workdir = tempfile.mkdtemp(prefix="run-", dir="/tmp")

    try:
        if language == "cpp":
            source = os.path.join(workdir, "main.cpp")
            executable = os.path.join(workdir, "main")

            with open(source, "w", encoding="utf-8") as file:
                file.write(code)

            try:
                compiled = subprocess.run(
                    ["g++", "-std=c++17", "-O0",
                     source, "-o", executable],
                    capture_output=True,
                    text=True,
                    timeout=COMPILE_TIMEOUT,
                    cwd=workdir,
                    env=ENV
                )
            except subprocess.TimeoutExpired:
                print(json.dumps({
                    "status": "compile_timeout",
                    "output": "",
                    "error": "Compilation exceeded the time limit."
                }))
                return

            if compiled.returncode != 0:
                print(json.dumps({
                    "status": "compile_error",
                    "output": "",
                    "error": limited(compiled.stderr)
                }))
                return

            command = [executable]

        
        elif language == "java":
            # Detect the public Java class name
            class_match = re.search(
                r"\bpublic\s+(?:(?:abstract|final|strictfp|sealed)\s+)*class\s+([A-Za-z_$][A-Za-z0-9_$]*)",
                code
            )

            # Use the detected class name, or Main by default
            class_name = class_match.group(1) if class_match else "Main"

            source = os.path.join(workdir, class_name + ".java")

            with open(source, "w", encoding="utf-8") as file:
                file.write(code)

            try:
                compiled = subprocess.run(
                    ["javac", "-J-Xmx128m", source],
                    capture_output=True,
                    text=True,
                    timeout=COMPILE_TIMEOUT,
                    cwd=workdir,
                    env=ENV
                )
            except subprocess.TimeoutExpired:
                print(json.dumps({
                    "status": "compile_timeout",
                    "output": "",
                    "error": "Compilation exceeded the time limit."
                }))
                return

            if compiled.returncode != 0:
                print(json.dumps({
                    "status": "compile_error",
                    "output": "",
                    "error": limited(compiled.stderr)
                }))
                return

            command = [
                "java",
                "-Xms16m",
                "-Xmx64m",
                "-XX:ActiveProcessorCount=1",
                "-cp", workdir,
                class_name
            ]

        else:
            source = os.path.join(workdir, "main.py")

            with open(source, "w", encoding="utf-8") as file:
                file.write(code)

            command = ["python3", "-I", source]

        try:
            completed = subprocess.run(
                command,
                input=stdin_data,
                capture_output=True,
                text=True,
                timeout=RUN_TIMEOUT,
                cwd=workdir,
                env=ENV
            )

            print(json.dumps({
                "status": (
                    "success" if completed.returncode == 0
                    else "runtime_error"
                ),
                "output": limited(completed.stdout),
                "error": limited(completed.stderr),
                "exitCode": completed.returncode
            }))

        except subprocess.TimeoutExpired as error:
            partial_output = error.stdout or ""
            partial_error = error.stderr or ""

            if isinstance(partial_output, bytes):
                partial_output = partial_output.decode(
                    "utf-8", errors="replace"
                )

            if isinstance(partial_error, bytes):
                partial_error = partial_error.decode(
                    "utf-8", errors="replace"
                )

            print(json.dumps({
                "status": "timeout",
                "output": limited(partial_output),
                "error": limited(
                    partial_error + "\nExecution time limit exceeded."
                )
            }))

    except Exception as error:
        import traceback
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({
            "status": "error",
            "output": "",
            "error": str(error)
        }))

    finally:
        shutil.rmtree(workdir, ignore_errors=True)


if __name__ == "__main__":
    main()
