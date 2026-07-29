/**
 * Service-role repository factories.
 * Import from `@/repositories/admin` in Server Actions / route handlers only —
 * these bypass RLS.
 */
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NotificationRepository } from "@/repositories/notification.repository";

export function createAdminNotificationRepository(): NotificationRepository {
  return new NotificationRepository(createAdminSupabaseClient());
}
