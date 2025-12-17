'use client';

import { useSearchParams } from 'next/navigation';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentFailPage() {
    const searchParams = useSearchParams();
    const message = searchParams.get('message') || "결제가 취소되었거나 오류가 발생했습니다.";
    const code = searchParams.get('code');

    return (
        <div className="flex h-screen flex-col items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg border border-gray-100">
                <div className="flex flex-col items-center gap-4">
                    <div className="rounded-full bg-red-100 p-3">
                        <XCircle className="h-12 w-12 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">결제 실패</h2>

                    <div className="bg-gray-50 p-4 rounded-lg w-full text-left border border-gray-200">
                        <p className="text-sm text-gray-500 mb-1">오류 내용</p>
                        <p className="text-gray-800 font-medium">{message}</p>
                        {code && <p className="text-xs text-gray-400 mt-2">Code: {code}</p>}
                    </div>

                    <div className="mt-6 w-full">
                        <Link
                            href="/pricing"
                            className="block w-full rounded-xl bg-gray-900 px-4 py-3 font-medium text-white hover:bg-gray-800"
                        >
                            다시 시도하기
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
