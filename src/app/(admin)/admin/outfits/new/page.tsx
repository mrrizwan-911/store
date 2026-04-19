import { OutfitBuilder } from '@/components/admin/OutfitBuilder'

export default function NewOutfitPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-playfair font-bold">Create New Outfit</h1>
      </div>
      <OutfitBuilder />
    </div>
  )
}
