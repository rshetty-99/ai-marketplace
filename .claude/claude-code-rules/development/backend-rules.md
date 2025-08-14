# Backend Development Specific Rules

## API Development
1. Version all APIs (/api/v1, /api/v2)
2. Implement idempotency for POST/PUT
3. Use transactions for multi-document updates
4. Return consistent response formats

## Database Rules
1. Always use batch operations when possible
2. Implement soft deletes for audit trail
3. Use composite indexes for complex queries
4. Design for eventual consistency

## Security
1. Validate all inputs with Zod
2. Implement rate limiting per tenant
3. Use prepared statements
4. Encrypt sensitive data at rest