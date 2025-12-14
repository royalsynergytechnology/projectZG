-- Audit Log Table for tracking user activity
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone default now()
);

alter table public.activity_logs enable row level security;

-- create policy "Admins can view all logs"
--   on public.activity_logs for select
--   using (auth.uid() in (select id from public.profiles where role = 'admin'));

create policy "System can insert logs"
  on public.activity_logs for insert
  with check (true);

-- Function to prevent duplicate posts
create or replace function prevent_duplicate_posts()
returns trigger
language plpgsql
security definer
as $$
declare
  normalized_content text;
  recent_post_count int;
  similarity_threshold float := 0.9;
begin
  -- 1. Content Normalization
  -- Convert to lowercase, remove special characters, and collapse whitespace
  normalized_content := lower(regexp_replace(trim(NEW.content_text), '\s+', ' ', 'g'));
  
  -- 2. Strict Duplicate Detection (Time Window: 1 hour)
  -- Checks for identical normalized content from the same author
  if exists (
    select 1 from public.posts 
    where author_id = NEW.author_id 
    and lower(regexp_replace(trim(content_text), '\s+', ' ', 'g')) = normalized_content
    and created_at > now() - interval '1 hour'
  ) then
    raise exception 'Duplicate content detected: You have posted this content recently.';
  end if;

  -- 3. Velocity Check (Rate Limiting)
  -- Prevent users from posting too rapidly (e.g., > 10 posts in 5 minutes)
  select count(*) into recent_post_count
  from public.posts
  where author_id = NEW.author_id
  and created_at > now() - interval '5 minutes';

  if recent_post_count >= 10 then
    raise exception 'Rate limit exceeded: You are posting too frequently. Please wait a moment.';
  end if;

  return NEW;
end;
$$;

create trigger on_post_insert_check_duplicate
  before insert on public.posts
  for each row
  execute function prevent_duplicate_posts();

-- Function to clean up orphaned records (Maintenance Routine)
create or replace function cleanup_orphaned_records()
returns void
language plpgsql
security definer
as $$
declare
  rows_deleted int;
begin
  -- 1. Clean up old notifications (> 90 days) to maintain table performance
  delete from public.notifications 
  where created_at < now() - interval '90 days';
  get diagnostics rows_deleted = row_count;
  raise notice 'Cleaned up % old notifications', rows_deleted;

  -- 2. Clean up orphaned notifications (where referenced entities are gone)
  -- Although FKs usually handle this, this ensures integrity for soft-deletes or edge cases
  delete from public.notifications
  where (post_id is not null and not exists (select 1 from public.posts where id = post_id))
     or (message_id is not null and not exists (select 1 from public.messages where id = message_id));
  
  -- 3. Archive/Cleanup old audit logs (> 1 year)
  delete from public.activity_logs
  where created_at < now() - interval '1 year';
end;
$$;

-- Function to log user activities
create or replace function log_user_activity()
returns trigger
language plpgsql
security definer
as $$
declare
  payload jsonb;
begin
  -- Capture the row data as JSON (excluding sensitive fields if necessary)
  payload := row_to_json(NEW);
  
  -- Insert into audit log
  insert into public.activity_logs (
    user_id, 
    action, 
    entity_type, 
    entity_id, 
    metadata,
    ip_address,
    user_agent
  ) values (
    auth.uid(),
    TG_OP,                 
    TG_TABLE_NAME,        
    NEW.id,         
    payload,
    inet_client_addr(),   
    current_setting('request.headers', true)::json->>'user-agent' 
  );
  
  return NEW;
exception when others then
  -- Fail safe: Do not block main transaction if logging fails
  raise warning 'Failed to log user activity: %', SQLERRM;
  return NEW;
end;
$$;