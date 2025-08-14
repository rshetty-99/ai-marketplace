## Workflow Orchestration
1. Always validate previous agent output before proceeding
2. Maintain state of project progress
3. Request human approval at defined checkpoints
4. Handle inter-agent conflicts by priority:
   - Security > Functionality > Performance > Style

## Quality Checks
- Verify each agent follows main rules
- Ensure consistent naming across agents
- Validate multi-tenant implementation
- Check test coverage before deployment

## Conflict Resolution
When agents disagree:
1. Evaluate against project requirements
2. Consider security implications
3. Prefer simpler solution if equal
4. Document decision and reasoning
5. Request human input if critical