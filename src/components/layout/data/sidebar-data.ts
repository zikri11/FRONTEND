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
  CreditCard,
  Layers,
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
          title: 'Kelola Owner',
          url: '/users',
          icon: Users,
        },
        {
          title: 'Kelola Plan',
          url: '/plans',
          icon: Layers,
        },
        {
          title: 'Kelola Router',
          url: '/routers',
          icon: Router,
        },
        {
          title: 'Transaksi POS',
          url: '/pos-transactions',
          icon: ReceiptText,
        },
        {
          title: 'Langganan',
          url: '/billing',
          icon: CreditCard,
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
              title: 'Riwayat POS',
              url: '/pos-transactions',
              icon: ReceiptText,
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

// Sidebar khusus SUPER_ADMIN — grup terstruktur (Overview / Management / Tools)
// dengan label item ringkas.
export const superAdminNavGroups: SidebarData['navGroups'] = [
  {
    title: 'Overview',
    items: [{ title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Management',
    items: [
      { title: 'User', url: '/users', icon: Users },
      { title: 'Router', url: '/routers', icon: Router },
      { title: 'Paket Langganan', url: '/plans', icon: Layers },
    ],
  },
  {
    title: 'Tools',
    items: [{ title: 'AI Assistant', url: '/chats', icon: Bot }],
  },
]

// Sidebar khusus TEKNISI — grup terstruktur (Overview / Hotspot / Developer)
// dengan grup terakhir tanpa judul berisi item mandiri. Selaras gaya OWNER.
export const technicianNavGroups: SidebarData['navGroups'] = [
  {
    title: 'Overview',
    items: [{ title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Hotspot',
    items: [
      { title: 'Router', url: '/servers', icon: Router },
      { title: 'Profile', url: '/profiles', icon: Package },
      { title: 'Voucher', url: '/vouchers', icon: Ticket },
    ],
  },
  {
    title: 'Developer',
    items: [
      { title: 'Kelola Key', url: '/developer/keys', icon: Key },
      { title: 'Riwayat POS', url: '/pos-transactions', icon: ReceiptText },
      { title: 'Dokumentasi API', url: '/developer/docs', icon: BookOpen },
    ],
  },
  {
    title: '',
    items: [
      { title: 'AI Assistant', url: '/chats', icon: Bot },
      { title: 'Riwayat Aktivitas', url: '/activity', icon: History },
    ],
  },
]

// Sidebar khusus OWNER — grup terstruktur. Grup terakhir tanpa judul
// (dipisah garis) berisi item mandiri.
export const ownerNavGroups: SidebarData['navGroups'] = [
  {
    title: 'Overview',
    items: [{ title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Menu',
    items: [
      { title: 'Transaksi POS', url: '/pos-transactions', icon: ReceiptText },
      { title: 'Langganan', url: '/billing', icon: CreditCard },
      { title: 'Teknisi', url: '/technicians', icon: Users },
    ],
  },
  {
    title: '',
    items: [
      { title: 'AI Assistant', url: '/chats', icon: Bot },
      { title: 'Riwayat Aktivitas', url: '/activity', icon: History },
    ],
  },
]
