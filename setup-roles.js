const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const env = fs.readFileSync('.env.local', 'utf8');
const uri = env.match(/MONGODB_URI=(.*)/)[1];

mongoose.connect(uri).then(async () => {
  const usersCollection = mongoose.connection.collection('users');

  const admins = [
    {
      name: 'Code Admin',
      email: 'codeadmin@avsec',
      password: 'avseccode',
      role: 'moduleAdmin',
      assignedModuleType: 'coding'
    },
    {
      name: 'Debug Admin',
      email: 'debugadmin@avsec',
      password: 'avsecdebug',
      role: 'moduleAdmin',
      assignedModuleType: 'mcq'
    },
    {
      name: 'Presentation Admin',
      email: 'presentadmin@avsec',
      password: 'avsecpresent',
      role: 'moduleAdmin',
      assignedModuleType: 'file_upload'
    },
    {
      name: 'Super Admin',
      email: 'superadmin@avsec',
      password: 'avsecsuperadmin',
      role: 'superadmin'
    }
  ];

  for (const admin of admins) {
    const existing = await usersCollection.findOne({ email: admin.email });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(admin.password, 12);
      await usersCollection.insertOne({
        name: admin.name,
        email: admin.email,
        password: hashedPassword,
        role: admin.role,
        assignedModuleType: admin.assignedModuleType || null,
        totalPoints: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Created ${admin.email}`);
    } else {
      console.log(`${admin.email} already exists`);
      // Update role/type just in case
      await usersCollection.updateOne({ email: admin.email }, { $set: { role: admin.role, assignedModuleType: admin.assignedModuleType || null }});
    }
  }

  console.log('Admin accounts configured.');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
