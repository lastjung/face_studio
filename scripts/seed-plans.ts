
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing Supabase URL or Service Role Key in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function seedPlans() {
    console.log("Seeding Pricing Plans...");

    const plans = [
        { name: 'Starter', credits: 10, price: 3900, sort_order: 1, is_active: true },
        { name: 'Basic', credits: 30, price: 9800, sort_order: 2, is_active: true },
        { name: 'Pro', credits: 60, price: 18800, sort_order: 3, is_active: true }
    ];

    for (const plan of plans) {
        const { data, error } = await supabase
            .from('pricing_plans')
            .upsert(plan, { onConflict: 'name' })
            .select();

        if (error) {
            console.error(`Error inserting ${plan.name}:`, error.message);
        } else {
            console.log(`Upserted ${plan.name}:`, data);
        }
    }

    console.log("Done!");
}

seedPlans();
