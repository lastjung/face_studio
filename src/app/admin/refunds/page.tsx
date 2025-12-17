import { createAdminClient } from '@/utils/supabase/admin';
import RefundActions from './RefundActions';

export default async function AdminRefundsPage() {
    const supabase = createAdminClient();

    const { data: requests, error } = await supabase
        .from('refund_requests')
        .select(`
            *,
            profiles (full_name, email),
            credit_sources (
                created_at,
                pricing_plans (name, price)
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        return <div className="text-red-500">Error loading refunds: {error.message}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">환불 관리</h1>
                <span className="text-sm text-gray-500">총 {requests?.length ?? 0}건</span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">요청자</th>
                            <th className="px-6 py-3">상품</th>
                            <th className="px-6 py-3">사유</th>
                            <th className="px-6 py-3">상태</th>
                            <th className="px-6 py-3">요청일</th>
                            <th className="px-6 py-3 text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {requests?.map((req: any) => (
                            <tr key={req.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{req.profiles?.full_name || 'Unknown'}</div>
                                    <div className="text-xs text-gray-500">{req.profiles?.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">
                                        {req.credit_sources?.pricing_plans?.name || 'Unknown Plan'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        ₩{req.credit_sources?.pricing_plans?.price?.toLocaleString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-700 max-w-xs truncate" title={req.reason}>
                                    {req.reason}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${req.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {req.status === 'pending' ? '대기중' :
                                            req.status === 'approved' ? '승인됨' : '거절됨'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {new Date(req.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {req.status === 'pending' && (
                                        <RefundActions requestId={req.id} />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
