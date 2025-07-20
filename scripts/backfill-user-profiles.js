import { createClient } from '@supabase/supabase-js';

// This script backfills user_profiles for existing auth users who don't have profiles
// Run this once to ensure all existing users have corresponding user_profiles records

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfillUserProfiles() {
  try {
    console.log('Starting user_profiles backfill...');
    
    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }
    
    console.log(`Found ${authUsers.users.length} auth users`);
    
    // Get existing user_profiles
    const { data: existingProfiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id');
    
    if (profileError) {
      console.error('Error fetching existing profiles:', profileError);
      return;
    }
    
    const existingProfileIds = new Set(existingProfiles.map(p => p.id));
    console.log(`Found ${existingProfiles.length} existing user_profiles`);
    
    // Find users without profiles
    const usersWithoutProfiles = authUsers.users.filter(user => 
      !existingProfileIds.has(user.id)
    );
    
    console.log(`Found ${usersWithoutProfiles.length} users without profiles`);
    
    if (usersWithoutProfiles.length === 0) {
      console.log('All users already have profiles. Nothing to backfill.');
      return;
    }
    
    // Create profiles for users without them
    const profilesToCreate = usersWithoutProfiles.map(user => ({
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || '',
      full_name_kana: user.user_metadata?.full_name_kana || '',
      preferred_location: user.user_metadata?.preferred_location || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    console.log('Creating user_profiles records...');
    
    const { data: createdProfiles, error: createError } = await supabase
      .from('user_profiles')
      .insert(profilesToCreate)
      .select();
    
    if (createError) {
      console.error('Error creating profiles:', createError);
      return;
    }
    
    console.log(`Successfully created ${createdProfiles.length} user_profiles records`);
    console.log('Backfill complete!');
    
  } catch (error) {
    console.error('Unexpected error during backfill:', error);
  }
}

// Run the backfill
backfillUserProfiles().then(() => {
  console.log('Backfill script finished');
  process.exit(0);
}).catch((error) => {
  console.error('Backfill script failed:', error);
  process.exit(1);
});
