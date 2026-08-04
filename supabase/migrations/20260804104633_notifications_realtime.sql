-- Deliver in-app alerts as they arrive while the PWA is open (no polling).
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
