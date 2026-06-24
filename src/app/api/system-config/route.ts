import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SystemConfig from '@/models/SystemConfig';
import { auth } from '@/auth';

export async function GET() {
  try {
    await dbConnect();
    let config = await SystemConfig.findOne().sort({ updatedAt: -1 });
    if (!config) {
      // Return defaults if none exists
      config = new SystemConfig();
    }
    return NextResponse.json(config);
  } catch (error: any) {
    console.error('Error fetching system config:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    await dbConnect();

    let config = await SystemConfig.findOne().sort({ updatedAt: -1 });
    if (!config) {
      config = new SystemConfig();
    }

    // Update only the tracking and admin notes fields requested
    config.googleTagManagerId = body.googleTagManagerId ?? '';
    config.googleAnalyticsId = body.googleAnalyticsId ?? '';
    config.googleAnalyticsPropertyId = body.googleAnalyticsPropertyId ?? '';
    config.metaPixelId = body.metaPixelId ?? '';
    config.facebookAccessToken = body.facebookAccessToken ?? '';
    config.facebookDomainVerification = body.facebookDomainVerification ?? '';
    config.facebookTestEventCode = body.facebookTestEventCode ?? '';
    config.googleSearchConsoleId = body.googleSearchConsoleId ?? '';
    config.searchConsoleMeta = body.searchConsoleMeta ?? '';
    config.superAdminNote = body.superAdminNote ?? '';

    await config.save();

    return NextResponse.json({ success: true, message: 'Configuration saved successfully', config });
  } catch (error: any) {
    console.error('Error updating system config:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
