import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { messaging } from '@/lib/firebaseAdmin';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Get sender info to enforce security
    await connectDB();
    const sender = await User.findById(decoded.userId);
    if (!sender || !['superadmin', 'admin', 'moduleAdmin'].includes(sender.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { title, message, target, filters, url } = await req.json();

    if (!title || !message || !target) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let query: any = { role: 'student', isActive: true };

    // Advanced Filtering Logic
    if (target === 'filters' && filters) {
      if (filters.department) query.department = filters.department;
      if (filters.year) query.year = filters.year;
      if (filters.section) query.section = filters.section;
      if (filters.category) query.category = filters.category;
    }

    // Security: Module Admins can only target students if they don't use "all"
    // (In this system, we'll allow them to target by filters but log the sender)
    if (sender.role === 'moduleAdmin') {
       // Restricted to their assigned module type if needed
       // query.assignedModuleType = sender.assignedModuleType; 
    }

    const users = await User.find(query).select('fcmTokens');
    const allTokens: string[] = [];
    
    users.forEach(user => {
      if (user.fcmTokens && user.fcmTokens.length > 0) {
        allTokens.push(...user.fcmTokens);
      }
    });

    if (allTokens.length === 0) {
      return NextResponse.json({ success: true, message: 'No recipients found with active tokens' });
    }

    if (!messaging) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    // Unique tokens only
    const uniqueTokens = [...new Set(allTokens)];

    // Send in batches of 500 (Firebase limit)
    const batches = [];
    for (let i = 0; i < uniqueTokens.length; i += 500) {
      const batch = uniqueTokens.slice(i, i + 500);
      const messagePayload = {
        notification: {
          title,
          body: message,
        },
        data: {
          url: url || '/student-dashboard',
          sender: sender.name,
        },
        tokens: batch,
      };
      batches.push(messaging.sendEachForMulticast(messagePayload));
    }

    const results = await Promise.all(batches);
    
    let successCount = 0;
    let failureCount = 0;
    
    results.forEach(res => {
      successCount += res.successCount;
      failureCount += res.failureCount;
    });

    return NextResponse.json({ 
      success: true, 
      successCount, 
      failureCount,
      recipientCount: uniqueTokens.length
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
