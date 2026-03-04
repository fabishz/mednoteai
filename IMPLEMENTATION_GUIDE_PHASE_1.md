# MedNoteAI Critical Fixes Implementation Guide

**Status:** Phase 1 - Critical Blockers  
**Target Completion:** Week 1  
**Priority:** 🔴 CRITICAL - Must complete before production

---

## OVERVIEW

This guide provides step-by-step instructions to fix the **7 critical blockers** identified in the API Contract Alignment Audit.

### Critical Issues to Address

1. ✅ **Backend:** Add `/auth/refresh` endpoint
2. ✅ **Backend:** Add `/auth/logout` endpoint
3. ✅ **Backend:** Update response structure to use `accessToken` + `refreshToken`
4. ⏳ **Frontend:** Replace mock AuthContext with real API calls
5. ⏳ **Frontend:** Fix field name mapping (phone, fullName, gender)
6. ⏳ **Frontend:** Implement real patient CRUD
7. ⏳ **Frontend:** Implement real note generation

---

## BACKEND FIXES (COMPLETED)

### Fix #1: Add Auth Refresh Endpoint ✅

**File:** `src/routes/auth.routes.js`  
**Status:** ✅ DONE

Added new route:
```javascript
router.post('/refresh', validate(authValidator.refreshSchema), authController.refresh);
```

**What it does:**
- Accepts `{refreshToken}` in request body
- Verifies refresh token signature and expiry
- Returns new `{accessToken, expiresIn}`
- Ensures user still exists in database

### Fix #2: Add Auth Logout Endpoint ✅

**File:** `src/routes/auth.routes.js`  
**Status:** ✅ DONE

Added new route:
```javascript
router.post('/logout', authMiddleware, authController.logout);
```

**What it does:**
- Requires valid access token
- Returns success response
- Client clears local tokens
- Future: Can add token blacklisting for full invalidation

### Fix #3: Update Token Response Structure ✅

**Files Modified:**
- `src/services/auth.service.js`
- `src/controllers/auth.controller.js`
- `src/config/swagger.js`

**Status:** ✅ DONE

**Old Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt...",
    "user": {...}
  }
}
```

**New Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "jwt...",
    "refreshToken": "jwt...",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "clinicName": "string"
    }
  }
}
```

**Key Changes:**
- Separated `token` into `accessToken` and `refreshToken`
- Added `expiresIn` field (3600 seconds = 1 hour)
- Refresh token expires in 7 days
- Both tokens use `type: 'access'|'refresh'` claim for validation

---

## FRONTEND FIXES (IN PROGRESS)

### Fix #4: Replace Mock AuthContext with Real API ⏳

**Files:**
- `src/contexts/AuthContext.tsx` → Replace with `AuthContext_FIXED.tsx`
- `src/services/auth.ts` → Replace with `auth_FIXED.ts`
- `src/services/api/client.ts` → Replace with `client_FIXED.ts`

**Step 1: Replace AuthContext.tsx**

Replace the mock implementation with the fixed version that:
```typescript
✅ Calls authService.login() instead of using localStorage directly
✅ Calls authService.register() with clinicName parameter
✅ Calls authService.logout() to invalidate session
✅ Handles API errors with user-friendly messages
✅ Restores session on app reload
✅ Tracks isLoading and error state for UI
```

**Step 2: Update auth.ts**

Key changes in the fixed auth service:
```typescript
// OLD - Never used real API
const login = async (credentials) => {
  await new Promise(r => setTimeout(r, 1200)); // FAKE DELAY
  localStorage.setItem("mednoteai-auth", JSON.stringify(u));
};

// NEW - Calls real backend API
async login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post('/auth/login', credentials);
  const { accessToken, refreshToken, expiresIn, user } = response.data;
  this.storeTokens(accessToken, refreshToken);
  return { user, accessToken, refreshToken, expiresIn };
}
```

**Step 3: Update API Client**

The fixed client properly handles the response envelope:
```typescript
// Response structure
interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;           // ← Real data here
  error?: {...};
  meta?: {...};
}

// Methods now return AxiosResponse<ApiEnvelope<T>>
const response = await apiClient.post('/auth/login', credentials);
const { data } = response;  // data = ApiEnvelope
const { accessToken, user } = response.data.data;  // data.data = actual payload
```

### Fix #5: Frontend Field Name Mapping ⏳

**Issue:** Frontend uses different field names than backend

| Frontend | Backend | Required? |
|----------|---------|-----------|
| `name` | `fullName` | YES - FIX |
| `contact` | `phone` | YES - FIX |
| `gender: "Male"` | `gender: "male"` | YES - FIX |

**Action Items:**

#### A. Update Patients.tsx

```typescript
// OLD
interface Patient {
  id: string;
  name: string;           // ❌ Wrong
  contact: string;        // ❌ Wrong
  gender: string;         // Gender can be "Male", "Female" ❌
}

// NEW
interface Patient {
  id: string;
  fullName: string;       // ✅ Correct
  phone: string;          // ✅ Correct
  gender: 'male' | 'female' | 'other';  // ✅ Correct enum
  age: number;
  createdAt: string;
  updatedAt: string;
}
```

#### B. Update Create Patient Form

```typescript
// OLD
const newPatient = {
  name: form.name,          // ❌
  contact: form.contact,    // ❌
  gender: form.gender,      // "Male" ❌
};

// NEW
const newPatient = {
  fullName: form.fullName,  // ✅
  phone: form.phone,        // ✅
  gender: form.gender.toLowerCase(),  // "male" ✅
  age: parseInt(form.age),
};
```

#### C. Update Register Form (src/pages/Register.tsx)

```typescript
// Password validation MUST be at least 8 characters
if (password.length < 8) {
  setError("Password must be at least 8 characters.");
  return;
}

// Include clinicName in register request
const registerData = {
  name,
  email,
  password,
  clinicName  // ✅ Required by backend
};
```

#### D. Update Gender Select Options

```typescript
// OLD
<SelectItem value="Male">Male</SelectItem>
<SelectItem value="Female">Female</SelectItem>
<SelectItem value="Other">Other</SelectItem>

// NEW
<SelectItem value="male">Male</SelectItem>
<SelectItem value="female">Female</SelectItem>
<SelectItem value="other">Other</SelectItem>
```

### Fix #6: Implement Real Patient CRUD ⏳

**File:** `src/pages/Patients.tsx`

**Current State:** Uses hardcoded `mockPatients` from `lib/mockData.ts`

**Target State:** Call backend API endpoints

```typescript
// Create Patient Service
import { apiClient } from '@/services/api/client';

export class PatientService {
  static async create(data: {
    fullName: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    phone: string;
  }) {
    const response = await apiClient.post<any>('/patients', data);
    return response.data.data;
  }

  static async list(page = 1, limit = 10) {
    const response = await apiClient.get<any>(
      `/patients?page=${page}&limit=${limit}`
    );
    return response.data.data;  // {items, total, page, limit}
  }

  static async getById(id: string) {
    const response = await apiClient.get<any>(`/patients/${id}`);
    return response.data.data;
  }

  static async delete(id: string) {
    await apiClient.delete(`/patients/${id}`);
  }
}
```

**Update Patients Component:**

```typescript
// OLD
const [patients, setPatients] = useState<Patient[]>(mockPatients);

const handleAdd = () => {
  const newPatient = {...};
  setPatients([newPatient, ...patients]);  // ❌ Local only
};

// NEW
const [patients, setPatients] = useState<Patient[]>([]);
const [page, setPage] = useState(1);
const [total, setTotal] = useState(0);

useEffect(() => {
  loadPatients();
}, [page]);

const loadPatients = async () => {
  try {
    const data = await PatientService.list(page, 10);
    setPatients(data.items);
    setTotal(data.total);
  } catch (err) {
    toast({ title: "Error", description: "Failed to load patients" });
  }
};

const handleAdd = async () => {
  try {
    const newPatient = await PatientService.create({
      fullName: form.fullName,
      age: parseInt(form.age),
      gender: form.gender as 'male' | 'female' | 'other',
      phone: form.phone
    });
    setPatients([newPatient, ...patients]);
    setModalOpen(false);
  } catch (err) {
    toast({ title: "Error", description: "Failed to create patient" });
  }
};
```

### Fix #7: Implement Real Note Generation ⏳

**File:** `src/pages/Notes.tsx`

**Current State:** Generates SOAP notes locally with mock data

**Target State:** Sends raw input to backend AI service

```typescript
// Create Note Service
export class NoteService {
  static async generate(patientId: string, rawInputText: string) {
    const response = await apiClient.post<any>('/notes/generate', {
      patientId,
      rawInputText
    });
    return response.data.data;  // {id, structuredOutput}
  }

  static async list(page = 1, limit = 10, patientId?: string) {
    let url = `/notes?page=${page}&limit=${limit}`;
    if (patientId) url += `&patientId=${patientId}`;
    const response = await apiClient.get<any>(url);
    return response.data.data;
  }

  static async getById(id: string) {
    const response = await apiClient.get<any>(`/notes/${id}`);
    return response.data.data;
  }

  static async downloadPDF(id: string) {
    // Returns PDF blob
    const response = await apiClient.client.get(`/notes/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }
}
```

**Update Notes Component:**

```typescript
// OLD
const handleGenerate = async () => {
  setGenerating(true);
  await new Promise(r => setTimeout(r, 2000));  // ❌ Fake delay
  const result = generateSOAP(symptoms, diagnosis, observations, treatment);
  setNote(result);  // ❌ Client-side only
};

// NEW
const [patientId, setPatientId] = useState("");

const handleGenerate = async () => {
  if (!patientId) {
    toast({ title: "Error", description: "Select a patient first" });
    return;
  }

  try {
    setGenerating(true);
    // Combine all inputs into raw text
    const rawInputText = `
      Symptoms: ${symptoms}
      Diagnosis: ${diagnosis}
      Observations: ${observations}
      Treatment: ${treatment}
    `;

    const result = await NoteService.generate(patientId, rawInputText);
    setNote(result.structuredOutput);  // ✅ From backend AI
    setNoteId(result.id);
    toast({ title: "Success", description: "Note generated successfully" });
  } catch (err) {
    toast({ title: "Error", description: "Failed to generate note" });
  } finally {
    setGenerating(false);
  }
};

const handleSave = async () => {
  // Note is already persisted on backend, just show confirmation
  setLastSaved(new Date().toLocaleTimeString());
  toast({ title: "Note saved", description: "Your clinical note has been saved." });
};
```

---

## TESTING THE FIXES

### Phase 1: Manual Testing (Local)

#### 1. Test Backend Endpoints

```bash
# Terminal 1: Start backend
cd MedNoteAIBackend
npm run dev

# Terminal 2: Test endpoints

# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Jane Doe",
    "email": "jane@clinic.com",
    "password": "SecurePass123!",
    "clinicName": "Riverside Clinic"
  }'

# Response should include: accessToken, refreshToken, expiresIn
```

#### 2. Test Token Refresh

```bash
# Using the refreshToken from register response
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "eyJ..."}'

# Response should include: accessToken, expiresIn
```

#### 3. Test Protected Endpoints

```bash
# Using accessToken from login/register
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJ..."

# Should return user profile
```

### Phase 2: Frontend Testing

#### 1. Login Flow
- [ ] Navigate to `/login`
- [ ] Enter valid credentials
- [ ] Click "Sign In"
- [ ] Should redirect to `/dashboard`
- [ ] User name should display in header
- [ ] Tokens should be in sessionStorage

#### 2. Register Flow
- [ ] Navigate to `/register`
- [ ] Fill in all fields (including clinicName)
- [ ] Password must be 8+ characters
- [ ] Click "Create Account"
- [ ] Should redirect to dashboard
- [ ] Should display success message

#### 3. Patient CRUD
- [ ] Create patient with fullName, age (0-130), gender (lowercase), phone
- [ ] Should appear in patient list
- [ ] Page refresh should persist data
- [ ] List should show pagination

#### 4. Note Generation
- [ ] Select a patient
- [ ] Enter raw clinical text (minimum 10 characters)
- [ ] Click "Generate SOAP Note"
- [ ] Should show structured output from backend
- [ ] Should save to database
- [ ] Refresh page should show saved note

#### 5. Token Refresh
- [ ] Login successfully
- [ ] Wait 2 hours (or manually expire token)
- [ ] Make API request
- [ ] Should automatically refresh token
- [ ] Request should succeed with new token

### Phase 3: Integration Testing

Create unit tests:

```typescript
// frontend/src/services/__tests__/auth.test.ts
describe('AuthService', () => {
  it('should login with correct credentials', async () => {
    const response = await authService.login({
      email: 'test@clinic.com',
      password: 'Password123'
    });
    
    expect(response.user).toBeDefined();
    expect(response.accessToken).toBeDefined();
    expect(response.refreshToken).toBeDefined();
  });

  it('should register with clinicName', async () => {
    const response = await authService.register({
      name: 'Dr. Test',
      email: 'test@clinic.com',
      password: 'Password123',
      clinicName: 'Test Clinic'
    });
    
    expect(response.user.clinicName).toBe('Test Clinic');
  });

  it('should refresh access token', async () => {
    // Setup: Get initial tokens
    const initial = await authService.login({...});
    
    // Act: Refresh token
    const refreshed = await apiClient.post('/auth/refresh', {
      refreshToken: initial.refreshToken
    });
    
    // Assert: New token issued
    expect(refreshed.data.data.accessToken).toBeDefined();
  });
});
```

---

## CONFIGURATION CHECKLIST

### Backend Environment Variables

```bash
# .env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://user:pass@localhost:5432/mednote"
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="1h"
CORS_ORIGIN="http://localhost:5173,http://localhost:3000"
```

### Frontend Environment Variables

```bash
# .env.local
VITE_API_URL=http://localhost:3000/api
```

---

## ROLLOUT PLAN

### Day 1: Backend
- [ ] Merge auth service updates (refresh, logout endpoints)
- [ ] Deploy to development environment
- [ ] Test all auth endpoints manually
- [ ] Get approval from tech lead

### Day 2: Frontend Core
- [ ] Replace AuthContext with fixed version
- [ ] Replace auth.ts with fixed version
- [ ] Replace API client with fixed version
- [ ] Test login/register/logout flows
- [ ] Verify token refresh works

### Day 3: Frontend Integration
- [ ] Implement PatientService
- [ ] Update Patients.tsx to call backend
- [ ] Implement NoteService
- [ ] Update Notes.tsx to call backend
- [ ] Test all CRUD operations

### Day 4: QA & Bug Fixes
- [ ] Full integration testing
- [ ] Fix any issues found
- [ ] Verify all field mappings correct
- [ ] Test error scenarios

### Day 5: Documentation & Deploy
- [ ] Update API documentation
- [ ] Create migration guide
- [ ] Deploy to staging
- [ ] Final QA sign-off

---

## KNOWN ISSUES & WORKAROUNDS

### Issue: Password validation mismatch
- **Problem:** Frontend allows 6 chars; backend requires 8
- **Solution:** Update frontend validation to require 8+ characters
- **Files:** `src/pages/Login.tsx`, `src/pages/Register.tsx`

### Issue: Gender enum values
- **Problem:** Frontend sends "Male"; backend expects "male"
- **Solution:** Convert to lowercase before sending: `gender.toLowerCase()`
- **Files:** `src/pages/Patients.tsx`

### Issue: Missing clinicName in Register
- **Problem:** Frontend register form doesn't ask for clinic name
- **Solution:** Add clinicName field to register form
- **Files:** `src/pages/Register.tsx`

### Issue: No patient selection in Notes
- **Problem:** Notes not associated with patients
- **Solution:** Add patient selector before note generation
- **Files:** `src/pages/Notes.tsx`

---

## SUCCESS CRITERIA

All of the following must be true:

- [ ] User can register with valid email, password (8+ chars), name, and clinicName
- [ ] User can login and receive accessToken + refreshToken
- [ ] Access token has 1 hour expiry
- [ ] Refresh token has 7 day expiry
- [ ] User can logout and tokens are cleared
- [ ] User can create patient with fullName, age (0-130), gender (male/female/other), phone
- [ ] Created patient persists across page refreshes
- [ ] User can generate note associated with specific patient
- [ ] Generated note returns structured SOAP format from backend
- [ ] Note persists in database
- [ ] Token refresh works transparently (no manual re-login needed)
- [ ] All validation errors display helpful messages
- [ ] Typing is consistent (TypeScript no errors)

---

## NEXT PHASE: Security & Authorization (Week 2)

After Phase 1 is complete, proceed to:

- [ ] Implement multi-tenant isolation (clinic_id)
- [ ] Implement RBAC (role-based access control)
- [ ] Add patient access control (can only see own patients)
- [ ] Implement audit logging
- [ ] Move tokens to httpOnly cookies
- [ ] Add rate limit feedback to UI

---

**Report Generated:** February 25, 2026  
**Target Completion:** March 3, 2026  
**Estimated Effort:** 40 developer hours (5 days with 2 developers)
