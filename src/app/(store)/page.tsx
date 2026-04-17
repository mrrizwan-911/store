import { HeroBanner } from '@/components/store/home/HeroBanner'
import { CategoryTiles } from '@/components/store/home/CategoryTiles'
import { FeaturedProducts } from '@/components/store/home/FeaturedProducts'
import { NewArrivalsStrip } from '@/components/store/home/NewArrivalsStrip'
import { LookbookTeaser } from '@/components/store/home/LookbookTeaser'
import { NewsletterSection } from '@/components/store/home/NewsletterSection'

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
