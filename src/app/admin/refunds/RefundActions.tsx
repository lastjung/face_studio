'use client';

import { useState } from 'react';
import { processRefund } from '@/app/admin/actions'; // Correct import path
import { toast } from 'sonner';
import { Check, X, Loader2 } from 'lucide-react';

export default function RefundActions({ requestId }: { requestId: string }) {
    const [loading, setLoading] = useState(false);

    const handleAction = async (action: 'approve' | 'reject') => {
        if (!confirm(`${action === 'approve' ? '승인' : '거절'} 하시겠습니까?`)) return;

        setLoading(true);
        try {
            const result = await processRefund(requestId, action);
            if (result.success) {
                toast.success(`환불 요청이 ${action === 'approve' ? '승인' : '거절'}되었습니다.`);
            } else {
                toast.error("처리 실패", { description: result.error });
            }
        } catch (e: any) {
            toast.error("오류 발생", { description: e.message });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
    }

    return (
        <div className="flex gap-2 justify-end">
            <button
                onClick={() => handleAction('approve')}
                className="p-1 rounded bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 transition-colors"
                title="승인"
            >
                <Check size={16} />
            </button>
            <button
                onClick={() => handleAction('reject')}
                className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
                title="거절"
            >
                <X size={16} />
            </button>
        </div>
    );
}
