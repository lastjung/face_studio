'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { requestRefund } from '@/app/actions';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

export default function HistoryPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [sources, setSources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'sources' | 'history'>('sources');
    const { user, openLoginModal, refreshCredits, credits } = useAuth();
    const router = useRouter();

    // Safety Init
    let supabase: any;
    try {
        supabase = createClient();
    } catch (e) {
        console.error("Supabase Init Error:", e);
    }

    const fetchHistory = async () => {
        if (!user || !supabase) return;
        setLoading(true);

        try {
            // Fetch Transactions
            const { data: txData, error: txError } = await supabase
                .from('credit_transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (txError) throw txError;
            if (txData) setTransactions(txData);

            // Fetch Sources with Price
            const { data: sourceData, error: sourceError } = await supabase
                .from('credit_sources')
                .select(`
                    *,
                    pricing_plans (name, price)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (sourceError) throw sourceError;
            if (sourceData) setSources(sourceData);
        } catch (e: any) {
            console.error("Fetch Error:", e);
            toast.error(`내역 로딩 실패: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const timeoutId = setTimeout(() => {
            if (isMounted && loading) {
                console.warn("Fetch timed out");
                setLoading(false);
                toast.error("데이터 로딩 시간이 초과되었습니다. 네트워크를 확인해주세요.");
            }
        }, 10000); // 10s Safety Timeout

        if (user) {
            fetchHistory().then(() => {
                if (isMounted) clearTimeout(timeoutId);
            });
        } else {
            const timer = setTimeout(() => {
                if (isMounted && !user) openLoginModal();
            }, 1000);
            return () => { clearTimeout(timer); clearTimeout(timeoutId); };
        }

        return () => { isMounted = false; clearTimeout(timeoutId); };
    }, [user]);

    const handleRefundRequest = async (sourceId: string) => {
        const reason = prompt("환불 요청 사유를 입력해주세요:");
        if (!reason) return;

        try {
            const result = await requestRefund(sourceId, reason);
            if (result.success) {
                toast.success("환불 요청이 접수되었습니다.", {
                    description: "관리자 승인 후 3-5일 내 처리됩니다."
                });
                await fetchHistory();
                await refreshCredits();
            } else {
                toast.error("요청 실패", { description: result.error });
            }
        } catch (e: any) {
            toast.error("오류 발생", { description: e.message });
        }
    };

    const isRefundable = (source: any) => {
        if (source.status !== 'active') return false;
        if (source.remaining_credits !== source.initial_credits) return false;
        const created = new Date(source.created_at);
        const now = new Date();
        const diffDays = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
        return diffDays < 7;
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <main className="container mx-auto max-w-3xl px-4">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">사용 내역</h1>
                    <p className="mt-1 text-sm text-gray-500">크레딧 구매 및 사용 내역을 확인하세요.</p>
                </div>

                {/* Balance Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between mb-8">
                    <div>
                        <span className="block text-sm text-gray-500 mb-1">현재 보유 크레딧</span>
                        <span className="text-4xl font-bold text-gray-900">{credits?.toLocaleString() ?? 0}</span>
                    </div>
                    <Link href="/pricing">
                        <button className="bg-[#00D686] hover:bg-[#00B873] text-white px-6 py-3 rounded-lg font-medium transition-colors">
                            크레딧 충전
                        </button>
                    </Link>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('sources')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'sources'
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        구매 내역
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history'
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        전체 내역
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activeTab === 'sources' && (
                            sources.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                                    구매 내역이 없습니다.
                                </div>
                            ) : (
                                sources.map((source) => {
                                    const used = source.initial_credits - source.remaining_credits;
                                    const progress = (used / source.initial_credits) * 100;

                                    return (
                                        <div key={source.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                            {/* Top Row: Plan & Status */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-gray-900">{source.pricing_plans?.name || 'Unknown Plan'}</h3>
                                                    {source.status === 'active' && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">사용 가능</span>}
                                                    {source.status === 'pending_refund' && <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full font-bold">환불 대기</span>}
                                                    {source.status === 'refunded' && <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold">환불 완료</span>}
                                                    {source.status === 'exhausted' && <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold">소진됨</span>}
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-sm text-gray-500 font-medium">결제 금액</span>
                                                    <span className="text-lg font-bold text-gray-900">₩{source.pricing_plans?.price?.toLocaleString() || 0}</span>
                                                </div>
                                            </div>

                                            {/* Date */}
                                            <div className="text-xs text-gray-400 mb-6">
                                                {new Date(source.created_at).toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mb-2">
                                                <div className="flex justify-between text-xs mb-1.5">
                                                    <span className="text-gray-500">{used} / {source.initial_credits} 크레딧 사용</span>
                                                    <span className="text-gray-900 font-bold">{source.remaining_credits} 남음</span>
                                                </div>
                                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gray-300 rounded-full transition-all duration-500"
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Refund Link */}
                                            {isRefundable(source) && (
                                                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-start">
                                                    <button
                                                        onClick={() => handleRefundRequest(source.id)}
                                                        className="text-xs text-red-500 hover:underline font-medium"
                                                    >
                                                        환불 요청 (환불 가능 기간: 7일 남음)
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )
                        )}

                        {activeTab === 'history' && (
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-3">날짜</th>
                                            <th className="px-6 py-3">내용</th>
                                            <th className="px-6 py-3 text-right">변동</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-4 text-gray-500 w-1/4">
                                                    {new Date(tx.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-gray-900">
                                                    {tx.description}
                                                    <div className="text-xs text-gray-400 mt-0.5 capitalize">{tx.type}</div>
                                                </td>
                                                <td className={`px-6 py-4 text-right font-bold ${tx.amount > 0 ? 'text-blue-600' : 'text-gray-900'}`}>
                                                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                                                </td>
                                            </tr>
                                        ))}
                                        {transactions.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-12 text-center text-gray-400">거래 내역이 없습니다.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
