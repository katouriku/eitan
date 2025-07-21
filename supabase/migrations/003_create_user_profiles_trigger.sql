-- Create a trigger to automatically create user_profiles record when a new user signs up
-- This ensures every authenticated user has a corresponding user_profiles record

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, user_id, email, full_name, full_name_kana, preferred_location, created_at, updated_at)
  values (
    new.id,
    new.id, -- Set user_id to the same value as id for now
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'full_name_kana', ''),
    coalesce(new.raw_user_meta_data->>'preferred_location', ''),
    now(),
    now()
  )
  on conflict (id) do nothing; -- Prevent duplicate entries if profile already exists
  
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Create trigger that fires when a new user is created in auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.user_profiles to anon, authenticated;
grant all on public.user_profiles to service_role;

-- Enable RLS on user_profiles table
alter table public.user_profiles enable row level security;

-- Create RLS policies to allow users to manage their own profiles
create policy "Users can view their own profile" on public.user_profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.user_profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on public.user_profiles
  for insert with check (auth.uid() = id);

-- Allow service role to bypass RLS (for admin operations)
create policy "Service role can manage all profiles" on public.user_profiles
  using (current_setting('role') = 'service_role');
