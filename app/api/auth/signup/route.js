import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser, saveUserData } from '../../../../lib/db';
import { signToken, setSessionCookie } from '../../../../lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user in DB
    const user = await createUser(email, passwordHash);

    // Initialize default empty habit data for new user
    const defaultData = {
      habits: [
        { id: 'h1', name: 'Exercise', colorIndex: 1, active: true },
        { id: 'h2', name: 'Reading', colorIndex: 2, active: true },
        { id: 'h3', name: 'Meditation', colorIndex: 3, active: true },
        { id: 'h4', name: 'Hydration', colorIndex: 4, active: true },
        { id: 'h5', name: 'Sleep 8h', colorIndex: 5, active: true },
        { id: 'h6', name: 'Healthy Diet', colorIndex: 6, active: true },
        { id: 'h7', name: 'Journaling', colorIndex: 7, active: true },
        { id: 'h8', name: 'Coding', colorIndex: 8, active: true }
      ],
      logs: {},
      quote: 'Discipline equals freedom.'
    };
    await saveUserData(user.id, defaultData);

    // Generate JWT token (default rememberMe false on signup, or could be true. Let's make it standard 1 day)
    const token = signToken({ userId: user.id });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email }
    });

    // Set JWT in HttpOnly cookie
    setSessionCookie(response, token, false);

    return response;
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json(
      { error: 'An error occurred during registration.' },
      { status: 500 }
    );
  }
}
