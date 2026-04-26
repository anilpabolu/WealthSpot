"""
Alembic env.py – async migration support for WealthSpot.
"""

import asyncio
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

# Override URL from settings
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
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
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

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
