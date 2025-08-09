import {
  IconCoin,
  IconLayoutDashboard,
  IconNotification,
  IconSettings,
  IconTool,
  IconUser,
  IconUsers,
} from "@tabler/icons-react"
import { 
  AudioWaveform, 
  GalleryVerticalEnd,
  Building2,
  TrendingUp,
  FileText,
  Briefcase,
  Target,
  PieChart,
  MessageSquare,
  Database,
  StickyNote,
  BarChart3,
  ArrowRightLeft,
  TrendingDown,
  Calculator,
  Phone,
  Send,
  ClipboardList,
  Bell,
  Bot,
  Shield,
  Activity,
  Sparkles,
  Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { type SidebarData } from "../types"

export const sidebarData: SidebarData = {
  user: {
    name: "VC Partner",
    email: "partner@redpillvc.com",
    avatar: "/avatars/avatar-1.png",
  },
  teams: [
    {
      name: "RedPill VC",
      logo: ({ className }: { className: string }) => (
        <Logo className={cn("invert dark:invert-0", className)} />
      ),
      plan: "VC CRM Platform",
    },
    {
      name: "Fund I",
      logo: Building2,
      plan: "$50M Fund",
    },
    {
      name: "Fund II",
      logo: TrendingUp,
      plan: "$100M Fund",
    },
  ],
  navGroups: [
    {
      title: "📂 Core",
      items: [
        {
          title: "AI Discovery",
          url: "/discovery",
          icon: Sparkles,
        },
        {
          title: "Founder Radar",
          url: "/discovery/people",
          icon: Users,
        },
        {
          title: "GP Dashboard",
          url: "/gp-dashboard",
          icon: BarChart3,
        },
      ],
    },
    {
      title: "🗂️ Portfolio", 
      items: [
        {
          title: "Portfolio Overview",
          url: "/portfolio",
          icon: Building2,
        },
        {
          title: "Companies",
          url: "/companies", 
          icon: Briefcase,
        },
        {
          title: "Portfolio Analytics",
          url: "/gp-dashboard?tab=portfolio-analytics",
          icon: Activity,
        },
      ],
    },
    {
      title: "🔄 Deal Flow",
      items: [
        {
          title: "Pipeline",
          url: "/dealflow",
          icon: Target,
        },
        {
          title: "Talent Network",
          url: "/talent",
          icon: Users,
        },
        {
          title: "Memos & Notes",
          url: "/notes",
          icon: StickyNote,
        },
        {
          title: "Deal Flow Analytics",
          url: "/gp-dashboard?tab=deal-flow",
          icon: FileText,
        },
        {
          title: "Market Intelligence",
          url: "/gp-dashboard?tab=market-intelligence",
          icon: TrendingUp,
        },
      ],
    },
    {
      title: "📈 Investments & LP",
      items: [
        {
          title: "Fund Performance",
          url: "/gp-dashboard?tab=fund-performance",
          icon: PieChart,
        },
        {
          title: "LP Reporting",
          url: "/gp-dashboard?tab=lp-reporting", 
          icon: Calculator,
        },
        {
          title: "Risk & Compliance",
          url: "/gp-dashboard?tab=risk-compliance",
          icon: Shield,
        },
      ],
    },
    {
      title: "⚙️ Operations",
      items: [
        {
          title: "Operations & Compliance",
          url: "/gp-dashboard?tab=operations",
          icon: ClipboardList,
        },
        {
          title: "Due Diligence",
          url: "/due-diligence",
          icon: FileText,
        },
        {
          title: "Templates & Snippets",
          url: "/templates",
          icon: StickyNote,
        },
        {
          title: "Notifications & Alerts",
          url: "/notifications",
          icon: Bell,
        },
      ],
    },
    {
      title: "🛠️ System", 
      items: [
        {
          title: "Data Sources",
          icon: Database,
          items: [
            {
              title: "OpenBB Integration",
              url: "/data-sources/openbb",
            },
            {
              title: "Market Data", 
              url: "/data-sources/market",
            },
            {
              title: "News & Research",
              url: "/data-sources/news",
            },
          ],
        },
        {
          title: "Team & Access",
          url: "/settings/team",
          icon: IconUsers,
        },
        {
          title: "Settings",
          icon: IconSettings,
          items: [
            {
              title: "General",
              icon: IconTool,
              url: "/settings",
            },
            {
              title: "Profile",
              icon: IconUser,
              url: "/settings/profile",
            },
            {
              title: "Fund Management",
              icon: IconCoin,
              url: "/settings/fund",
            },
            {
              title: "Notifications",
              icon: IconNotification,
              url: "/settings/notifications",
            },
          ],
        },
      ],
    },
  ],
}
