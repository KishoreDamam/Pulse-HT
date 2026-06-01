import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from '../../../../lib/db';
import { signToken, setSessionCookie } from '../../../../lib/auth';

export async function POST(req) {
  try {
    const { email, password, rememberMe } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Generate token with rememberMe configuration
    const token = signToken({ userId: user.id }, rememberMe);

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email }
    });

    // Set JWT in HttpOnly cookie
    setSessionCookie(response, token, rememberMe);

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'An error occurred during login.' },
      { status: 500 }
    );
  }
}
