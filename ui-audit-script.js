#!/usr/bin/env node

/**
 * AI Marketplace UI Audit Script
 * Uses Playwright MCP to analyze UI best practices, accessibility, and design
 */

const fs = require('fs');
const path = require('path');

class UIAuditScript {
    constructor() {
        this.auditResults = {
            timestamp: new Date().toISOString(),
            pages: [],
            summary: {
                totalIssues: 0,
                criticalIssues: 0,
                warnings: 0,
                passed: 0
            }
        };
    }

    async runAudit() {
        console.log('🔍 Starting AI Marketplace UI Audit...\n');
        
        // Define pages to audit
        const pagesToAudit = [
            { name: 'Home Page', url: 'http://localhost:3000' },
            { name: 'Dashboard', url: 'http://localhost:3000/dashboard' },
            { name: 'Projects', url: 'http://localhost:3000/projects' },
            { name: 'Search', url: 'http://localhost:3000/search' },
            { name: 'Messages', url: 'http://localhost:3000/messages' }
        ];

        // Audit checklist
        const auditChecklist = [
            'Color contrast and accessibility',
            'Dark/Light mode implementation', 
            'Responsive design patterns',
            'Typography consistency',
            'Component spacing and layout',
            'Loading states and error handling',
            'Navigation and UX flow',
            'Form validation and feedback',
            'Button and interactive elements',
            'Performance and optimization'
        ];

        console.log('📋 Audit Checklist:');
        auditChecklist.forEach((item, index) => {
            console.log(`${index + 1}. ${item}`);
        });
        console.log('\n');

        // Since we can't directly control Playwright MCP from here,
        // let's create instructions for manual testing with the MCP server
        this.generateMCPInstructions(pagesToAudit, auditChecklist);
        
        // Analyze the codebase for best practices
        await this.analyzeCodebase();
        
        // Generate audit report
        this.generateAuditReport();
    }

    generateMCPInstructions(pages, checklist) {
        console.log('🎭 Playwright MCP Commands to Run:\n');
        
        pages.forEach((page, index) => {
            console.log(`\n=== ${page.name.toUpperCase()} AUDIT ===`);
            console.log(`1. Navigate to ${page.url}`);
            console.log(`2. Take a screenshot of the full page`);
            console.log(`3. Check for accessibility issues`);
            console.log(`4. Test responsive design (mobile/tablet/desktop)`);
            console.log(`5. Verify color contrast ratios`);
            console.log(`6. Test dark/light mode toggle (if available)`);
            console.log(`7. Check for loading states`);
            console.log(`8. Test form interactions (if applicable)`);
            console.log(`9. Verify navigation and links work`);
            console.log(`10. Check console for errors\n`);
        });

        // Generate specific MCP commands
        this.generateSpecificMCPCommands(pages);
    }

    generateSpecificMCPCommands(pages) {
        const commands = [];
        
        pages.forEach(page => {
            commands.push(`# ${page.name} Audit Commands`);
            commands.push(`"Navigate to ${page.url}"`);
            commands.push(`"Take a screenshot of the current page"`);
            commands.push(`"Check the accessibility tree of this page"`);
            commands.push(`"Resize viewport to 375x667 and take a screenshot" # Mobile`);
            commands.push(`"Resize viewport to 768x1024 and take a screenshot" # Tablet`);
            commands.push(`"Resize viewport to 1920x1080 and take a screenshot" # Desktop`);
            commands.push(`"Get all the colors used on this page"`);
            commands.push(`"Check if there are any console errors"`);
            commands.push(`"Find all buttons and interactive elements"`);
            commands.push('');
        });

        // Write commands to file for easy copy-paste
        const commandsFile = path.join(__dirname, 'playwright-mcp-commands.txt');
        fs.writeFileSync(commandsFile, commands.join('\n'));
        console.log(`📝 MCP Commands saved to: ${commandsFile}\n`);
    }

    async analyzeCodebase() {
        console.log('🔍 Analyzing Codebase for UI Best Practices...\n');
        
        const analysis = {
            themeImplementation: this.checkThemeImplementation(),
            componentConsistency: this.checkComponentConsistency(),
            accessibilityFeatures: this.checkAccessibilityFeatures(),
            responsiveDesign: this.checkResponsiveDesign(),
            colorSystem: this.checkColorSystem(),
            typographySystem: this.checkTypographySystem()
        };

        this.auditResults.codebaseAnalysis = analysis;
        this.reportCodebaseFindings(analysis);
    }

    checkThemeImplementation() {
        console.log('🎨 Theme Implementation Analysis:');
        
        const findings = [];
        
        // Check for theme provider
        const themeFiles = [
            'src/app/globals.css',
            'src/components/theme-provider.tsx',
            'tailwind.config.js'
        ];

        themeFiles.forEach(file => {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                console.log(`  ✅ Found: ${file}`);
                findings.push({ file, status: 'found' });
            } else {
                console.log(`  ❌ Missing: ${file}`);
                findings.push({ file, status: 'missing' });
            }
        });

        return findings;
    }

    checkComponentConsistency() {
        console.log('\n🧩 Component Consistency Analysis:');
        
        const componentDir = path.join(__dirname, 'src/components');
        const findings = [];
        
        if (fs.existsSync(componentDir)) {
            const components = fs.readdirSync(componentDir, { recursive: true });
            const uiComponents = components.filter(f => f.includes('ui/'));
            
            console.log(`  📦 Total components found: ${components.length}`);
            console.log(`  🎨 UI components: ${uiComponents.length}`);
            
            // Check for common UI patterns
            const expectedUIComponents = [
                'button.tsx', 'input.tsx', 'card.tsx', 'badge.tsx',
                'avatar.tsx', 'tabs.tsx', 'select.tsx', 'textarea.tsx'
            ];
            
            expectedUIComponents.forEach(comp => {
                const exists = uiComponents.some(f => f.includes(comp));
                if (exists) {
                    console.log(`    ✅ ${comp}`);
                    findings.push({ component: comp, status: 'implemented' });
                } else {
                    console.log(`    ❌ Missing: ${comp}`);
                    findings.push({ component: comp, status: 'missing' });
                }
            });
        }

        return findings;
    }

    checkAccessibilityFeatures() {
        console.log('\n♿ Accessibility Features Analysis:');
        
        const findings = [];
        
        // Check for accessibility imports and usage
        const accessibilityFeatures = [
            'aria-label',
            'aria-describedby', 
            'role',
            'tabindex',
            'alt attributes',
            'semantic HTML'
        ];

        console.log('  📋 Accessibility features to verify manually:');
        accessibilityFeatures.forEach(feature => {
            console.log(`    - ${feature}`);
        });

        return findings;
    }

    checkResponsiveDesign() {
        console.log('\n📱 Responsive Design Analysis:');
        
        const findings = [];
        
        // Check Tailwind config
        const tailwindConfigPath = path.join(__dirname, 'tailwind.config.js');
        if (fs.existsSync(tailwindConfigPath)) {
            console.log('  ✅ Tailwind CSS configured');
            console.log('  📐 Responsive breakpoints available: sm, md, lg, xl, 2xl');
            findings.push({ feature: 'tailwind-breakpoints', status: 'available' });
        }

        return findings;
    }

    checkColorSystem() {
        console.log('\n🎨 Color System Analysis:');
        
        const findings = [];
        
        // Check CSS variables and color definitions
        const globalCSSPath = path.join(__dirname, 'src/app/globals.css');
        if (fs.existsSync(globalCSSPath)) {
            const cssContent = fs.readFileSync(globalCSSPath, 'utf8');
            
            // Look for CSS custom properties
            const hasCustomProperties = cssContent.includes('--');
            const hasThemeColors = cssContent.includes(':root') && cssContent.includes('[data-theme');
            
            console.log(`  ✅ CSS custom properties: ${hasCustomProperties ? 'Yes' : 'No'}`);
            console.log(`  ✅ Theme color system: ${hasThemeColors ? 'Yes' : 'No'}`);
            
            findings.push({ 
                customProperties: hasCustomProperties,
                themeColors: hasThemeColors
            });
        }

        return findings;
    }

    checkTypographySystem() {
        console.log('\n📝 Typography System Analysis:');
        
        const findings = [];
        
        // Check for typography consistency
        console.log('  📋 Typography elements to verify:');
        const typographyElements = [
            'Headings hierarchy (h1-h6)',
            'Body text consistency',
            'Font weight variations',
            'Line height standards',
            'Letter spacing',
            'Font family consistency'
        ];

        typographyElements.forEach(element => {
            console.log(`    - ${element}`);
        });

        return findings;
    }

    reportCodebaseFindings(analysis) {
        console.log('\n📊 CODEBASE ANALYSIS SUMMARY:\n');
        
        let totalChecks = 0;
        let passedChecks = 0;
        
        // Count findings
        Object.keys(analysis).forEach(category => {
            const findings = analysis[category];
            if (Array.isArray(findings)) {
                findings.forEach(finding => {
                    totalChecks++;
                    if (finding.status === 'found' || finding.status === 'implemented' || finding.status === 'available') {
                        passedChecks++;
                    }
                });
            }
        });

        console.log(`✅ Passed Checks: ${passedChecks}/${totalChecks}`);
        console.log(`🔍 Manual Verification Needed: Use Playwright MCP for visual testing`);
    }

    generateAuditReport() {
        console.log('\n📋 UI AUDIT RECOMMENDATIONS:\n');
        
        const recommendations = [
            {
                priority: 'HIGH',
                category: 'Theme System',
                issue: 'Dark/Light Mode Implementation',
                description: 'Implement comprehensive dark/light mode toggle with system preference detection',
                action: 'Add ThemeProvider and theme toggle button to main layout'
            },
            {
                priority: 'HIGH', 
                category: 'Accessibility',
                issue: 'Color Contrast',
                description: 'Verify all text meets WCAG AA standards (4.5:1 ratio)',
                action: 'Use Playwright MCP to check contrast ratios across all pages'
            },
            {
                priority: 'MEDIUM',
                category: 'Responsive Design',
                issue: 'Mobile Optimization',
                description: 'Test all pages across different viewport sizes',
                action: 'Use Playwright MCP to test mobile, tablet, desktop layouts'
            },
            {
                priority: 'MEDIUM',
                category: 'Performance',
                issue: 'Loading States',
                description: 'Add loading states for all async operations',
                action: 'Implement skeleton loaders and loading spinners'
            },
            {
                priority: 'LOW',
                category: 'UX Polish',
                issue: 'Animations & Transitions',
                description: 'Add smooth transitions for better user experience',
                action: 'Implement hover states, page transitions, and micro-interactions'
            }
        ];

        recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. [${rec.priority}] ${rec.category}: ${rec.issue}`);
            console.log(`   Description: ${rec.description}`);
            console.log(`   Action: ${rec.action}\n`);
        });

        // Save detailed report
        const reportPath = path.join(__dirname, 'ui-audit-report.json');
        fs.writeFileSync(reportPath, JSON.stringify({
            ...this.auditResults,
            recommendations
        }, null, 2));

        console.log(`📄 Detailed audit report saved to: ${reportPath}\n`);
    }
}

// Run the audit
if (require.main === module) {
    const audit = new UIAuditScript();
    audit.runAudit().catch(console.error);
}

module.exports = { UIAuditScript };