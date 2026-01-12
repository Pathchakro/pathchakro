import { z } from 'zod';

export const profileCompletionSchema = z.object({
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', '']).optional(),
    bookPreferences: z.array(z.string()).min(1, 'Select at least one book category'),
});

export type ProfileCompletionData = z.infer<typeof profileCompletionSchema>;
