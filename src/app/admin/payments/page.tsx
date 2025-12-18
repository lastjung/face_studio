import { createAdminClient } from '@/utils/supabase/admin';
import PaymentTable from './PaymentTable';

export default async function AdminPaymentsPage() {
    const supabase = createAdminClient();

    // 1. Fetch Payment History
    const { data: payments, error } = await supabase
        .from('payment_history')
        .select(`
            *,
            profiles (full_name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error loading payments:", error);
        return <div className="text-red-500 p-4">Error loading payments: {error.message}</div>;
    }

    // 2. Fetch Emails manually via Auth Admin API (since profiles doesn't have email)
    const paymentsWithEmail = await Promise.all(
        (payments || []).map(async (payment: any) => {
            const { data: { user } } = await supabase.auth.admin.getUserById(payment.user_id);
            return {
                ...payment,
                email: user?.email || 'No Email'
            };
        })
    );

    return <PaymentTable payments={paymentsWithEmail} />;
}
