-- Add integrity_score column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS integrity_score INTEGER DEFAULT 0;

-- Function to calculate score
CREATE OR REPLACE FUNCTION public.calculate_user_integrity_score(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    closed_count INTEGER;
    missed_count INTEGER;
    total_count INTEGER;
    new_score INTEGER;
BEGIN
    -- Count Closed promises (Kept)
    SELECT COUNT(*) INTO closed_count
    FROM public.promises
    WHERE user_id = target_user_id AND status = 'Closed';

    -- Count Missed promises
    SELECT COUNT(*) INTO missed_count
    FROM public.promises
    WHERE user_id = target_user_id AND status = 'Missed';

    total_count := closed_count + missed_count;

    -- Calculate Score
    IF total_count > 0 THEN
        new_score := ROUND((closed_count::NUMERIC / total_count::NUMERIC) * 100);
    ELSE
        -- Default to 100 or 0? 
        -- Front end used 100 for new users usually (innocent until proven guilty)
        -- But logic says 0 completed. Let's stick to 100 for "Potential".
        new_score := 100;
    END IF;

    -- Update Profile
    UPDATE public.profiles
    SET integrity_score = new_score
    WHERE user_id = target_user_id;

    RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Function
CREATE OR REPLACE FUNCTION public.trigger_update_integrity_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate for the user who owns the promise
    -- NEW.user_id for inserts/updates
    -- OLD.user_id for deletes (if applicable)
    
    IF (TG_OP = 'DELETE') THEN
        PERFORM public.calculate_user_integrity_score(OLD.user_id);
    ELSE
        PERFORM public.calculate_user_integrity_score(NEW.user_id);
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger on Promises
DROP TRIGGER IF EXISTS update_integrity_score_on_change ON public.promises;
CREATE TRIGGER update_integrity_score_on_change
AFTER INSERT OR UPDATE OR DELETE ON public.promises
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_integrity_score();

-- Backfill: Calculate for all existing users
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT user_id FROM public.profiles LOOP
        PERFORM public.calculate_user_integrity_score(r.user_id);
    END LOOP;
END;
$$;
