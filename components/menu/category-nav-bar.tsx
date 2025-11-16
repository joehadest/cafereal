"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

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
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

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

  useEffect(() => {
    const checkScroll = () => {
      if (navRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = navRef.current
        setShowLeftArrow(scrollLeft > 0)
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
      }
    }

    checkScroll()
    const nav = navRef.current
    if (nav) {
      nav.addEventListener("scroll", checkScroll)
      window.addEventListener("resize", checkScroll)
      return () => {
        nav.removeEventListener("scroll", checkScroll)
        window.removeEventListener("resize", checkScroll)
      }
    }
  }, [categories])

  const scroll = (direction: "left" | "right") => {
    if (navRef.current) {
      const scrollAmount = 200
      navRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="sticky top-[48px] sm:top-[76px] z-30 bg-gradient-to-b from-white via-white to-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-lg animate-in slide-in-from-top duration-300">
      <div className="relative container mx-auto">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-10 px-2 sm:px-4 bg-gradient-to-r from-white via-white/90 to-transparent hover:from-slate-50 transition-all duration-300 flex items-center"
            aria-label="Scroll left"
          >
            <div className="p-1.5 sm:p-2 bg-white rounded-full shadow-md border border-slate-200 hover:shadow-lg hover:scale-110 transition-all duration-300">
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
            </div>
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-10 px-2 sm:px-4 bg-gradient-to-l from-white via-white/90 to-transparent hover:from-slate-50 transition-all duration-300 flex items-center"
            aria-label="Scroll right"
          >
            <div className="p-1.5 sm:p-2 bg-white rounded-full shadow-md border border-slate-200 hover:shadow-lg hover:scale-110 transition-all duration-300">
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
            </div>
          </button>
        )}

        <div
          ref={navRef}
          className="px-2 sm:px-6 md:px-8 py-3 sm:py-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <div className="flex gap-2 sm:gap-3 min-w-max">
            {categories.map((category, index) => {
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
                    text-xs sm:text-sm font-medium
                    px-3 sm:px-4 md:px-5 py-2 sm:py-2.5
                    rounded-full
                    animate-in fade-in slide-in-from-bottom duration-500
                    ${
                      isActive
                        ? "bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 text-white shadow-xl scale-105 border-0 hover:from-slate-700 hover:via-slate-600 hover:to-slate-700 hover:shadow-2xl hover:scale-110"
                        : "bg-white/80 backdrop-blur-sm text-slate-700 border-slate-200/80 hover:bg-slate-50 hover:border-slate-400 hover:shadow-md hover:scale-105 active:scale-95"
                    }
                  `}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {category.name}
                </Button>
              )
            })}
          </div>
        </div>
      </div>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
