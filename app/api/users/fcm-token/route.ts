import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    const { token: fcmToken } = await req.json();

    if (!fcmToken) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Add token to user if it doesn't already exist
    await User.findByIdAndUpdate(decoded.userId, {
      $addToSet: { fcmTokens: fcmToken }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
