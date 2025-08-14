security# Deployment Specific Rules

## CI/CD Pipeline
1. Run tests on every commit
2. Deploy to staging first
3. Require approval for production
4. Maintain rollback capability

## Environment Management
1. Separate configs per environment
2. Never commit secrets
3. Use GitHub Secrets for CI/CD
4. Validate env vars at startup

## Monitoring
1. Set up alerts for critical errors
2. Monitor performance metrics
3. Track deployment success rate
4. Implement health checks