import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function useSlidesPerView() {
  const [perView, setPerView] = useState(1)

  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1024) setPerView(4)
      else if (window.innerWidth >= 640) setPerView(2)
      else setPerView(1)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return perView
}

export default function FeaturesCarousel({ features, icons, iconClasses }) {
  const perView = useSlidesPerView()
  const maxIndex = Math.max(0, Math.ceil(features.length / perView) - 1)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex))
  }, [maxIndex])

  const go = useCallback(
    (dir) => {
      setIndex((i) => {
        if (dir < 0) return i <= 0 ? maxIndex : i - 1
        return i >= maxIndex ? 0 : i + 1
      })
    },
    [maxIndex]
  )

  useEffect(() => {
    if (paused) return undefined
    const timer = setInterval(() => go(1), 6000)
    return () => clearInterval(timer)
  }, [go, paused])

  const slideCount = maxIndex + 1

  return (
    <div
      className="lp-features-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative">
        <button
          type="button"
          className="lp-carousel-btn lp-carousel-btn--prev"
          onClick={() => go(-1)}
          aria-label="Previous features"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="overflow-hidden mx-10 sm:mx-12">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${index * 100}%)`,
            }}
          >
            {Array.from({ length: slideCount }, (_, slideIdx) => (
              <div
                key={slideIdx}
                className="min-w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-0.5"
              >
                {features
                  .slice(slideIdx * perView, slideIdx * perView + perView)
                  .map((f, i) => {
                    const globalIdx = slideIdx * perView + i
                    const Icon = icons[globalIdx]
                    return (
                      <div key={f.title} className="lp-card rounded-2xl p-5 h-full">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconClasses[globalIdx]}`}
                        >
                          <Icon size={20} />
                        </div>
                        <h3 className="font-semibold lp-hero-title mb-2">{f.title}</h3>
                        <p className="text-sm lp-muted leading-relaxed">{f.desc}</p>
                      </div>
                    )
                  })}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="lp-carousel-btn lp-carousel-btn--next"
          onClick={() => go(1)}
          aria-label="Next features"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: slideCount }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`lp-carousel-dot ${i === index ? 'lp-carousel-dot--active' : ''}`}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
