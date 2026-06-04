"""
Alembic env.py – async migration support for WealthSpot.
"""

# ruff: noqa: F401, I001

import asyncio
import ssl as _ssl_module
import sys
from logging.config import fileConfig
from pathlib import Path

# Ensure project root is importable so migration scripts can `from sql_utils import …`
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from alembic import context
from sqlalchemy import Connection, pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import get_settings
from app.core.database import Base

# Import ALL models so Base.metadata is fully populated –
# required both for `alembic upgrade head` and for `autogenerate` to detect schema drift.
import app.models.user as _user_models  # pyright: ignore[reportUnusedImport]
import app.models.property as _property_models  # pyright: ignore[reportUnusedImport]
import app.models.investment as _investment_models  # pyright: ignore[reportUnusedImport]
import app.models.community as _community_models  # pyright: ignore[reportUnusedImport]
import app.models.approval as _approval_models  # pyright: ignore[reportUnusedImport]
import app.models.opportunity as _opportunity_models  # pyright: ignore[reportUnusedImport]
import app.models.platform_config as _platform_config_models  # pyright: ignore[reportUnusedImport]
import app.models.admin_invite as _admin_invite_models  # pyright: ignore[reportUnusedImport]
import app.models.appreciation_event as _appreciation_event_models  # pyright: ignore[reportUnusedImport]
import app.models.app_image as _app_image_models  # pyright: ignore[reportUnusedImport]
import app.models.app_video as _app_video_models  # pyright: ignore[reportUnusedImport]
import app.models.builder_question as _builder_question_models  # pyright: ignore[reportUnusedImport]
import app.models.builder_update as _builder_update_models  # pyright: ignore[reportUnusedImport]
import app.models.comm_mapping as _comm_mapping_models  # pyright: ignore[reportUnusedImport]
import app.models.company as _company_models  # pyright: ignore[reportUnusedImport]
import app.models.eoi_stage_history as _eoi_stage_history_models  # pyright: ignore[reportUnusedImport]
import app.models.expression_of_interest as _eoi_models  # pyright: ignore[reportUnusedImport]
import app.models.notification as _notification_models  # pyright: ignore[reportUnusedImport]
import app.models.opportunity_assessment as _opportunity_assessment_models  # pyright: ignore[reportUnusedImport]
import app.models.opportunity_investment as _opportunity_investment_models  # pyright: ignore[reportUnusedImport]
import app.models.opportunity_like as _opportunity_like_models  # pyright: ignore[reportUnusedImport]
import app.models.opportunity_media as _opportunity_media_models  # pyright: ignore[reportUnusedImport]
import app.models.pincode as _pincode_models  # pyright: ignore[reportUnusedImport]
import app.models.profiling as _profiling_models  # pyright: ignore[reportUnusedImport]
import app.models.property_referral as _property_referral_models  # pyright: ignore[reportUnusedImport]
import app.models.role_group as _role_group_models  # pyright: ignore[reportUnusedImport]
import app.models.site_content as _site_content_models  # pyright: ignore[reportUnusedImport]
import app.models.user_point as _user_point_models  # pyright: ignore[reportUnusedImport]
import app.models.vault_explorer as _vault_explorer_models  # pyright: ignore[reportUnusedImport]
import app.models.vault_feature_flag as _vault_feature_flag_models  # pyright: ignore[reportUnusedImport]

config = context.config
settings = get_settings()

# asyncpg does not support ?ssl=require as a URL query parameter; strip it.
# SSL is configured via connect_args in run_async_migrations() below.
_raw_db_url = settings.database_url
_db_url_clean = _raw_db_url.replace("?ssl=require", "").replace("&ssl=require", "")
_db_needs_ssl = "ssl=require" in _raw_db_url

# Override URL from settings (cleaned URL for alembic config)
config.set_main_option("sqlalchemy.url", _db_url_clean)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    # Compatibility shim: several historical migrations call `conn.exec_driver_sql(...)`.
    # In offline mode Alembic provides SQLAlchemy MockConnection, which lacks that method.
    # Alias it to `execute` so `alembic upgrade --sql` can render all migrations.
    try:
        from sqlalchemy.engine import mock as _sa_mock

        if not hasattr(_sa_mock.MockConnection, "exec_driver_sql"):
            _sa_mock.MockConnection.exec_driver_sql = _sa_mock.MockConnection.execute  # type: ignore[attr-defined]
    except Exception:
        # If SQLAlchemy internals change, offline generation may still work without this shim.
        pass

    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async engine."""
    from sqlalchemy.ext.asyncio import create_async_engine

    engine_kwargs: dict = {"poolclass": pool.NullPool}
    if _db_needs_ssl:
        _ssl_ctx = _ssl_module.create_default_context()
        _ssl_ctx.check_hostname = False
        _ssl_ctx.verify_mode = _ssl_module.CERT_NONE
        engine_kwargs["connect_args"] = {"ssl": _ssl_ctx}

    connectable = create_async_engine(_db_url_clean, **engine_kwargs)

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
