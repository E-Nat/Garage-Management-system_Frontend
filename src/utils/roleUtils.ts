import { UserRole } from '../types';

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  owner: 'Owner',
  admin: 'Administrator',
  advisor: 'Service Advisor',
  staff: 'Service Advisor',
  mechanic: 'Mechanic',
  parts_manager: 'Parts Manager',
  customer: 'Customer',
};

/**
 * Returns a human-readable, professional role label for display across the UI.
 * e.g., 'owner' -> 'Owner', 'admin' -> 'Administrator', 'advisor' -> 'Service Advisor',
 * 'mechanic' -> 'Mechanic', 'parts_manager' -> 'Parts Manager', 'customer' -> 'Customer'
 */
export const getRoleDisplayName = (role?: UserRole | string | null): string => {
  if (!role) return 'Staff';
  const clean = role.toLowerCase().trim();
  return ROLE_DISPLAY_NAMES[clean] || clean.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};
