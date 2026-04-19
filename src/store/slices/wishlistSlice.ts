import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface WishlistItem {
  productId: string
  variantId?: string
  size?: string
  color?: string
}

interface WishlistState {
  items: WishlistItem[]
  /** Legacy: kept for backward compat with any existing usage */
  productIds: string[]
}

const initialState: WishlistState = { items: [], productIds: [] }

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<WishlistItem>) {
      const { productId, variantId } = action.payload
      const exists = state.items.some(
        (i) => i.productId === productId && i.variantId === variantId
      )
      if (!exists) {
        state.items.push(action.payload)
        if (!state.productIds.includes(productId)) {
          state.productIds.push(productId)
        }
      }
    },
    addToWishlist(state, action: PayloadAction<string>) {
      if (!state.productIds.includes(action.payload)) {
        state.productIds.push(action.payload)
        state.items.push({ productId: action.payload })
      }
    },
    removeFromWishlist(state, action: PayloadAction<string>) {
      state.productIds = state.productIds.filter(id => id !== action.payload)
      state.items = state.items.filter(i => i.productId !== action.payload)
    },
    toggleWishlist(state, action: PayloadAction<string>) {
      const idx = state.productIds.indexOf(action.payload)
      if (idx === -1) {
        state.productIds.push(action.payload)
        state.items.push({ productId: action.payload })
      } else {
        state.productIds.splice(idx, 1)
        state.items = state.items.filter(i => i.productId !== action.payload)
      }
    },
  },
})

export const { addItem, addToWishlist, removeFromWishlist, toggleWishlist } = wishlistSlice.actions
export default wishlistSlice.reducer
