import { ChevronsUpDown, Plus, Server, ServerOff } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useServerStore } from '@/stores/server-store'

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { servers, activeServerId, setActiveServerId } = useServerStore()
  
  const activeServer = servers.find((s) => s.id === activeServerId)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                {activeServer ? <Server className='size-4' /> : <ServerOff className='size-4' />}
              </div>
              <div className='grid flex-1 text-start text-sm leading-tight'>
                <span className='truncate font-semibold'>
                  {activeServer ? activeServer.name : 'Belum ada router'}
                </span>
                <span className='truncate text-xs'>
                  {activeServer ? activeServer.host : 'Pilih / Tambah Router'}
                </span>
              </div>
              <ChevronsUpDown className='ms-auto' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-xs text-muted-foreground'>
              Pilih Router
            </DropdownMenuLabel>
            {servers.length > 0 ? (
              servers.map((server, index) => (
                <DropdownMenuItem
                  key={server.id}
                  onClick={() => setActiveServerId(server.id)}
                  className='gap-2 p-2 cursor-pointer'
                >
                  <div className='flex size-6 items-center justify-center rounded-sm border'>
                    <Server className='size-4 shrink-0' />
                  </div>
                  <div className='grid flex-1 leading-tight'>
                    <span className='truncate text-sm font-medium'>{server.name}</span>
                    <span className='truncate text-xs text-muted-foreground'>{server.host}</span>
                  </div>
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))
            ) : (
              <div className='p-2 text-xs text-muted-foreground'>
                Tidak ada router terdaftar.
              </div>
            )}
            <DropdownMenuSeparator />
            <Link to="/servers">
              <DropdownMenuItem className='gap-2 p-2 cursor-pointer'>
                <div className='flex size-6 items-center justify-center rounded-md border bg-background'>
                  <Plus className='size-4' />
                </div>
                <div className='font-medium text-muted-foreground'>Manajemen Router</div>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
