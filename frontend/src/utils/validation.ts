/**
 * src/utils/validation.ts
 * 
 * Input validation utilities
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < 12) {
    errors.push('At least 12 characters required');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter required');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter required');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('At least one number required');
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) {
    errors.push('At least one special character required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate name
 */
export function validateName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  } else if (name.length > 100) {
    errors.push('Name is too long (max 100 characters)');
  } else if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    errors.push('Name contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate phone number
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  const errors: string[] = [];

  if (!phone) {
    errors.push('Phone number is required');
  } else if (!/^[\d\s\-().+]+$/.test(phone) || phone.replace(/\D/g, '').length < 10) {
    errors.push('Invalid phone number format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate age
 */
export function validateAge(age: string | number): ValidationResult {
  const errors: string[] = [];
  const ageNum = typeof age === 'string' ? parseInt(age, 10) : age;

  if (!age) {
    errors.push('Age is required');
  } else if (isNaN(ageNum)) {
    errors.push('Age must be a number');
  } else if (ageNum < 0 || ageNum > 150) {
    errors.push('Age must be between 0 and 150');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  // Remove leading/trailing whitespace
  let sanitized = input.trim();

  // Remove potential XSS
  sanitized = sanitized
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers

  return sanitized;
}

/**
 * Validate form data
 */
export function validateFormData(
  data: Record<string, unknown>,
  schema: Record<string, (value: unknown) => ValidationResult>
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  Object.entries(schema).forEach(([key, validator]) => {
    const result = validator(data[key]);
    if (!result.isValid) {
      errors[key] = result.errors;
    }
  });

  return errors;
}
