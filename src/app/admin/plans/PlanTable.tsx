'use client';

import { useState } from 'react';
import { updatePlan, createPlan, togglePlanStatus } from '@/app/admin/actions';
import { toast } from 'sonner';
import { Pencil, Save, X, Plus, Loader2, Trash2 } from 'lucide-react';

interface Plan {
    id: string;
    name: string;
    credits: number;
    price: number;
    is_active: boolean;
    sort_order: number;
}

export default function PlanTable({ initialPlans }: { initialPlans: Plan[] }) {
    const [plans, setPlans] = useState(initialPlans);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Plan>>({});
    const [isCreating, setIsCreating] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', credits: 10, price: 1000, sort_order: 1 });
    const [loading, setLoading] = useState(false);

    const handleEdit = (plan: Plan) => {
        setEditingId(plan.id);
        setEditForm(plan);
        setIsCreating(false);
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
        setIsCreating(false);
    };

    const handleSave = async (id: string) => {
        if (!editForm.name || !editForm.credits || !editForm.price) {
            toast.error("필수 정보를 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const result = await updatePlan(id, {
                name: editForm.name!,
                credits: Number(editForm.credits),
                price: Number(editForm.price),
                sort_order: Number(editForm.sort_order ?? 0)
            });

            if (result.success) {
                toast.success("요금제가 수정되었습니다.");
                setEditingId(null);
                // Optimistic update or wait for revalidatePath (Next.js server action revalidates path, so page props might update if router refreshes)
                // Since this is client state initialized from server, we should rely on router refresh or manual update.
                // For simplicity, we assume simpler state update logic or let router.refresh() handle it if we hook it up.
                // But `updatePlan` calls `revalidatePath`, which doesn't auto-refresh client component state unless we force it.
                // We'll manually update local state to be snappy.
                setPlans(plans.map(p => p.id === id ? { ...p, ...editForm } as Plan : p));
            } else {
                toast.error("수정 실패", { description: result.error });
            }
        } catch (e: any) {
            toast.error("오류 발생", { description: e.message });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!createForm.name) {
            toast.error("이름을 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const result = await createPlan(createForm);
            if (result.success) {
                toast.success("새 요금제가 생성되었습니다.");
                setIsCreating(false);
                setCreateForm({ name: '', credits: 10, price: 1000, sort_order: 1 });
                // We really should refresh from server to get ID.
                window.location.reload(); // Simplest way to get new ID and data sync
            } else {
                toast.error("생성 실패", { description: result.error });
            }
        } catch (e: any) {
            toast.error("오류 발생", { description: e.message });
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        if (!confirm(`요금제를 ${currentStatus ? '판매 중단' : '판매 개시'} 하시겠습니까?`)) return;

        try {
            const result = await togglePlanStatus(id, !currentStatus);
            if (result.success) {
                toast.success("상태가 변경되었습니다.");
                setPlans(plans.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
            } else {
                toast.error("변경 실패", { description: result.error });
            }
        } catch (e: any) {
            toast.error("오류 발생", { description: e.message });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    disabled={isCreating}
                >
                    <Plus size={16} />
                    새 요금제 추가
                </button>
            </div>

            {/* Create Form */}
            {isCreating && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                    <div className="grid grid-cols-5 gap-4 items-end">
                        <div>
                            <label className="text-xs font-semibold text-gray-500">이름 (고유)</label>
                            <input
                                type="text"
                                value={createForm.name}
                                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                className="w-full mt-1 p-2 text-sm border rounded"
                                placeholder="예: Premium"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500">크레딧</label>
                            <input
                                type="number"
                                value={createForm.credits}
                                onChange={(e) => setCreateForm({ ...createForm, credits: Number(e.target.value) })}
                                className="w-full mt-1 p-2 text-sm border rounded"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500">가격 (KRW)</label>
                            <input
                                type="number"
                                value={createForm.price}
                                onChange={(e) => setCreateForm({ ...createForm, price: Number(e.target.value) })}
                                className="w-full mt-1 p-2 text-sm border rounded"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500">순서</label>
                            <input
                                type="number"
                                value={createForm.sort_order}
                                onChange={(e) => setCreateForm({ ...createForm, sort_order: Number(e.target.value) })}
                                className="w-full mt-1 p-2 text-sm border rounded"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleCreate} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 w-full flex justify-center">
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : '생성'}
                            </button>
                            <button onClick={handleCancel} className="px-4 py-2 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50" title="취소">
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">이름</th>
                            <th className="px-6 py-3">제공 크레딧</th>
                            <th className="px-6 py-3">가격</th>
                            <th className="px-6 py-3">정렬 순서</th>
                            <th className="px-6 py-3">상태</th>
                            <th className="px-6 py-3 text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {plans.map((plan) => (
                            <tr key={plan.id} className="hover:bg-gray-50/50">
                                {editingId === plan.id ? (
                                    // Editing Mode
                                    <>
                                        <td className="px-6 py-3">
                                            <input
                                                className="w-full p-1 border rounded"
                                                value={editForm.name || ''}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            />
                                        </td>
                                        <td className="px-6 py-3">
                                            <input
                                                className="w-full p-1 border rounded"
                                                type="number"
                                                value={editForm.credits || 0}
                                                onChange={(e) => setEditForm({ ...editForm, credits: Number(e.target.value) })}
                                            />
                                        </td>
                                        <td className="px-6 py-3">
                                            <input
                                                className="w-full p-1 border rounded"
                                                type="number"
                                                value={editForm.price || 0}
                                                onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                                            />
                                        </td>
                                        <td className="px-6 py-3">
                                            <input
                                                className="w-full p-1 border rounded"
                                                type="number"
                                                value={editForm.sort_order || 0}
                                                onChange={(e) => setEditForm({ ...editForm, sort_order: Number(e.target.value) })}
                                            />
                                        </td>
                                        <td className="px-6 py-3 text-gray-400">
                                            -
                                        </td>
                                        <td className="px-6 py-3 text-right flex justify-end gap-2">
                                            <button onClick={() => handleSave(plan.id)} disabled={loading} className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200">
                                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                            </button>
                                            <button onClick={handleCancel} className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </>
                                ) : (
                                    // Display Mode
                                    <>
                                        <td className="px-6 py-4 font-bold text-gray-900">{plan.name}</td>
                                        <td className="px-6 py-4">{plan.credits}</td>
                                        <td className="px-6 py-4">₩{plan.price.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-gray-500">{plan.sort_order}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggle(plan.id, plan.is_active)}
                                                className={`px-2 py-1 rounded-full text-xs font-bold transition-colors ${plan.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {plan.is_active ? '판매 중' : '비활성'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleEdit(plan)}
                                                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
