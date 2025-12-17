import { createAdminClient } from '@/utils/supabase/admin';
// StatCard component is defined at the bottom of this file

import { Users, CreditCard, Activity, ArrowUpRight, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default async function AdminDashboard() {
    const supabase = createAdminClient();

    // Aggregated Stats
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { data: payments } = await supabase.from('payment_history').select('amount');
    const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    const { data: creditSources } = await supabase.from('credit_sources').select('initial_credits, remaining_credits');
    const totalCreditsIssued = creditSources?.reduce((sum, c) => sum + c.initial_credits, 0) || 0;
    const totalCreditsUsed = creditSources?.reduce((sum, c) => sum + (c.initial_credits - c.remaining_credits), 0) || 0;

    // Recent Activity (Credit Transactions)
    const { data: recentTxs } = await supabase
        .from('credit_transactions')
        .select(`
            id,
            amount,
            created_at,
            type,
            description,
            profiles (full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
    // const totalCreditsRemaining = creditStats?.reduce((acc, curr) => acc + curr.remaining_credits, 0) || 0;
    // const totalCreditsUsed = totalCreditsIssued - totalCreditsRemaining;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="총 회원수"
                    value={`${userCount?.toLocaleString() ?? 0}명`}
                    icon={<Users className="text-blue-500" />}
                    subtext="전체 가입 사용자"
                />
                <StatCard
                    title="총 매출"
                    value={`₩${totalRevenue.toLocaleString()}`}
                    icon={<DollarSign className="text-emerald-500" />}
                    subtext="누적 결제 금액"
                />
                <StatCard
                    title="발행 크레딧"
                    value={totalCreditsIssued.toLocaleString()}
                    icon={<CreditCard className="text-purple-500" />}
                    subtext={`사용됨: ${totalCreditsUsed.toLocaleString()}`}
                />
                <StatCard
                    title="최근 활동"
                    value="실시간"
                    icon={<Activity className="text-orange-500" />}
                    subtext="모니터링 중"
                />
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">최근 거래 내역</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3">사용자</th>
                                <th className="px-6 py-3">내용</th>
                                <th className="px-6 py-3">유형</th>
                                <th className="px-6 py-3 text-right">변동</th>
                                <th className="px-6 py-3 text-right">일시</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {recentTxs?.map((tx: any) => (
                                <tr key={tx.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{tx.profiles?.full_name || 'Unknown'}</div>
                                        <div className="text-xs text-gray-500">{tx.profiles?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">{tx.description}</td>
                                    <td className="px-6 py-4">
                                        <Badge type={tx.type} />
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${tx.amount > 0 ? 'text-blue-600' : 'text-gray-900'}`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-500">
                                        {new Date(tx.created_at).toLocaleString('ko-KR', {
                                            month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </td>
                                </tr>
                            ))}
                            {(!recentTxs || recentTxs.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">거래 내역이 없습니다.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, subtext }: { title: string, value: string, icon: React.ReactNode, subtext: string }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                    {icon}
                </div>
            </div>
            <div className="text-xs text-gray-400">
                {subtext}
            </div>
        </div>
    );
}

function Badge({ type }: { type: string }) {
    const styles: Record<string, string> = {
        purchase: 'bg-blue-100 text-blue-700',
        usage: 'bg-gray-100 text-gray-700',
        refund: 'bg-red-100 text-red-700',
        bonus: 'bg-purple-100 text-purple-700',
        admin_adjustment: 'bg-yellow-100 text-yellow-700'
    };

    const label: Record<string, string> = {
        purchase: '구매',
        usage: '사용',
        refund: '환불',
        bonus: '보너스',
        admin_adjustment: '관리자'
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[type] || 'bg-gray-100 text-gray-700'}`}>
            {label[type] || type}
        </span>
    );
}
