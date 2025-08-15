/**
 * Firestore Security Rules Generator
 * This file contains the security rules for multi-tenant access control
 * Rules are designed for GDPR/HIPAA compliance and enterprise security
 */

export const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions for authentication and authorization
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserRoles() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles;
    }
    
    function hasPermission(permission) {
      return isAuthenticated() && 
             getUserRoles() != null &&
             getUserRoles().hasAny([permission]);
    }
    
    function isPlatformAdmin() {
      return hasPermission('platform_admin');
    }
    
    function belongsToOrganization(orgId) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organizationId == orgId;
    }
    
    function isResourceOwner(resourceUserId) {
      return isAuthenticated() && request.auth.uid == resourceUserId;
    }
    
    function isActiveUser() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isActive == true;
    }

    // Organizations collection
    match /organizations/{orgId} {
      allow read: if isActiveUser() && (
        isPlatformAdmin() || 
        belongsToOrganization(orgId) ||
        hasPermission('view_organizations')
      );
      
      allow create: if isActiveUser() && (
        isPlatformAdmin() ||
        hasPermission('create_organization')
      );
      
      allow update: if isActiveUser() && (
        isPlatformAdmin() || 
        (belongsToOrganization(orgId) && hasPermission('manage_organization'))
      );
      
      allow delete: if isPlatformAdmin();
      
      // Subsidiaries subcollection
      match /subsidiaries/{subsidId} {
        allow read, write: if isActiveUser() && (
          isPlatformAdmin() || 
          belongsToOrganization(orgId)
        );
      }
      
      // Organization analytics
      match /analytics/{analyticsId} {
        allow read: if isActiveUser() && (
          isPlatformAdmin() || 
          (belongsToOrganization(orgId) && hasPermission('view_analytics'))
        );
        allow write: if isPlatformAdmin();
      }
    }

    // Subsidiaries collection (global access)
    match /subsidiaries/{subsidId} {
      allow read: if isActiveUser() && (
        isPlatformAdmin() || 
        belongsToOrganization(resource.data.parentOrganizationId) ||
        belongsToOrganization(subsidId)
      );
      
      allow create, update: if isActiveUser() && (
        isPlatformAdmin() || 
        belongsToOrganization(resource.data.parentOrganizationId)
      );
      
      allow delete: if isPlatformAdmin() || 
        belongsToOrganization(resource.data.parentOrganizationId);
    }

    // Services collection
    match /services/{serviceId} {
      allow read: if isActiveUser() && (
        resource.data.isActive == true ||
        isPlatformAdmin() ||
        isResourceOwner(resource.data.providerId) ||
        (resource.data.organizationId != null && belongsToOrganization(resource.data.organizationId))
      );
      
      allow create: if isActiveUser() && (
        isPlatformAdmin() ||
        isResourceOwner(request.resource.data.providerId) ||
        hasPermission('create_service')
      );
      
      allow update: if isActiveUser() && (
        isPlatformAdmin() ||
        isResourceOwner(resource.data.providerId) ||
        (resource.data.organizationId != null && 
         belongsToOrganization(resource.data.organizationId) && 
         hasPermission('manage_services'))
      );
      
      allow delete: if isPlatformAdmin() || 
        isResourceOwner(resource.data.providerId);
    }

    // Providers collection
    match /providers/{providerId} {
      allow read: if isActiveUser() && (
        resource.data.status == 'active' ||
        isPlatformAdmin() ||
        isResourceOwner(providerId)
      );
      
      allow create: if isActiveUser() && (
        isPlatformAdmin() ||
        request.auth.uid == providerId
      );
      
      allow update: if isActiveUser() && (
        isPlatformAdmin() ||
        isResourceOwner(providerId)
      );
      
      allow delete: if isPlatformAdmin();
      
      // Provider portfolio
      match /portfolio/{portfolioId} {
        allow read, write: if isActiveUser() && (
          isPlatformAdmin() ||
          isResourceOwner(providerId)
        );
      }
    }

    // Projects collection
    match /projects/{projectId} {
      allow read: if isActiveUser() && (
        isPlatformAdmin() ||
        belongsToOrganization(resource.data.organizationId) ||
        (resource.data.visibility == 'public' && resource.data.status == 'published') ||
        (resource.data.assignedProvider != null && 
         isResourceOwner(resource.data.assignedProvider.providerId))
      );
      
      allow create: if isActiveUser() && (
        isPlatformAdmin() ||
        (belongsToOrganization(request.resource.data.organizationId) && 
         hasPermission('create_project'))
      );
      
      allow update: if isActiveUser() && (
        isPlatformAdmin() ||
        (belongsToOrganization(resource.data.organizationId) && hasPermission('edit_project')) ||
        (resource.data.assignedProvider != null && 
         isResourceOwner(resource.data.assignedProvider.providerId) &&
         request.resource.data.keys().hasOnly(['status', 'updatedAt']))
      );
      
      allow delete: if isPlatformAdmin() ||
        (belongsToOrganization(resource.data.organizationId) && hasPermission('delete_project'));
      
      // Project applications
      match /applications/{applicationId} {
        allow read: if isActiveUser() && (
          isPlatformAdmin() ||
          belongsToOrganization(get(/databases/$(database)/documents/projects/$(projectId)).data.organizationId) ||
          isResourceOwner(resource.data.providerId)
        );
        
        allow create: if isActiveUser() && 
          isResourceOwner(request.resource.data.providerId);
        
        allow update: if isActiveUser() && (
          isPlatformAdmin() ||
          belongsToOrganization(get(/databases/$(database)/documents/projects/$(projectId)).data.organizationId) ||
          isResourceOwner(resource.data.providerId)
        );
      }
    }

    // Bookings collection
    match /bookings/{bookingId} {
      allow read, write: if isActiveUser() && (
        isPlatformAdmin() ||
        belongsToOrganization(resource.data.organizationId) ||
        isResourceOwner(resource.data.providerId)
      );
      
      // Booking messages
      match /messages/{messageId} {
        allow read, write: if isActiveUser() && (
          isPlatformAdmin() ||
          belongsToOrganization(get(/databases/$(database)/documents/bookings/$(bookingId)).data.organizationId) ||
          isResourceOwner(get(/databases/$(database)/documents/bookings/$(bookingId)).data.providerId)
        );
      }
    }

    // Payments collection
    match /payments/{paymentId} {
      allow read: if isActiveUser() && (
        isPlatformAdmin() ||
        belongsToOrganization(resource.data.organizationId) ||
        isResourceOwner(resource.data.providerId)
      );
      
      // Only platform admin can create/update payments (handled by backend)
      allow write: if isPlatformAdmin();
    }

    // Channel Partners collection
    match /channelPartners/{partnerId} {
      allow read: if isActiveUser() && (
        isPlatformAdmin() ||
        isResourceOwner(partnerId) ||
        hasPermission('view_partners')
      );
      
      allow create: if isActiveUser() && (
        isPlatformAdmin() ||
        request.auth.uid == partnerId
      );
      
      allow update: if isActiveUser() && (
        isPlatformAdmin() ||
        isResourceOwner(partnerId)
      );
      
      allow delete: if isPlatformAdmin();
      
      // Partner clients
      match /clients/{clientId} {
        allow read, write: if isActiveUser() && (
          isPlatformAdmin() ||
          isResourceOwner(partnerId)
        );
      }
    }

    // Analytics collection (read-only for users, write-only for admin)
    match /analytics/{analyticsId} {
      allow read: if isActiveUser() && (
        isPlatformAdmin() ||
        (resource.data.organizationId != null && 
         belongsToOrganization(resource.data.organizationId) &&
         hasPermission('view_analytics'))
      );
      
      allow write: if isPlatformAdmin();
    }

    // Audit logs collection (read-only for admins)
    match /auditLogs/{logId} {
      allow read: if isPlatformAdmin() || 
        (hasPermission('view_audit_logs') && 
         belongsToOrganization(resource.data.organizationId));
      
      allow write: if isPlatformAdmin();
    }

    // User profiles collection
    match /users/{userId} {
      allow read: if isAuthenticated() && (
        isPlatformAdmin() ||
        request.auth.uid == userId ||
        hasPermission('view_users')
      );
      
      allow create, update: if isAuthenticated() && (
        isPlatformAdmin() ||
        request.auth.uid == userId
      );
      
      allow delete: if isPlatformAdmin();
    }

    // Categories and system data (read-only for authenticated users)
    match /categories/{categoryId} {
      allow read: if isAuthenticated();
      allow write: if isPlatformAdmin();
    }
    
    match /skills/{skillId} {
      allow read: if isAuthenticated();
      allow write: if isPlatformAdmin();
    }
    
    match /system/{systemId} {
      allow read: if isAuthenticated();
      allow write: if isPlatformAdmin();
    }

    // Reviews collection
    match /reviews/{reviewId} {
      allow read: if isAuthenticated();
      
      allow create: if isActiveUser() && (
        isResourceOwner(request.resource.data.reviewerId)
      );
      
      allow update: if isActiveUser() && (
        isPlatformAdmin() ||
        isResourceOwner(resource.data.reviewerId)
      );
      
      allow delete: if isPlatformAdmin();
    }

    // Notifications collection
    match /notifications/{notificationId} {
      allow read, update: if isActiveUser() && 
        isResourceOwner(resource.data.userId);
      
      allow create: if isPlatformAdmin();
      allow delete: if isPlatformAdmin() || 
        isResourceOwner(resource.data.userId);
    }
  }
}
`;

/**
 * Security Rules for Firebase Storage
 * Handles file uploads with proper access control
 */
export const storageRules = `
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper function to check authentication
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isPlatformAdmin() {
      return request.auth.token.platform_admin == true;
    }
    
    function belongsToOrganization(orgId) {
      return request.auth.token.organizationId == orgId;
    }
    
    function isResourceOwner(userId) {
      return request.auth.uid == userId;
    }

    // Organization logos and documents
    match /organizations/{orgId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && (
        isPlatformAdmin() ||
        belongsToOrganization(orgId)
      );
    }

    // Provider profiles and portfolios
    match /providers/{providerId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && (
        isPlatformAdmin() ||
        isResourceOwner(providerId)
      );
    }

    // Project attachments
    match /projects/{projectId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && (
        isPlatformAdmin() ||
        // Organization members can upload to their projects
        belongsToOrganization(firestore.get(/databases/(default)/documents/projects/$(projectId)).data.organizationId)
      );
    }

    // Service portfolios and attachments
    match /services/{serviceId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && (
        isPlatformAdmin() ||
        isResourceOwner(firestore.get(/databases/(default)/documents/services/$(serviceId)).data.providerId)
      );
    }

    // Booking attachments and deliverables
    match /bookings/{bookingId}/{allPaths=**} {
      allow read, write: if isAuthenticated() && (
        isPlatformAdmin() ||
        belongsToOrganization(firestore.get(/databases/(default)/documents/bookings/$(bookingId)).data.organizationId) ||
        isResourceOwner(firestore.get(/databases/(default)/documents/bookings/$(bookingId)).data.providerId)
      );
    }

    // Channel partner assets
    match /partners/{partnerId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && (
        isPlatformAdmin() ||
        isResourceOwner(partnerId)
      );
    }

    // System assets (admin only)
    match /system/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isPlatformAdmin();
    }

    // User uploads (profile pictures, etc.)
    match /users/{userId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && (
        isPlatformAdmin() ||
        isResourceOwner(userId)
      );
    }
  }
}
`;

/**
 * Composite Index Definitions
 * These indexes optimize query performance for the marketplace
 */
export const indexes = [
  // Organizations
  {
    collectionGroup: 'organizations',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'isActive', order: 'ASCENDING' },
      { fieldPath: 'subscription.plan', order: 'ASCENDING' },
      { fieldPath: 'createdAt', order: 'DESCENDING' }
    ]
  },
  
  // Services - for marketplace search and filtering
  {
    collectionGroup: 'services',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'isActive', order: 'ASCENDING' },
      { fieldPath: 'category', order: 'ASCENDING' },
      { fieldPath: 'pricing.type', order: 'ASCENDING' },
      { fieldPath: 'reviews.rating', order: 'DESCENDING' }
    ]
  },
  {
    collectionGroup: 'services',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'isActive', order: 'ASCENDING' },
      { fieldPath: 'tags', arrayConfig: 'CONTAINS' },
      { fieldPath: 'createdAt', order: 'DESCENDING' }
    ]
  },
  {
    collectionGroup: 'services',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'providerId', order: 'ASCENDING' },
      { fieldPath: 'isActive', order: 'ASCENDING' },
      { fieldPath: 'updatedAt', order: 'DESCENDING' }
    ]
  },
  
  // Providers - for talent search
  {
    collectionGroup: 'providers',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'tier', order: 'ASCENDING' },
      { fieldPath: 'ratings.overall', order: 'DESCENDING' }
    ]
  },
  {
    collectionGroup: 'providers',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'isAvailable', order: 'ASCENDING' },
      { fieldPath: 'profile.location.country', order: 'ASCENDING' },
      { fieldPath: 'ratings.overall', order: 'DESCENDING' }
    ]
  },
  {
    collectionGroup: 'providers',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'skills.name', arrayConfig: 'CONTAINS' },
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'ratings.overall', order: 'DESCENDING' }
    ]
  },
  
  // Projects - for organization and provider queries
  {
    collectionGroup: 'projects',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'organizationId', order: 'ASCENDING' },
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'updatedAt', order: 'DESCENDING' }
    ]
  },
  {
    collectionGroup: 'projects',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'visibility', order: 'ASCENDING' },
      { fieldPath: 'category', order: 'ASCENDING' },
      { fieldPath: 'createdAt', order: 'DESCENDING' }
    ]
  },
  {
    collectionGroup: 'projects',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'requirements.skills', arrayConfig: 'CONTAINS' },
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'budget.min', order: 'ASCENDING' }
    ]
  },
  
  // Bookings - for project and provider management
  {
    collectionGroup: 'bookings',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'organizationId', order: 'ASCENDING' },
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'updatedAt', order: 'DESCENDING' }
    ]
  },
  {
    collectionGroup: 'bookings',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'providerId', order: 'ASCENDING' },
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'updatedAt', order: 'DESCENDING' }
    ]
  },
  
  // Payments - for financial tracking
  {
    collectionGroup: 'payments',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'organizationId', order: 'ASCENDING' },
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'createdAt', order: 'DESCENDING' }
    ]
  },
  {
    collectionGroup: 'payments',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'providerId', order: 'ASCENDING' },
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'createdAt', order: 'DESCENDING' }
    ]
  },
  
  // Analytics - for reporting
  {
    collectionGroup: 'analytics',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'organizationId', order: 'ASCENDING' },
      { fieldPath: 'type', order: 'ASCENDING' },
      { fieldPath: 'period', order: 'ASCENDING' },
      { fieldPath: 'date', order: 'DESCENDING' }
    ]
  },
  
  // Audit logs - for compliance
  {
    collectionGroup: 'auditLogs',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'organizationId', order: 'ASCENDING' },
      { fieldPath: 'action', order: 'ASCENDING' },
      { fieldPath: 'timestamp', order: 'DESCENDING' }
    ]
  },
  {
    collectionGroup: 'auditLogs',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'userId', order: 'ASCENDING' },
      { fieldPath: 'severity', order: 'ASCENDING' },
      { fieldPath: 'timestamp', order: 'DESCENDING' }
    ]
  }
];