"use client";

import { useState } from 'react';

interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: string;
    provider: string;
    created_at: string;
    email: string;
    profiles?: {
        full_name: string;
    };
}

const statusMap: Record<string, { label: string; color: string }> = {
    succeeded: { label: '완료', color: 'bg-emerald-100 text-emerald-700' },
    failed: { label: '실패', color: 'bg-red-100 text-red-700' },
    pending: { label: '대기', color: 'bg-yellow-100 text-yellow-700' },
    refunded: { label: '환불됨', color: 'bg-gray-100 text-gray-600' },
};

export default function PaymentTable({ payments }: { payments: Payment[] }) {
    const [activeTab, setActiveTab] = useState('all');

    const filteredPayments = payments.filter((payment) => {
        if (activeTab === 'all') return true;
        if (activeTab === 'succeeded') return payment.status === 'succeeded';
        if (activeTab === 'pending') return payment.status === 'pending';
        if (activeTab === 'failed') return payment.status === 'failed';
        if (activeTab === 'refunded') return payment.status === 'refunded';
        return true;
    });

    const totalRevenue = payments
        .filter(p => p.status === 'succeeded')
        .reduce((sum, p) => sum + p.amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-gray-900">결제 관리</h1>
                <p className="text-sm text-gray-500">
                    총 {payments.length}건 · 총 매출 ₩{totalRevenue.toLocaleString()}
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {[
                    { id: 'all', label: '전체' },
                    { id: 'succeeded', label: '완료' },
                    { id: 'pending', label: '대기' },
                    { id: 'failed', label: '실패' },
                    { id: 'refunded', label: '환불됨' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">회원</th>
                            <th className="px-6 py-3">요금제</th>
                            <th className="px-6 py-3">금액</th>
                            <th className="px-6 py-3">상태</th>
                            <th className="px-6 py-3 text-center">결제일</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredPayments.length > 0 ? (
                            filteredPayments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">
                                            {payment.profiles?.full_name || 'Unknown'}
                                        </div>
                                        <div className="text-xs text-gray-500">{payment.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {/* TODO: Add Plan Name if available in join */}
                                        -
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-900">
                                        ₩{payment.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-bold ${statusMap[payment.status]?.color ||
                                                'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {statusMap[payment.status]?.label || payment.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-500">
                                        {new Date(payment.created_at).toLocaleString('ko-KR')}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    결제 내역이 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
