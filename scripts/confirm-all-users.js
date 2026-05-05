// scripts/confirm-all-users.js
// Confirms all unconfirmed Supabase users so they can sign in immediately
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load env vars from .env.local
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function confirmAllUsers() {
  console.log('Fetching all Supabase users...');

  let page = 1;
  let confirmed = 0;
  let skipped = 0;
  let failed = 0;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) { console.error('Failed to list users:', error.message); break; }
    if (!data.users.length) break;

    for (const user of data.users) {
      if (user.email_confirmed_at) {
        skipped++;
        continue; // already confirmed
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        email_confirm: true
      });

      if (updateError) {
        console.error(`  ✗ Failed to confirm ${user.email}: ${updateError.message}`);
        failed++;
      } else {
        console.log(`  ✓ Confirmed: ${user.email}`);
        confirmed++;
      }
    }

    if (data.users.length < 1000) break;
    page++;
  }

  console.log('\n--- DONE ---');
  console.log(`✓ Confirmed: ${confirmed}`);
  console.log(`  Skipped (already confirmed): ${skipped}`);
  console.log(`✗ Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

confirmAllUsers();
