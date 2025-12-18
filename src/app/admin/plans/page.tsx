import { createAdminClient } from '@/utils/supabase/admin';
import PlanManager from './PlanManager';

export default async function AdminPlansPage() {
    const supabase = createAdminClient();

    const { data: plans, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) {
        return <div className="text-red-500">Error loading plans</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">요금제 관리</h1>
                <span className="text-sm text-gray-500">총 {plans?.length ?? 0}개</span>
            </div>

            <PlanManager initialPlans={plans || []} />
        </div>
    );
}
