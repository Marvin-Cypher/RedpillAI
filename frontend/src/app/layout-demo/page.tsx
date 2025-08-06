import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react"

export default function LayoutDemoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shadcn/UI Layout Demo</h1>
        <p className="text-muted-foreground">
          Experience the new CRM dashboard shell built with shadcn/ui components.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total AUM</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.4B</div>
            <p className="text-xs text-muted-foreground">+20.1% from last quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+3 new this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Companies</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">8 new investments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">2 new hires</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New Layout Features</CardTitle>
            <CardDescription>
              Key improvements in the shadcn-based dashboard shell
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">New</Badge>
              <span className="text-sm">Shadcn/UI Sidebar with collapsible navigation</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">New</Badge>
              <span className="text-sm">Responsive header with user dropdown menu</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">New</Badge>
              <span className="text-sm">Mobile-first design with Sheet drawer</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">New</Badge>
              <span className="text-sm">Consistent theme and styling system</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">New</Badge>
              <span className="text-sm">Professional CRM navigation structure</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navigation Test</CardTitle>
            <CardDescription>
              Try the navigation links to test the new layout across pages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <Button variant="outline" asChild>
                <a href="/dashboard">Dashboard</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/dealflow">Deal Flow</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/portfolio">Portfolio</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/shadcn-test">Shadcn Components Test</a>
              </Button>
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                <strong>Mobile Testing:</strong> Resize your browser or use developer tools 
                to test the responsive mobile navigation with hamburger menu.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}