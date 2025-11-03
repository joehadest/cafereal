"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

type Category = {
  id: string
  name: string
}

export function CategoryNavBar({
  categories,
  activeCategory,
  onCategoryClick,
}: {
  categories: Category[]
  activeCategory: string | null
  onCategoryClick: (categoryId: string) => void
}) {
  const navRef = useRef<HTMLDivElement>(null)
  const activeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (activeButtonRef.current && navRef.current) {
      const button = activeButtonRef.current
      const nav = navRef.current
      const buttonLeft = button.offsetLeft
      const buttonWidth = button.offsetWidth
      const navWidth = nav.offsetWidth
      const scrollLeft = buttonLeft - navWidth / 2 + buttonWidth / 2

      nav.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      })
    }
  }, [activeCategory])

  return (
    <div className="sticky top-[48px] sm:top-[76px] z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-md animate-in slide-in-from-top duration-300">
      <div
        ref={navRef}
        className="container mx-auto px-2 sm:px-4 py-2 overflow-x-auto scrollbar-hide"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div className="flex gap-2 min-w-max">
          {categories.map((category) => {
            const isActive = activeCategory === category.id
            return (
              <Button
                key={category.id}
                ref={isActive ? activeButtonRef : null}
                onClick={() => onCategoryClick(category.id)}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={`
                  whitespace-nowrap transition-all duration-300 flex-shrink-0
                  ${
                    isActive
                      ? "bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow-lg scale-105 border-slate-600"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:scale-105"
                  }
                `}
              >
                {category.name}
              </Button>
            )
          })}
        </div>
      </div>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
