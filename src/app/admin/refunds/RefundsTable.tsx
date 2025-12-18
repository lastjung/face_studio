'use client';

import { useState } from 'react';
import RefundActions from './RefundActions';

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

export default function RefundsTable({ requests }: { requests: any[] }) {
    const [filter, setFilter] = useState<FilterType>('all');

    const filteredRequests = requests.filter(req => {
        if (filter === 'all') return true;
        return req.status === filter;
    });

    const counts = {
        all: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-2">
                {[
                    { id: 'all', label: '전체' },
                    { id: 'pending', label: '대기' },
                    { id: 'approved', label: '승인' },
                    { id: 'rejected', label: '거부' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id as FilterType)}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-medium transition-colors relative
                            ${filter === tab.id
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
                            }
                        `}
                    >
                        {tab.label}
                        {/* Red badge for pending count if > 0 */}
                        {tab.id === 'pending' && counts.pending > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {counts.pending}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">회원</th>
                            <th className="px-6 py-3">요금제</th>
                            <th className="px-6 py-3">환불 금액</th>
                            <th className="px-6 py-3">상태</th>
                            <th className="px-6 py-3">요청일</th>
                            <th className="px-6 py-3 text-right">작업</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredRequests.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                    해당하는 요청이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            filteredRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{req.profiles?.full_name || 'Unknown'}</div>
                                        <div className="text-xs text-gray-500">{req.profiles?.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">
                                            {req.credit_sources?.pricing_plans?.name || '-'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {req.credit_sources?.amount ?? 0} 크레딧
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-900">
                                        ₩{req.credit_sources?.pricing_plans?.price?.toLocaleString() || 0}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded inline-flex text-xs font-bold leading-none ${req.status === 'approved' ? 'bg-green-100 text-green-600' :
                                                req.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                                    'bg-red-500 text-white' // Pending style in screenshot
                                            }`}>
                                            {req.status === 'pending' ? '대기' :
                                                req.status === 'approved' ? '승인' : '거부'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        {new Date(req.created_at).toLocaleString('ko-KR', {
                                            year: 'numeric', month: 'long', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {req.status === 'pending' ? (
                                            <RefundActions
                                                requestId={req.id}
                                                email={req.profiles?.email}
                                                planName={req.credit_sources?.pricing_plans?.name || 'Unknown Plan'}
                                                refundAmount={req.credit_sources?.pricing_plans?.price || 0}
                                                refundCredits={req.credit_sources?.remaining_amount || 0}
                                            />
                                        ) : (
                                            <span className="text-xs text-gray-400">처리됨</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
