export const ROLES = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  REVIEWER: "Reviewer",
  READER: "Reader",
  GUEST: "Guest",
};

// Roles allowed to manage wines & producers. A Reviewer authenticates the
// wines we review, so they are content managers: anywhere a Reviewer is
// allowed, an Editor is allowed too.
const WINE_MANAGER_ROLES = [ROLES.ADMIN, ROLES.EDITOR, ROLES.REVIEWER];

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
  return canManageWinesRole(user);
}

// Catalogue managers (Admin/Editor) see and manage EVERY package; a Reviewer
// only ever manages the packages they are responsible for — the backend
// enforces that, this only gates the UI.
export function canManageAllPackages(user) {
  return user?.roles.some((role) => role === ROLES.ADMIN || role === ROLES.EDITOR) ?? false;
}

// Wine packages (receiving wines and reviewing them) are visible to content
// managers: the person who physically opens the box is exactly who needs to
// record it. Reviewers only ever manage the packages they are responsible
// for — the backend enforces that, this only gates the UI.
export function canAccessPackages(user) {
  return canManageWinesRole(user);
}

// Whether the user may record a brand-new package (any package role).
export const canCreatePackage = canAccessPackages;