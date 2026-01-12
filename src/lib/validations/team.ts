import { z } from 'zod';

export const createTeamSchema = z.object({
    name: z.string().min(3, 'Team name must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    type: z.enum(['University', 'Thana', 'Special']),
    privacy: z.enum(['public', 'private']),
    university: z.string().optional(),
    location: z.string().optional(),
});

export type CreateTeamData = z.infer<typeof createTeamSchema>;
