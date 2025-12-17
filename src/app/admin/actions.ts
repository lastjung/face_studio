'use server';

import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function processRefund(requestId: string, action: 'approve' | 'reject', adminNote?: string) {
    // 1. Auth Check (Must be Admin)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase.from('profiles').select('role').eq('id', user.id).single();

    if (profile?.role !== 'Admin') return { success: false, error: "Forbidden" };

    try {
        // 2. Fetch Request
        const { data: request, error: reqError } = await adminSupabase
            .from('refund_requests')
            .select('*, credit_sources(*)')
            .eq('id', requestId)
            .single();

        if (reqError || !request) throw new Error("Request not found");

        const sourceId = request.source_id;
        // const userId = request.user_id; // Unused but available

        if (action === 'approve') {
            // 3. Approve Logic
            // Update Request
            await adminSupabase
                .from('refund_requests')
                .update({
                    status: 'approved',
                    updated_at: new Date().toISOString(),
                    admin_note: adminNote
                })
                .eq('id', requestId);

            // Update Source -> Refunded
            await adminSupabase
                .from('credit_sources')
                .update({ status: 'refunded' })
                .eq('id', sourceId);

            // Log Transaction (Record Keeping)
            // Note: Credits are removed from profile automatically by Trigger when status changes.
            await adminSupabase.from('credit_transactions').insert({
                user_id: request.user_id,
                amount: request.credit_sources.remaining_credits, // Log the amount that was refunded (cancelled)
                type: 'refund',
                description: `Refund Approved (Source: ${request.credit_sources.plan_id})`
            });

        } else {
            // 4. Reject Logic
            // Update Request
            await adminSupabase
                .from('refund_requests')
                .update({
                    status: 'rejected',
                    updated_at: new Date().toISOString(),
                    admin_note: adminNote
                })
                .eq('id', requestId);

            // Update Source -> Active (Unlock)
            await adminSupabase
                .from('credit_sources')
                .update({ status: 'active' })
                .eq('id', sourceId);
        }

        revalidatePath('/admin/refunds');
        revalidatePath('/admin'); // Update dashboard stats
        return { success: true };

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// --- Pricing Plan Actions ---

export async function updatePlan(id: string, data: { name: string, price: number, credits: number, sort_order: number }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'Admin') return { success: false, error: "Forbidden" };

    try {
        const { error } = await adminSupabase
            .from('pricing_plans')
            .update(data)
            .eq('id', id);

        if (error) throw error;
        revalidatePath('/admin/plans');
        revalidatePath('/pricing'); // Update public page
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function createPlan(data: { name: string, price: number, credits: number, sort_order: number }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'Admin') return { success: false, error: "Forbidden" };

    try {
        const { error } = await adminSupabase
            .from('pricing_plans')
            .insert({ ...data, is_active: true });

        if (error) throw error;
        revalidatePath('/admin/plans');
        revalidatePath('/pricing');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function togglePlanStatus(id: string, isActive: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'Admin') return { success: false, error: "Forbidden" };

    try {
        const { error } = await adminSupabase
            .from('pricing_plans')
            .update({ is_active: isActive })
            .eq('id', id);

        if (error) throw error;
        revalidatePath('/admin/plans');
        revalidatePath('/pricing');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// --- Admin Role Verification (Server Side) ---

export async function checkAdminRole() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { isAdmin: false, error: "No User" };
        }

        const adminSupabase = createAdminClient();
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role === 'Admin') {
            return { isAdmin: true };
        }
        return { isAdmin: false, error: "Not Admin" };
    } catch (e: any) {
        return { isAdmin: false, error: e.message };
    }
}
