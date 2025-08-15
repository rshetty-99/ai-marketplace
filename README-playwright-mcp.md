# Playwright MCP Server Setup

This document explains how to set up and use the Playwright Model Context Protocol (MCP) server for browser automation with AI assistants.

## 🚀 Quick Start

The Playwright MCP server is currently **RUNNING** on:
- **MCP Endpoint**: http://localhost:3001/mcp
- **SSE Endpoint**: http://localhost:3001/sse (legacy support)

## 📋 What is MCP?

Model Context Protocol (MCP) is an open protocol that enables AI assistants to securely connect to local and remote resources. The Playwright MCP server provides browser automation capabilities to AI assistants.

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (LTS version)
- npm or npx

### Installation Methods

#### 1. Direct NPX Usage (Recommended)
```bash
npx @playwright/mcp@latest --port 3001 --host 0.0.0.0
```

#### 2. Using the Batch Script
```bash
./start-playwright-mcp.bat
```

#### 3. Background Process
```bash
npx @playwright/mcp@latest --port 3001 --host 0.0.0.0 &
```

## 🔧 Configuration

### For Claude Desktop
Add this to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "playwright": {
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

### For VS Code
```bash
code --add-mcp '{"name":"playwright","command":"npx","args":["@playwright/mcp@latest"]}'
```

### For Cursor IDE
1. Go to Settings → MCP → Add new MCP Server
2. Use command: `npx @playwright/mcp`

### For Cline
1. Go to Advanced settings → Extensions
2. Use command: `npx @playwright/mcp`

## 🎭 Server Options

```bash
npx @playwright/mcp@latest [options]

Options:
  --port <port>                Port to listen on (default: 3001)
  --host <host>                Host to bind to (default: localhost)
  --browser <browser>          Browser: chrome, firefox, webkit, msedge
  --headless                   Run in headless mode
  --device <device>            Device to emulate: "iPhone 15", etc.
  --viewport-size <size>       Viewport size: "1280,720"
  --save-trace                 Save Playwright traces
  --save-session               Save browser sessions
  --output-dir <path>          Output directory for traces/sessions
  --user-data-dir <path>       Browser user data directory
  --proxy-server <proxy>       Proxy server configuration
  --ignore-https-errors        Ignore HTTPS errors
  --no-sandbox                 Disable sandbox (for containers)
```

## 🧪 Testing

### Test Page
Open `playwright-test.html` in your browser to test various automation scenarios:
- Basic interactions (click, hover, toggle)
- Form handling and validation
- Dynamic content manipulation
- Navigation testing
- Data display and manipulation

### Available Capabilities
- ✅ Web page interaction
- ✅ Screenshot capture
- ✅ DOM manipulation
- ✅ Form filling and submission
- ✅ Navigation and scrolling
- ✅ Accessibility tree analysis
- ✅ Multi-browser support
- ✅ Device emulation
- ✅ Trace recording

## 📊 Usage Examples

### Basic Commands You Can Use:
1. **Navigate to a website**: "Go to example.com"
2. **Take a screenshot**: "Take a screenshot of the current page"
3. **Fill forms**: "Fill the name field with 'John Doe'"
4. **Click elements**: "Click the submit button"
5. **Extract data**: "Get the text from all headings on the page"
6. **Verify content**: "Check if the page contains 'success message'"

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 3001
npx kill-port 3001
```

#### Browser Not Found
```bash
# Install browsers
npx playwright install
```

#### Permission Issues
```bash
# Run with elevated permissions (Windows)
npx @playwright/mcp@latest --no-sandbox
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npx @playwright/mcp@latest --port 3001
```

## 📁 File Structure

```
├── playwright-mcp-config.json    # Configuration file
├── playwright-test.html           # Test page for validation
├── start-playwright-mcp.bat      # Windows startup script
├── playwright-output/             # Output directory (created automatically)
│   ├── traces/                   # Playwright traces
│   └── sessions/                 # Browser sessions
└── README-playwright-mcp.md      # This documentation
```

## 🔐 Security Considerations

- The server runs on localhost by default
- Configure `--allowed-origins` for production use
- Use `--blocked-origins` to restrict access to specific domains
- Enable `--isolated` mode for sensitive operations
- Regular browser updates are recommended

## 🔗 Useful Links

- [Playwright Documentation](https://playwright.dev/)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [MCP Servers Directory](https://mcpservers.org/)

## 🆘 Support

If you encounter issues:
1. Check the console output for error messages
2. Verify Node.js and npm versions
3. Try running with different browser engines
4. Check network connectivity and firewall settings
5. Review the Playwright and MCP documentation

## 📈 Advanced Usage

### Custom Browser Configuration
```bash
npx @playwright/mcp@latest \
  --browser chrome \
  --user-data-dir ./chrome-profile \
  --viewport-size "1920,1080" \
  --device "Desktop Chrome" \
  --save-trace \
  --output-dir ./automation-results
```

### With Proxy
```bash
npx @playwright/mcp@latest \
  --proxy-server "http://proxy.company.com:8080" \
  --proxy-bypass ".internal.com,localhost"
```

### Production Deployment
```bash
npx @playwright/mcp@latest \
  --host 0.0.0.0 \
  --port 3001 \
  --headless \
  --no-sandbox \
  --allowed-origins "https://your-app.com" \
  --output-dir /var/log/playwright
```

---

**Status**: ✅ **ACTIVE** - Server is currently running and ready for connections!