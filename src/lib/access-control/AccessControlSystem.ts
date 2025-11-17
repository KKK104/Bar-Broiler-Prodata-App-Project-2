/**
 * Advanced Access Control System for Broiler Farm Management
 * Combines hierarchical levels, roles, and contextual permissions
 */

// ===== ACCESS LEVELS =====
export enum AccessLevel {
  LEVEL_1_VIEWER = 1,      // Can only view basic data
  LEVEL_2_RECORDER = 2,    // Can record daily data
  LEVEL_3_ANALYST = 3,     // Can generate reports and analytics
  LEVEL_4_MANAGER = 4,     // Can manage buildings and participants
  LEVEL_5_ADMIN = 5        // Full access to everything
}

// ===== ROLES =====
export enum Role {
  FARM_WORKER = 'farm_worker',
  PRODUCTION_SUPERVISOR = 'production_supervisor',
  FEED_MANAGER = 'feed_manager',
  HARVEST_COORDINATOR = 'harvest_coordinator',
  BUILDING_MANAGER = 'building_manager',
  FARM_ANALYST = 'farm_analyst',
  FARM_OWNER = 'farm_owner'
}

// ===== PERMISSIONS =====
export enum Permission {
  // Viewing permissions
  VIEW_DASHBOARD = 'view_dashboard',
  VIEW_DAILY_RECORDS = 'view_daily_records',
  VIEW_PRODUCTION_DATA = 'view_production_data',
  VIEW_MORTALITY_DATA = 'view_mortality_data',
  VIEW_FEED_DATA = 'view_feed_data',
  VIEW_HARVEST_DATA = 'view_harvest_data',
  VIEW_ANALYTICS = 'view_analytics',
  VIEW_FINANCIAL_DATA = 'view_financial_data',
  
  // Input permissions
  INPUT_DAILY_RECORDS = 'input_daily_records',
  INPUT_PRODUCTION_DATA = 'input_production_data',
  INPUT_MORTALITY_DATA = 'input_mortality_data',
  INPUT_FEED_DATA = 'input_feed_data',
  INPUT_HARVEST_DATA = 'input_harvest_data',
  
  // Edit permissions
  EDIT_DAILY_RECORDS = 'edit_daily_records',
  EDIT_PRODUCTION_DATA = 'edit_production_data',
  EDIT_HISTORICAL_DATA = 'edit_historical_data',
  
  // Management permissions
  MANAGE_BUILDINGS = 'manage_buildings',
  MANAGE_PARTICIPANTS = 'manage_participants',
  MANAGE_CYCLES = 'manage_cycles',
  
  // Advanced permissions
  EXPORT_DATA = 'export_data',
  GENERATE_REPORTS = 'generate_reports',
  ACCESS_API = 'access_api',
  SYSTEM_ADMIN = 'system_admin'
}

// ===== RESOURCE TYPES =====
export enum ResourceType {
  DASHBOARD = 'dashboard',
  DAILY_RECORD = 'daily_record',
  BUILDING = 'building',
  PARTICIPANT = 'participant',
  HARVEST_DATA = 'harvest_data',
  FINANCIAL_DATA = 'financial_data',
  ANALYTICS = 'analytics',
  SYSTEM_SETTINGS = 'system_settings'
}

// ===== ACCESS CONTEXT =====
export interface AccessContext {
  user: {
    id: string
    level: AccessLevel
    role: Role
    farmId: string
    buildingIds?: string[]  // Specific buildings user can access
    experience: number      // Years of experience
    certifications: string[]
  }
  resource: {
    type: ResourceType
    id?: string
    buildingId?: string
    sensitivity: 'public' | 'internal' | 'confidential'
    ownerId?: string
  }
  environment: {
    timestamp: Date
    location?: string
    deviceType: 'mobile' | 'desktop' | 'tablet'
    isWorkingHours: boolean
  }
  action: {
    type: 'read' | 'write' | 'delete' | 'export'
    isBulk?: boolean
  }
}

// ===== ROLE DEFINITIONS =====
export const RoleDefinitions: Record<Role, {
  name: string
  description: string
  minLevel: AccessLevel
  permissions: Permission[]
  restrictions?: string[]
}> = {
  [Role.FARM_WORKER]: {
    name: 'Farm Worker',
    description: 'Basic production worker with input responsibilities',
    minLevel: AccessLevel.LEVEL_2_RECORDER,
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.VIEW_DAILY_RECORDS,
      Permission.VIEW_PRODUCTION_DATA,
      Permission.INPUT_DAILY_RECORDS,
      Permission.INPUT_PRODUCTION_DATA,
      Permission.INPUT_MORTALITY_DATA
    ],
    restrictions: ['working_hours_only', 'own_buildings_only']
  },
  
  [Role.PRODUCTION_SUPERVISOR]: {
    name: 'Production Supervisor',
    description: 'Supervises production activities and data quality',
    minLevel: AccessLevel.LEVEL_3_ANALYST,
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.VIEW_DAILY_RECORDS,
      Permission.VIEW_PRODUCTION_DATA,
      Permission.VIEW_MORTALITY_DATA,
      Permission.VIEW_ANALYTICS,
      Permission.INPUT_DAILY_RECORDS,
      Permission.INPUT_PRODUCTION_DATA,
      Permission.INPUT_MORTALITY_DATA,
      Permission.EDIT_DAILY_RECORDS,
      Permission.EDIT_PRODUCTION_DATA,
      Permission.GENERATE_REPORTS
    ]
  },
  
  [Role.FEED_MANAGER]: {
    name: 'Feed Manager',
    description: 'Manages feed inventory and nutrition programs',
    minLevel: AccessLevel.LEVEL_3_ANALYST,
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.VIEW_DAILY_RECORDS,
      Permission.VIEW_FEED_DATA,
      Permission.VIEW_ANALYTICS,
      Permission.INPUT_FEED_DATA,
      Permission.EDIT_DAILY_RECORDS,
      Permission.GENERATE_REPORTS
    ]
  },
  
  [Role.HARVEST_COORDINATOR]: {
    name: 'Harvest Coordinator',
    description: 'Manages harvest operations and buyer relationships',
    minLevel: AccessLevel.LEVEL_3_ANALYST,
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.VIEW_HARVEST_DATA,
      Permission.VIEW_PRODUCTION_DATA,
      Permission.VIEW_ANALYTICS,
      Permission.INPUT_HARVEST_DATA,
      Permission.GENERATE_REPORTS,
      Permission.EXPORT_DATA
    ]
  },
  
  [Role.BUILDING_MANAGER]: {
    name: 'Building Manager',
    description: 'Manages building operations and maintenance',
    minLevel: AccessLevel.LEVEL_4_MANAGER,
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.VIEW_DAILY_RECORDS,
      Permission.VIEW_PRODUCTION_DATA,
      Permission.VIEW_ANALYTICS,
      Permission.MANAGE_BUILDINGS,
      Permission.MANAGE_CYCLES,
      Permission.GENERATE_REPORTS,
      Permission.EXPORT_DATA
    ]
  },
  
  [Role.FARM_ANALYST]: {
    name: 'Farm Analyst',
    description: 'Analyzes farm performance and generates insights',
    minLevel: AccessLevel.LEVEL_3_ANALYST,
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.VIEW_DAILY_RECORDS,
      Permission.VIEW_PRODUCTION_DATA,
      Permission.VIEW_MORTALITY_DATA,
      Permission.VIEW_FEED_DATA,
      Permission.VIEW_HARVEST_DATA,
      Permission.VIEW_ANALYTICS,
      Permission.VIEW_FINANCIAL_DATA,
      Permission.GENERATE_REPORTS,
      Permission.EXPORT_DATA,
      Permission.ACCESS_API
    ]
  },
  
  [Role.FARM_OWNER]: {
    name: 'Farm Owner',
    description: 'Full access to all farm operations and data',
    minLevel: AccessLevel.LEVEL_5_ADMIN,
    permissions: Object.values(Permission)  // All permissions
  }
}

// ===== ACCESS CONTROL ENGINE =====
export class AccessControlEngine {
  
  /**
   * Check if user has permission for a specific action
   */
  static hasPermission(context: AccessContext, requiredPermission: Permission): boolean {
    const { user, resource, environment, action } = context
    
    // 1. Check basic level requirements
    const roleDefinition = RoleDefinitions[user.role]
    if (user.level < roleDefinition.minLevel) {
      return false
    }
    
    // 2. Check if role has the required permission
    if (!roleDefinition.permissions.includes(requiredPermission)) {
      return false
    }
    
    // 3. Apply contextual restrictions
    return this.checkContextualRestrictions(context, requiredPermission)
  }
  
  /**
   * Get all permissions for a user
   */
  static getUserPermissions(user: AccessContext['user']): Permission[] {
    const roleDefinition = RoleDefinitions[user.role]
    
    // Level-based inheritance
    const levelPermissions = this.getLevelPermissions(user.level)
    
    // Combine role permissions with level permissions
    const allPermissions = Array.from(new Set([
      ...levelPermissions,
      ...roleDefinition.permissions
    ]))
    
    return allPermissions
  }
  
  /**
   * Get permissions based on access level (inheritance)
   */
  private static getLevelPermissions(level: AccessLevel): Permission[] {
    const levelPermissions: Record<AccessLevel, Permission[]> = {
      [AccessLevel.LEVEL_1_VIEWER]: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_DAILY_RECORDS,
        Permission.VIEW_PRODUCTION_DATA
      ],
      [AccessLevel.LEVEL_2_RECORDER]: [
        Permission.INPUT_DAILY_RECORDS,
        Permission.INPUT_PRODUCTION_DATA,
        Permission.INPUT_MORTALITY_DATA
      ],
      [AccessLevel.LEVEL_3_ANALYST]: [
        Permission.VIEW_ANALYTICS,
        Permission.VIEW_FINANCIAL_DATA,
        Permission.GENERATE_REPORTS,
        Permission.EXPORT_DATA
      ],
      [AccessLevel.LEVEL_4_MANAGER]: [
        Permission.MANAGE_BUILDINGS,
        Permission.MANAGE_PARTICIPANTS,
        Permission.MANAGE_CYCLES,
        Permission.EDIT_HISTORICAL_DATA
      ],
      [AccessLevel.LEVEL_5_ADMIN]: [
        Permission.SYSTEM_ADMIN,
        Permission.ACCESS_API
      ]
    }
    
    // Inherit permissions from lower levels
    let permissions: Permission[] = []
    for (let i = 1; i <= level; i++) {
      permissions.push(...(levelPermissions[i as AccessLevel] || []))
    }
    
    return permissions
  }
  
  /**
   * Check contextual restrictions
   */
  private static checkContextualRestrictions(
    context: AccessContext, 
    permission: Permission
  ): boolean {
    const { user, resource, environment, action } = context
    const roleDefinition = RoleDefinitions[user.role]
    
    // Working hours restriction
    if (roleDefinition.restrictions?.includes('working_hours_only')) {
      if (!environment.isWorkingHours && !this.isEmergencyAccess(permission)) {
        return false
      }
    }
    
    // Building-specific access
    if (roleDefinition.restrictions?.includes('own_buildings_only')) {
      if (resource.buildingId && user.buildingIds && 
          !user.buildingIds.includes(resource.buildingId)) {
        return false
      }
    }
    
    // Sensitive data restrictions
    if (resource.sensitivity === 'confidential' && user.level < AccessLevel.LEVEL_4_MANAGER) {
      return false
    }
    
    // Bulk operation restrictions
    if (action.isBulk && user.level < AccessLevel.LEVEL_3_ANALYST) {
      return false
    }
    
    return true
  }
  
  /**
   * Check if this is emergency access
   */
  private static isEmergencyAccess(permission: Permission): boolean {
    const emergencyPermissions = [
      Permission.VIEW_DASHBOARD,
      Permission.VIEW_MORTALITY_DATA,
      Permission.INPUT_MORTALITY_DATA
    ]
    
    return emergencyPermissions.includes(permission)
  }
  
  /**
   * Get user's accessible resources
   */
  static getAccessibleResources(
    user: AccessContext['user'], 
    resourceType: ResourceType
  ): string[] {
    // Implementation would query database based on user's permissions
    // This is a simplified example
    switch (resourceType) {
      case ResourceType.BUILDING:
        return user.buildingIds || []
      default:
        return []
    }
  }
}

// ===== PERMISSION CHECKER HOOK =====
export function usePermissions(user: AccessContext['user']) {
  const hasPermission = (
    permission: Permission,
    resource?: Partial<AccessContext['resource']>,
    action?: Partial<AccessContext['action']>
  ): boolean => {
    const context: AccessContext = {
      user,
      resource: {
        type: ResourceType.DASHBOARD,
        sensitivity: 'internal',
        ...resource
      },
      environment: {
        timestamp: new Date(),
        deviceType: 'desktop',
        isWorkingHours: true  // This would be calculated
      },
      action: {
        type: 'read',
        ...action
      }
    }
    
    return AccessControlEngine.hasPermission(context, permission)
  }
  
  const getUserPermissions = () => {
    return AccessControlEngine.getUserPermissions(user)
  }
  
  return {
    hasPermission,
    getUserPermissions,
    canView: (resource: ResourceType) => hasPermission(Permission.VIEW_DASHBOARD, { type: resource }),
    canEdit: (resource: ResourceType) => hasPermission(Permission.EDIT_DAILY_RECORDS, { type: resource }),
    canManage: (resource: ResourceType) => hasPermission(Permission.MANAGE_BUILDINGS, { type: resource })
  }
}

