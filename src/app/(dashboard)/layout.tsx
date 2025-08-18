import { RoleBasedSidebar } from '@/components/dashboard/role-based-sidebar'
import { RoleBasedHeader } from '@/components/dashboard/role-based-header'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <RoleBasedSidebar />
      <SidebarInset>
        <RoleBasedHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}