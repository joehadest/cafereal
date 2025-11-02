"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, UtensilsCrossed, Package, LayoutGrid, ClipboardList, LogOut, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const menuItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/categories",
    label: "Categorias",
    icon: LayoutGrid,
  },
  {
    href: "/admin/products",
    label: "Produtos",
    icon: Package,
  },
  {
    href: "/admin/tables",
    label: "Mesas",
    icon: UtensilsCrossed,
  },
  {
    href: "/admin/orders",
    label: "Pedidos",
    icon: ClipboardList,
  },
  {
    href: "/admin/settings",
    label: "Configurações",
    icon: Settings,
  },
]

export function AdminSidebar({ user }: { user: any }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-white to-purple-50/30 border-r border-purple-200 shadow-xl flex flex-col animate-in slide-in-from-left duration-500">
      <div className="p-6 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-transparent">
        <div className="flex items-center gap-3 animate-in fade-in duration-700">
          <div className="bg-gradient-to-br from-purple-600 to-purple-500 p-2 rounded-lg shadow-lg hover:scale-110 transition-transform duration-300">
            <UtensilsCrossed className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-purple-900">Admin Panel</h2>
            <p className="text-xs text-purple-700 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start transition-all duration-300 animate-in slide-in-from-left ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 hover:to-purple-600 shadow-lg scale-105"
                    : "text-purple-900 hover:bg-purple-50 hover:scale-105 hover:shadow-md"
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Icon className={`h-5 w-5 mr-3 ${isActive ? "" : "group-hover:scale-110 transition-transform"}`} />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-purple-200 bg-gradient-to-r from-purple-50 to-transparent">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start border-purple-300 text-purple-900 hover:bg-purple-50 hover:border-purple-500 bg-transparent hover:scale-105 hover:shadow-lg transition-all duration-300"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
