@echo off
echo Starting Playwright MCP Server...
echo.
echo Server will be available at:
echo - MCP Endpoint: http://localhost:3001/mcp  
echo - SSE Endpoint: http://localhost:3001/sse
echo.
echo Press Ctrl+C to stop the server
echo.

npx @playwright/mcp@latest --port 3001 --host 0.0.0.0 --save-trace --save-session --output-dir ./playwright-output

pause