import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../../lib/auth';
import { getUserData, saveUserData } from '../../../../lib/db';

/**
 * Fetch habits, logs, and quote data for logged-in user
 */
export async function GET(req) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await getUserData(userId);
    return NextResponse.json({
      success: true,
      data: userData ? {
        habits: userData.habits,
        logs: userData.logs,
        quote: userData.quote
      } : {
        habits: [],
        logs: {},
        quote: 'Discipline equals freedom.'
      }
    });
  } catch (err) {
    console.error('Fetch habits error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Save / Synchronize habits, logs, and quote data
 */
export async function POST(req) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { habits, logs, quote } = await req.json();

    await saveUserData(userId, { habits, logs, quote });

    return NextResponse.json({
      success: true,
      message: 'Habit data synchronized successfully.'
    });
  } catch (err) {
    console.error('Sync habits error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
