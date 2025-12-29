export type PromiseStatus = 'Open' | 'Closed' | 'Missed' | 'Pending Verification';

export interface PromysrPromise {
  id: string;
  leader_id: string; // The Creator
  promise_text: string;
  owner_name: string;
  owner_email: string; // The Executor
  due_date: string;
  status: PromiseStatus;
  created_at: string;
  updated_at: string;
  organization_id?: string; // Optional for now
}

export type PromiseRole = 'leader' | 'owner';

export type UserRole = 'admin' | 'member';

export interface Organization {
  id: string;
  name: string;
  subscription_plan: 'starter_999' | 'basic_999' | 'pro' | 'pro_1999' | 'ultimate_3999';
  billing_cycle: 'monthly' | 'yearly'; // 999 vs 10000
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'inactive';
  max_users: number; // default 10
  owner_id?: string;
  email_sender_name?: string;
  email_reply_to?: string;
  weekly_report_time?: string;
  daily_digest_time?: string;
  weekly_report_enabled?: boolean;
  daily_digest_enabled?: boolean;
  realtime_alerts_enabled?: boolean;
  timezone?: string;
  created_at: string;
}


export interface Profile {
  email: string;
  full_name: string;
}

export interface OrganizationMember {
  organization_id: string;
  user_id: string;
  role: UserRole;
  profile?: Profile;
}
