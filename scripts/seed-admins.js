// scripts/seed-admins.js
const { createClient } = require('@supabase/supabase-js');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load env vars manually from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envData = fs.readFileSync(envPath, 'utf8');
  envData.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length) {
      process.env[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '');
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mongoUri = process.env.MONGODB_URI;

if (!supabaseUrl || !supabaseServiceKey || !mongoUri) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const admins = [
  {
    email: 'codeadmin@avsec',
    password: 'avseccode',
    name: 'Code Admin',
    role: 'moduleAdmin',
    assignedModuleType: 'coding'
  },
  {
    email: 'debugadmin@avsec',
    password: 'avsecdebug',
    name: 'Debug Admin',
    role: 'moduleAdmin',
    assignedModuleType: 'mcq'
  },
  {
    email: 'presentadmin@avsec',
    password: 'avsecpresent',
    name: 'Present Admin',
    role: 'moduleAdmin',
    assignedModuleType: 'file_upload'
  },
  {
    email: 'superadmin@avsec',
    password: 'avsecsuperadmin',
    name: 'Super Admin',
    role: 'superadmin'
  }
];

async function seed() {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Define User Model inline
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      role: String,
      supabaseId: { type: String, unique: true },
      assignedModuleType: String,
      password: { type: String, default: 'SUPABASE_MANAGED' },
      isActive: { type: Boolean, default: true },
      totalPoints: { type: Number, default: 0 }
    }, { timestamps: true }));

    for (const admin of admins) {
      console.log(`Processing ${admin.email}...`);

      // 2. Check if user already exists in Supabase
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      
      let existingAuthUser = users.users.find(u => u.email === admin.email);
      let supabaseId;

      if (!existingAuthUser) {
        // Create in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: admin.email,
          password: admin.password,
          email_confirm: true,
          user_metadata: { name: admin.name, role: admin.role }
        });

        if (authError) {
          console.error(`Supabase creation error for ${admin.email}:`, authError.message);
          continue;
        }
        supabaseId = authData.user.id;
        console.log(`Created Supabase user: ${supabaseId}`);
      } else {
        supabaseId = existingAuthUser.id;
        console.log(`User ${admin.email} already exists in Supabase. ID: ${supabaseId}`);
        
        // Update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(supabaseId, {
          password: admin.password
        });
        if (updateError) console.warn(`Could not update password for ${admin.email}:`, updateError.message);
      }

      // 3. Create/Update in MongoDB
      await User.findOneAndUpdate(
        { email: admin.email },
        { 
          name: admin.name,
          role: admin.role,
          supabaseId: supabaseId,
          assignedModuleType: admin.assignedModuleType,
          isActive: true
        },
        { upsert: true, new: true }
      );

      console.log(`Successfully synced MongoDB for ${admin.email}`);
    }

    console.log('--- SEEDING COMPLETED ---');
    process.exit(0);
  } catch (err) {
    console.error('Seed script failed:', err);
    process.exit(1);
  }
}

seed();
