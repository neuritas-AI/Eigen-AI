-- Supabase SQL Editor: create the tables used by the app

create table if not exists public."User" (
  id text primary key,
  email text not null unique,
  "passwordHash" text not null,
  role text not null default 'USER',
  plan text not null default 'FREE',
  "createdAt" timestamptz not null default now()
);

create table if not exists public."Usage" (
  id text primary key,
  "userId" text not null references public."User"(id) on delete cascade,
  "requestCount" integer not null default 0,
  month text not null,
  "tokensUsed" integer not null default 0,
  "createdAt" timestamptz not null default now(),
  unique ("userId", month)
);

create table if not exists public."Conversation" (
  id text primary key,
  "userId" text not null references public."User"(id) on delete cascade,
  messages text not null,
  "createdAt" timestamptz not null default now()
);

-- Optional: add a demo user (replace password hash with your own if needed)
-- You can generate a hash locally with bcryptjs or use the app's password change flow.
