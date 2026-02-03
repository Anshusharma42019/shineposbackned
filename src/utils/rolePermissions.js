// Role-based access control configuration for backend
const ROLES = {
  RESTAURANT_ADMIN: 'RESTAURANT_ADMIN',
  MANAGER: 'MANAGER',
  CHEF: 'CHEF',
  WAITER: 'WAITER',
  CASHIER: 'CASHIER'
};

// Define role permissions for different operations
const rolePermissions = {
  // Dashboard access
  dashboard: [ROLES.RESTAURANT_ADMIN, ROLES.MANAGER, ROLES.CHEF, ROLES.WAITER, ROLES.CASHIER],
  
  // Order management
  orders: {
    view: [ROLES.RESTAURANT_ADMIN, ROLES.MANAGER, ROLES.CHEF, ROLES.WAITER, ROLES.CASHIER],
    create: [ROLES.RESTAURANT_ADMIN, ROLES.MANAGER, ROLES.WAITER],
    update: [ROLES.RESTAURANT_ADMIN, ROLES.MANAGER, ROLES.WAITER, ROLES.CASHIER],
    delete: [ROLES.RESTAURANT_ADMIN, ROLES.MANAGER]
  },
  
  // Kitchen/KOT
  kot: {
    view: [ROLES.RESTAURANT_ADMIN, ROLES.MANAGER, ROLES.CHEF],
    update: [ROLES.RESTAURANT_ADMIN, ROLES.MANAGER, ROLES.CHEF]
  },
  
  // Tables
  tables: {
    view: [ROLES.RESTAURANT_ADMIN, ROLES.MANAGER, ROLES.WAITER],
    manage: [ROLES.RESTAURANT_ADMIN, ROLES.MANAGER]
  },
  
  // Menu management
  menu: {
    view: [ROLES.RESTAURANT_ADMIN, ROLES.MANAGER],
    manage: [ROLES.RESTAURANT_ADMIN, ROLES.MANAGER]
  },
  
  // Inventory
  inventory: {
    view: [ROLES.RESTAURANT_ADMIN, ROLES.MANAGER, ROLES.CHEF],
    manage: [ROLES.RESTAURANT_ADMIN, ROLES.MANAGER]
  },
  
  // Staff management
  staff: {
    view: [ROLES.RESTAURANT_ADMIN, ROLES.MANAGER],
    manage: [ROLES.RESTAURANT_ADMIN]
  },
  
  // Attendance
  attendance: {
    viewOwn: [ROLES.RESTAURANT_ADMIN, ROLES.MANAGER, ROLES.CHEF, ROLES.WAITER, ROLES.CASHIER],
    viewAll: [ROLES.RESTAURANT_ADMIN, ROLES.MANAGER],
    manage: [ROLES.RESTAURANT_ADMIN, ROLES.MANAGER]
  },
  
  // Analytics
  analytics: [ROLES.RESTAURANT_ADMIN, ROLES.MANAGER],
  
  // Subscription
  subscription: [ROLES.RESTAURANT_ADMIN],
  
  // Settings
  settings: [ROLES.RESTAURANT_ADMIN]
};

module.exports = { ROLES, rolePermissions };
