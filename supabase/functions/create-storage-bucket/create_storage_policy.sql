CREATE OR REPLACE FUNCTION create_storage_policy(bucket_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS "quizo %s public read" ON storage.objects', bucket_name);
  EXECUTE format('DROP POLICY IF EXISTS "quizo %s public upload" ON storage.objects', bucket_name);
  EXECUTE format('DROP POLICY IF EXISTS "quizo %s public update" ON storage.objects', bucket_name);

  EXECUTE format(
    'CREATE POLICY "quizo %s public read" ON storage.objects
     FOR SELECT TO anon, authenticated
     USING (bucket_id = %L)',
    bucket_name,
    bucket_name
  );

  EXECUTE format(
    'CREATE POLICY "quizo %s public upload" ON storage.objects
     FOR INSERT TO anon, authenticated
     WITH CHECK (bucket_id = %L)',
    bucket_name,
    bucket_name
  );

  EXECUTE format(
    'CREATE POLICY "quizo %s public update" ON storage.objects
     FOR UPDATE TO anon, authenticated
     USING (bucket_id = %L)
     WITH CHECK (bucket_id = %L)',
    bucket_name,
    bucket_name,
    bucket_name
  );
END;
$$;
