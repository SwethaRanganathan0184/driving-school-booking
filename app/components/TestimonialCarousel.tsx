'use client'

import { useState, useEffect } from 'react'

// TODO: replace with real student testimonials before launch.
// Fabricated reviews are a real legal/trust risk — don't ship these as-is.
const TESTIMONIALS = [
  { quote: 'Placeholder — swap in a real quote from a student.', name: 'Verified student' },
  { quote: 'Placeholder — swap in a real quote from a student.', name: 'Verified student' },
  { quote: 'Placeholder — swap in a real quote from a student.', name: 'Verified student' },
]

export default function TestimonialCarousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % TESTIMONIALS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl p-10 text-center min-h-[160px] flex flex-col justify-center">
        <p className="text-lg text-[#1A1D29] leading-relaxed">
          &ldquo;{TESTIMONIALS[index].quote}&rdquo;
        </p>
        <p className="mt-4 text-sm text-[#47526B]">— {TESTIMONIALS[index].name}</p>
      </div>
      <div className="flex justify-center gap-2 mt-5">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Show testimonial ${i + 1}`}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === index ? 'bg-[#B8912F]' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  )
}