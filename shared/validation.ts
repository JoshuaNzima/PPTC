import { z } from "zod";

// Enhanced phone number validation for Malawi
export const phoneRegex = /^(\+265|265|0)([12378][0-9]{7}|9[0-9]{8})$/;

// Enhanced email validation
export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Validation for names (allows letters, spaces, hyphens, apostrophes)
export const nameRegex = /^[a-zA-Z\s\-']+$/;

// Validation for abbreviations (3-5 uppercase letters)
export const abbreviationRegex = /^[A-Z]{2,5}$/;

// Validation for constituency/ward names
export const placeNameRegex = /^[a-zA-Z0-9\s\-'.]+$/;

// Validation for hex colors
export const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// Enhanced phone validation schema
export const phoneSchema = z.string()
  .min(1, "Phone number is required")
  .regex(phoneRegex, "Please enter a valid Malawi phone number (e.g., +265999123456, 0999123456)");

// Enhanced email validation schema
export const emailSchema = z.string()
  .min(1, "Email is required")
  .regex(emailRegex, "Please enter a valid email address");

// Optional phone validation (for forms where phone is optional)
export const optionalPhoneSchema = z.string()
  .optional()
  .refine(val => !val || phoneRegex.test(val), {
    message: "Please enter a valid Malawi phone number (e.g., +265999123456, 0999123456)"
  });

// Optional email validation (for forms where email is optional)
export const optionalEmailSchema = z.string()
  .optional()
  .refine(val => !val || emailRegex.test(val), {
    message: "Please enter a valid email address"
  });

// Name validation schema
export const nameSchema = z.string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must not exceed 100 characters")
  .regex(nameRegex, "Name can only contain letters, spaces, hyphens, and apostrophes");

// Abbreviation validation schema
export const abbreviationSchema = z.string()
  .optional()
  .refine(val => !val || abbreviationRegex.test(val), {
    message: "Abbreviation must be 2-5 uppercase letters (e.g., DPP, UDF)"
  });

// Password validation schema
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    "Password must contain at least one uppercase letter, one lowercase letter, and one number");

// Vote count validation
export const voteCountSchema = z.coerce.number()
  .min(0, "Vote count must be non-negative")
  .max(50000, "Vote count seems unreasonably high. Please verify.");

// Description validation
export const descriptionSchema = z.string()
  .min(10, "Description must be at least 10 characters")
  .max(2000, "Description must not exceed 2000 characters");

// Title validation
export const titleSchema = z.string()
  .min(3, "Title must be at least 3 characters")
  .max(200, "Title must not exceed 200 characters");

// Hex color validation
export const colorSchema = z.string()
  .regex(hexColorRegex, "Please enter a valid hex color code (e.g., #FF0000)");

// URL validation schema
export const urlSchema = z.string()
  .optional()
  .refine(val => !val || z.string().url().safeParse(val).success, {
    message: "Please enter a valid URL"
  });

// Custom validation for either email or phone required
export const contactRequiredSchema = z.object({
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone number is required",
  path: ["email"],
});

// File size validation (in bytes)
export const fileSizeSchema = (maxSizeMB: number) => z.instanceof(File)
  .refine(file => file.size <= maxSizeMB * 1024 * 1024, {
    message: `File size must be less than ${maxSizeMB}MB`
  });

// File type validation
export const fileTypeSchema = (allowedTypes: string[]) => z.instanceof(File)
  .refine(file => allowedTypes.includes(file.type), {
    message: `File type must be one of: ${allowedTypes.join(", ")}`
  });

// Combined file validation
export const fileSchema = (maxSizeMB: number, allowedTypes: string[]) => z.instanceof(File)
  .refine(file => file.size <= maxSizeMB * 1024 * 1024, {
    message: `File size must be less than ${maxSizeMB}MB`
  })
  .refine(file => allowedTypes.includes(file.type), {
    message: `File type must be one of: ${allowedTypes.join(", ")}`
  });