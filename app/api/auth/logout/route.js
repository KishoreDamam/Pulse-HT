import { NextResponse } from 'next/server';
import { clearSessionCookie } from '../../../../lib/auth';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    clearSessionCookie(response);
    return response;
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json(
      { error: 'An error occurred during logout.' },
      { status: 500 }
    );
  }
}
export async function GET() {
  // Support both GET and POST for logout redirect ease if needed
  const response = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  clearSessionCookie(response);
  return response;
}
