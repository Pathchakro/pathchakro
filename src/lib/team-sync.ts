
import mongoose from 'mongoose';
import Team from '@/models/Team';
import User from '@/models/User';

export async function syncUserTeams(userId: string) {
    const user = await User.findById(userId);
    if (!user) return;

    // 1. Identify Target Teams based on Profile
    const targets: { name: string; type: 'University' | 'Thana' | 'Special' }[] = [];

    // University
    const institution = user.academic?.institution || (user as any).university;
    if (institution) {
        targets.push({ name: institution, type: 'University' });
    }

    // Thana (Present & Permanent)
    const thanas = new Set<string>();
    if (user.address?.present?.thana) thanas.add(user.address.present.thana);
    if (user.address?.permanent?.thana) thanas.add(user.address.permanent.thana);
    if ((user as any).thana) thanas.add((user as any).thana);

    thanas.forEach(thana => {
        targets.push({ name: thana, type: 'Thana' });
    });

    // Interests
    if (user.interests && Array.isArray(user.interests)) {
        user.interests.forEach(interest => {
            targets.push({ name: interest, type: 'Special' });
        });
    }

    const targetTeamIds = new Set<string>();

    // 2. Process Targets (Find or Create)
    for (const target of targets) {
        // Find existing team
        let team = await Team.findOne({ name: target.name, type: target.type });

        // Create if not exists
        if (!team) {
            const slug = await generateUniqueSlug(target.name);
            team = await Team.create({
                name: target.name,
                type: target.type,
                slug: slug,
                description: `Community for ${target.name}`,
                members: [],
                leader: null, // No leader initially
                privacy: 'public'
            });
        }

        if (team) {
            targetTeamIds.add(team._id.toString());

            // Add user if not member
            const isMember = team.members.some((m: any) => m.user.toString() === userId);
            if (!isMember) {
                await Team.findByIdAndUpdate(team._id, {
                    $push: { members: { user: userId, role: 'member', joinedAt: new Date() } }
                });
            }
        }
    }

    // 3. Remove from Old Teams
    // Find all teams where user is a member matchin the auto-types
    const currentTeams = await Team.find({
        'members.user': userId,
        type: { $in: ['University', 'Thana', 'Special'] }
    });

    for (const team of currentTeams) {
        if (!targetTeamIds.has(team._id.toString())) {
            // User shouldn't be here anymore
            await Team.findByIdAndUpdate(team._id, {
                $pull: { members: { user: userId } }
            });
        }
    }
}

async function generateUniqueSlug(name: string): Promise<string> {
    let slugBase = name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\p{L}\p{M}\p{N}\-]/gu, '') // Unicode support
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

    if (!slugBase) {
        slugBase = 'team-' + Math.random().toString(36).substring(2, 8);
    }

    let slug = slugBase;
    let counter = 1;

    while (await Team.findOne({ slug })) {
        slug = `${slugBase}-${counter}`;
        counter++;
    }
    return slug;
}
