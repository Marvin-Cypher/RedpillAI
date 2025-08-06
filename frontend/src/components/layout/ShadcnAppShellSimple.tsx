'use client'

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ThemeProvider } from "@/components/theme/ThemeProvider"
import { UnifiedAISystem } from "@/components/ai"
import { useAuthStore } from "@/lib/stores/authStore"
import { cn } from "@/lib/utils"

// Shadcn UI Components (only using the ones that work reliably)
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"

// Icons
import {
  Home,
  TrendingUp,
  Briefcase,
  BarChart3,
  FileText,
  Building,
  Users,
  Settings,
  Bell,
  Search,
  Menu,
  LogOut,
  User,
  Brain,
  X,
} from "lucide-react"

// Navigation configuration
const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Fund overview and key metrics",
  },
  {
    title: "Deal Flow",
    href: "/dealflow",
    icon: TrendingUp,
    description: "Pipeline management and sourcing",
  },
  {
    title: "Portfolio",
    href: "/portfolio",
    icon: Briefcase,
    description: "Investment tracking and monitoring",
  },
  {
    title: "Analytics", 
    href: "/analytics",
    icon: BarChart3,
    description: "Performance analysis and reporting",
  },
]

const secondaryNavItems = [
  {
    title: "Workflows",
    href: "/workflow",
    icon: FileText,
  },
  {
    title: "History",
    href: "/history",
    icon: Building,
  },
  {
    title: "Team",
    href: "/team",
    icon: Users,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

// Desktop sidebar component
function DesktopSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
      <div className="flex flex-col flex-grow bg-card border-r border-border pt-5 pb-4 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-4">
          <Link href="/" className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              <span className="text-sm font-bold">R</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">RedPill VC</span>
              <span className="text-xs text-muted-foreground">AI-Native Platform</span>
            </div>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="mt-8 flex-1 px-3 space-y-1">
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    active
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground"
                  )} />
                  <div className="flex-1">
                    <div>{item.title}</div>
                    <div className="text-xs text-muted-foreground group-hover:text-accent-foreground">
                      {item.description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="space-y-1">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center px-3 py-2 text-sm font-medium text-muted-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Icon className="mr-3 h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-accent-foreground" />
                    {item.title}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* User Profile */}
        <div className="flex-shrink-0 px-3 pb-3">
          <div className="border-t border-border pt-4">
            <div className="flex items-center space-x-3 px-3 py-2 text-sm mb-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.name || user?.email || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.role || 'Investor'}
                </p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost" 
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>

          {/* Bottom promotional section */}
          <div className="mt-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="w-5 h-5 text-primary" />
              <span className="font-medium text-primary">AI-Powered</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Experience the future of venture capital with our AI-native platform
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Mobile sidebar component
function MobileSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [open, setOpen] = React.useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      setOpen(false)
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-14 items-center border-b px-6">
            <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                <span className="text-sm font-bold">R</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">RedPill VC</span>
                <span className="text-xs text-muted-foreground">AI-Native Platform</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3">
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <h4 className="px-2 text-sm font-medium text-muted-foreground">Main Navigation</h4>
                {mainNavItems.map((item) => (
                  <Button
                    key={item.href}
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href={item.href} onClick={() => setOpen(false)}>
                      <item.icon className="mr-2 size-4" />
                      {item.title}
                    </Link>
                  </Button>
                ))}
              </div>

              <div className="border-t" />

              <div className="space-y-1">
                <h4 className="px-2 text-sm font-medium text-muted-foreground">Quick Actions</h4>
                {secondaryNavItems.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href={item.href} onClick={() => setOpen(false)}>
                      <item.icon className="mr-2 size-4" />
                      {item.title}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 mb-3">
              <Avatar className="size-9">
                <AvatarFallback>
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-0.5">
                <p className="text-sm font-medium">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email || "user@redpill.vc"}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 size-4" />
              Log out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Header component
function AppHeader() {
  const { user } = useAuthStore()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:pl-64">
      <div className="flex h-14 items-center px-4">
        <div className="flex flex-1 items-center gap-4">
          {/* Mobile menu */}
          <MobileSidebar />
          
          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search companies, deals..."
                className="w-full rounded-md border border-input bg-background px-8 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive"></span>
            <span className="sr-only">Notifications</span>
          </Button>

          {/* User avatar */}
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}

// Auth guard component
function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()
  
  // DEMO MODE: Bypass authentication for testing
  const DEMO_MODE = true
  
  React.useEffect(() => {
    if (DEMO_MODE) {
      console.log("🔓 Demo mode active - authentication bypassed")
      return
    }
    
    const publicRoutes = ["/login", "/simple-login", "/direct-login"]
    if (publicRoutes.includes(pathname)) {
      return
    }

    checkAuth()
  }, [pathname, checkAuth, DEMO_MODE])

  React.useEffect(() => {
    if (DEMO_MODE) return
    
    const publicRoutes = ["/login", "/simple-login", "/direct-login"]
    if (publicRoutes.includes(pathname)) {
      return
    }

    if (!isLoading && !isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname)
      router.push(`/login?returnUrl=${returnUrl}`)
    }
  }, [isAuthenticated, isLoading, pathname, router, DEMO_MODE])

  if (DEMO_MODE) {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  if (!isAuthenticated && pathname !== "/login") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Main shell component
export function ShadcnAppShellSimple({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthGuard>
        <UnifiedAISystem>
          <div className="relative flex min-h-screen">
            <DesktopSidebar />
            <div className="flex-1 flex flex-col lg:pl-64">
              <AppHeader />
              <main className="flex-1">
                <div className="container py-6 mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </UnifiedAISystem>
      </AuthGuard>
    </ThemeProvider>
  )
}