
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const updatePassword = async () => {
    const email = 'chul.h.jung@gmail.com';
    const newPassword = 'password1234!'; // Temporary password

    console.log(`Resetting password for ${email}...`);

    const { data: user, error: findError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

    if (findError || !user) {
        console.error("User not found in profiles table.", findError);
        // Try finding by authadmin (if profile sync is broken, but standard is auth.users)
        // Actually, updateUserById needs the AUTH ID, which is the same as profile ID usually.
    }

    // We need the Auth User ID to update password. 
    // Admin API 'listUsers' or just 'updateUser' if we have the ID.
    // Ideally, valid user ID is needed. 

    // Easier way: Admin update user by email is not directly supported in all SDK versions, 
    // but let's try getting the user ID from the auth api first.

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const targetUser = users.find(u => u.email === email);

    if (!targetUser) {
        console.error(`User ${email} not found in Auth system.`);
        return;
    }

    const { data, error } = await supabase.auth.admin.updateUserById(
        targetUser.id,
        { password: newPassword }
    );

    if (error) {
        console.error('Error updating password:', error);
    } else {
        console.log(`Password updated successfully for ${email}`);
        console.log(`New Password: ${newPassword}`);
    }
};

updatePassword();
