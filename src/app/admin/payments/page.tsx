import { createAdminClient } from '@/utils/supabase/admin';

export default async function AdminPaymentsPage() {
    const supabase = createAdminClient();

    const { data: payments, error } = await supabase
        .from('payment_history')
        .select(`
            *,
            profiles (full_name, email)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        return <div className="text-red-500">Error loading payments</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">결제 관</h1>
                <span className="text-sm text-gray-500">총 {payments?.length ?? 0}건</span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">결제자</th>
                            <th className="px-6 py-3">금액</th>
                            <th className="px-6 py-3">수단/제공자</th>
                            <th className="px-6 py-3">상태</th>
                            <th className="px-6 py-3 text-right">일시</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {payments?.map((payment: any) => (
                            <tr key={payment.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{payment.profiles?.full_name || 'Unknown'}</div>
                                    <div className="text-xs text-gray-500">{payment.profiles?.email}</div>
                                </td>
                                <td className="px-6 py-4 font-bold text-gray-900">
                                    ₩{payment.amount.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-gray-600 capitalize">
                                    {payment.provider}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${payment.status === 'succeeded' ? 'bg-emerald-100 text-emerald-700' :
                                            payment.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {payment.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-gray-500">
                                    {new Date(payment.created_at).toLocaleString('ko-KR')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
