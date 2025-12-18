'use client';

import { useState } from 'react';
import { createPlan, updatePlan, deletePlan } from '@/app/admin/actions';
import { toast } from 'sonner';
import { Loader2, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Plan {
    id: string;
    name: string;
    price: number;
    credits: number;
    description?: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
}

export default function PlanManager({ initialPlans }: { initialPlans: Plan[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        price: 0,
        credits: 0,
        description: '',
        sort_order: 0,
        is_active: true
    });

    const openCreateModal = () => {
        setEditingPlan(null);
        setFormData({
            name: '',
            price: 0,
            credits: 0,
            description: '',
            sort_order: initialPlans.length + 1,
            is_active: true
        });
        setIsModalOpen(true);
    };

    const openEditModal = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name,
            price: plan.price,
            credits: plan.credits,
            description: plan.description || '',
            sort_order: plan.sort_order,
            is_active: plan.is_active
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (planId: string) => {
        if (!confirm('정말 이 요금제를 삭제하시겠습니까?')) return;
        setLoading(true);
        try {
            const result = await deletePlan(planId);
            if (result.success) {
                toast.success('요금제가 삭제되었습니다.');
                router.refresh();
            } else {
                toast.error('삭제 실패', { description: result.error });
            }
        } catch (e: any) {
            toast.error('오류 발생', { description: e.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name) return toast.error('이름을 입력해주세요.');

        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                price: Number(formData.price),
                credits: Number(formData.credits),
                description: formData.description,
                sort_order: Number(formData.sort_order),
                is_active: formData.is_active
            };

            let result;
            if (editingPlan) {
                result = await updatePlan(editingPlan.id, payload);
            } else {
                result = await createPlan(payload);
            }

            if (result.success) {
                toast.success(editingPlan ? '요금제가 수정되었습니다.' : '요금제가 생성되었습니다.');
                setIsModalOpen(false);
                router.refresh();
            } else {
                toast.error('저장 실패', { description: result.error });
            }
        } catch (e: any) {
            toast.error('오류 발생', { description: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Info */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                <p className="text-sm text-gray-500">요금제를 추가, 수정, 삭제할 수 있습니다.</p>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-[#00D686] hover:bg-[#00B873] text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                >
                    <Plus size={16} />
                    요금제 추가
                </button>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {initialPlans.map((plan) => (
                    <div key={plan.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {plan.is_active ? '활성' : '비활성'}
                                </span>
                                <span className="text-xs text-gray-400">순서: {plan.sort_order}</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                            <p className="text-sm text-gray-500 mb-6 min-h-[40px]">{plan.description || '설명 없음'}</p>

                            <div className="space-y-2 mb-6 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>크레딧</span>
                                    <span className="font-bold text-gray-900">{plan.credits}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>가격</span>
                                    <span className="font-bold text-gray-900">₩{plan.price.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>크레딧당</span>
                                    <span className="text-gray-400">₩{Math.round(plan.price / plan.credits).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-gray-50">
                            <button
                                onClick={() => openEditModal(plan)}
                                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                수정
                            </button>
                            <button
                                onClick={() => handleDelete(plan.id)}
                                className="px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors flex items-center justify-center"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">{editingPlan ? '요금제 수정' : '요금제 추가'}</h3>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">이름 *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border-gray-200 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                                    placeholder="예: Standard"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">크레딧 *</label>
                                    <input
                                        type="number"
                                        value={formData.credits}
                                        onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                                        className="w-full border-gray-200 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">가격 (원) *</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                        className="w-full border-gray-200 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">설명</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border-gray-200 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                                    placeholder="간단한 설명..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">순서</label>
                                    <input
                                        type="number"
                                        value={formData.sort_order}
                                        onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                                        className="w-full border-gray-200 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">상태</label>
                                    <select
                                        value={formData.is_active ? 'true' : 'false'}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                                        className="w-full border-gray-200 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="true">활성</option>
                                        <option value="false">비활성</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-2.5 text-sm font-bold text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                disabled={loading}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 py-2.5 text-sm font-bold text-white bg-[#00D686] hover:bg-[#00B873] rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
