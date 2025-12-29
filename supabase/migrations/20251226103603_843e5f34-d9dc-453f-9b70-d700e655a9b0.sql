-- Create profiles table for leaders
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  company_name TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create promises table
CREATE TABLE IF NOT EXISTS public.promises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  promise_text TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'negotiating', 'kept', 'broken')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on promises
ALTER TABLE public.promises ENABLE ROW LEVEL SECURITY;

-- Promises policies
DROP POLICY IF EXISTS "Leaders can view their own promises" ON public.promises;
CREATE POLICY "Leaders can view their own promises"
  ON public.promises FOR SELECT
  USING (leader_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Leaders can create promises" ON public.promises;
CREATE POLICY "Leaders can create promises"
  ON public.promises FOR INSERT
  WITH CHECK (leader_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Leaders can update their own promises" ON public.promises;
CREATE POLICY "Leaders can update their own promises"
  ON public.promises FOR UPDATE
  USING (leader_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Leaders can delete their own promises" ON public.promises;
CREATE POLICY "Leaders can delete their own promises"
  ON public.promises FOR DELETE
  USING (leader_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Create promise_responses table
CREATE TABLE IF NOT EXISTS public.promise_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promise_id UUID NOT NULL REFERENCES public.promises(id) ON DELETE CASCADE,
  response_type TEXT NOT NULL CHECK (response_type IN ('accepted', 'negotiate')),
  proposed_date DATE,
  message TEXT,
  responded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on promise_responses
ALTER TABLE public.promise_responses ENABLE ROW LEVEL SECURITY;

-- Promise responses policies (leaders can view responses to their promises)
DROP POLICY IF EXISTS "Leaders can view responses to their promises" ON public.promise_responses;
CREATE POLICY "Leaders can view responses to their promises"
  ON public.promise_responses FOR SELECT
  USING (promise_id IN (
    SELECT p.id FROM public.promises p
    JOIN public.profiles pr ON p.leader_id = pr.id
    WHERE pr.user_id = auth.uid()
  ));

-- Create emails_log table
CREATE TABLE IF NOT EXISTS public.emails_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promise_id UUID REFERENCES public.promises(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('handshake', 'reminder', 'digest', 'negotiation')),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed'))
);

-- Enable RLS on emails_log
ALTER TABLE public.emails_log ENABLE ROW LEVEL SECURITY;

-- Email log policies
DROP POLICY IF EXISTS "Leaders can view their email logs" ON public.emails_log;
CREATE POLICY "Leaders can view their email logs"
  ON public.emails_log FOR SELECT
  USING (promise_id IN (
    SELECT p.id FROM public.promises p
    JOIN public.profiles pr ON p.leader_id = pr.id
    WHERE pr.user_id = auth.uid()
  ));

-- Create waitlist table (public, no auth required)
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on waitlist but allow public inserts
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (user_id) DO NOTHING; -- Add safety check here too
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_promises_updated_at ON public.promises;
CREATE TRIGGER update_promises_updated_at
  BEFORE UPDATE ON public.promises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();