"""Train the loan default prediction model."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.pipeline.training import train
from src.utils.config import get_config


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the loan default prediction model")
    parser.add_argument(
        "--config",
        type=Path,
        default=Path("config/config.yaml"),
        help="Path to configuration YAML",
    )
    args = parser.parse_args()

    config = get_config(args.config)
    metrics = train(config)

    print("Training complete. Key metrics:")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
