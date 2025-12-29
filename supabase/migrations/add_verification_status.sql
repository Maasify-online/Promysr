-- Add Pending Verification to status check constraint
alter table public.promises drop constraint if exists promises_status_check;
alter table public.promises add constraint promises_status_check 
    check (status in ('Open', 'Closed', 'Missed', 'Pending Verification'));
