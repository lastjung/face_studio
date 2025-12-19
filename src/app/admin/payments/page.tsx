import { createAdminClient } from '@/utils/supabase/admin';
import { decrypt } from '@/utils/encryption';
import PaymentTable from './PaymentTable';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentsPage() {
    const supabase = createAdminClient();

    // 1. Fetch Payment History with Profile info
    // Now that profiles has encrypted 'email', we can fetch it directly.
    const { data: payments, error } = await supabase
        .from('payment_history')
        .select(`
            *,
            profiles (
                full_name,
                email
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error loading payments:", error);
        return <div className="text-red-500 p-4">Error loading payments: {error.message}</div>;
    }

    // 2. Process and Decrypt Data
    const processedPayments = (payments || []).map((payment: any) => {
        const profile = payment.profiles || {};

        let fullName = profile.full_name || 'Unknown';
        let email = profile.email || 'No Email';

        // Decrypt
        try {
            if (fullName) fullName = decrypt(fullName);
        } catch (e) { /* Ignore */ }

        try {
            if (email && (email.includes(':') || email.length > 50)) email = decrypt(email);
        } catch (e) { /* Ignore */ }

        return {
            ...payment,
            email: email, // Top-level email used by PaymentTable
            profiles: {
                ...profile,
                full_name: fullName // Nested full_name used by PaymentTable
            }
        };
    });

    return <PaymentTable payments={processedPayments} />;
}
