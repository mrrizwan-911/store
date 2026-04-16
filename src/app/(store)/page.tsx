import { HeroBanner } from '@/components/store/HeroBanner'
import { CategoryTiles } from '@/components/store/CategoryTiles'
import { FeaturedProducts } from '@/components/store/FeaturedProducts'
import { NewArrivalsStrip } from '@/components/store/NewArrivalsStrip'
import { LookbookTeaser } from '@/components/store/LookbookTeaser'
import { NewsletterSection } from '@/components/store/NewsletterSection'

export default function Homepage() {
  return (
    <main>
      <HeroBanner />
      <CategoryTiles />
      <FeaturedProducts />
      <NewArrivalsStrip />
      <LookbookTeaser />
      <NewsletterSection />
    </main>
  )
}
