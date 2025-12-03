-- Create default user for development
-- TODO: Remove in production and implement proper auth

INSERT INTO users (id, email, name, role, settings, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'dev@aimate.local',
  'Development User',
  'admin',
  '{"theme": "dark"}',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create default workspace
INSERT INTO workspaces (id, user_id, name, description, is_default, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Default',
  'Default workspace',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
