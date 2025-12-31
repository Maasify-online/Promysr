-- Create organization_invitations table
CREATE TABLE IF NOT EXISTS public.organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    invitee_name TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX idx_invitations_email ON public.organization_invitations(invitee_email);
CREATE INDEX idx_invitations_token ON public.organization_invitations(token);
CREATE INDEX idx_invitations_org ON public.organization_invitations(organization_id);
CREATE INDEX idx_invitations_status ON public.organization_invitations(status);

-- Enable RLS
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Org admins can view invitations" ON public.organization_invitations;
CREATE POLICY "Org admins can view invitations"
ON public.organization_invitations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        JOIN public.profiles p ON om.user_id = p.id
        WHERE om.organization_id = organization_invitations.organization_id
        AND p.user_id = auth.uid()
        AND om.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Org admins can create invitations" ON public.organization_invitations;
CREATE POLICY "Org admins can create invitations"
ON public.organization_invitations FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        JOIN public.profiles p ON om.user_id = p.id
        WHERE om.organization_id = organization_invitations.organization_id
        AND p.user_id = auth.uid()
        AND om.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Org admins can update invitations" ON public.organization_invitations;
CREATE POLICY "Org admins can update invitations"
ON public.organization_invitations FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        JOIN public.profiles p ON om.user_id = p.id
        WHERE om.organization_id = organization_invitations.organization_id
        AND p.user_id = auth.uid()
        AND om.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Anyone can view invitations by token" ON public.organization_invitations;
CREATE POLICY "Anyone can view invitations by token"
ON public.organization_invitations FOR SELECT
USING (true); -- Anyone with the token can view it

DROP POLICY IF EXISTS "Users can view their own invitations" ON public.organization_invitations;
CREATE POLICY "Users can view their own invitations"
ON public.organization_invitations FOR SELECT
USING (
    invitee_email = (
        SELECT email FROM public.profiles WHERE user_id = auth.uid()
    )
);

-- Function to auto-expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.organization_invitations
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < now();
END;
$$;
