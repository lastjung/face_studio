import { createAdminClient } from '@/utils/supabase/admin';
import { decrypt } from '@/utils/encryption';
import RefundsTable from './RefundsTable';

export const dynamic = 'force-dynamic';

export default async function AdminRefundsPage() {
    const supabase = createAdminClient();

    const { data: requests, error } = await supabase
        .from('refund_requests')
        .select(`
            *,
            profiles (
                full_name,
                email
            ),
            credit_sources (
                created_at,
                pricing_plans (name, price)
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        return <div className="text-red-500">Error loading refunds: {error.message}</div>;
    }

    // Process and Decrypt
    const processedRequests = (requests || []).map((req: any) => {
        const profile = req.profiles || {};

        let fullName = profile.full_name || 'Unknown';
        let email = profile.email || 'No Email';

        try {
            if (fullName) fullName = decrypt(fullName);
        } catch (e) { /* Ignore */ }

        try {
            if (email && (email.includes(':') || email.length > 50)) email = decrypt(email);
        } catch (e) { /* Ignore */ }

        return {
            ...req,
            profiles: {
                ...req.profiles,
                full_name: fullName,
                email: email
            }
        };
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">환불 관리</h1>
                <span className="text-sm text-gray-500">총 {processedRequests?.length ?? 0}건</span>
            </div>

            <RefundsTable requests={processedRequests} />
        </div>
    );
}
