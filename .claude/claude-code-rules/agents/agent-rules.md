# Universal Agent Rules - Applied to ALL Agents

## Agent Behavior Standards

### 1. Input/Output Protocol
- Always read previous agent outputs from `/project-documentation/`
- Validate inputs before processing
- Generate outputs in designated directories
- Include metadata in every output (agent name, timestamp, version)

### 2. Communication Between Agents
```yaml
# Standard message format for inter-agent communication
message:
  from_agent: "backend-developer"
  to_agent: "qa-testing"
  timestamp: "2024-01-20T10:00:00Z"
  status: "complete"
  outputs:
    - path: "/src/app/api/v1/organizations/route.ts"
    - path: "/lib/services/organizationService.ts"
  validation:
    - typescript_check: "passed"
    - eslint_check: "passed"
  next_steps:
    - "Create unit tests for organization service"
    - "Create E2E tests for organization CRUD"
  human_review_needed:
    - "Verify RBAC implementation for subsidiaries"
```

### 3. Agent Quality Standards
Every agent MUST:
- Follow the main `.claude-code-rules` file
- Generate complete, working code (no pseudocode)
- Add TODO comments for human review
- Include error handling in all code
- Document decisions and trade-offs
- Validate their own output before passing to next agent

### 4. Agent-Specific Capabilities

#### Product Manager Agent
- Can create new requirements
- Can modify scope based on technical constraints
- Cannot write code directly
- Must produce markdown documentation only

#### System Architect Agent  
- Can override PM requirements for technical reasons
- Can define technology choices within approved stack
- Must justify any architectural decisions
- Cannot implement code, only design

#### Backend Developer Agent
- Must follow architecture specifications
- Can suggest architecture improvements
- Must implement all security measures
- Must create API documentation

#### Frontend Developer Agent
- Must follow design system (ShadCN)
- Can create new shared components
- Must implement responsive design
- Must handle all loading/error states

#### QA/Testing Agent
- Can request code changes if tests fail
- Must test all user paths
- Must test all tenant scenarios
- Must achieve 80% coverage minimum

#### DevOps Agent
- Can modify deployment configurations
- Must ensure zero-downtime deployments
- Must implement rollback procedures
- Must set up monitoring

### 5. Conflict Resolution Protocol

When agents disagree:
```
1. Identify conflict type:
   - Technical (implementation approach)
   - Business (requirement interpretation)
   - Security (risk assessment)
   
2. Resolution hierarchy:
   Security > Data Integrity > Functionality > Performance > Style
   
3. Escalation path:
   Agent → Coordinator Agent → Human
   
4. Document resolution:
   - What was the conflict
   - How was it resolved
   - Why this decision was made
```

### 6. Agent Learning Protocol
- Track common errors and prevent repetition
- Share learnings between agents via Coordinator
- Update agent prompts based on patterns
- Document best practices discovered

### 7. Agent Validation Checklist
Before passing work to next agent:
- [ ] Code compiles without errors
- [ ] No 'any' types used
- [ ] Multi-tenant context verified
- [ ] Security measures implemented
- [ ] Tests included (if applicable)
- [ ] Documentation updated
- [ ] TODO comments added for review
- [ ] Performance considerations addressed

### 8. Agent Error Handling
```typescript
// Every agent must handle errors gracefully
try {
  // Agent operation
  const result = await performOperation();
  
  // Validate result
  if (!validateOutput(result)) {
    throw new Error('Validation failed');
  }
  
  // Pass to next agent
  await notifyNextAgent(result);
  
} catch (error) {
  // Log error
  logger.error(`Agent ${agentName} error:`, error);
  
  // Attempt recovery
  if (canRecover(error)) {
    await recoverAndRetry();
  } else {
    // Escalate to Coordinator
    await escalateToCoordinator(error);
  }
}
```

### 9. Agent Performance Standards
- Response time: < 30 seconds for code generation
- Validation time: < 10 seconds
- Maximum retries: 3
- Success rate target: > 95%

### 10. Agent Documentation Requirements
Each agent must maintain:
- Input specifications
- Output specifications  
- Decision log
- Error log
- Performance metrics
- Learning notes

### 11. Inter-Agent Dependencies
```yaml
dependencies:
  product-manager:
    provides: ["requirements", "user-stories", "acceptance-criteria"]
    requires: []
    
  system-architect:
    provides: ["technical-design", "database-schema", "api-contracts"]
    requires: ["requirements"]
    
  backend-developer:
    provides: ["api-implementation", "services", "database-setup"]
    requires: ["technical-design", "api-contracts"]
    
  frontend-developer:
    provides: ["ui-components", "pages", "user-interactions"]
    requires: ["technical-design", "api-contracts"]
    
  qa-testing:
    provides: ["test-suites", "test-reports", "coverage-reports"]
    requires: ["api-implementation", "ui-components"]
    
  devops:
    provides: ["deployment-config", "ci-cd-pipeline", "monitoring"]
    requires: ["all-code", "test-suites"]
```

### 12. Agent File Ownership
```yaml
file_ownership:
  product-manager:
    - /project-documentation/*.md
    
  system-architect:
    - /project-documentation/architecture/*.md
    - /project-documentation/database/*.sql
    
  backend-developer:
    - /src/app/api/**
    - /src/services/**
    - /src/lib/firebase/**
    - /src/lib/middleware/**
    
  frontend-developer:
    - /src/app/(dashboard)/**
    - /src/app/(auth)/**
    - /src/components/**
    - /src/hooks/**
    
  qa-testing:
    - /tests/**
    - /playwright.config.ts
    - /jest.config.js
    
  devops:
    - /.github/workflows/**
    - /firebase.json
    - /.firebaserc
    - /scripts/**
```

### 13. Agent Review Protocol
Each agent must review:
1. Previous agent's output for compatibility
2. Their own output for completeness
3. Integration points with other agents
4. Compliance with main rules
5. Performance implications

### 14. Agent Rollback Capability
If an agent's output causes issues:
```bash
# Each agent must support rollback
agent_rollback() {
  # Save current state
  git stash
  
  # Revert to previous valid state
  git checkout HEAD~1
  
  # Notify coordinator
  notify_coordinator("Rollback executed due to: $reason")
  
  # Request human intervention if needed
  if [ "$severity" = "critical" ]; then
    request_human_review()
  fi
}
```

### 15. Agent Communication Examples

#### Success Communication
```json
{
  "status": "success",
  "agent": "backend-developer",
  "timestamp": "2024-01-20T10:00:00Z",
  "outputs": [
    {
      "type": "api",
      "path": "/src/app/api/v1/organizations/route.ts",
      "tests": "pending",
      "documentation": "complete"
    }
  ],
  "metrics": {
    "files_created": 5,
    "lines_of_code": 500,
    "time_taken": "25s"
  },
  "next_agent": "qa-testing"
}
```

#### Error Communication
```json
{
  "status": "error",
  "agent": "frontend-developer",
  "timestamp": "2024-01-20T10:00:00Z",
  "error": {
    "type": "compilation",
    "message": "TypeScript compilation failed",
    "file": "/src/components/OrganizationList.tsx",
    "line": 45,
    "suggestion": "Missing type definition for 'organizationData'"
  },
  "attempted_fixes": [
    "Added interface definition",
    "Imported missing types"
  ],
  "requires": "human_intervention"
}
```

### 16. Agent Priority Matrix
When multiple agents need to work:
1. **Critical Path**: PM → Architect → Backend → Frontend → QA → DevOps
2. **Parallel Work**: Backend and Frontend can work simultaneously
3. **Blocking Issues**: Security issues block all other work
4. **Optimization**: Can be done after functional completion

### 17. Agent Success Metrics
Track for each agent:
- Accuracy rate (outputs that don't need revision)
- Speed (time to complete tasks)
- Integration success (works with other agent outputs)
- Error rate (failures requiring intervention)
- Learning rate (improvements over time)