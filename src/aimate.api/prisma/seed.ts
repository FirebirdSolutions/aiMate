/**
 * Prisma Seed Script
 * Creates default user and workspace for development
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default development user
  const user = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'dev@aimate.local',
      name: 'Development User',
      role: 'admin',
      settings: { theme: 'dark' },
    },
  });

  console.log(`Created user: ${user.email}`);

  // Create default workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      userId: user.id,
      name: 'Default',
      description: 'Default workspace',
      isDefault: true,
    },
  });

  console.log(`Created workspace: ${workspace.name}`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
