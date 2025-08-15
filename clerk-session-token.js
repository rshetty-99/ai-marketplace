/**
 * Clerk Session Token Template Configuration
 * 
 * This file defines the custom claims structure for JWT session tokens in Clerk.
 * These claims will be available in session tokens and can be used for:
 * - Frontend authorization checks
 * - Middleware permission validation  
 * - RBAC enforcement
 * 
 * IMPORTANT: This file should be uploaded to your Clerk dashboard under:
 * Sessions → Customize session token → Session token template
 * 
 * The template uses Liquid syntax to dynamically populate claims based on user data.
 */

{
  "user_id": "{{user.id}}",
  "email": "{{user.primary_email_address.email_address}}",
  "email_verified": "{{user.primary_email_address.verification.status == 'verified'}}",
  "name": "{{user.first_name}} {{user.last_name}}",
  "username": "{{user.username}}",
  "created_at": "{{user.created_at}}",
  "updated_at": "{{user.updated_at}}",
  "user_type": "{{user.public_metadata.user_type | default: null}}",
  "onboarding_status": "{{user.public_metadata.onboarding_status | default: 'not_started'}}",
  "onboarding_completed": "{{user.public_metadata.onboarding_completed | default: false}}",
  "onboarding_current_step": "{{user.public_metadata.onboarding_current_step | default: 0}}",
  "organization_id": "{{user.public_metadata.organization_id | default: null}}",
  "organization_name": "{{user.public_metadata.organization_name | default: null}}",
  "organization_role": "{{user.public_metadata.organization_role | default: null}}",
  "roles": "{{user.public_metadata.roles | default: '[]'}}",
  "permissions": "{{user.public_metadata.permissions | default: '[]'}}",
  "user_status": "{{user.public_metadata.user_status | default: 'active'}}",
  "freelancer_tier": "{{user.public_metadata.freelancer_tier | default: null}}",
  "freelancer_verified": "{{user.public_metadata.freelancer_verified | default: false}}",
  "freelancer_rating": "{{user.public_metadata.freelancer_rating | default: null}}",
  "organization_type": "{{user.public_metadata.organization_type | default: null}}",
  "can_invite_users": "{{user.public_metadata.can_invite_users | default: false}}",
  "max_budget_approval": "{{user.public_metadata.max_budget_approval | default: 0}}",
  "feature_flags": "{{user.public_metadata.feature_flags | default: '{}'}}",
  "preferences": "{{user.public_metadata.preferences | default: '{}'}}",
  "background_check_status": "{{user.public_metadata.background_check_status | default: 'not_started'}}",
  "compliance_status": "{{user.public_metadata.compliance_status | default: 'pending'}}",
  "api_access_level": "{{user.public_metadata.api_access_level | default: 'basic'}}",
  "session_id": "{{session.id}}",
  "session_status": "{{session.status}}",
  "last_active_at": "{{session.last_active_at}}",
  "iss": "https://{{clerk.publishable_key}}.clerk.accounts.dev",
  "sub": "{{user.id}}",
  "aud": "{{clerk.publishable_key}}",
  "iat": "{{session.created_at | date: '%s'}}",
  "exp": "{{session.expire_at | date: '%s'}}",
  "azp": "{{clerk.publishable_key}}",
  {% if user.organization_memberships.size > 0 %}
  "org": {
    "id": "{{user.organization_memberships[0].organization.id}}",
    "name": "{{user.organization_memberships[0].organization.name}}",
    "slug": "{{user.organization_memberships[0].organization.slug}}",
    "role": "{{user.organization_memberships[0].role}}",
    "permissions": "{{user.organization_memberships[0].permissions | join: ','}}",
    "created_at": "{{user.organization_memberships[0].created_at}}",
    "updated_at": "{{user.organization_memberships[0].updated_at}}"
  }
  {% else %}
  "org": null
  {% endif %}
}