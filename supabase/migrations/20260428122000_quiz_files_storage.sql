-- Recreate the Storage bucket used by QUIZO file uploads on the new Supabase project.
-- The old dump contains the same bucket id: quiz-files.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'quiz-files',
  'quiz-files',
  true,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  updated_at = now();

drop policy if exists "quizo quiz files public read" on storage.objects;
drop policy if exists "quizo quiz files public upload" on storage.objects;
drop policy if exists "quizo quiz files public update" on storage.objects;
drop policy if exists "quizo quiz files public delete" on storage.objects;

create policy "quizo quiz files public read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'quiz-files');

create policy "quizo quiz files public upload"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'quiz-files');

create policy "quizo quiz files public update"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'quiz-files')
with check (bucket_id = 'quiz-files');

create policy "quizo quiz files public delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'quiz-files');
