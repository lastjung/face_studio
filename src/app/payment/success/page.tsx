'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { confirmTossPayment } from '@/app/actions';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const orderId = searchParams.get('orderId');
        const paymentKey = searchParams.get('paymentKey');
        const amount = Number(searchParams.get('amount'));
        const planId = searchParams.get('planId'); // Passed from successUrl in PaymentPage

        if (!orderId || !paymentKey || !amount || !planId) {
            setStatus('error');
            setErrorMessage("잘못된 접근입니다. 결제 정보가 누락되었습니다.");
            return;
        }

        const verifyPayment = async () => {
            try {
                const result = await confirmTossPayment(orderId, paymentKey, amount, planId);

                if (result.success) {
                    setStatus('success');
                    toast.success("결제가 성공적으로 완료되었습니다!");
                } else {
                    setStatus('error');
                    setErrorMessage(result.error || "결제 승인 중 오류가 발생했습니다.");
                }
            } catch (error: any) {
                console.error("Verification Error:", error);
                setStatus('error');
                setErrorMessage(error.message || "알 수 없는 오류가 발생했습니다.");
            }
        };

        verifyPayment();
    }, [searchParams]);

    return (
        <div className="flex h-screen flex-col items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg border border-gray-100">

                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                        <h2 className="text-xl font-semibold text-gray-900">결제 확인 중...</h2>
                        <p className="text-gray-500">잠시만 기다려주세요.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="rounded-full bg-green-100 p-3">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">결제 성공!</h2>
                        <p className="text-gray-500">크레딧이 정상적으로 충전되었습니다.</p>

                        <div className="mt-6 flex w-full flex-col gap-3">
                            <Link
                                href="/credits/history"
                                className="w-full rounded-xl bg-black px-4 py-3 font-medium text-white hover:bg-gray-800"
                            >
                                사용 내역 확인하기
                            </Link>
                            <Link
                                href="/"
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
                            >
                                이미지 생성하러 가기
                            </Link>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="rounded-full bg-red-100 p-3">
                            <XCircle className="h-12 w-12 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">결제 실패</h2>
                        <p className="text-red-500">{errorMessage}</p>

                        <div className="mt-6 w-full">
                            <Link
                                href="/pricing"
                                className="block w-full rounded-xl bg-gray-900 px-4 py-3 font-medium text-white hover:bg-gray-800"
                            >
                                요금제 페이지로 돌아가기
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
