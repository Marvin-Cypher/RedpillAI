# RedPill VC - Design System Documentation

**Version:** 1.0  
**Date:** July 25, 2025  
**Design Team:** RedPill Design  
**Status:** Active  

## Overview

This design system provides a comprehensive guide for building consistent, accessible, and scalable user interfaces for the RedPill VC platform. It establishes visual and interaction standards that reflect our AI-native approach while maintaining the professionalism required for financial services.

---

## 1. Design Principles

### 1.1 Core Principles

**🤖 AI-Native First**
- AI capabilities are seamlessly integrated, not bolted on
- Conversational interfaces feel natural and contextual
- Transparent AI operations build trust through visibility

**📊 Data-Driven Clarity**
- Complex financial data presented with clear hierarchy
- Visual emphasis on actionable insights and trends
- Progressive disclosure to avoid information overload

**⚡ Efficiency-Focused**
- Common tasks accessible within 2 clicks
- Keyboard shortcuts for power users
- Optimistic UI updates for perceived performance

**🎯 Professional Excellence**
- Suitable for high-stakes financial decisions
- Consistent with enterprise software expectations
- Accessible and inclusive design patterns

### 1.2 User Experience Tenets

1. **Context-Aware**: The interface adapts to user role, current task, and available data
2. **Predictable**: Consistent patterns reduce cognitive load across the platform
3. **Responsive**: Smooth performance across devices and usage patterns
4. **Trustworthy**: Clear data sources, confident AI indicators, audit trails

---

## 2. Visual Identity

### 2.1 Color Palette

#### Primary Colors
```css
/* Trust & Reliability */
--primary-blue: #1e40af;      /* Primary CTA, links */
--primary-teal: #0891b2;      /* Secondary actions */
--primary-navy: #1e293b;      /* Headers, emphasis */

/* AI & Innovation */
--ai-gradient-start: #3b82f6; /* AI feature highlights */
--ai-gradient-end: #8b5cf6;   /* AI buttons, indicators */
--ai-accent: #06d6a0;         /* Success, positive AI feedback */
```

#### Semantic Colors
```css
/* Status Indicators */
--success-green: #10b981;     /* Completed, positive metrics */
--warning-yellow: #f59e0b;    /* Attention needed, pending states */
--error-red: #ef4444;         /* Errors, negative trends */
--info-blue: #3b82f6;         /* Information, neutral status */

/* Performance Indicators */
--performance-excellent: #059669;  /* Top quartile performance */
--performance-good: #65a30d;       /* Above average */
--performance-average: #ca8a04;    /* Benchmark performance */
--performance-poor: #dc2626;       /* Below expectations */
```

#### Neutral Palette
```css
/* Interface Foundation */
--gray-50: #f8fafc;          /* Page backgrounds */
--gray-100: #f1f5f9;         /* Card backgrounds */
--gray-200: #e2e8f0;         /* Borders, dividers */
--gray-300: #cbd5e1;         /* Input borders */
--gray-400: #94a3b8;         /* Placeholder text */
--gray-500: #64748b;         /* Secondary text */
--gray-600: #475569;         /* Body text */
--gray-700: #334155;         /* Headings */
--gray-800: #1e293b;         /* Primary text */
--gray-900: #0f172a;         /* Emphasis text */
```

### 2.2 Typography

#### Font Stack
```css
/* Primary Typography */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Monospace (Data/Code) */
font-family: 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', monospace;
```

#### Type Scale
```css
/* Display & Headlines */
--text-4xl: 2.25rem;  /* 36px - Page titles */
--text-3xl: 1.875rem; /* 30px - Section headers */
--text-2xl: 1.5rem;   /* 24px - Card titles */
--text-xl: 1.25rem;   /* 20px - Component headers */

/* Body Text */
--text-lg: 1.125rem;  /* 18px - Emphasized body */
--text-base: 1rem;    /* 16px - Default body */
--text-sm: 0.875rem;  /* 14px - Secondary text */
--text-xs: 0.75rem;   /* 12px - Captions, labels */

/* Font Weights */
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 2.3 Spacing System

```css
/* Consistent 8px grid system */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

### 2.4 Shadows & Elevation

```css
/* Card Elevation */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

/* Interactive States */
--shadow-focus: 0 0 0 3px rgba(59, 130, 246, 0.15);
--shadow-ai: 0 0 20px rgba(139, 92, 246, 0.3);
```

---

## 3. Component Library

### 3.1 Buttons

#### Primary Button
```tsx
// Investment actions, primary CTAs
<Button className="bg-primary-blue hover:bg-blue-700 text-white font-medium">
  Start Due Diligence
</Button>
```

#### AI Button
```tsx
// AI-powered features with gradient
<Button className="bg-gradient-to-r from-ai-gradient-start to-ai-gradient-end text-white">
  ✨ Ask AI
</Button>
```

#### Secondary Button
```tsx
// Secondary actions, cancel buttons
<Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
  View Details
</Button>
```

### 3.2 Cards

#### Data Card
```tsx
// Portfolio metrics, KPI displays
<Card className="p-6 bg-white shadow-md rounded-lg">
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle className="text-gray-800 font-semibold">Total AUM</CardTitle>
      <TrendingUp className="w-5 h-5 text-success-green" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold text-gray-900">$125.4M</div>
    <div className="text-sm text-success-green">+12.5% from last quarter</div>
  </CardContent>
</Card>
```

#### Company Card
```tsx
// Portfolio company or deal cards
<Card className="hover:shadow-lg transition-shadow duration-200">
  <CardHeader className="pb-3">
    <div className="flex items-center space-x-3">
      <Avatar className="w-12 h-12">
        <CompanyLogo />
      </Avatar>
      <div>
        <CardTitle>Acme Corp</CardTitle>
        <p className="text-sm text-gray-600">Series A • $5M</p>
      </div>
    </div>
  </CardHeader>
</Card>
```

### 3.3 Status Indicators

#### Progress Bars
```tsx
// Workflow progress, fund deployment
<Progress 
  value={75} 
  className="h-2 bg-gray-200"
  indicatorClassName="bg-gradient-to-r from-blue-500 to-blue-600"
/>
```

#### Status Badges
```tsx
// Deal status, company health
<Badge className="bg-success-green/10 text-success-green border-success-green/20">
  ✅ Completed
</Badge>

<Badge className="bg-warning-yellow/10 text-warning-yellow border-warning-yellow/20">
  ⏳ In Progress
</Badge>
```

### 3.4 Data Visualization

#### Metric Cards with Trends
```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  <MetricCard
    title="Portfolio Companies"
    value="47"
    trend="+3"
    trendDirection="up"
    icon={<Briefcase />}
  />
</div>
```

#### Charts & Graphs
```css
/* Chart color scheme */
.chart-primary { color: var(--primary-blue); }
.chart-secondary { color: var(--primary-teal); }
.chart-success { color: var(--success-green); }
.chart-warning { color: var(--warning-yellow); }
.chart-error { color: var(--error-red); }
```

---

## 4. AI-Specific Design Patterns

### 4.1 AI Chat Interface

#### Message Bubbles
```tsx
// User message
<div className="flex justify-end mb-4">
  <div className="bg-primary-blue text-white rounded-lg px-4 py-2 max-w-xs">
    What's the average burn rate of my portfolio?
  </div>
</div>

// AI response
<div className="flex justify-start mb-4">
  <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2 max-w-md">
    <div className="flex items-center mb-2">
      <div className="w-6 h-6 bg-gradient-to-r from-ai-gradient-start to-ai-gradient-end rounded-full mr-2"></div>
      <span className="text-sm font-medium">RedPill AI</span>
    </div>
    The average monthly burn rate across your 47 portfolio companies is $180K...
  </div>
</div>
```

#### Typing Indicators
```tsx
// AI thinking/processing state
<div className="flex items-center space-x-2 text-gray-500">
  <div className="w-6 h-6 bg-gradient-to-r from-ai-gradient-start to-ai-gradient-end rounded-full animate-pulse"></div>
  <div className="flex space-x-1">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
  </div>
  <span>Analyzing portfolio data...</span>
</div>
```

### 4.2 AI Status Indicators

#### Tool Usage Display
```tsx
// Show when AI is using external tools
<div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
  <div className="flex items-center">
    <Database className="w-4 h-4 text-blue-400 mr-2" />
    <span className="text-sm text-blue-800">Fetching data from OpenBB Platform...</span>
  </div>
</div>
```

#### Confidence Levels
```tsx
// AI response confidence indicator
<div className="flex items-center justify-between mt-2">
  <div className="flex items-center space-x-2">
    <div className="w-16 h-1 bg-gray-200 rounded-full">
      <div className="w-3/4 h-full bg-success-green rounded-full"></div>
    </div>
    <span className="text-xs text-gray-600">High confidence</span>
  </div>
  <button className="text-xs text-blue-600 hover:underline">Sources</button>
</div>
```

---

## 5. Layout Patterns

### 5.1 Dashboard Layout

```tsx
// Main dashboard structure
<div className="min-h-screen bg-gray-50">
  {/* Header */}
  <header className="bg-white shadow-sm border-b">
    <div className="max-w-7xl mx-auto px-6 py-4">
      <Navigation />
    </div>
  </header>

  {/* Main Content */}
  <main className="max-w-7xl mx-auto p-6">
    {/* Stats Overview */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <MetricCards />
    </div>

    {/* Content Tabs */}
    <Tabs defaultValue="overview">
      <TabsContent value="overview">
        <DashboardOverview />
      </TabsContent>
    </Tabs>
  </main>
</div>
```

### 5.2 Detail Page Layout

```tsx
// Company or deal detail page
<div className="max-w-7xl mx-auto p-6">
  {/* Breadcrumb & Header */}
  <div className="mb-6">
    <Breadcrumb />
    <CompanyHeader />
  </div>

  {/* Two-column layout */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Main content */}
    <div className="lg:col-span-2 space-y-6">
      <MetricsOverview />
      <UpdatesFeed />
    </div>

    {/* Sidebar */}
    <div className="space-y-6">
      <QuickStats />
      <AIAssistant />
    </div>
  </div>
</div>
```

### 5.3 Mobile Responsive Patterns

```css
/* Mobile-first breakpoints */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }

/* Mobile navigation */
.mobile-nav {
  @apply fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform;
}

/* Responsive grids */
.responsive-grid {
  @apply grid grid-cols-1 gap-4;
  @apply md:grid-cols-2 md:gap-6;
  @apply lg:grid-cols-3 lg:gap-8;
}
```

---

## 6. Interaction Patterns

### 6.1 Loading States

```tsx
// Skeleton loading for data cards
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
  <div className="h-4 bg-gray-200 rounded w-full"></div>
</div>

// Loading spinner for AI operations
<div className="flex items-center justify-center p-8">
  <div className="w-8 h-8 border-4 border-gray-200 border-t-ai-gradient-start rounded-full animate-spin"></div>
</div>
```

### 6.2 Error States

```tsx
// Inline error message
<div className="bg-red-50 border border-red-200 rounded-lg p-4">
  <div className="flex items-center">
    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
    <span className="text-red-800">Unable to load portfolio data. Please try again.</span>
  </div>
</div>

// Empty states
<div className="text-center py-12">
  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
  <h3 className="text-lg font-medium text-gray-900 mb-2">No deals in pipeline</h3>
  <p className="text-gray-600 mb-6">Start by adding your first deal to track it through the process.</p>
  <Button className="bg-primary-blue text-white">Add Deal</Button>
</div>
```

### 6.3 Micro-interactions

```css
/* Hover effects */
.card-hover {
  @apply transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5;
}

/* Focus states */
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}

/* Button press feedback */
.button-press {
  @apply active:scale-95 transition-transform duration-75;
}
```

---

## 7. Accessibility Guidelines

### 7.1 Color & Contrast

- All text meets WCAG 2.1 AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
- Interactive elements have sufficient contrast in all states
- Color is never the only indicator of meaning (supplemented with icons, text)

### 7.2 Keyboard Navigation

```tsx
// Ensure all interactive elements are keyboard accessible
<button 
  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Action Button
</button>
```

### 7.3 Screen Reader Support

```tsx
// Proper ARIA labels and descriptions
<button 
  aria-label={`View details for ${companyName}`}
  aria-describedby={`${companyName}-status`}
>
  View Details
</button>

<div id={`${companyName}-status`} className="sr-only">
  Status: {status}, Last updated: {lastUpdated}
</div>
```

---

## 8. Animation & Motion

### 8.1 Animation Principles

- **Purposeful**: Animations should enhance understanding, not distract
- **Fast**: Most animations complete within 200-300ms
- **Respectful**: Respect user preferences for reduced motion

### 8.2 Common Animations

```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Slide in from right (mobile menu) */
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* AI sparkle effect */
@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
}
```

---

## 9. Implementation Guidelines

### 9.1 CSS Custom Properties

```css
:root {
  /* Import all design tokens as CSS custom properties */
  --primary-blue: #1e40af;
  --space-4: 1rem;
  --text-base: 1rem;
  /* ... all other tokens */
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --gray-50: #0f172a;
    --gray-900: #f8fafc;
    /* ... inverted colors */
  }
}
```

### 9.2 Component Development

```tsx
// Use TypeScript for all components
interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down' | 'flat';
    value: string;
  };
  icon?: React.ReactNode;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  icon,
  className
}) => {
  return (
    <Card className={cn("p-6 bg-white shadow-md rounded-lg", className)}>
      {/* Component implementation */}
    </Card>
  );
};
```

### 9.3 Testing Guidelines

- **Visual Regression**: All components should have Storybook stories with visual testing
- **Accessibility**: Automated accessibility testing with axe-core
- **Responsive**: Test all breakpoints and device orientations
- **Performance**: Monitor animation performance and loading states

---

## 10. Maintenance & Evolution

### 10.1 Design Token Updates

- All design tokens are centrally managed in `design-tokens.json`
- Updates propagate automatically through build process
- Version control tracks all token changes

### 10.2 Component Lifecycle

1. **Design** → Create in Figma with design tokens
2. **Develop** → Build component with TypeScript and tests
3. **Document** → Add to Storybook with usage examples
4. **Deploy** → Release through component library

### 10.3 Feedback & Iteration

- Regular design system reviews with product team
- User feedback collection through in-app feedback tools
- Analytics tracking for component usage and performance
- Quarterly design system health checks

---

## Resources

- **Figma Design System**: [Link to Figma file]
- **Component Library**: [Storybook URL]
- **Design Tokens**: `src/styles/design-tokens.json`
- **Implementation Guide**: `docs/component-development.md`

---

**Document History:**
- v1.0 (July 25, 2025): Initial design system documentation based on implemented UI components and design research