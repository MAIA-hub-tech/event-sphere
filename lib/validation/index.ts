import * as z from "zod";

export const SignupValidation = z.object({
    name: z.string().min(2, {message:"To short"}).max(50),
    username: z.string().min(2, {message:"To short"}),
    email: z.string().email(),
    password: z.string().min(8, {message: "Too short"}),
  });

  export const eventFormSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(3, 'Description must be at least 3 characters').max(400, 'Description must be less than 400 characters'),
    location: z.string().min(3, 'Location must be at least 3 characters').max(400, 'Location must be less than 400 characters'),
    imageUrl: z.string(),
    startDateTime: z.date(),
    endDateTime: z.date(),
    categoryId: z.string(),
    price: z.string().refine((val) => {
      // Allow empty string when isFree is true
      if (val === "" || val === "0") return true;
      return !isNaN(parseFloat(val)) && parseFloat(val) >= 0;
    }, {
      message: "Must be a valid positive number"
    }),
    isFree: z.boolean(),
    url: z.string().url().optional().or(z.literal("")),
  }).refine(data => {
    // Additional validation when isFree is false
    if (!data.isFree) {
      return data.price !== "" && data.price !== "0";
    }
    return true;
  }, {
    message: "Price is required for paid events",
    path: ["price"]
  });
  