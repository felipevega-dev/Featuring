import { User } from '@supabase/auth-helpers-nextjs'

export function isAdmin(user: User | null): boolean {
  return user?.user_metadata?.is_super_admin === true
}