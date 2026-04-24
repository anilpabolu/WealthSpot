-- 045_safe_listing_category.sql
-- Add safe-specific approval category data and runtime seed records.

BEGIN;

-- Reclassify existing safe vault approvals from legacy opportunity_listing.
UPDATE approval_requests ar
SET category = 'safe_listing',
    updated_at = NOW()
WHERE ar.category = 'opportunity_listing'
  AND (
    COALESCE(ar.payload ->> 'vault_type', '') = 'safe'
    OR EXISTS (
      SELECT 1
      FROM opportunities o
      WHERE o.id::text = ar.resource_id
        AND o.vault_type = 'safe'
    )
  );

-- Copy vault feature flags from opportunity -> safe for runtime feature gating.
INSERT INTO vault_feature_flags (id, vault_type, role, feature_key, enabled, updated_by, updated_at)
SELECT gen_random_uuid(), 'safe', role, feature_key, enabled, updated_by, NOW()
FROM vault_feature_flags
WHERE vault_type = 'opportunity'
ON CONFLICT (vault_type, role, feature_key)
DO UPDATE SET
  enabled = EXCLUDED.enabled,
  updated_by = EXCLUDED.updated_by,
  updated_at = NOW();

-- Seed a safe intro video by cloning the legacy opportunity intro slot.
INSERT INTO app_videos (
  page,
  section_tag,
  title,
  description,
  video_url,
  s3_key,
  content_type,
  size_bytes,
  thumbnail_url,
  additional_info,
  is_active,
  sort_order,
  uploaded_by
)
SELECT
  page,
  'safe_vault_intro',
  'Safe Vault Introduction',
  'Introduction to the Safe Vault — fixed-return mortgage-backed investments.',
  video_url,
  s3_key,
  content_type,
  size_bytes,
  thumbnail_url,
  additional_info,
  is_active,
  sort_order,
  uploaded_by
FROM app_videos
WHERE page = 'vaults'
  AND section_tag = 'opportunity_vault_intro'
ON CONFLICT (page, section_tag)
DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  s3_key = EXCLUDED.s3_key,
  content_type = EXCLUDED.content_type,
  size_bytes = EXCLUDED.size_bytes,
  thumbnail_url = EXCLUDED.thumbnail_url,
  additional_info = EXCLUDED.additional_info,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  uploaded_by = EXCLUDED.uploaded_by,
  updated_at = NOW();

COMMIT;