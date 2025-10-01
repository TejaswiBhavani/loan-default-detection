"""Logging configuration helper."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from .config import get_config

_LOGGER: Optional[logging.Logger] = None


def get_logger(name: str = "loan_default") -> logging.Logger:
    global _LOGGER
    if _LOGGER is not None:
        return _LOGGER

    config = get_config()
    log_file = Path(config.logging.file)
    log_file.parent.mkdir(parents=True, exist_ok=True)

    logging.basicConfig(
        level=getattr(logging, config.logging.level.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler(log_file, encoding="utf-8"),
        ],
    )

    _LOGGER = logging.getLogger(name)
    _LOGGER.debug("Logger initialized")
    return _LOGGER


__all__ = ["get_logger"]
