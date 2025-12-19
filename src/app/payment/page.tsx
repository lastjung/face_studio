'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadPaymentWidget, PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";

export default function PaymentPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, isLoading: authLoading, openLoginModal } = useAuth();

    // Plan Info
    const planId = searchParams.get('planId');
    const [plan, setPlan] = useState<any>(null);
    const [loadingPlan, setLoadingPlan] = useState(true);

    // Toss Widget
    const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
    const paymentMethodsWidgetRef = useRef<ReturnType<PaymentWidgetInstance["renderPaymentMethods"]> | null>(null);
    const [isWidgetReady, setIsWidgetReady] = useState(false);

    useEffect(() => {
        // 1. Auth Check
        if (!authLoading && !user) {
            router.replace('/pricing'); // Go back if accessed directly without auth
            setTimeout(() => openLoginModal(), 500); // Open login modal
        }
    }, [user, authLoading, router, openLoginModal]);

    // 2. Fetch Plan
    useEffect(() => {
        if (!planId) return;

        const fetchPlan = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('pricing_plans')
                .select('*')
                .eq('id', planId)
                .single();

            if (error || !data) {
                toast.error("요금제 정보를 불러올 수 없습니다.");
                router.push('/pricing');
                return;
            }

            setPlan(data);
            setLoadingPlan(false);
        };

        fetchPlan();
    }, [planId, router]);

    // 3. Initialize Toss Widget AFTER Plan Loaded
    useEffect(() => {
        if (loadingPlan || !plan || !user) return;

        const initWidget = async () => {
            try {
                const visibleRef = document.getElementById('payment-widget');
                if (!visibleRef) {
                    console.error("DOM container not found");
                    return;
                }

                const paymentWidget = await loadPaymentWidget(clientKey, user.id);
                paymentWidgetRef.current = paymentWidget;

                // Render Payment Methods
                const paymentMethodsWidget = await paymentWidget.renderPaymentMethods(
                    "#payment-widget",
                    { value: plan.discounted_price || plan.price },
                    { variantKey: "DEFAULT" } // Use default UI
                );
                paymentMethodsWidgetRef.current = paymentMethodsWidget;

                // Render Agreement
                await paymentWidget.renderAgreement("#agreement", { variantKey: "AGREEMENT" });

                setIsWidgetReady(true); // Enable button only after rendering

            } catch (error) {
                console.error("Error loading payment widget:", error);
                toast.error("결제 위젯 로딩 실패. 새로고침 해주세요.");
            }
        };

        initWidget();
    }, [loadingPlan, plan, user]);


    const handlePayment = async () => {
        if (!isWidgetReady) return;
        const paymentWidget = paymentWidgetRef.current;
        if (!paymentWidget || !plan || !user) return;

        try {
            const orderId = uuidv4(); // Generate unique order ID

            // Request Payment
            await paymentWidget.requestPayment({
                orderId: orderId,
                orderName: `${plan.name} (${plan.credits} Credits)`,
                customerName: user.user_metadata?.full_name || "고객",
                customerEmail: user.email,
                customerMobilePhone: "01000000000", // Required for some payment flows
                successUrl: `${window.location.origin}/payment/success?planId=${plan.id}`,
                failUrl: `${window.location.origin}/payment/fail`,
            });
        } catch (error) {
            console.error("Payment request failed:", error);
        }
    };

    if (authLoading || loadingPlan || !plan) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <main className="container mx-auto px-4 max-w-6xl">
                <h1 className="text-3xl font-bold mb-8">결제하기</h1>

                {/* Layout: PC (Left Widget, Right Info) / Mobile (Top Info, Bottom Widget) */}
                <div className="flex flex-col lg:flex-row-reverse gap-8">

                    {/* Order Information (PC: Right, Mobile: Top) */}
                    <div className="w-full lg:w-1/3">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm sticky top-24">
                            <h2 className="text-xl font-semibold mb-4 border-b pb-4">주문 정보</h2>

                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">상품명</span>
                                <span className="font-medium">{plan.name}</span>
                            </div>
                            <div className="flex justify-between mb-4">
                                <span className="text-gray-600">제공 크레딧</span>
                                <span className="font-medium">{plan.credits}개</span>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>총 결제금액</span>
                                    <span className="text-blue-600">₩{(plan.discounted_price || plan.price).toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={!isWidgetReady}
                                className={`w-full mt-6 font-bold py-4 rounded-xl transition-colors text-lg ${isWidgetReady
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                {isWidgetReady ? '결제하기' : '로딩 중...'}
                            </button>
                        </div>
                    </div>

                    {/* Payment Widget (PC: Left, Mobile: Bottom) */}
                    <div className="w-full lg:w-2/3">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm min-h-[500px]">
                            {/* Widget Container */}
                            <div id="payment-widget" className="w-full" />
                            <div id="agreement" className="w-full" />
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
