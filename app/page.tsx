import Journey from './components/home/Journey'
import { CallToAction, Faq, Features, Hero, Pricing, SectionHeading, Testimonials } from './components/home/HomeSections'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Features />

      <section className="px-4 sm:px-6 py-20" aria-labelledby="how-it-works">
        <div className="max-w-6xl mx-auto">
          <SectionHeading id="how-it-works" title="How it works" />
          <Journey />
        </div>
      </section>

      <Pricing />
      <Testimonials />
      <Faq />
      <CallToAction />
    </main>
  )
}
