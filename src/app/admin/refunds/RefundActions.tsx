'use client';

import { useState } from 'react';
import { processRefund } from '@/app/admin/actions';
import { toast } from 'sonner';
import { Check, X, Loader2 } from 'lucide-react';

interface RefundActionsProps {
    requestId: string;
    email: string;
    planName: string;
    refundAmount: number;
    refundCredits: number; // You might need to add this to the parent query or estimate it
}

export default function RefundActions({ requestId, email, planName, refundAmount, refundCredits }: RefundActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [memo, setMemo] = useState('');

    const handleAction = async (action: 'approve' | 'reject') => {
        if (!confirm(`${action === 'approve' ? '승인' : '거절'} 하시겠습니까?`)) return;

        setLoading(true);
        try {
            // Note: If backend supports memo, pass it here. Currently it might not, but UI shows it.
            const result = await processRefund(requestId, action);
            if (result.success) {
                toast.success(`환불 요청이 ${action === 'approve' ? '승인' : '거절'}되었습니다.`);
                setIsOpen(false);
            } else {
                toast.error("처리 실패", { description: result.error });
            }
        } catch (e: any) {
            toast.error("오류 발생", { description: e.message });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="text-sm font-medium text-green-600 hover:text-green-700"
            >
                처리하기
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">환불 요청 처리</h3>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
                        <div className="text-gray-500">회원</div>
                        <div className="font-medium text-gray-900">{email}</div>

                        <div className="text-gray-500">요금제</div>
                        <div className="font-medium text-gray-900">{planName}</div>

                        <div className="text-gray-500">환불 크레딧</div>
                        <div className="font-medium text-gray-900">{refundCredits} 크레딧</div>

                        <div className="text-gray-500">환불 금액</div>
                        <div className="font-bold text-green-600">₩{refundAmount.toLocaleString()}</div>
                    </div>

                    <div className="pt-4 border-t border-gray-50">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                            관리자 메모
                        </label>
                        <textarea
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            placeholder="메모를 입력하세요 (선택)"
                            className="w-full text-sm border-gray-200 rounded-lg focus:ring-gray-900 focus:border-gray-900 min-h-[80px]"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        취소
                    </button>
                    <button
                        onClick={() => handleAction('reject')}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        거부
                    </button>
                    <button
                        onClick={() => handleAction('approve')}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        승인
                    </button>
                </div>
            </div>
        </div>
    );
}
