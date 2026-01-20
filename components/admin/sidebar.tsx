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
  Smartphone,
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
    href: "/staff/orders",
    label: "Anotar Pedidos",
    icon: Smartphone,
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 hover:scale-110 hover:shadow-xl transition-all duration-300 cursor-pointer"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="h-6 w-6 text-slate-700" /> : <Menu className="h-6 w-6 text-slate-700" />}
      </button>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
        fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-white via-white to-slate-50/50 
        border-r border-slate-200/80 shadow-2xl flex flex-col z-40
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="p-6 pt-16 lg:pt-6 border-b border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-slate-50">
          <div className="flex items-center gap-3 animate-in fade-in duration-700">
            {restaurantLogo ? (
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md hover:scale-110 hover:shadow-lg transition-all duration-300 flex-shrink-0 border-2 border-slate-200">
                <Image
                  src={restaurantLogo}
                  alt={restaurantName || "Logo"}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 p-2.5 rounded-xl shadow-md hover:scale-110 hover:shadow-lg transition-all duration-300 flex-shrink-0">
                <UtensilsCrossed className="h-6 w-6 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base text-slate-900 truncate">{restaurantName || "Admin Panel"}</h2>
              <p className="text-xs text-slate-600 truncate mt-0.5">{user.email}</p>
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
                  className={`w-full justify-start transition-all duration-300 animate-in fade-in slide-in-from-left cursor-pointer rounded-xl ${
                    isActive
                      ? "bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 text-white hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 shadow-lg scale-[1.02] font-semibold"
                      : "text-slate-700 hover:bg-slate-100/80 hover:scale-[1.02] hover:shadow-md font-medium"
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Icon className={`h-5 w-5 mr-3 transition-transform duration-300 ${isActive ? "scale-110" : ""}`} />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-slate-50">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 bg-white hover:scale-[1.02] hover:shadow-md transition-all duration-300 cursor-pointer rounded-xl font-medium"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sair
          </Button>
        </div>
      </aside>
    </>
  )
}
