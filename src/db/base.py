"""Database setup utilities using SQLAlchemy."""

from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path
from typing import Iterator, Optional

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, declarative_base, scoped_session, sessionmaker

from ..utils.config import AppConfig, get_config

Base = declarative_base()
_engine: Optional[Engine] = None
_SessionLocal: Optional[scoped_session] = None


def _ensure_sqlite_path(database_url: str) -> None:
    if database_url.startswith("sqlite"):
        path = database_url.split("sqlite:///", 1)[-1]
        if path:
            db_path = Path(path)
            if db_path.parent:
                db_path.parent.mkdir(parents=True, exist_ok=True)


def configure_database(config: Optional[AppConfig] = None) -> None:
    """Configure the global engine and session factory."""

    global _engine, _SessionLocal

    cfg = config or get_config()
    _ensure_sqlite_path(cfg.database.url)
    _engine = create_engine(cfg.database.url, echo=cfg.database.echo, future=True)
    _SessionLocal = scoped_session(
        sessionmaker(bind=_engine, autocommit=False, autoflush=False, expire_on_commit=False)
    )


def get_engine() -> Engine:
    if _engine is None:
        configure_database()
    return _engine  # type: ignore[return-value]


def get_session_factory() -> scoped_session:
    if _SessionLocal is None:
        configure_database()
    return _SessionLocal  # type: ignore[return-value]


def init_db(config: Optional[AppConfig] = None) -> None:
    """Create database tables if they do not exist."""

    configure_database(config)
    from . import models  # noqa: F401

    Base.metadata.create_all(bind=get_engine())


@contextmanager
def get_session() -> Iterator[Session]:
    session_factory = get_session_factory()
    session = session_factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


__all__ = [
    "Base",
    "configure_database",
    "get_engine",
    "get_session",
    "get_session_factory",
    "init_db",
]
