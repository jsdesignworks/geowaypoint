/**
 * Shared domain constants — spec terminology only (resorts, maps, sites, ownerrez, embed, webhooks, analytics).
 * Expand per section as needed; do not rename spec fields here.
 */

/** Plan values from spec §1 / §16 matrix */
export const PLAN_STARTER = 'starter' as const;
export const PLAN_TRIAL = 'trial' as const;
export const PLAN_GROWTH = 'growth' as const;
export const PLAN_PRO = 'pro' as const;
export const PLAN_RESORT = 'resort' as const;
export const PLAN_ENTERPRISE = 'enterprise' as const;

export type PlanName =
  | typeof PLAN_STARTER
  | typeof PLAN_TRIAL
  | typeof PLAN_GROWTH
  | typeof PLAN_PRO
  | typeof PLAN_RESORT
  | typeof PLAN_ENTERPRISE;

/** Site status — spec §4 sites.status */
export const SITE_STATUS_AVAILABLE = 'available' as const;
export const SITE_STATUS_OCCUPIED = 'occupied' as const;
export const SITE_STATUS_RESERVED = 'reserved' as const;
export const SITE_STATUS_MAINTENANCE = 'maintenance' as const;

export type SiteStatus =
  | typeof SITE_STATUS_AVAILABLE
  | typeof SITE_STATUS_OCCUPIED
  | typeof SITE_STATUS_RESERVED
  | typeof SITE_STATUS_MAINTENANCE;

/** Team role — spec §4 team_members.role */
export const TEAM_ROLE_VIEWER = 'viewer' as const;
export const TEAM_ROLE_EDITOR = 'editor' as const;
export const TEAM_ROLE_ADMIN = 'admin' as const;

export type TeamRole = typeof TEAM_ROLE_VIEWER | typeof TEAM_ROLE_EDITOR | typeof TEAM_ROLE_ADMIN;

/** Analytics event names — spec §10 embed payload */
export const ANALYTICS_EVENT_MAP_VIEW = 'map_view' as const;
export const ANALYTICS_EVENT_MARKER_CLICK = 'marker_click' as const;
export const ANALYTICS_EVENT_BOOK_CLICK = 'book_click' as const;

export type AnalyticsEventName =
  | typeof ANALYTICS_EVENT_MAP_VIEW
  | typeof ANALYTICS_EVENT_MARKER_CLICK
  | typeof ANALYTICS_EVENT_BOOK_CLICK;
