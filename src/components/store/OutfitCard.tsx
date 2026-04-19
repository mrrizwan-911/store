import Link from 'next/link'
import Image from 'next/image'

interface OutfitCardProps {
  outfit: any
}

export function OutfitCard({ outfit }: OutfitCardProps) {
  return (
    <Link href={`/lookbook/${outfit.id}`} className="group block border border-[#E5E5E5] bg-white transition-colors hover:border-[#000000]">
      <div className="relative aspect-[3/4] w-full bg-[#FAFAFA] overflow-hidden">
        {outfit.imageUrl ? (
          <Image
            src={outfit.imageUrl}
            alt={outfit.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#A3A3A3]">
            No Image
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="bg-white text-black px-6 py-3 font-medium uppercase tracking-wider text-sm shadow-sm transform translate-y-4 group-hover:translate-y-0 transition-all">
            View Look
          </span>
        </div>
      </div>
      <div className="p-4 text-center">
        <h3 className="font-playfair text-lg font-bold truncate">{outfit.title}</h3>
        <p className="text-sm text-[#737373] mt-1 uppercase tracking-widest text-xs">
          {outfit.season} · {outfit.gender}
        </p>
        <div className="mt-3 flex justify-between items-center text-sm border-t border-[#E5E5E5] pt-3">
          <span className="text-[#737373]">{outfit.itemCount} pieces</span>
          <span className="font-medium">PKR {outfit.totalPrice.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  )
}
