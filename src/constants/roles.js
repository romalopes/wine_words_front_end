export const ROLES = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  REVIEWER: "Reviewer",
  READER: "Reader",
  GUEST: "Guest",
};

// Roles allowed to manage wines & producers (anywhere a Reviewer is
// allowed, an Editor is allowed too).
const WINE_MANAGER_ROLES = [ROLES.ADMIN, ROLES.EDITOR];

export function canManageWinesRole(user) {
  return user?.roles.some((role) => WINE_MANAGER_ROLES.includes(role)) ?? false;
}

/**
 * Alias for content-management permission (Admin / Editor / Reviewer):
 * creating articles, reviews, producers, vintages; publishing; seeing
 * draft/management filters.
 */
export const isContentManager = canManageWinesRole;

export function isAdmin(user) {
  return user?.roles.some((role) => role === ROLES.ADMIN) ?? false;
}

export function canManageGrapes(user) {
  return user?.roles.some((role) => role === ROLES.ADMIN || role === ROLES.EDITOR) ?? false;
}