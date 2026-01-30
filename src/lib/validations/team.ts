import { z } from 'zod';

export const createTeamSchema = z.object({
    name: z.string().min(3, 'Team name must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    type: z.enum(['University', 'Thana', 'Special']),
    privacy: z.enum(['public', 'private']),
    university: z.string().optional(),
    location: z.string().optional(),
    category: z.string().min(2, 'Category is required'),
}).superRefine((data, ctx) => {
    if (data.type === 'University' && !data.university) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'University name is required for University teams',
            path: ['university'],
        });
    }
    if (data.type === 'Thana' && !data.location) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Location/Thana is required for Thana teams',
            path: ['location'],
        });
    }
});

export type CreateTeamData = z.infer<typeof createTeamSchema>;
