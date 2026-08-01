from __future__ import annotations

import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys


REPOSITORY_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_ROOT = REPOSITORY_ROOT / "outputs" / "coverage" / "python"


def run(*arguments: str, environment: dict[str, str]) -> str:
    command = [sys.executable, "-m", "coverage", *arguments]
    print(f"PYTHON-COVERAGE {' '.join(arguments)}", flush=True)
    result = subprocess.run(
        command,
        cwd=REPOSITORY_ROOT,
        env=environment,
        check=True,
        capture_output=True,
        text=True,
    )
    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)
    return f"{result.stdout}\n{result.stderr}"


def main() -> int:
    shutil.rmtree(OUTPUT_ROOT, ignore_errors=True)
    OUTPUT_ROOT.mkdir(parents=True)
    environment = {
        **os.environ,
        "COVERAGE_FILE": str(OUTPUT_ROOT / ".coverage"),
    }
    source_roots = "apps/data-pipeline/src,integrations/odoo/src"
    test_results: list[dict[str, object]] = []
    for suite, tests in (
        ("data-pipeline", "apps/data-pipeline/tests"),
        ("odoo-bridge", "integrations/odoo/tests"),
    ):
        output = run(
            "run",
            "--branch",
            "--parallel-mode",
            f"--source={source_roots}",
            "-m",
            "unittest",
            "discover",
            "-s",
            tests,
            "-v",
            environment=environment,
        )
        match = re.search(r"Ran (\d+) tests? in", output)
        if match is None:
            raise RuntimeError(f"coverage run for {suite} emitted no unittest count")
        test_results.append(
            {"suite": suite, "status": "PASSED", "tests": int(match.group(1))}
        )
    run("combine", environment=environment)
    run("json", "-o", str(OUTPUT_ROOT / "coverage.json"), environment=environment)
    run("xml", "-o", str(OUTPUT_ROOT / "coverage.xml"), environment=environment)
    (OUTPUT_ROOT / "test-results.json").write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "runner": "unittest",
                "suites": test_results,
                "tests": sum(int(result["tests"]) for result in test_results),
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print("Python evidence -> outputs/coverage/python/{coverage.json,coverage.xml,test-results.json}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
