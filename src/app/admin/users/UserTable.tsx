'use client';

import { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DecryptedUser {
    id: string;
    email: string; // Decrypted or raw
    full_name: string; // Decrypted or raw
    username: string | null;
    avatar_url: string | null;
    role: 'Admin' | 'User';
    credits: number;
    created_at: string;
    deleted_at: string | null;
}

export default function UserTable({ users }: { users: DecryptedUser[] }) {
    const [search, setSearch] = useState('');
    const [showDeleted, setShowDeleted] = useState(false);

    // Filter Logic
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase());

        const matchesDeleted = showDeleted ? true : !user.deleted_at;

        return matchesSearch && matchesDeleted;
    });

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="이메일 또는 이름으로 검색..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showDeleted}
                        onChange={(e) => setShowDeleted(e.target.checked)}
                        className="rounded border-gray-300 text-black focus:ring-black"
                    />
                    탈퇴 회원 포함
                </label>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 font-normal">회원</th>
                            <th className="px-6 py-3 font-normal">상태</th>
                            <th className="px-6 py-3 font-normal">역할</th>
                            <th className="px-6 py-3 font-normal">크레딧</th>
                            <th className="px-6 py-3 font-normal">가입일</th>
                            <th className="px-6 py-3 font-normal">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    검색 결과가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/50 group transition-colors">
                                    {/* Member Column (Avatar + Name/Email) */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {/* Avatar (Optional based on design, but good to have) */}
                                            {/* Design shows no avatar? Just name/email text block? 
                                                Actually image shows "hong noa" then email. Likely no avatar or avatar is hidden/minimal.
                                                Wait, the design has a lot of whitespace. Let's include avatar if available, or just text.
                                                The user's previous table had avatar. I'll keep it but make it minimal?
                                                Actually the photo shows just text "hong noa\nemail". No avatar column separately.
                                                I will remove separate avatar column and maybe put it next to name or omit.
                                                Let's keep it clean as per text.
                                            */}
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">{user.full_name}</span>
                                                <span className="text-gray-400 text-xs">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4">
                                        {user.deleted_at ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-600 border border-red-100">
                                                탈퇴
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600 border border-green-100">
                                                활성
                                            </span>
                                        )}
                                    </td>

                                    {/* Role */}
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${user.role === 'Admin'
                                                ? 'bg-purple-50 text-purple-600 border-purple-100'
                                                : 'bg-gray-50 text-gray-600 border-gray-100'
                                            }`}>
                                            {user.role === 'Admin' ? '관리자' : '일반'}
                                        </span>
                                    </td>

                                    {/* Credits */}
                                    <td className="px-6 py-4 text-gray-900 font-medium">
                                        {user.credits?.toLocaleString()}
                                    </td>

                                    {/* Join Date */}
                                    <td className="px-6 py-4 text-gray-500">
                                        {formatDate(user.created_at)}
                                    </td>

                                    {/* Manage - Delete Button */}
                                    <td className="px-6 py-4">
                                        {!user.deleted_at && (
                                            <button
                                                className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors"
                                                onClick={() => {
                                                    if (confirm('정말 이 회원을 탈퇴 처리하시겠습니까?')) {
                                                        // Call server action to delete user?
                                                        // For now just alert or log, or implement. 
                                                        // I'll wire this up later or leave generic.
                                                        alert('관리자 탈퇴 기능은 아직 구현되지 않았습니다.');
                                                    }
                                                }}
                                            >
                                                탈퇴
                                            </button>
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
