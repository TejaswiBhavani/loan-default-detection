"""Launch the Streamlit dashboard."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Streamlit dashboard")
    parser.add_argument("--port", type=int, default=8501)
    parser.add_argument("--address", default="0.0.0.0")
    args = parser.parse_args()

    command = [
        sys.executable,
        "-m",
        "streamlit",
        "run",
        str(PROJECT_ROOT / "streamlit_app.py"),
        "--server.port",
        str(args.port),
        "--server.address",
        args.address,
    ]

    subprocess.run(command, check=True)


if __name__ == "__main__":
    main()
