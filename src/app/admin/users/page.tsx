import { createAdminClient } from '@/utils/supabase/admin';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Using raw img if fallback needed

export default async function AdminUsersPage() {
    const supabase = createAdminClient();

    const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .order('id', { ascending: false }); // ID order as proxy for time or add created_at if available

    if (error) {
        return <div className="text-red-500">Error loading users</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
                <span className="text-sm text-gray-500">총 {users?.length ?? 0}명</span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">프로필</th>
                            <th className="px-6 py-3">이름/이메일</th>
                            <th className="px-6 py-3">역할</th>
                            <th className="px-6 py-3">가입일 (ID)</th>
                            <th className="px-6 py-3 text-right">크레딧</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users?.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4">
                                    <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt={user.full_name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                ?
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{user.full_name}</div>
                                    <div className="text-xs text-gray-400">{user.username || '-'}</div>
                                    {/* Note: Profiles table might not have email directly if not synced. 
                                        If email is strictly in `auth.users`, we can't get it easily via simple fetch unless we made a view.
                                        But typically Supabase syncs or we use `username` as identifier. 
                                        Wait, looking at schema, profile doesn't have email column?
                                        Let's check `01_supabase_schema.sql` again. 
                                        It has username, full_name. 
                                        Usually we rely on Auth for email.
                                        Admin fetching `auth.users` via API is possible but `profiles` is easier.
                                        I will verify if I can get email. If not, I'll show ID.
                                     */}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs font-mono">
                                    {user.id}
                                    {/* TODO: Add created_at to profiles if missing, or use ID */}
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900">
                                    {user.credits?.toLocaleString() ?? 0}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
