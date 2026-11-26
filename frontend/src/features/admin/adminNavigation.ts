/**
 * Lexilume — Admin Navigation Source of Truth
 *
 * The six primary destinations exposed in the learner-facing admin header,
 * plus the complete set of internal AdminWorkbench tabs. Both the router and
 * the AdminWorkbench use these definitions so the selected destination is
 * never duplicated between navigation layers.
 */

export const ADMIN_PRIMARY_DESTINATIONS = [
  { id: 'overview', label: 'Dashboard' },
  { id: 'content_studio', label: 'Content Library' },
  { id: 'content_import', label: 'Import Content' },
  { id: 'processing_studio', label: 'Processing Studio' },
  { id: 'review', label: 'Review & Publish' },
  { id: 'settings', label: 'Settings' },
] as const;

export type AdminPrimaryDestination = (typeof ADMIN_PRIMARY_DESTINATIONS)[number]['id'];

export const ADMIN_WORKBENCH_TABS = [
  'overview',
  'content_studio',
  'content_import',
  'processing_studio',
  'review',
  'settings',
  'users',
  'languages',
  'cefr_audit',
  'providers',
  'jobs',
  'duplicates',
  'datasets',
  'daily_content',
  'audit',
] as const;

export type AdminWorkbenchTab = (typeof ADMIN_WORKBENCH_TABS)[number];

export const DEFAULT_ADMIN_DESTINATION: AdminPrimaryDestination = 'overview';

const ADMIN_WORKBENCH_TAB_SET = new Set<string>(ADMIN_WORKBENCH_TABS);
const ADMIN_PRIMARY_DESTINATION_SET = new Set<string>(
  ADMIN_PRIMARY_DESTINATIONS.map(destination => destination.id)
);

export const isAdminWorkbenchTab = (value: string | null | undefined): value is AdminWorkbenchTab =>
  Boolean(value) && ADMIN_WORKBENCH_TAB_SET.has(value as string);

export const isAdminPrimaryDestination = (
  value: string | null | undefined
): value is AdminPrimaryDestination =>
  Boolean(value) && ADMIN_PRIMARY_DESTINATION_SET.has(value as string);
