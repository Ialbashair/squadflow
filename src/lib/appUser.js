import { base44 } from '@/api/base44Client';

/**
 * Get or create the AppUser record for the currently authenticated user.
 * Returns the AppUser entity record (with role, user_id, email, full_name).
 */
export async function getOrCreateAppUser() {
  const authUser = await base44.auth.me();
  if (!authUser) return null;

  const existing = await base44.entities.AppUser.filter({ user_id: authUser.id });
  if (existing.length > 0) return existing[0];

  // First time: create the AppUser record
  const created = await base44.entities.AppUser.create({
    user_id: authUser.id,
    email: authUser.email,
    full_name: authUser.full_name || '',
    role: 'user',
  });
  return created;
}