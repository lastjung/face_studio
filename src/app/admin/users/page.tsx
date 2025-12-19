import { createAdminClient } from '@/utils/supabase/admin';
import { decrypt } from '@/utils/encryption';
import UserTable from './UserTable';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
    const supabase = createAdminClient();

    // 1. Fetch Profiles (Metadata, Encrypted Fields)
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('id', { ascending: false });

    if (profileError) {
        return <div className="text-red-500">Error loading profiles: {profileError.message}</div>;
    }

    // 2. Fetch Auth Users (Created At, Email fallback)
    // Note: listUsers defaults to page 1, 50 users. For now this is fine, but for scale need pagination.
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000
    });

    if (authError) {
        return <div className="text-red-500">Error loading auth users: {authError.message}</div>;
    }

    // Map Auth Users for quick lookup
    const authUserMap = new Map(authUsers.map(u => [u.id, u]));

    // 3. Merge and Decrypt
    const tableData = profiles.map(profile => {
        const authUser = authUserMap.get(profile.id);

        let fullName = profile.full_name || 'Unknown';
        let email = profile.email || authUser?.email || '-';

        // Decrypt
        try {
            if (fullName) fullName = decrypt(fullName);
        } catch (e) { /* Ignore */ }

        try {
            if (email && email.includes(':')) email = decrypt(email);
        } catch (e) { /* Ignore */ }

        return {
            id: profile.id,
            email: email,
            full_name: fullName,
            username: profile.username,
            avatar_url: profile.avatar_url,
            role: profile.role,
            credits: profile.credits || 0,
            deleted_at: profile.deleted_at,
            created_at: authUser?.created_at || new Date().toISOString() // Fallback if not found
        };
    });

    // Sort by created_at desc (newest first)
    tableData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
                <span className="text-sm text-gray-500">총 {tableData.length}명</span>
            </div>

            <UserTable users={tableData} />
        </div>
    );
}
