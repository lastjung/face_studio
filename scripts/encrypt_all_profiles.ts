import { createAdminClient } from '@/utils/supabase/admin';
import { encrypt } from '@/utils/encryption';
import fs from 'fs';
import path from 'path';

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

async function encryptAllProfiles() {
    console.log("Starting full encryption migration...");
    console.log("Current working directory:", process.cwd());
    console.log("Env path:", envPath);
    console.log("Key loaded:", !!process.env.ENCRYPTION_KEY); // Boolean check

    // Validate Key (Script-side check)
    if (!process.env.ENCRYPTION_KEY) {
        console.error("FATAL: ENCRYPTION_KEY is missing in .env.local");
        process.exit(1);
    }

    const supabase = createAdminClient();

    // 1. Fetch All Profiles
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

    if (error) {
        console.error("Failed to fetch profiles:", error);
        return;
    }

    console.log(`Found ${profiles.length} profiles.`);

    for (const profile of profiles) {
        let updates: any = {};
        let needsUpdate = false;

        // Check & Encrypt Email
        // If email is missing in profile (schema added recently), try to migrate from Auth?
        // Admin client can list users from Auth API? No, separate API.
        // For now, if profile.email is empty, we can't encrypt what we don't have.
        // But if it exists and looks plain (no colons), encrypt it.
        if (profile.email && !profile.email.includes(':')) {
            updates.email = encrypt(profile.email);
            needsUpdate = true;
        }

        // Check & Encrypt Full Name
        if (profile.full_name && !profile.full_name.includes(':')) {
            updates.full_name = encrypt(profile.full_name);
            needsUpdate = true;
        }

        if (needsUpdate) {
            console.log(`Encrypting profile: ${profile.id} (${profile.username || 'No Username'})`);
            const { error: updateError } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', profile.id);

            if (updateError) {
                console.error(`  Failed to update ${profile.id}:`, updateError.message);
            } else {
                console.log(`  Success.`);
            }
        } else {
            console.log(`Skipping ${profile.id} (Already encrypted or empty)`);
        }
    }

    console.log("Migration complete.");
}

encryptAllProfiles();
