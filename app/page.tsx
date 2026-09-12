import Link from 'next/link'
import LogoMark from './components/LogoMark'
import Reveal from './components/Reveal'
import TestimonialCarousel from './components/TestimonialCarousel'

const FEATURES = [
  { title: 'Real roads, real confidence', body: 'Practice on the actual roads you\'ll drive every day, not a closed course.' },
  { title: 'Flexible timings', body: 'Morning and evening slots, so lessons fit around your day, not the other way around.' },
  { title: 'Pay after each class', body: 'No upfront payment. Settle up in person once you\'ve actually had the lesson.' },
  { title: 'Learn at your pace', body: 'Single classes to try it out, or a 10-class package if you\'re ready to commit.' },
]

const ABOUT_POINTS = [
  {
    title: 'Personal attention',
    body: 'Small enough that your instructor actually knows you, not a training conveyor belt.',
  },
  {
    title: 'Real-world roads',
    body: 'You\u2019ll learn on the actual streets you\u2019ll be driving on after you\u2019re licensed.',
  },
  {
    title: 'Transparent pricing',
    body: 'One simple rate per class. No hidden fees, no surprise charges.',
  },
]

const FAQ = [
  {
    q: 'How do I pay for classes?',
    a: 'Payment is collected in person after each class — a single class is billed right away, and a 10-class package is billed once all 10 are complete (or pro-rated if you cancel partway through).',
  },
  {
    q: 'Can I cancel a 10-class package partway through?',
    a: 'Yes. You only pay for the classes you\'ve actually completed — any remaining classes are cancelled with nothing owed for them.',
  },
  {
    q: 'What if I need to pick a different instructor?',
    a: 'You can browse and book with any available instructor from the "Find an instructor" page after signing up.',
  },
  {
    q: 'Do I need my own vehicle?',
    a: 'Details on this depend on the instructor — check with them directly when you book.',
  },
]

export default function HomePage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="bg-[#16213E] px-6 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-fade-up flex justify-center mb-7">
            <LogoMark className="w-14 h-14 text-[#B8912F]" />
          </div>
          <h1
            className="animate-fade-up text-white text-4xl sm:text-5xl font-[family-name:var(--font-manrope)] font-semibold tracking-tight"
            style={{ animationDelay: '0.1s' }}
          >
            DriveWise
          </h1>
          <p
            className="animate-fade-up text-[#B8912F] text-xs sm:text-sm uppercase tracking-[0.2em] mt-3"
            style={{ animationDelay: '0.2s' }}
          >
            Control the Wheel. Command the Road.
          </p>
          <p
            className="animate-fade-up text-white/70 text-lg sm:text-xl max-w-lg mx-auto mt-5"
            style={{ animationDelay: '0.3s' }}
          >
            Book lessons with a real instructor. Pick a slot that works, learn at your own pace.
          </p>
          <div
            className="animate-fade-up mt-9 flex flex-col sm:flex-row gap-3 justify-center"
            style={{ animationDelay: '0.4s' }}
          >
            <Link
              href="/signup"
              className="rounded-md bg-[#B8912F] text-[#16213E] font-medium px-7 py-3 hover:bg-[#A57F27] transition-colors"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-white/25 text-white font-medium px-7 py-3 hover:bg-white/10 transition-colors"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="px-6 py-16 bg-[#F7F8FA] border-b border-gray-200">
        <Reveal className="max-w-3xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-[family-name:var(--font-manrope)] font-semibold text-[#16213E] mb-4">
            About DriveWise
          </h2>
          <p className="text-center text-lg text-[#47526B] max-w-xl mx-auto mb-10">
            DriveWise was built to make learning to drive straightforward — real roads, a real
            instructor, and a booking process that stays out of your way. We&apos;re just
            getting started, which means every student gets real, individual attention instead
            of being one of thousands.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {ABOUT_POINTS.map((item) => (
              <div key={item.title} className="text-center">
                <h3 className="font-semibold text-[#16213E] font-[family-name:var(--font-manrope)] mb-1">
                  {item.title}
                </h3>
                <p className="text-base text-[#47526B]">{item.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Why choose us */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <h2 className="text-center text-2xl sm:text-3xl font-[family-name:var(--font-manrope)] font-semibold text-[#16213E] mb-12">
              Why learn with us
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} className={i % 2 === 1 ? 'sm:delay-100' : ''}>
                <div className="border-t-2 border-[#B8912F] pt-4">
                  <h3 className="font-semibold text-[#16213E] font-[family-name:var(--font-manrope)] mb-1">
                    {f.title}
                  </h3>
                  <p className="text-base text-[#47526B]">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20 bg-[#F7F8FA]">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <h2 className="text-center text-2xl sm:text-3xl font-[family-name:var(--font-manrope)] font-semibold text-[#16213E] mb-2">
              Simple pricing
            </h2>
            <p className="text-center text-base text-[#47526B] mb-12">
              One hour per class. No hidden fees.
            </p>
          </Reveal>
          <Reveal className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-7 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-[#16213E] font-[family-name:var(--font-manrope)] mb-1">
                Single class
              </h3>
              <p className="text-base text-[#47526B] mb-5">Try a lesson before committing.</p>
              <p className="text-4xl font-[family-name:var(--font-manrope)] font-semibold text-[#16213E]">
                ₹400
              </p>
              <p className="text-sm text-[#47526B] mt-1">pay after the class</p>
            </div>
            <div className="bg-white border-2 border-[#B8912F] rounded-lg p-7 hover:shadow-md transition-shadow">
              <p className="text-xs font-medium text-[#B8912F] uppercase tracking-wide mb-2">
                Most popular
              </p>
              <h3 className="font-semibold text-[#16213E] font-[family-name:var(--font-manrope)] mb-1">
                10-class package
              </h3>
              <p className="text-base text-[#47526B] mb-5">Best value if you're ready to commit.</p>
              <p className="text-4xl font-[family-name:var(--font-manrope)] font-semibold text-[#16213E]">
                ₹4,000
              </p>
              <p className="text-sm text-[#47526B] mt-1">
                pay after all 10, or only for classes completed if you cancel early
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <h2 className="text-center text-2xl sm:text-3xl font-[family-name:var(--font-manrope)] font-semibold text-[#16213E] mb-12">
              How it works
            </h2>
          </Reveal>
          <Reveal className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Sign up', body: 'Create an account with your email or Google.' },
              { step: '2', title: 'Pick a slot', body: 'Choose an instructor and a time that suits you.' },
              { step: '3', title: 'Learn, then pay', body: 'Take your class and settle up in person after.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-3 w-9 h-9 flex items-center justify-center rounded-full bg-[#16213E] text-white text-sm font-[family-name:var(--font-manrope)] font-semibold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-[#16213E] font-[family-name:var(--font-manrope)] mb-1">
                  {item.title}
                </h3>
                <p className="text-base text-[#47526B]">{item.body}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-20 bg-[#F7F8FA]">
        <Reveal>
          <h2 className="text-center text-2xl sm:text-3xl font-[family-name:var(--font-manrope)] font-semibold text-[#16213E] mb-12">
            What students say
          </h2>
          <TestimonialCarousel />
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-2xl mx-auto">
          <Reveal>
            <h2 className="text-center text-2xl sm:text-3xl font-[family-name:var(--font-manrope)] font-semibold text-[#16213E] mb-12">
              Frequently asked questions
            </h2>
          </Reveal>
          <Reveal className="space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="border border-gray-200 rounded-lg p-5 group">
                <summary className="font-semibold text-[#16213E] font-[family-name:var(--font-manrope)] cursor-pointer list-none flex items-center justify-between">
                  {item.q}
                  <span className="text-[#B8912F] group-open:rotate-45 transition-transform text-xl leading-none">
                    +
                  </span>
                </summary>
                <p className="text-base text-[#47526B] mt-3">{item.a}</p>
              </details>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#16213E] px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-3">
            <LogoMark className="w-8 h-8 text-[#B8912F]" />
          </div>
          <p className="text-white font-[family-name:var(--font-manrope)] font-semibold">DriveWise</p>
          <p className="text-white/50 text-sm mt-2">[Address — TODO]</p>
          <p className="text-white/50 text-sm mt-1">[Phone — TODO] · [Email — TODO]</p>
        </div>
      </footer>
    </main>
  )
}