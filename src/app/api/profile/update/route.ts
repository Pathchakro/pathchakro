import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Group from '@/models/Group';

export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            title,
            bio,
            location,
            website,
            dateOfBirth,
            phone,
            whatsappNumber,
            bloodGroup,
            willingToDonateBlood,
            lastDateOfDonateBlood,
            // Academic
            currentEducation,
            institution,
            degree,
            fieldOfStudy,
            graduationYear,
            gpa,
            // Career
            currentPosition,
            company,
            industry,
            yearsOfExperience,
            skills,
            cvLink,
            // Social
            linkedin,
            github,
            twitter,
            // Interests
            interests,
            languages,
        } = body;

        await dbConnect();

        const updateData: any = {};

        // Personal
        if (title !== undefined) updateData.title = title;
        if (bio !== undefined) updateData.bio = bio;
        if (location !== undefined) updateData.location = location;
        if (website !== undefined) updateData.website = website;
        if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
        if (phone !== undefined) updateData.phone = phone;
        if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
        if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
        if (willingToDonateBlood !== undefined) updateData.willingToDonateBlood = willingToDonateBlood;
        if (lastDateOfDonateBlood !== undefined) updateData.lastDateOfDonateBlood = lastDateOfDonateBlood;

        // Academic
        if (currentEducation !== undefined) updateData['academic.currentEducation'] = currentEducation;
        if (institution !== undefined) updateData['academic.institution'] = institution;
        if (degree !== undefined) updateData['academic.degree'] = degree;
        if (fieldOfStudy !== undefined) updateData['academic.fieldOfStudy'] = fieldOfStudy;
        if (graduationYear !== undefined) updateData['academic.graduationYear'] = graduationYear;
        if (gpa !== undefined) updateData['academic.gpa'] = gpa;

        // Career
        if (currentPosition !== undefined) updateData['career.currentPosition'] = currentPosition;
        if (company !== undefined) updateData['career.company'] = company;
        if (industry !== undefined) updateData['career.industry'] = industry;
        if (yearsOfExperience !== undefined) updateData['career.yearsOfExperience'] = yearsOfExperience;
        if (skills !== undefined) updateData['career.skills'] = skills;
        if (cvLink !== undefined) updateData['career.cvLink'] = cvLink;

        // Social
        if (linkedin !== undefined) updateData['social.linkedin'] = linkedin;
        if (github !== undefined) updateData['social.github'] = github;
        if (twitter !== undefined) updateData['social.twitter'] = twitter;

        // Interests
        // Interests & Groups Logic
        if (session.user.id) {
            // Get current user to compare for sync
            const currentUser = await User.findById(session.user.id).select('address academic');

            // --- Interest Groups Sync ---
            if (interests !== undefined && Array.isArray(interests)) {
                updateData.interests = interests;

                // 1. Remove from old interest groups (those NOT in new list)
                await Group.updateMany(
                    {
                        type: 'interest',
                        members: session.user.id,
                        name: { $nin: interests }
                    },
                    { $pull: { members: session.user.id } }
                );

                // 2. Add to new interest groups
                if (interests.length > 0) {
                    for (const interestName of interests) {
                        let group = await Group.findOne({ name: interestName, type: 'interest' });
                        if (!group) {
                            group = await Group.create({
                                name: interestName,
                                type: 'interest',
                                members: [new mongoose.Types.ObjectId(session.user.id)]
                            });
                        } else {
                            if (!group.members.includes(session.user.id as any)) {
                                await Group.findByIdAndUpdate(group._id, {
                                    $addToSet: { members: new mongoose.Types.ObjectId(session.user.id) }
                                });
                            }
                        }
                    }
                }
            }

            // --- Institution Group Sync ---
            if (institution !== undefined) {
                updateData['academic.institution'] = institution;

                // 1. Remove from old institution groups
                await Group.updateMany(
                    {
                        type: 'institution',
                        members: session.user.id,
                        name: { $ne: institution } // Remove from any group that is NOT the new institution
                    },
                    { $pull: { members: session.user.id } }
                );

                // 2. Add to new institution group
                if (institution && institution.trim().length > 0) {
                    let group = await Group.findOne({ name: institution, type: 'institution' });
                    if (!group) {
                        group = await Group.create({
                            name: institution,
                            type: 'institution',
                            members: [new mongoose.Types.ObjectId(session.user.id)]
                        });
                    } else {
                        if (!group.members.includes(session.user.id as any)) {
                            await Group.findByIdAndUpdate(group._id, {
                                $addToSet: { members: new mongoose.Types.ObjectId(session.user.id) }
                            });
                        }
                    }
                }
            }

            // --- Thana (Location) Groups Sync ---
            // Only run if address is updated, merging with existing data to prevent partial data loss
            if (body.presentAddress || body.permanentAddress) {
                // Update User Profile Data
                if (body.presentAddress !== undefined) updateData['address.present'] = body.presentAddress;
                if (body.permanentAddress !== undefined) updateData['address.permanent'] = body.permanentAddress;

                const newPresentThana = body.presentAddress?.thana || (body.presentAddress === undefined ? currentUser?.address?.present?.thana : undefined);
                // Logic: if body.presentAddress is passed (even empty), use it/its thana. If undefined, keep old. 
                // Better: if body.presentAddress is defined, retrieve thana from it. If it is NOT defined, retrieve from currentUser.

                const finalPresentThana = body.presentAddress !== undefined
                    ? body.presentAddress.thana
                    : currentUser?.address?.present?.thana;

                const finalPermanentThana = body.permanentAddress !== undefined
                    ? body.permanentAddress.thana
                    : currentUser?.address?.permanent?.thana;

                const correctThanas = [finalPresentThana, finalPermanentThana].filter(t => t && t.trim().length > 0);

                // 1. Remove from All Thana groups NOT in the correct list
                await Group.updateMany(
                    {
                        type: 'thana',
                        members: session.user.id,
                        name: { $nin: correctThanas }
                    },
                    { $pull: { members: session.user.id } }
                );

                // 2. Add to correct Thana groups
                for (const thanaName of correctThanas) {
                    let group = await Group.findOne({ name: thanaName, type: 'thana' });
                    if (!group) {
                        group = await Group.create({
                            name: thanaName,
                            type: 'thana',
                            members: [new mongoose.Types.ObjectId(session.user.id)]
                        });
                    } else {
                        if (!group.members.includes(session.user.id as any)) {
                            await Group.findByIdAndUpdate(group._id, {
                                $addToSet: { members: new mongoose.Types.ObjectId(session.user.id) }
                            });
                        }
                    }
                }
            }
        }

        // Verification
        if (body.verificationDocuments && body.verificationDocuments.length > 0) {
            updateData['verification.documentUrls'] = body.verificationDocuments;
            updateData['verification.status'] = 'pending';
            updateData['verification.submittedAt'] = new Date();
        }

        const user = await User.findByIdAndUpdate(
            session.user.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        return NextResponse.json({ user, message: 'Profile updated successfully' });
    } catch (error: any) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}
