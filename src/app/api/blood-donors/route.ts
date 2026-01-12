import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import BloodDonor from '@/models/BloodDonor';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const bloodGroup = searchParams.get('bloodGroup');
        const location = searchParams.get('location');

        let filter: any = { availableForDonation: true, medicallyEligible: true };

        if (bloodGroup) {
            filter.bloodGroup = bloodGroup;
        }

        if (location) {
            // Case-insensitive location search
            filter.location = { $regex: location, $options: 'i' };
        }

        const donors = await BloodDonor.find(filter)
            .populate('user', 'name image rankTier')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return NextResponse.json({ donors });
    } catch (error: any) {
        console.error('Error fetching donors:', error);
        return NextResponse.json(
            { error: 'Failed to fetch donors' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
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
            bloodGroup,
            location,
            phone,
            lastDonationDate,
            willingToTravel,
            maxTravelDistance,
            notes,
        } = body;

        if (!bloodGroup || !location || !phone) {
            return NextResponse.json(
                { error: 'Blood group, location, and phone are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if already registered
        const existingDonor = await BloodDonor.findOne({ user: session.user.id });

        if (existingDonor) {
            // Update existing registration
            existingDonor.bloodGroup = bloodGroup;
            existingDonor.location = location;
            existingDonor.phone = phone;
            existingDonor.lastDonationDate = lastDonationDate ? new Date(lastDonationDate) : undefined;
            existingDonor.willingToTravel = willingToTravel || false;
            existingDonor.maxTravelDistance = maxTravelDistance;
            existingDonor.notes = notes;
            existingDonor.availableForDonation = true;

            await existingDonor.save();

            const updatedDonor = await BloodDonor.findById(existingDonor._id)
                .populate('user', 'name image')
                .lean();

            return NextResponse.json({
                donor: updatedDonor,
                message: 'Donor profile updated successfully',
            });
        }

        // Create new donor
        const donor = await BloodDonor.create({
            user: session.user.id,
            bloodGroup,
            location,
            phone,
            lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : undefined,
            availableForDonation: true,
            willingToTravel: willingToTravel || false,
            maxTravelDistance,
            medicallyEligible: true,
            notes,
        });

        const populatedDonor = await BloodDonor.findById(donor._id)
            .populate('user', 'name image')
            .lean();

        return NextResponse.json(
            { donor: populatedDonor, message: 'Registered as blood donor successfully' },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error registering donor:', error);
        return NextResponse.json(
            { error: 'Failed to register as donor' },
            { status: 500 }
        );
    }
}
