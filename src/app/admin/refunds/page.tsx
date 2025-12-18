import { createAdminClient } from '@/utils/supabase/admin';
import RefundsTable from './RefundsTable';

export default async function AdminRefundsPage() {
    const supabase = createAdminClient();

    const { data: requests, error } = await supabase
        .from('refund_requests')
        .select(`
            *,
            profiles (full_name),
            credit_sources (
                created_at,
                pricing_plans (name, price)
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        return <div className="text-red-500">Error loading refunds: {error.message}</div>;
    }

    // Fetch Emails manually via Auth Admin API
    const requestsWithEmail = await Promise.all(
        (requests || []).map(async (req: any) => {
            const { data: { user } } = await supabase.auth.admin.getUserById(req.user_id);
            return {
                ...req,
                profiles: {
                    ...req.profiles,
                    email: user?.email || 'No Email'
                }
            };
        })
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">환불 관리</h1>
                <span className="text-sm text-gray-500">총 {requestsWithEmail?.length ?? 0}건</span>
            </div>

            <RefundsTable requests={requestsWithEmail} />
        </div>
    );
}
