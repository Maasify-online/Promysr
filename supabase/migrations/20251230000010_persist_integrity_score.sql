-- Add integrity_score column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS integrity_score INTEGER DEFAULT 0;

-- Function to calculate score
CREATE OR REPLACE FUNCTION public.calculate_user_integrity_score(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    target_email TEXT;
    closed_count INTEGER;
    missed_count INTEGER;
    total_count INTEGER;
    new_score INTEGER;
BEGIN
    -- Get User Email
    SELECT email INTO target_email FROM public.profiles WHERE id = target_user_id;

    -- If no email found, exit
    IF target_email IS NULL THEN
        RETURN 0;
    END IF;

    -- Count Closed promises (Kept)
    SELECT COUNT(*) INTO closed_count
    FROM public.promises
    WHERE owner_email = target_email AND status = 'Closed';

    -- Count Missed promises
    SELECT COUNT(*) INTO missed_count
    FROM public.promises
    WHERE owner_email = target_email AND status = 'Missed';

    total_count := closed_count + missed_count;

    -- Calculate Score
    IF total_count > 0 THEN
        new_score := ROUND((closed_count::NUMERIC / total_count::NUMERIC) * 100);
    ELSE
        new_score := 100;
    END IF;

    -- Update Profile
    UPDATE public.profiles
    SET integrity_score = new_score
    WHERE id = target_user_id;

    RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Function
CREATE OR REPLACE FUNCTION public.trigger_update_integrity_score()
RETURNS TRIGGER AS $$
    -- Recalculate based on OWNER EMAIL
    DECLARE
        target_uid UUID;
    BEGIN
        IF (TG_OP = 'DELETE') THEN
            SELECT id INTO target_uid FROM public.profiles WHERE email = OLD.owner_email;
        ELSE
            SELECT id INTO target_uid FROM public.profiles WHERE email = NEW.owner_email;
        END IF;

        IF target_uid IS NOT NULL THEN
             PERFORM public.calculate_user_integrity_score(target_uid);
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
    FOR r IN SELECT id as user_id FROM public.profiles LOOP
        PERFORM public.calculate_user_integrity_score(r.user_id);
    END LOOP;
END;
$$;
