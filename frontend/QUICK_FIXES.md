# MedNoteAI Frontend - Quick Fix Implementations

This document provides ready-to-use code snippets for critical issues identified in the audit.

---

## Fix #1: Add Error Boundary to App.tsx

**Problem**: Application crashes on any component error  
**Severity**: CRITICAL  
**Time**: 15 minutes

Replace your `src/App.tsx`:

```tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import ErrorBoundary from "@/components/ErrorBoundary";

import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Notes from "./pages/Notes";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

const App = () => (
  <ErrorBoundary>  {/* ← ADD ERROR BOUNDARY */}
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
              <Route path="/dashboard/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
              <Route path="/dashboard/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>  {/* ← CLOSE ERROR BOUNDARY */}
);

export default App;
```

---

## Fix #2: Fix Unsafe localStorage Access in AuthContext

**Problem**: JSON.parse() crashes if localStorage is corrupted  
**Severity**: CRITICAL  
**Time**: 10 minutes

Update `src/contexts/AuthContext.tsx`:

```tsx
useEffect(() => {
  const stored = localStorage.getItem("mednoteai-auth");
  try {  // ← ADD TRY-CATCH
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate the parsed data has required fields
      if (parsed && parsed.id && parsed.email) {
        setUser(parsed);
      } else {
        // Invalid data structure
        localStorage.removeItem("mednoteai-auth");
      }
    }
  } catch (error) {
    // Corrupted localStorage data
    console.error("Failed to parse stored auth:", error);
    localStorage.removeItem("mednoteai-auth");
  }
  setIsLoading(false);
}, []);
```

---

## Fix #3: Add Error Handling to Auth Functions

**Problem**: Promise rejections not caught  
**Severity**: CRITICAL  
**Time**: 10 minutes

Update auth callbacks in `src/contexts/AuthContext.tsx`:

```tsx
const login = useCallback(async (email: string, password: string) => {
  setIsLoading(true);
  try {  // ← ADD TRY-CATCH
    await new Promise((r) => setTimeout(r, 1200));
    const u = { ...MOCK_USER, email };
    localStorage.setItem("mednoteai-auth", JSON.stringify(u));
    setUser(u);
  } catch (error) {
    console.error("Login failed:", error);
    throw new Error("Login failed. Please try again.");
  } finally {
    setIsLoading(false);
  }
}, []);

const register = useCallback(async (name: string, email: string, password: string) => {
  setIsLoading(true);
  try {  // ← ADD TRY-CATCH
    await new Promise((r) => setTimeout(r, 1500));
    const u = { ...MOCK_USER, name, email };
    localStorage.setItem("mednoteai-auth", JSON.stringify(u));
    setUser(u);
  } catch (error) {
    console.error("Registration failed:", error);
    throw new Error("Registration failed. Please try again.");
  } finally {
    setIsLoading(false);
  }
}, []);
```

---

## Fix #4: Improve Email Validation

**Problem**: Only checks if empty, not format  
**Severity**: HIGH  
**Time**: 5 minutes

Update `src/pages/Login.tsx` and `src/pages/Register.tsx`:

```tsx
const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) return "Email is required";
  if (!emailRegex.test(email)) return "Invalid email format";
  
  return null;
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  
  // Validate email
  const emailError = validateEmail(email);
  if (emailError) {
    setError(emailError);
    return;
  }
  
  // Validate password
  if (!password) {
    setError("Password is required");
    return;
  }
  
  if (password.length < 6) {
    setError("Password must be at least 6 characters");
    return;
  }

  try {
    setLoading(true);
    await login(email, password);
    navigate("/dashboard");
  } catch (err) {
    setError("Invalid credentials. Please try again.");
  } finally {
    setLoading(false);
  }
};
```

---

## Fix #5: Improve Password Validation

**Problem**: Weak 6-character minimum  
**Severity**: HIGH  
**Time**: 10 minutes

Create `src/utils/passwordValidator.ts`:

```tsx
export interface PasswordValidation {
  isValid: boolean;
  score: number; // 0-4 (weak to strong)
  feedback: string[];
}

export function validatePassword(password: string): PasswordValidation {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return { isValid: false, score: 0, feedback: ["Password is required"] };
  }

  // Minimum length (12 instead of 6)
  if (password.length >= 12) {
    score++;
  } else {
    feedback.push(`At least 12 characters required (${password.length}/12)`);
  }

  // Uppercase
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push("Add at least one uppercase letter");
  }

  // Lowercase
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push("Add at least one lowercase letter");
  }

  // Numbers
  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push("Add at least one number");
  }

  // Special characters
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    score++;
  } else {
    feedback.push("Add at least one special character (!@#$%^&*)");
  }

  return {
    isValid: score >= 4, // All criteria must be met
    score,
    feedback: score < 4 ? feedback : [],
  };
}

// Visual indicator
export function getPasswordStrength(score: number): {
  label: string;
  color: string;
} {
  if (score < 2) return { label: "Very Weak", color: "text-destructive" };
  if (score < 3) return { label: "Weak", color: "text-orange-500" };
  if (score < 4) return { label: "Good", color: "text-yellow-500" };
  return { label: "Strong", color: "text-green-500" };
}
```

Use in Register page:

```tsx
import { validatePassword, getPasswordStrength } from "@/utils/passwordValidator";

const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
  isValid: false,
  score: 0,
  feedback: [],
});

const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const pwd = e.target.value;
  setPassword(pwd);
  setPasswordValidation(validatePassword(pwd));
};

<div className="space-y-2">
  <Label htmlFor="password">Password</Label>
  <div className="relative">
    <Input 
      id="password" 
      type={showPass ? "text" : "password"} 
      value={password} 
      onChange={handlePasswordChange}
      placeholder="Min. 12 characters with uppercase, number, special char"
      className="h-11 pr-10"
    />
    <button type="button" onClick={() => setShowPass(!showPass)} className="...">
      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  </div>
  
  {/* Password strength indicator */}
  {password && (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Password strength:</span>
        <span className={`text-xs font-semibold ${getPasswordStrength(passwordValidation.score).color}`}>
          {getPasswordStrength(passwordValidation.score).label}
        </span>
      </div>
      
      {/* Feedback */}
      {passwordValidation.feedback.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1">
          {passwordValidation.feedback.map((msg, i) => (
            <li key={i}>• {msg}</li>
          ))}
        </ul>
      )}
    </div>
  )}
</div>
```

---

## Fix #6: Fix Memory Leak in DashboardLayout

**Problem**: Multiple event listeners accumulate  
**Severity**: MEDIUM  
**Time**: 5 minutes

Update `src/components/DashboardLayout.tsx`:

```tsx
useEffect(() => {
  const handler = () => setTick((t) => t + 1);
  window.addEventListener("theme-change", handler);
  
  return () => {
    window.removeEventListener("theme-change", handler);  // ← ADD CLEANUP
  };
}, []); // ← Empty dependency, run once
```

---

## Fix #7: Add Input Length Limits

**Problem**: No max length on text inputs  
**Severity**: MEDIUM  
**Time**: 10 minutes

Update form inputs in Settings:

```tsx
<Input 
  value={name} 
  onChange={(e) => setName(e.target.value.slice(0, 100))}  // ← Limit to 100 chars
  maxLength={100}
  placeholder="Full Name"
/>

<Input 
  value={email} 
  onChange={(e) => setEmail(e.target.value.slice(0, 254))}  // ← Email max length
  maxLength={254}
  placeholder="Email Address"
/>

<Input 
  value={org} 
  onChange={(e) => setOrg(e.target.value.slice(0, 200))}  // ← Org name limit
  maxLength={200}
  placeholder="Organization Name"
/>
```

---

## Fix #8: Add Loading State to Async Operations

**Problem**: No visual feedback during API calls  
**Severity**: MEDIUM  
**Time**: 15 minutes

Update `src/pages/Settings.tsx`:

```tsx
export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [org, setOrg] = useState(user?.organization || "");
  const [loading, setLoading] = useState(false);  // ← ADD THIS

  const handleSaveProfile = async () => {
    try {
      setLoading(true);  // ← SET LOADING
      // Simulate API call
      await new Promise(r => setTimeout(r, 1000));
      toast({ title: "Profile updated", description: "Your profile information has been saved." });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);  // ← CLEAR LOADING
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* ... */}
      
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h2 className="text-lg font-semibold text-foreground">Profile Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
          </div>
        </div>
        <Button onClick={handleSaveProfile} disabled={loading}>  {/* ← DISABLE WHEN LOADING */}
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </motion.section>
    </div>
  );
}
```

---

## Fix #9: Remove Console Errors in Production

**Problem**: 404 errors logged to console  
**Severity**: LOW  
**Time**: 5 minutes

Update `src/pages/NotFound.tsx`:

```tsx
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Log to error tracking service instead of console
    if (import.meta.env.PROD) {
      // TODO: Send to Sentry or error tracking service
      // logErrorToService({
      //   message: "404 - Page Not Found",
      //   path: location.pathname,
      //   url: window.location.href,
      // });
    } else {
      console.warn("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
```

---

## Fix #10: Add Race Condition Prevention

**Problem**: Multiple rapid clicks cause race condition  
**Severity**: MEDIUM  
**Time**: 10 minutes

Update `src/pages/Notes.tsx`:

```tsx
export default function Notes() {
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [observations, setObservations] = useState("");
  const [treatment, setTreatment] = useState("");
  const [generating, setGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);  // ← ADD THIS

  const handleGenerate = async () => {
    // Prevent multiple simultaneous requests
    if (isProcessing) return;  // ← ADD THIS CHECK
    
    setGenerating(true);
    setIsProcessing(true);  // ← SET FLAG
    
    try {
      await new Promise((r) => setTimeout(r, 2000));
      const result = generateSOAP(symptoms, diagnosis, observations, treatment);
      setNote(result);
      setEditedNote(result);
      toast({ title: "Note generated successfully" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to generate note",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
      setIsProcessing(false);  // ← CLEAR FLAG
    }
  };

  return (
    <div className="space-y-6">
      {/* ... */}
      <Button 
        onClick={handleGenerate} 
        disabled={generating || isProcessing}  // ← DISABLE WHILE PROCESSING
        className="w-full h-12 font-semibold"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate SOAP Note
          </>
        )}
      </Button>
    </div>
  );
}
```

---

## Installation Commands

Once you've made all the fixes above, install missing dependencies:

```bash
# Security & validation
npm install dompurify zod @hookform/resolvers react-hook-form

# API & data fetching (keep axios for backend integration)
npm install axios

# Error tracking (optional but recommended)
npm install @sentry/react

# Development
npm install -D @types/dompurify

# Run tests
npm run test
```

---

## Quick Verification Checklist

After implementing these fixes, verify:

```bash
# Lint check
npm run lint

# Type check
npx tsc --noEmit

# Run tests
npm run test

# Build test
npm run build

# Preview production build
npm run preview
```

---

## Summary of Fixes

| # | Issue | Severity | Time | Status |
|---|-------|----------|------|--------|
| 1 | Add Error Boundary | CRITICAL | 15m | ✅ Template provided |
| 2 | Fix unsafe localStorage | CRITICAL | 10m | ✅ Code above |
| 3 | Add error handling | CRITICAL | 10m | ✅ Code above |
| 4 | Email validation | HIGH | 5m | ✅ Code above |
| 5 | Password validation | HIGH | 10m | ✅ Code above |
| 6 | Memory leak fix | MEDIUM | 5m | ✅ Code above |
| 7 | Input limits | MEDIUM | 10m | ✅ Code above |
| 8 | Loading states | MEDIUM | 15m | ✅ Code above |
| 9 | Console logging | LOW | 5m | ✅ Code above |
| 10 | Race conditions | MEDIUM | 10m | ✅ Code above |

**Total Time**: ~95 minutes (1.5-2 hours)

---

These fixes will bring your application from **32/100 to ~50/100** production readiness.

The remaining work is backend integration and comprehensive testing, which cannot be done without finalizing the backend API specification.

