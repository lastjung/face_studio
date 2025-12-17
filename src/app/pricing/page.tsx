'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { purchaseCredit } from '@/app/actions';
import { Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface PricingPlan {
    id: string;
    name: string;
    credits: number;
    price: number;
    description?: string;
}

export default function PricingPage() {
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasingId, setPurchasingId] = useState<string | null>(null);
    const { user, openLoginModal, refreshCredits } = useAuth();
    const router = useRouter();

    let supabase: any;
    try {
        supabase = createClient();
    } catch (e) {
        console.error("Supabase init failed:", e);
    }

    useEffect(() => {
        let isMounted = true;
        const timeoutId = setTimeout(() => {
            if (isMounted && loading) {
                console.warn("Fetch timed out");
                setLoading(false);
                toast.error("데이터 로딩 시간이 초과되었습니다. 네트워크를 확인해주세요.");
            }
        }, 10000); // 10s Safety Timeout

        async function fetchPlans() {
            if (!supabase) {
                if (isMounted) {
                    toast.error("시스템 오류: Supabase 연결 설정이 누락되었습니다.");
                    setLoading(false);
                }
                return;
            }
            // console.log("Fetching plans...");
            try {
                const { data, error } = await supabase
                    .from('pricing_plans')
                    .select('*')
                    .eq('is_active', true)
                    .order('sort_order', { ascending: true });

                if (isMounted) {
                    if (error) {
                        console.error("Error fetching plans:", error);
                        toast.error(`요금제 로딩 실패: ${error.message}`);
                    }
                    if (data) setPlans(data);
                }
            } catch (err) {
                if (isMounted) console.error("Unexpected error:", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                    clearTimeout(timeoutId);
                }
            }
        }

        fetchPlans();

        return () => { isMounted = false; clearTimeout(timeoutId); };
    }, []);

    const handlePurchase = async (plan: PricingPlan) => {
        if (!user) {
            openLoginModal();
            return;
        }

        // Redirect to Payment Page
        router.push(`/payment?planId=${plan.id}`);
    };

    return (
        <div className="min-h-screen bg-gray-50">

            <main className="container mx-auto px-4 py-16">
                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">
                        단순하고 투명한 요금제
                    </h1>
                    <p className="text-lg text-gray-600">
                        복잡한 구독 없이, 필요한 만큼만 충전해서 사용하세요.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-3 md:gap-12 lg:px-20">
                        {plans.length === 0 ? (
                            <div className="col-span-3 py-12 text-center text-gray-500">
                                <p className="text-lg">등록된 요금제가 없습니다.</p>
                                <p className="text-sm">관리자에게 문의하거나 데이터베이스를 확인해주세요.</p>
                            </div>
                        ) : (
                            plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className={`relative flex flex-col rounded-2xl border p-8 shadow-sm transition-all hover:shadow-md ${plan.name === 'Basic'
                                        ? 'border-gray-900 bg-white ring-1 ring-gray-900/5'
                                        : 'border-gray-200 bg-white'
                                        }`}
                                >
                                    {plan.name === 'Basic' && (
                                        <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-black px-4 py-1 text-xs font-medium text-white shadow-sm">
                                            가장 인기있는 선택
                                        </div>
                                    )}

                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                                        <div className="mt-4 flex items-baseline text-gray-900">
                                            <span className="text-4xl font-bold tracking-tight">
                                                ₩{plan.price.toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm text-gray-500">
                                            {plan.credits} 크레딧 제공
                                        </p>
                                    </div>

                                    <ul className="mb-8 space-y-3 text-sm leading-6 text-gray-600">
                                        <li className="flex gap-x-3">
                                            <Check className="h-6 w-5 flex-none text-black" aria-hidden="true" />
                                            크레딧당 약 ₩{Math.round(plan.price / plan.credits).toLocaleString()}원
                                        </li>
                                        <li className="flex gap-x-3">
                                            <Check className="h-6 w-5 flex-none text-black" aria-hidden="true" />
                                            유효기간 무제한
                                        </li>
                                    </ul>

                                    <button
                                        onClick={() => handlePurchase(plan)}
                                        disabled={!!purchasingId}
                                        className={`mt-auto block w-full rounded-xl px-3 py-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${plan.name === 'Basic'
                                            ? 'bg-black text-white hover:bg-gray-800 focus-visible:outline-black'
                                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                            } ${purchasingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {purchasingId === plan.id ? '처리 중...' : '구매하기'}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
