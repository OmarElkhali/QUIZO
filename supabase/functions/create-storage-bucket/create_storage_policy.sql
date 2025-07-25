
CREATE OR REPLACE FUNCTION create_storage_policy(bucket_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create policy to allow public read access
  EXECUTE format(
    'CREATE POLICY IF NOT EXISTS "Public Access" ON storage.objects
    FOR SELECT
    USING (bucket_id = %L)',
    bucket_name
  );

  -- Create policy to allow authenticated users to upload files
  EXECUTE format(
    'CREATE POLICY IF NOT EXISTS "Upload Access" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = %L)',
    bucket_name
  );

  -- Create policy to allow authenticated users to update their own files
  EXECUTE format(
    'CREATE POLICY IF NOT EXISTS "Update Access" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = %L AND auth.uid() = owner)',
    bucket_name
  );

  -- Create policy to allow authenticated users to delete their own files
  EXECUTE format(
    'CREATE POLICY IF NOT EXISTS "Delete Access" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = %L AND auth.uid() = owner)',
    bucket_name
  );
END;
$$;
