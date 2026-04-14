"""
Command Control Centre router – super-admin only platform configuration.
"""

import secrets
from datetime import datetime, timedelta, timezone
from typing import Any
import uuid as _uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user, require_super_admin
from app.models.admin_invite import AdminInvite
from app.models.approval import ApprovalCategory, ApprovalRequest, ApprovalStatus
from app.models.opportunity import Opportunity, OpportunityStatus
from app.models.opportunity_investment import OpportunityInvestment, OppInvestmentStatus
from app.models.platform_config import PlatformConfig
from app.models.user import User, UserRole
from app.models.role_group import RoleGroup, GroupMessage
from app.schemas.admin_invite import AdminInviteCreate, AdminInviteRead
from app.schemas.platform_config import ConfigCreate, ConfigRead, ConfigUpdate
from app.schemas.user import UserRead

router = APIRouter(prefix="/control-centre", tags=["control-centre"])


# ── Public Platform Stats ────────────────────────────────────────────────────


@router.get("/platform-stats")
async def platform_stats(db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    """Public endpoint: aggregated platform metrics for landing page."""
    active_statuses = [
        OpportunityStatus.APPROVED, OpportunityStatus.ACTIVE,
        OpportunityStatus.FUNDING, OpportunityStatus.FUNDED,
    ]

    total_members = (await db.execute(select(func.count(User.id)))).scalar() or 0

    active_opps = (
        await db.execute(
            select(func.count(Opportunity.id)).where(
                Opportunity.status.in_(active_statuses)
            )
        )
    ).scalar() or 0

    capital_deployed = (
        await db.execute(
            select(func.coalesce(func.sum(OpportunityInvestment.amount), 0)).where(
                OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED
            )
        )
    ).scalar() or 0

    markets = (
        await db.execute(
            select(func.count(func.distinct(Opportunity.city))).where(
                Opportunity.city.isnot(None),
                Opportunity.status.in_(active_statuses),
            )
        )
    ).scalar() or 0

    verified_investors = (
        await db.execute(
            select(func.count(func.distinct(OpportunityInvestment.user_id))).where(
                OpportunityInvestment.status == OppInvestmentStatus.CONFIRMED
            )
        )
    ).scalar() or 0

    return {
        "total_members": total_members,
        "capital_deployed": float(capital_deployed),
        "active_opportunities": active_opps,
        "markets_covered": max(markets, 1),
        "verified_investors": verified_investors,
    }


# ── Public Vault Config ──────────────────────────────────────────────────────


@router.get("/vault-config")
async def get_vault_config(db: AsyncSession = Depends(get_db)) -> dict[str, bool]:
    """Public endpoint: returns which vaults are enabled/disabled + video toggles.

    Reads from PlatformConfig section='vaults' and section='content'.
    Missing keys default to True (enabled).
    """
    result = await db.execute(
        select(PlatformConfig).where(
            PlatformConfig.section.in_(["vaults", "content"]),
            PlatformConfig.is_active.is_(True),
        )
    )
    configs = {c.key: c.value for c in result.scalars().all()}

    def _is_enabled(key: str) -> bool:
        val = configs.get(key)
        if val is None:
            return True
        if isinstance(val, dict):
            return bool(val.get("enabled", True))
        return bool(val)

    return {
        "wealth_vault_enabled": True,  # always on — core product
        "opportunity_vault_enabled": _is_enabled("opportunity_vault_enabled"),
        "community_vault_enabled": _is_enabled("community_vault_enabled"),
        # Video toggles (per-category)
        "intro_videos_enabled": _is_enabled("intro_videos_enabled"),
        "vault_videos_enabled": _is_enabled("vault_videos_enabled"),
        "property_videos_enabled": _is_enabled("property_videos_enabled"),
        "video_management_enabled": _is_enabled("video_management_enabled"),
    }


# ── Public Vault Metrics Config ──────────────────────────────────────────────

# Default metrics per vault (used when no DB config exists yet)
_DEFAULT_VAULT_METRICS: dict[str, list[str]] = {
    "wealth": ["total_invested", "investor_count", "properties_listed"],
    "opportunity": ["total_invested", "investor_count", "startups_listed"],
    "community": ["total_invested", "investor_count", "projects_launched", "co_investors"],
}


@router.get("/vault-metrics-config")
async def get_vault_metrics_config(db: AsyncSession = Depends(get_db)) -> dict[str, list[str]]:
    """Public endpoint: returns enabled metric keys per vault."""
    result = await db.execute(
        select(PlatformConfig).where(
            PlatformConfig.section == "vault_metrics",
            PlatformConfig.is_active.is_(True),
        )
    )
    configs = {c.key: c.value for c in result.scalars().all()}

    def _metrics(key: str, vault: str) -> list[str]:
        val = configs.get(key)
        if isinstance(val, dict) and "metrics" in val:
            return val["metrics"]
        return _DEFAULT_VAULT_METRICS.get(vault, [])

    return {
        "wealth": _metrics("wealth_metrics", "wealth"),
        "opportunity": _metrics("opportunity_metrics", "opportunity"),
        "community": _metrics("community_metrics", "community"),
    }


# ── Platform Config CRUD ─────────────────────────────────────────────────────


@router.get("/configs", response_model=list[ConfigRead])
async def list_configs(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
    section: str | None = Query(None),
) -> list[ConfigRead]:
    """List all platform configs, optionally filtered by section."""
    query = select(PlatformConfig).order_by(PlatformConfig.section, PlatformConfig.key)
    if section:
        query = query.where(PlatformConfig.section == section)
    result = await db.execute(query)
    return [ConfigRead.model_validate(c) for c in result.scalars().all()]


@router.post("/configs", response_model=ConfigRead)
async def create_config(
    body: ConfigCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin),
) -> ConfigRead:
    """Create a new platform config entry."""
    config = PlatformConfig(
        section=body.section,
        key=body.key,
        value=body.value,
        description=body.description,
        is_active=body.is_active,
        updated_by=admin.id,
    )
    db.add(config)
    await db.flush()
    await db.refresh(config)
    return ConfigRead.model_validate(config)


@router.put("/configs/{config_id}", response_model=ConfigRead)
async def update_config(
    config_id: str,
    body: ConfigUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin),
) -> ConfigRead:
    """Update a platform config entry."""
    result = await db.execute(
        select(PlatformConfig).where(PlatformConfig.id == _uuid.UUID(config_id))
    )
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")

    if body.value is not None:
        config.value = body.value
    if body.description is not None:
        config.description = body.description
    if body.is_active is not None:
        config.is_active = body.is_active
    config.updated_by = admin.id

    await db.flush()
    await db.refresh(config)
    return ConfigRead.model_validate(config)


# ── Dashboard Overview ───────────────────────────────────────────────────────


@router.get("/dashboard")
async def control_dashboard(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
) -> dict[str, Any]:
    """Aggregated overview for the Command Control Centre dashboard."""
    total_users = (await db.execute(select(func.count(User.id)).where(User.is_active.is_(True)))).scalar() or 0

    # Role distribution
    role_counts = {}
    for role in UserRole:
        count = (await db.execute(
            select(func.count(User.id)).where(User.role == role, User.is_active.is_(True))
        )).scalar() or 0
        role_counts[role.value] = count

    # Approval stats
    pending_approvals = (await db.execute(
        select(func.count(ApprovalRequest.id)).where(
            ApprovalRequest.status.in_([ApprovalStatus.PENDING, ApprovalStatus.IN_REVIEW])
        )
    )).scalar() or 0

    total_opportunities = (await db.execute(
        select(func.count(Opportunity.id))
    )).scalar() or 0

    total_configs = (await db.execute(
        select(func.count(PlatformConfig.id))
    )).scalar() or 0

    return {
        "total_users": total_users,
        "role_distribution": role_counts,
        "pending_approvals": pending_approvals,
        "total_opportunities": total_opportunities,
        "total_configs": total_configs,
    }


# ── User Role Management ────────────────────────────────────────────────────


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: UserRole = Query(...),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
) -> dict[str, str]:
    """Directly assign a role to a user (super-admin bypass)."""
    result = await db.execute(select(User).where(User.id == _uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = role
    await db.flush()
    return {"status": "ok", "user_id": str(user.id), "new_role": role.value}


@router.get("/users", response_model=list[UserRead])
async def list_all_users(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
    role: UserRole | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> list[UserRead]:
    """List all users for the control centre."""
    query = select(User).where(User.is_active.is_(True))
    if role:
        query = query.where(User.role == role)
    query = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    return [UserRead.model_validate(u) for u in result.scalars().all()]


# ── Approval Category Configs ────────────────────────────────────────────────


@router.get("/approval-categories")
async def list_approval_categories(
    _admin: User = Depends(require_super_admin),
) -> list[dict[str, str]]:
    """Return all approval category types and their labels."""
    return [
        {"value": c.value, "label": c.value.replace("_", " ").title()}
        for c in ApprovalCategory
    ]


# ── Role Groups ──────────────────────────────────────────────────────────────


@router.get("/role-groups")
async def list_role_groups(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
) -> list[dict]:
    """List all role groups."""
    result = await db.execute(select(RoleGroup).order_by(RoleGroup.name))
    groups = result.scalars().all()
    return [
        {
            "id": str(g.id),
            "name": g.name,
            "description": g.description,
            "roles": g.roles,
            "is_active": g.is_active,
            "created_at": g.created_at.isoformat() if g.created_at else None,
        }
        for g in groups
    ]


@router.post("/role-groups")
async def create_role_group(
    body: dict,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
) -> dict:
    """Create a new role group."""
    group = RoleGroup(
        name=body["name"],
        description=body.get("description"),
        roles=body.get("roles", []),
    )
    db.add(group)
    await db.flush()
    await db.refresh(group)
    return {"id": str(group.id), "name": group.name, "roles": group.roles}


@router.put("/role-groups/{group_id}")
async def update_role_group(
    group_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
) -> dict:
    """Update a role group's name, description, or roles."""
    result = await db.execute(select(RoleGroup).where(RoleGroup.id == _uuid.UUID(group_id)))
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Role group not found")

    if "name" in body:
        group.name = body["name"]
    if "description" in body:
        group.description = body["description"]
    if "roles" in body:
        group.roles = body["roles"]
    if "is_active" in body:
        group.is_active = body["is_active"]

    await db.flush()
    return {"status": "ok", "id": str(group.id)}


# ── Group Messages ───────────────────────────────────────────────────────────


@router.post("/role-groups/{group_id}/messages")
async def send_group_message(
    group_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin),
) -> dict:
    """Send a message to all users in a role group."""
    result = await db.execute(select(RoleGroup).where(RoleGroup.id == _uuid.UUID(group_id)))
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Role group not found")

    msg = GroupMessage(
        group_id=group.id,
        sender_id=admin.id,
        subject=body["subject"],
        body=body["body"],
        message_type=body.get("message_type", "announcement"),
    )
    db.add(msg)
    await db.flush()
    return {"status": "sent", "message_id": str(msg.id), "group": group.name}


@router.get("/role-groups/{group_id}/messages")
async def list_group_messages(
    group_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
) -> list[dict]:
    """List messages sent to a role group."""
    result = await db.execute(
        select(GroupMessage)
        .where(GroupMessage.group_id == _uuid.UUID(group_id))
        .order_by(GroupMessage.created_at.desc())
    )
    messages = result.scalars().all()
    return [
        {
            "id": str(m.id),
            "subject": m.subject,
            "body": m.body,
            "message_type": m.message_type,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in messages
    ]


# ── Admin Invites ────────────────────────────────────────────────────────────


@router.post("/invite-admin", response_model=AdminInviteRead)
async def invite_admin(
    body: AdminInviteCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_super_admin),
) -> AdminInvite:
    """Invite a new admin or super_admin by email. Generates a secure token."""
    # Soft warning if already >= 3 super_admins
    if body.role == "super_admin":
        count = (await db.execute(
            select(func.count(User.id)).where(
                User.roles.contains('"super_admin"'),
                User.is_active.is_(True),
            )
        )).scalar() or 0
        if count >= 3:
            pass  # soft warning — not blocking

    # Check for existing pending invite
    existing = await db.execute(
        select(AdminInvite).where(
            AdminInvite.email == body.email,
            AdminInvite.status == "pending",
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Pending invite already exists for this email")

    token = secrets.token_urlsafe(48)
    invite = AdminInvite(
        email=body.email,
        role=body.role,
        invited_by=admin.id,
        token=token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invite)
    await db.flush()
    await db.refresh(invite)
    return invite


@router.post("/accept-invite/{token}")
async def accept_invite(
    token: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Accept an admin invite. Adds the admin/super_admin role to the user."""
    result = await db.execute(
        select(AdminInvite).where(AdminInvite.token == token)
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.status != "pending":
        raise HTTPException(status_code=400, detail=f"Invite is already {invite.status}")
    if invite.expires_at < datetime.now(timezone.utc):
        invite.status = "expired"
        await db.flush()
        raise HTTPException(status_code=400, detail="Invite has expired")
    if invite.email != user.email:
        raise HTTPException(status_code=403, detail="Invite was sent to a different email")

    # Add role to user
    current_roles = list(user.roles or [])
    if invite.role not in current_roles:
        current_roles.append(invite.role)
        user.roles = current_roles
    user.role = UserRole(invite.role)  # sync legacy column
    user.primary_role = invite.role

    invite.status = "accepted"
    invite.accepted_at = datetime.now(timezone.utc)
    await db.flush()
    return {"status": "accepted", "role": invite.role}


@router.get("/invites", response_model=list[AdminInviteRead])
async def list_invites(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_super_admin),
    status_filter: str | None = Query(None, alias="status"),
) -> list[AdminInvite]:
    """List all admin invites, optionally filtered by status."""
    query = select(AdminInvite).order_by(AdminInvite.created_at.desc())
    if status_filter:
        query = query.where(AdminInvite.status == status_filter)
    result = await db.execute(query)
    return list(result.scalars().all())
