/**
 * Seed script for feature flags
 * Run with: node src/scripts/seed-feature-flags.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_FEATURE_FLAGS = [
  {
    name: 'voice_notes',
    enabled: false,
    description: 'Enable voice note recording and transcription',
    clinicId: null, // Global flag
  },
  {
    name: 'ai_diagnosis',
    enabled: false,
    description: 'Enable AI-powered diagnosis suggestions',
    clinicId: null, // Global flag
  },
  {
    name: 'advanced_reports',
    enabled: false,
    description: 'Enable advanced reporting features',
    clinicId: null, // Global flag
  },
];

async function seedFeatureFlags() {
  console.log('Seeding feature flags...');

  for (const flag of DEFAULT_FEATURE_FLAGS) {
    try {
      const created = await prisma.featureFlag.upsert({
        where: {
          name_clinicId: {
            name: flag.name,
            clinicId: flag.clinicId,
          },
        },
        update: {
          enabled: flag.enabled,
        },
        create: {
          name: flag.name,
          enabled: flag.enabled,
          clinicId: flag.clinicId,
        },
      });
      
      console.log(`✓ Feature flag "${flag.name}" created/updated (enabled: ${created.enabled})`);
    } catch (error) {
      console.error(`✗ Error creating feature flag "${flag.name}":`, error.message);
    }
  }

  console.log('\nSeeding complete!');
  
  // Display all feature flags
  const allFlags = await prisma.featureFlag.findMany({
    orderBy: { name: 'asc' },
  });
  
  console.log('\nCurrent feature flags:');
  allFlags.forEach(flag => {
    console.log(`  - ${flag.name}: ${flag.enabled ? 'enabled' : 'disabled'} ${flag.clinicId ? `(clinic: ${flag.clinicId})` : '(global)'}`);
  });
}

seedFeatureFlags()
  .catch((e) => {
    console.error('Error seeding feature flags:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
