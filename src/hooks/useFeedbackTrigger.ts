import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useFeedbackTrigger() {
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [currentMilestone, setCurrentMilestone] = useState<number>(0);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const checkMilestones = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const userId = session.user.id;
            setCurrentUserId(userId);

            // 1. Get Promise Counts (Created + Completed)
            // Note: This is a rough 'action' count. 
            // 'promises' table: count where leader_id = me OR user_id = me?
            // "Actions" usually implies Created + Marked as Kept.
            // Let's count total promises involved in (Owner or Leader) for simplicity as 'actions'
            // Or strictly: Created (insert) + Updates (status change).
            // Simplest proxy: Count of promises *created* by user (as leader) + promises *assigned* to user.

            const { count: promisesCreated } = await supabase
                .from('promises')
                .select('*', { count: 'exact', head: true })
                .eq('leader_id', userId);

            // For actions done by user, maybe we check 'promises' where they are user_id too?
            // Let's sum them up.
            // Actually, querying all might be heavy. Let's just trust 'promisesCreated' as the main metric for now, 
            // or maybe 'promises' where user is involved.
            // Let's assume 'Promises Created' is the key metric for a Leader's tool use.

            // Wait, standard users?
            // Let's count 'promises' where (leader_id = me OR user_id = me).

            // To keep it efficient, we might need a better query or just check 'created' count for simplicity 
            // if we assume 'Leader' persona is primary "PRO" user.
            // Let's go with: Promises Created (Leader) + Promises Completed (User).

            // Let's just fetch count of promises table where leader_id = me.
            const totalActions = (promisesCreated || 0);
            // (Simulated count logic: checking promises is cheaper than tracking every click)

            // Milestones
            const milestones = [50, 100, 500];

            // Check if we hit a milestone (allowing for some buffer if we missed exact hit, e.g. >= 50 and < 60)
            // But we only want to show it ONCE.
            // So we check DB if feedback for this milestone exists.

            let hitMilestone = 0;
            // Reverse check to find highest hit
            for (const m of milestones.reverse()) {
                if (totalActions >= m) {
                    hitMilestone = m;
                    break;
                }
            }

            if (hitMilestone === 0) return;

            // 2. Check if already given feedback for this milestone
            const { data: existingFeedback } = await supabase
                .from('feedback' as any)
                .select('id')
                .eq('user_id', userId)
                .eq('milestone', hitMilestone)
                .single();

            if (!existingFeedback) {
                // Not given yet! Trigger modal.
                setCurrentMilestone(hitMilestone);
                setShowFeedbackModal(true);
            }
        };

        // Check on mount (or could trigger on specific actions)
        checkMilestones();

    }, []);

    const closeFeedback = () => setShowFeedbackModal(false);

    return {
        showFeedbackModal,
        setShowFeedbackModal: closeFeedback,
        currentMilestone,
        currentUserId
    };
}
