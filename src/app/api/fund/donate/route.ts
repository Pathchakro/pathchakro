import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Transaction from '@/models/Transaction';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// Helper to validate Mobile Number (generic 11 digits for BD)
const validateMobile = (mobile: string) => /^\d{11}$/.test(mobile);

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized. Please login to donate.' },
                { status: 401 }
            );
        }

        await dbConnect();

        const data = await req.json();
        const {
            amount,
            method,          // 'bkash', 'nagad', 'bank', etc.
            verificationType, // 'screenshot' or 'manual'
            proofUrl,        // If verificationType is 'screenshot'
            transactionId,   // If verificationType is 'manual'
            mobileNumber,
            accountNumber
        } = data;

        // Basic Validation
        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid donation amount' }, { status: 400 });
        }
        if (!method) {
            return NextResponse.json({ error: 'Payment method is required' }, { status: 400 });
        }

        // Verification Logic
        if (verificationType === 'screenshot' && !proofUrl) {
            return NextResponse.json({ error: 'Payment screenshot is required' }, { status: 400 });
        }
        if (verificationType === 'transaction') {
            if (!transactionId) {
                return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
            }
        }
        if (verificationType === 'mobile') {
            if (!mobileNumber) {
                return NextResponse.json({ error: 'Mobile Number is required' }, { status: 400 });
            }
        }

        // Auto-populate donor name from session if user exists
        const user = await User.findById(session.user.id);
        const donorName = user?.name || session.user.name || 'Anonymous User';

        // Check for existing pending donation
        const existingPending = await Transaction.findOne({
            buyer: session.user.id,
            type: 'donation',
            status: 'pending'
        });

        if (existingPending) {
            return NextResponse.json(
                { error: 'You already have a pending donation. Please wait for admin approval.' },
                { status: 400 } // Or 409 Conflict
            );
        }

        // Create the transaction
        const transaction = await Transaction.create({
            type: 'donation',
            category: 'other', // or 'fund' if added to enum
            buyer: session.user.id, // Buyer acts as Donor
            donorName: donorName,
            seller: session.user.id, // Self-donation/Fund (or distinct Admin ID if preferred) - Using User ID to avoid null/validation errors
            itemName: 'Donation to Fund',
            amount: Number(amount),
            platformFee: 0,
            sellerEarnings: Number(amount), // Full amount goes to fund
            status: 'pending',
            paymentMethod: method,
            proofOfPayment: proofUrl,
            transactionId,
            mobileNumber,
            accountNumber,
        });

        return NextResponse.json({
            success: true,
            message: 'Donation submitted successfully. Waiting for approval.',
            transactionId: transaction._id
        });

    } catch (error) {
        console.error('Donation Error:', error);
        return NextResponse.json(
            { error: 'Failed to process donation' },
            { status: 500 }
        );
    }
}
