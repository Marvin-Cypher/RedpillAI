'use client'

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeProvider } from "@/components/theme/ThemeProvider"
import { UnifiedAISystem } from "@/components/ai"
import { useAuthStore } from "@/lib/stores/authStore"
import { cn } from "@/lib/utils"

// Shadcn UI Components
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

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
  ChevronRight,
  Zap,
  Brain,
  CreditCard,
  LifeBuoy,
  UserPlus,
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

// Header component with user menu
function AppHeader() {
  const { user, logout } = useAuthStore()
  
  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex flex-1 items-center gap-2 md:gap-4">
          {/* Mobile menu trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <MobileSidebar />
            </SheetContent>
          </Sheet>

          {/* Desktop sidebar trigger */}
          <SidebarTrigger className="hidden md:flex" />
          
          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search companies, deals..."
                className="w-full rounded-md border border-input bg-background px-8 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-600"></span>
            <span className="sr-only">Notifications</span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <div className="px-3 py-2 border-b">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || "user@redpill.vc"}
                  </p>
                </div>
              </div>
              
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              
              <div className="border-t my-1" />
              
              <DropdownMenuItem>
                <LifeBuoy className="mr-2 h-4 w-4" />
                <span>Support</span>
              </DropdownMenuItem>
              
              <div className="border-t my-1" />
              
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

// Desktop sidebar component
function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                  <span className="font-bold">R</span>
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">RedPill VC</span>
                  <span className="text-xs text-muted-foreground">AI-Native Platform</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Brain className="size-4 text-primary" />
            <span>AI-Powered Platform</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Experience the future of venture capital
          </p>
        </div>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}

// Mobile sidebar component (for Sheet)
function MobileSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
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
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 size-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>

          <Separator />

          <div className="space-y-1">
            <h4 className="px-2 text-sm font-medium text-muted-foreground">Quick Actions</h4>
            {secondaryNavItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                className="w-full justify-start"
                asChild
              >
                <Link href={item.href}>
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
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
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
          className="mt-2 w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 size-4" />
          Log out
        </Button>
      </div>
    </div>
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
export function ShadcnAppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthGuard>
        <UnifiedAISystem>
          <SidebarProvider>
            <div className="relative flex min-h-screen flex-col">
              {/* Desktop Layout */}
              <div className="hidden md:flex">
                <AppSidebar />
                <div className="flex-1 flex flex-col">
                  <AppHeader />
                  <main className="flex-1">
                    <div className="container py-6">
                      {children}
                    </div>
                  </main>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden flex flex-col min-h-screen">
                <AppHeader />
                <main className="flex-1">
                  <div className="container py-6">
                    {children}
                  </div>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </UnifiedAISystem>
      </AuthGuard>
    </ThemeProvider>
  )
}

// Add missing import
import { useRouter } from "next/navigation"