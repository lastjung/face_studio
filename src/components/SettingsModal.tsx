import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { withdrawUser } from '@/app/actions';
import { toast } from 'sonner';
import { X, UserX, Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { logout } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    const handleWithdraw = async () => {
        if (!confirm('정말 탈퇴하시겠습니까? 탈퇴 후에는 계정을 복구할 수 없으며, 모든 크레딧이 소멸됩니다.')) return;

        setLoading(true);
        try {
            const result = await withdrawUser();
            if (result.success) {
                toast.success('회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.');
                // Force logout via client-side cleanup
                await logout();
                onClose();
            } else {
                toast.error('탈퇴 처리 중 오류가 발생했습니다.', { description: result.error });
            }
        } catch (error: any) {
            toast.error('오류 발생', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden zoom-in-95 duration-200 relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">설정</h2>

                    <div className="space-y-2">
                        <button
                            onClick={async () => {
                                await logout();
                                onClose();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <LogOut size={18} />
                            로그아웃
                        </button>

                        <div className="pt-4 mt-4 border-t border-gray-100">
                            <button
                                onClick={handleWithdraw}
                                disabled={loading}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <UserX size={18} />}
                                회원 탈퇴
                            </button>
                            <p className="mt-2 text-xs text-gray-400 px-1">
                                탈퇴 시 보유 중인 크레딧은 모두 소멸되며 복구되지 않습니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
