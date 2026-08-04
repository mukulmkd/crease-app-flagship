-- Public team logos bucket — Admin write under {team_id}/…; readable by anyone with the public URL.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-logos',
  'team-logos',
  true,
  1048576,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY team_logos_upload_admin
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'team-logos'
    AND public.app_is_team_admin(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY team_logos_update_admin
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'team-logos'
    AND public.app_is_team_admin(((storage.foldername(name))[1])::uuid)
  )
  WITH CHECK (
    bucket_id = 'team-logos'
    AND public.app_is_team_admin(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY team_logos_delete_admin
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'team-logos'
    AND public.app_is_team_admin(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY team_logos_select_public
  ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'team-logos');
