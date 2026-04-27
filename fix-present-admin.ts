import connectDB from './lib/db';
import User from './models/User';

async function fixPresentAdmin() {
  await connectDB();
  
  const result = await User.updateOne(
    { email: 'presentadmin@avsec' },
    { assignedModuleType: 'file_upload' }
  );
  console.log('Updated:', result.modifiedCount, 'document(s)');
  
  const u = await User.findOne({ email: 'presentadmin@avsec' }, 'name email role assignedModuleType');
  console.log('Presentation Admin:', JSON.stringify(u, null, 2));
  process.exit(0);
}

fixPresentAdmin().catch(err => { console.error(err); process.exit(1); });
