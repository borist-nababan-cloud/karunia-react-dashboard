/**
 * Role Constants mapping to database user_roles table
 * Do not change these IDs as they are tied to the database structure.
 */
export const ROLES = {
  ADMIN: 1,
  SUPERVISOR: 2,
  SALES: 3,
  CUSTOMER: 4,
  WEB_ADMIN: 5,
  CRM_STAFF: 6,
  UN_IDENTIFIED: 7,
  SUPER_USER: 8,
} as const;

export type RoleId = typeof ROLES[keyof typeof ROLES];

/**
 * Helper to check if a user has access to a specific feature.
 * @param userRoleId - The role ID from the current user session
 * @param allowedRoles - An array of allowed Role IDs
 */
export const hasAccess = (userRoleId: number | undefined, allowedRoles: RoleId[]): boolean => {
  if (!userRoleId) return false;
  return allowedRoles.includes(userRoleId as RoleId);
};

/**
 * Example usage for sidebar menus or component visibility:
 * 
 * if (hasAccess(user.role_id, [ROLES.ADMIN, ROLES.SUPER_USER])) {
 *    renderAdminMenu();
 * }
 */