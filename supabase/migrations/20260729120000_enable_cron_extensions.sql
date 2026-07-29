-- Enable extensions used for scheduled Edge Function invokes.
-- Actual cron.schedule HTTP posts should be configured after deploy
-- (Dashboard Cron or vault-backed settings) with CRON_SECRET.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

COMMENT ON EXTENSION pg_cron IS
  'Crease jobs: freeze-polls @18:00 IST, carpool-assignment-reminders @14:00 IST, strength-reminders 12:00/21:00 IST, weekend-settlement Sun 19:00 IST';
