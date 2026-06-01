import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../../lib/auth';
import { getUserData } from '../../../../lib/db';

export async function GET(req) {
  try {
    const userId = getUserIdFromRequest(req);
    
    if (!userId) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    // Load initial habit tracking data to send back together for instant dashboard rendering
    const userData = await getUserData(userId);
    
    return NextResponse.json({
      authenticated: true,
      user: { id: userId },
      data: userData ? {
        habits: userData.habits,
        logs: userData.logs,
        quote: userData.quote
      } : null
    });
  } catch (err) {
    console.error('Check auth error:', err);
    return NextResponse.json({ authenticated: false, error: 'Internal server error' }, { status: 500 });
  }
}
