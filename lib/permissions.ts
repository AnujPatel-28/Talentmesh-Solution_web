export type Role = 'admin' | 'super_admin' | 'recruiter' | 'candidate';
export type Resource = 
  | 'dashboard' 
  | 'jobs' 
  | 'candidates' 
  | 'recruiters' 
  | 'reports' 
  | 'settings' 
  | 'audit_logs' 
  | 'billing' 
  | 'team';
export type Action = 'view' | 'edit' | 'delete' | 'approve' | 'export';

const PERMISSION_MATRIX: Record<Role, Partial<Record<Resource, Action[]>>> = {
  super_admin: {
    dashboard: ['view', 'edit', 'delete', 'approve', 'export'],
    jobs: ['view', 'edit', 'delete', 'approve', 'export'],
    candidates: ['view', 'edit', 'delete', 'approve', 'export'],
    recruiters: ['view', 'edit', 'delete', 'approve', 'export'],
    reports: ['view', 'edit', 'delete', 'approve', 'export'],
    settings: ['view', 'edit', 'delete', 'approve', 'export'],
    audit_logs: ['view', 'edit', 'delete', 'approve', 'export'],
    billing: ['view', 'edit', 'delete', 'approve', 'export'],
    team: ['view', 'edit', 'delete', 'approve', 'export'],
  },
  admin: {
    dashboard: ['view'],
    jobs: ['view', 'edit', 'delete', 'approve'],
    candidates: ['view', 'edit', 'delete', 'approve'],
    recruiters: ['view', 'edit', 'delete', 'approve'],
    reports: ['view', 'export'],
    settings: ['view', 'edit'],
    audit_logs: ['view', 'export'],
    billing: ['view'],
    team: ['view', 'edit'],
  },
  recruiter: {
    dashboard: ['view'],
    jobs: ['view', 'edit'], // Server side will enforce own jobs only
    reports: ['view'],
    settings: ['view', 'edit'],
  },
  candidate: {
    dashboard: ['view'],
    jobs: ['view'],
    settings: ['view', 'edit'],
  }
};

/**
 * Checks if a role has access to a specific resource (implied by view permission).
 */
export function canAccess(role: Role, resource: Resource): boolean {
  const actions = PERMISSION_MATRIX[role]?.[resource];
  return !!actions && actions.includes('view');
}

/**
 * Checks if a role can edit/write to a resource.
 */
export function canEdit(role: Role, resource: Resource): boolean {
  const actions = PERMISSION_MATRIX[role]?.[resource];
  return !!actions && actions.includes('edit');
}

/**
 * Checks if a role can delete items in a resource.
 */
export function canDelete(role: Role, resource: Resource): boolean {
  const actions = PERMISSION_MATRIX[role]?.[resource];
  return !!actions && actions.includes('delete');
}

/**
 * Enforces action level granularity on a resource.
 */
export function canPerform(role: Role, resource: Resource, action: Action): boolean {
  const actions = PERMISSION_MATRIX[role]?.[resource];
  return !!actions && actions.includes(action);
}
