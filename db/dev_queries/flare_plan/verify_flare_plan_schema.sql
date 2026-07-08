select
  c.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name in (
    'flare_plans',
    'flare_plan_starter_templates',
    'flare_plan_actions',
    'flare_plan_runs',
    'flare_plan_run_actions',
    'flare_plan_run_checkpoints',
    'flare_plan_idempotency_keys'
  )
order by c.table_name, c.ordinal_position;

select
  rel.relname as table_name,
  con.conname as constraint_name,
  pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace nsp on nsp.oid = rel.relnamespace
where nsp.nspname = 'public'
  and rel.relname like 'flare_plan%'
order by rel.relname, con.conname;

select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename like 'flare_plan%'
order by tablename, indexname;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename like 'flare_plan%'
order by tablename, policyname;
