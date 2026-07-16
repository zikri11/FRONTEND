import {
  LayoutDashboard,
  Server,
  Router,
  Package,
  Ticket,
  Bot,
  History,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  Code,
  Key,
  BookOpen,
  Users,
  ReceiptText,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Pilih router',
      logo: Command,
      plan: 'Belum ada router',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'Menu',
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'Transaksi POS',
          url: '/pos-transactions',
          icon: ReceiptText,
        },
        {
          title: 'Kelola Teknisi',
          url: '/technicians',
          icon: Users,
        },
        {
          title: 'Server',
          icon: Server,
          items: [
            {
              title: 'Router',
              url: '/servers',
              icon: Router,
            },
            {
              title: 'Profile',
              url: '/profiles',
              icon: Package,
            },
            {
              title: 'Voucher',
              url: '/vouchers',
              icon: Ticket,
            },
          ],
        },
        {
          title: 'Developer',
          icon: Code,
          items: [
            {
              title: 'Kelola Key',
              url: '/developer/keys',
              icon: Key,
            },
            {
              title: 'Dokumentasi API',
              url: '/developer/docs',
              icon: BookOpen,
            },
          ],
        },
        {
          title: 'Tanya AI',
          url: '/chats',
          icon: Bot,
        },
        {
          title: 'Riwayat Aktivitas',
          url: '/activity',
          icon: History,
        },
      ],
    },
  ],
}
