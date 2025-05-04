import * as z from "zod";

// Base event schema without refinements
const baseEventSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters",
  }).max(2000, {
    message: "Description must be less than 2000 characters",
  }),
  location: z.string().min(3, {
    message: "Location must be at least 3 characters",
  }),
  imageUrl: z.string().optional(),
  startDateTime: z.date(),
  endDateTime: z.date(),
  categoryId: z.string().min(1, {
    message: "Category is required",
  }),
  price: z.string().refine((val) => {
    if (val === "0") return true; // Free event
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, {
    message: "Price must be a positive number",
  }),
  isFree: z.boolean(),
  url: z.string().url({
    message: "Please enter a valid URL",
  }).optional(),
});

// Add date validation separately
export const eventFormSchema = baseEventSchema.refine(
  (data) => data.endDateTime > data.startDateTime,
  {
    message: "End date must be after start date",
    path: ["endDateTime"],
  }
);

// Type for form values
export type EventFormValues = z.infer<typeof baseEventSchema>;

// Create extended schemas from the base (not the refined version)
export const createEventSchema = baseEventSchema.extend({
  userId: z.string().min(1),
});

export const updateEventSchema = baseEventSchema.extend({
  id: z.string().min(1),
  userId: z.string().min(1),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.custom<File>((val) => val instanceof File, {
    message: "File is required",
  }),
  eventId: z.string().optional(),
});

// Query params validation
export const eventQuerySchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  limit: z.number().min(1).max(100).default(10),
  page: z.number().min(1).default(1),
});