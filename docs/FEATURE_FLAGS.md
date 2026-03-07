# Feature Flag System - MedNoteAI

The feature flag system enables safe rollout of features during beta by allowing you to enable/disable features at runtime without deploying new code.

## Overview

- **Model**: `FeatureFlag` (already exists in Prisma schema)
- **Fields**:
  - `id`: UUID primary key
  - `name`: Feature flag name (e.g., "voice_notes")
  - `enabled`: Boolean (default: false)
  - `clinicId`: Optional - enables per-clinic feature toggles

## Default Feature Flags

| Flag Name | Description |
|-----------|-------------|
| `voice_notes` | Voice note recording and transcription |
| `ai_diagnosis` | AI-powered diagnosis suggestions |
| `advanced_reports` | Advanced reporting features |

## Backend Usage

### 1. Middleware - Protect Routes

Use `requireFeature` middleware to protect routes:

```javascript
import requireFeature from '../middlewares/requireFeature.js';

// Example: Protect voice note routes
router.post(
  '/',
  authorize(Permissions.NOTE_CREATE),
  requireFeature('voice_notes'),
  validate(voiceNoteValidator.createVoiceNoteSchema),
  voiceNoteController.create
);
```

If the feature is disabled, the API returns:
```json
{
  "error": "Feature Not Available",
  "message": "The \"voice_notes\" feature is currently disabled.",
  "code": "FEATURE_DISABLED"
}
```

### 2. Service - Programmatic Access

Use the feature flag service directly:

```javascript
import featureFlagService from '../services/feature-flag.service.js';

// Check if feature is enabled
const isEnabled = await featureFlagService.isEnabled('voice_notes', clinicId);

// Enable/disable feature
await featureFlagService.enable('voice_notes', clinicId);
await featureFlagService.disable('voice_notes', clinicId);

// Get all flags for a clinic
const flags = await featureFlagService.getAll(clinicId);
```

### 3. API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/feature-flags` | Get all flags for current clinic |
| GET | `/api/feature-flags/:name` | Check if specific flag is enabled |
| POST | `/api/feature-flags` | Create/update flag (admin only) |
| PUT | `/api/feature-flags/:name` | Enable/disable flag (admin only) |
| DELETE | `/api/feature-flags/:name` | Delete flag (admin only) |

### 4. Seeding Default Flags

Run the seed script to create default feature flags:

```bash
cd backend
npm run seed:feature-flags
```

Or manually via Prisma:

```bash
cd backend
npx prisma db execute --stdin <<< "
INSERT INTO \"FeatureFlag\" (id, name, enabled, \"clinicId\")
VALUES 
  (gen_random_uuid(), 'voice_notes', false, NULL),
  (gen_random_uuid(), 'ai_diagnosis', false, NULL),
  (gen_random_uuid(), 'advanced_reports', false, NULL)
ON CONFLICT (name, \"clinicId\") DO NOTHING;
"
```

## Frontend Usage

### 1. Setup Providers

Wrap your app with the FeatureFlagProvider:

```tsx
// main.tsx or App.tsx
import { FeatureFlagProvider } from './contexts/FeatureFlagContext';

function App() {
  return (
    <AuthProvider>
      <FeatureFlagProvider>
        <YourApp />
      </FeatureFlagProvider>
    </AuthProvider>
  );
}
```

### 2. Using the Hook

```tsx
import { useFeatureFlags } from './contexts/FeatureFlagContext';

function MyComponent() {
  const { isFeatureEnabled, isVoiceNotesEnabled } = useFeatureFlags();
  
  // Check specific feature
  if (isFeatureEnabled('voice_notes')) {
    return <VoiceNotesButton />;
  }
  
  // Or use convenience helpers
  if (isVoiceNotesEnabled()) {
    return <VoiceNotesButton />;
  }
  
  return null;
}
```

### 3. Using the FeatureGuard Component

Use the `FeatureGuard` component to conditionally render UI:

```tsx
import { FeatureGuard } from './contexts/FeatureFlagContext';

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      <FeatureGuard featureName="voice_notes">
        <VoiceNotesSection />
      </FeatureGuard>
      
      <FeatureGuard 
        featureName="ai_diagnosis"
        fallback={<DisabledFeatureMessage />}
      >
        <AiDiagnosisPanel />
      </FeatureGuard>
      
      <FeatureGuard featureName="advanced_reports">
        <AdvancedReportsSection />
      </FeatureGuard>
    </div>
  );
}
```

### 4. Using the Service Directly

```tsx
import { featureFlagService } from './services/featureFlags';

async function handleButtonClick() {
  const isEnabled = await featureFlagService.isEnabled('voice_notes');
  if (isEnabled) {
    // Do something
  }
}
```

## Feature Flag Resolution

The system supports both global and clinic-specific flags:

1. **First**, it checks for a clinic-specific flag (`clinicId = clinicId`)
2. **Then**, it falls back to the global flag (`clinicId = null`)
3. **Default**: Returns `false` if no flag exists

This allows:
- Global rollout: Set the global flag (clinicId = null)
- Per-clinic rollout: Override for specific clinics

## Example: Gradual Rollout

1. **Initial state**: All features disabled globally
2. **Beta testing**: Enable for specific clinic(s) only
3. **General availability**: Enable globally
4. **Production**: Features always enabled (middleware can be removed)

## Error Handling

- **Backend errors**: Returns 500 with `FEATURE_CHECK_ERROR` code
- **Default behavior**: Feature is disabled if there's any error (fail-safe)

## Security Considerations

- Feature flag routes require authentication
- Only SUPER_ADMIN can create/modify global flags
- Admins can only modify flags for their own clinic
