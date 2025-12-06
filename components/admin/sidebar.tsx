"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  UtensilsCrossed,
  Package,
  LayoutGrid,
  ClipboardList,
  LogOut,
  Settings,
  Menu,
  X,
  Store,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

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
    href: "/admin/counter",
    label: "Balcão",
    icon: Store,
  },
  {
    href: "/admin/settings",
    label: "Configurações",
    icon: Settings,
  },
]

export function AdminSidebar({ 
  user, 
  restaurantName, 
  restaurantLogo 
}: { 
  user: any
  restaurantName?: string
  restaurantLogo?: string | null
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-slate-200 hover:bg-slate-50 hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-pointer"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="h-6 w-6 text-slate-600" /> : <Menu className="h-6 w-6 text-slate-600" />}
      </button>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
        fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-white to-slate-50/30 
        border-r border-slate-200 shadow-xl flex flex-col z-40
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="p-6 pt-16 lg:pt-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-transparent">
          <div className="flex items-center gap-3 animate-in fade-in duration-700">
            {restaurantLogo ? (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 flex-shrink-0">
                <Image
                  src={restaurantLogo}
                  alt={restaurantName || "Logo"}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-600 to-slate-500 p-2 rounded-lg shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 flex-shrink-0">
                <UtensilsCrossed className="h-6 w-6 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-900 truncate">{restaurantName || "Admin Panel"}</h2>
              <p className="text-xs text-slate-700 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="cursor-pointer">
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start transition-all duration-300 animate-in fade-in slide-in-from-left cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-slate-600 to-slate-500 text-white hover:from-slate-700 hover:to-slate-600 shadow-lg scale-105"
                      : "text-slate-900 hover:bg-slate-50 hover:scale-105 hover:shadow-md"
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Icon className={`h-5 w-5 mr-3 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-transparent">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start border-slate-300 text-slate-900 hover:bg-slate-50 hover:border-slate-500 bg-transparent hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sair
          </Button>
        </div>
      </aside>
    </>
  )
}
