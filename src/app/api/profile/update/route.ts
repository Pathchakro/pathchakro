import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { syncUserTeams } from '@/lib/team-sync';

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
            facebook,
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
        if (facebook !== undefined) updateData['social.facebook'] = facebook;

        // Core Profile Updates (Name & Image)
        if (body.name !== undefined) updateData.name = body.name;
        if (body.image !== undefined) updateData.image = body.image;

        // Interests
        if (interests !== undefined) updateData.interests = interests;

        // Address Updates
        if (body.presentAddress !== undefined) updateData['address.present'] = body.presentAddress;
        if (body.permanentAddress !== undefined) updateData['address.permanent'] = body.permanentAddress;

        // Verification
        if (body.verificationDocuments && body.verificationDocuments.length > 0) {
            updateData['verification.documentUrls'] = body.verificationDocuments;
            updateData['verification.status'] = 'pending';
            updateData['verification.submittedAt'] = new Date();
        }

        // Calculate Profile Completion
        if (session.user.id) {
            const userForCalc = await User.findById(session.user.id);

            if (userForCalc) {
                const mergedData = { ...userForCalc.toObject(), ...updateData };

                // Handle nested updates for calculation
                if (updateData['academic.currentEducation']) mergedData.academic = { ...mergedData.academic, currentEducation: updateData['academic.currentEducation'] };
                if (updateData['academic.institution']) mergedData.academic = { ...mergedData.academic, institution: updateData['academic.institution'] };
                if (updateData['career.currentPosition']) mergedData.career = { ...mergedData.career, currentPosition: updateData['career.currentPosition'] };
                if (updateData['career.company']) mergedData.career = { ...mergedData.career, company: updateData['career.company'] };
                if (updateData['address.present']) mergedData.address = { ...mergedData.address, present: updateData['address.present'] };
                if (updateData['address.permanent']) mergedData.address = { ...mergedData.address, permanent: updateData['address.permanent'] };

                const fieldsToCheck = [
                    mergedData.title,
                    mergedData.bio,
                    mergedData.location,
                    mergedData.phone,
                    mergedData.academic?.currentEducation,
                    mergedData.academic?.institution,
                    mergedData.career?.currentPosition,
                    mergedData.career?.company,
                    mergedData.address?.present?.addressLine,
                    mergedData.address?.permanent?.addressLine,
                    (mergedData.interests && mergedData.interests.length > 0) ? 'filled' : ''
                ];

                const filledCount = fieldsToCheck.filter(f => f && typeof f === 'string' && f.trim().length > 0).length;
                const completionScore = Math.round((filledCount / 11) * 100);

                updateData.profileCompletion = completionScore;
            }
        }

        const user = await User.findByIdAndUpdate(
            session.user.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        // Sync Teams after update
        await syncUserTeams(session.user.id);

        return NextResponse.json({ user, message: 'Profile updated successfully' });
    } catch (error: any) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}
