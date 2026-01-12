import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import dbConnect from './mongodb';
import User from '@/models/User';

/**
 * Role-based access control middleware
 * Admin: Can create, update, and delete everything
 * User: Can only create, cannot update or delete
 */

export async function checkAdminRole() {
    const session = await auth();

    if (!session?.user?.id) {
        return { authorized: false, error: 'Unauthorized', status: 401 };
    }

    await dbConnect();
    const user = await User.findById(session.user.id).select('role').lean();

    if (!user || user.role !== 'admin') {
        return { authorized: false, error: 'Admin access required', status: 403 };
    }

    return { authorized: true, userId: session.user.id };
}

export async function checkUserRole() {
    const session = await auth();

    if (!session?.user?.id) {
        return { authorized: false, error: 'Unauthorized', status: 401 };
    }

    return { authorized: true, userId: session.user.id };
}

export async function requireAdmin() {
    const result = await checkAdminRole();

    if (!result.authorized) {
        return NextResponse.json(
            { error: result.error },
            { status: result.status }
        );
    }

    return null;
}

export async function requireUser() {
    const result = await checkUserRole();

    if (!result.authorized) {
        return NextResponse.json(
            { error: result.error },
            { status: result.status }
        );
    }

    return null;
}
