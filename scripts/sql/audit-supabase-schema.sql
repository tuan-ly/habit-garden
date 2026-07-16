select jsonb_build_object(
  'tables', coalesce((
    select jsonb_object_agg(table_name, columns order by table_name)
    from (
      select
        table_name,
        jsonb_agg(column_name order by ordinal_position) as columns
      from information_schema.columns
      where table_schema = 'public'
      group by table_name
    ) table_columns
  ), '{}'::jsonb),
  'functions', coalesce((
    select jsonb_agg(
      p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')'
      order by p.proname, pg_get_function_identity_arguments(p.oid)
    )
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  ), '[]'::jsonb),
  'indexes', coalesce((
    select jsonb_agg(indexname order by indexname)
    from pg_indexes
    where schemaname = 'public'
  ), '[]'::jsonb),
  'triggers', coalesce((
    select jsonb_agg(trigger_name order by trigger_name)
    from information_schema.triggers
    where trigger_schema = 'public'
  ), '[]'::jsonb),
  'policies', coalesce((
    select jsonb_agg(tablename || ':' || policyname order by tablename, policyname)
    from pg_policies
    where schemaname = 'public'
  ), '[]'::jsonb),
  'constraints', coalesce((
    select jsonb_agg(
      c.relname || ':' || con.conname || ':' || pg_get_constraintdef(con.oid)
      order by c.relname, con.conname
    )
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
  ), '[]'::jsonb),
  'migrationVersions', coalesce((
    select jsonb_agg(version order by version)
    from supabase_migrations.schema_migrations
  ), '[]'::jsonb)
) as schema_audit;
