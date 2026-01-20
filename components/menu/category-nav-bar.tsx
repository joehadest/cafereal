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
    <div className="bg-white/98 backdrop-blur-sm border-b border-slate-200/80">
      <div className="relative container mx-auto">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-10 px-2 sm:px-4 bg-gradient-to-r from-white via-white/95 to-transparent hover:from-slate-50 transition-colors flex items-center"
            aria-label="Scroll left"
          >
            <div className="p-2 bg-white rounded-full shadow-md border border-slate-200 hover:shadow-lg hover:scale-110 transition-all duration-200">
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
            </div>
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-10 px-2 sm:px-4 bg-gradient-to-l from-white via-white/95 to-transparent hover:from-slate-50 transition-colors flex items-center"
            aria-label="Scroll right"
          >
            <div className="p-2 bg-white rounded-full shadow-md border border-slate-200 hover:shadow-lg hover:scale-110 transition-all duration-200">
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
            </div>
          </button>
        )}

        <div
          ref={navRef}
          className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <div className="flex gap-2 sm:gap-3 min-w-max">
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
                    text-xs sm:text-sm font-semibold
                    px-4 sm:px-5 md:px-6 py-2.5 sm:py-3
                    rounded-full
                    ${
                      isActive
                        ? "bg-gradient-to-r from-slate-700 to-slate-600 text-white border-0 hover:from-slate-800 hover:to-slate-700 shadow-md hover:shadow-lg hover:scale-105"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm hover:scale-105"
                    }
                  `}
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
