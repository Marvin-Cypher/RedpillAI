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
  StickyNote
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
      title: "Core",
      items: [
        {
          title: "Dashboard",
          icon: IconLayoutDashboard,
          items: [
            {
              title: "Overview",
              url: "/",
            },
            {
              title: "GP Dashboard",
              url: "/gp-dashboard",
            },
            {
              title: "Portfolio Analytics",
              url: "/dashboard-portfolio",
            },
            {
              title: "Fund Performance",
              url: "/dashboard-fund",
            },
          ],
        },
        {
          title: "Deal Flow",
          url: "/dealflow",
          icon: Target,
        },
        {
          title: "Portfolio",
          url: "/portfolio",
          icon: Building2,
        },
        {
          title: "Companies",
          url: "/companies",
          icon: Briefcase,
        },
        {
          title: "Notes & Memos",
          url: "/notes",
          icon: StickyNote,
        },
      ],
    },
    {
      title: "Investment Management",
      items: [
        {
          title: "Due Diligence",
          icon: FileText,
          items: [
            {
              title: "Active Reviews",
              url: "/due-diligence/active",
            },
            {
              title: "Templates",
              url: "/due-diligence/templates",
            },
            {
              title: "AI Research",
              url: "/due-diligence/ai-research",
            },
          ],
        },
        {
          title: "Market Intelligence",
          url: "/market-intelligence",
          icon: TrendingUp,
        },
        {
          title: "Fund Analytics",
          url: "/fund-analytics",
          icon: PieChart,
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          title: "AI Assistant",
          url: "/ai-chat",
          icon: MessageSquare,
        },
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
              title: "Team & Access",
              icon: IconUsers,
              url: "/settings/team",
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
