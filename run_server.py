"""
Supervised launcher for the ForenSync API.

Why this exists: `python main.py` runs a single uvicorn process. If it dies
(native crash in onnxruntime/insightface, OOM, or an accidental kill) the API
is simply gone until someone notices — which is exactly what happened before.
This wrapper restarts it automatically and, crucially, APPENDS every run's
output to server.log with timestamps so a crash leaves evidence behind
(redirecting with `>` truncates the log and destroys it).

Usage:
    python run_server.py            # supervise + auto-restart
    python run_server.py --once     # run once, no restart (for debugging)

Stop with Ctrl+C.
"""
import os
import subprocess
import sys
import time
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
LOG_PATH = os.path.join(HERE, "server.log")

MAX_BACKOFF = 30
RESET_AFTER = 60  # a run lasting this long is "healthy" → reset backoff


def log(line):
    stamp = f"[supervisor {datetime.now().strftime('%H:%M:%S')}] {line}"
    print(stamp, flush=True)
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as fh:
            fh.write(stamp + "\n")
    except OSError:
        pass


def run_once():
    """Start the API and stream its output into server.log (append mode)."""
    env = dict(os.environ)
    # Heavy native deps + Unicode banner need these on Windows
    env.setdefault("PYTHONUTF8", "1")
    env.setdefault("PYTHONIOENCODING", "utf-8")
    env.setdefault("PYTHONUNBUFFERED", "1")

    with open(LOG_PATH, "a", encoding="utf-8") as logfh:
        logfh.write(f"\n=== run started {datetime.now().isoformat()} ===\n")
        logfh.flush()
        proc = subprocess.Popen(
            [sys.executable, "main.py"],
            cwd=HERE,
            env=env,
            stdout=logfh,
            stderr=subprocess.STDOUT,
        )
        return proc.wait()


def main():
    once = "--once" in sys.argv
    backoff = 1

    while True:
        started = time.time()
        log("starting API (python main.py)")
        try:
            code = run_once()
        except KeyboardInterrupt:
            log("interrupted — shutting down")
            return 0

        ran_for = time.time() - started
        log(f"API exited with code {code} after {ran_for:.0f}s")
        log(f"→ check server.log and server_crash.log for the traceback")

        if once:
            return code

        if ran_for > RESET_AFTER:
            backoff = 1  # it was healthy for a while; restart promptly

        log(f"restarting in {backoff}s…")
        try:
            time.sleep(backoff)
        except KeyboardInterrupt:
            log("interrupted — shutting down")
            return 0
        backoff = min(backoff * 2, MAX_BACKOFF)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(0)
