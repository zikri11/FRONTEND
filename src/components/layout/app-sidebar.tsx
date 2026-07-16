import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
// import { AppTitle } from './app-title'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import { useAuthStore } from '@/stores/auth-store'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { user } = useAuthStore((state) => state.auth)

  const dynamicUser = {
    name: user?.name || 'User',
    email: user?.email || '',
    avatar: '/avatars/shadcn.jpg',
  }

  // SUPER_ADMIN & OWNER tidak terikat router terpilih — "Pilih Router" hanya
  // untuk TEKNISI; role lain menaruh profil (NavUser) di posisi atas.
  const isRouterScoped = user?.role === 'TEKNISI'

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        {isRouterScoped ? (
          <TeamSwitcher />
        ) : (
          <NavUser user={dynamicUser} />
        )}
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((group) => {
          const filteredItems = group.items.filter((item) => {
            if (user?.role === 'TEKNISI' && item.title === 'Kelola Teknisi') {
              return false
            }
            if (
              user?.role !== 'SUPER_ADMIN' &&
              (item.title === 'Kelola Owner' || item.title === 'Kelola Plan')
            ) {
              return false
            }
            if (
              user?.role === 'SUPER_ADMIN' &&
              ['Kelola Teknisi', 'Server', 'Developer', 'Riwayat Aktivitas'].includes(
                item.title
              )
            ) {
              return false
            }
            if (
              user?.role !== 'OWNER' &&
              (item.title === 'Transaksi POS' || item.title === 'Langganan')
            ) {
              return false
            }
            if (
              user?.role === 'OWNER' &&
              (item.title === 'Server' || item.title === 'Developer')
            ) {
              return false
            }
            return true
          })

          if (filteredItems.length === 0) return null

          return <NavGroup key={group.title} {...group} items={filteredItems} />
        })}
      </SidebarContent>
      {isRouterScoped && (
        <SidebarFooter>
          <NavUser user={dynamicUser} />
        </SidebarFooter>
      )}
      <SidebarRail />
    </Sidebar>
  )
}
