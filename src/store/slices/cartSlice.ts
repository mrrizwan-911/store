import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface CartItem {
  productId: string
  variantId?: string
  name: string
  price: number
  quantity: number
  imageUrl: string
  size?: string
  color?: string
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
}

const initialState: CartState = { items: [], isOpen: false }

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find(
        i => i.productId === action.payload.productId &&
             i.variantId === action.payload.variantId
      )
      if (existing) {
        existing.quantity += action.payload.quantity
      } else {
        state.items.push(action.payload)
      }
    },
    removeItem(state, action: PayloadAction<{ productId: string; variantId?: string }>) {
      state.items = state.items.filter(
        i => !(i.productId === action.payload.productId &&
               i.variantId === action.payload.variantId)
      )
    },
    updateQuantity(
      state,
      action: PayloadAction<{ productId: string; variantId?: string; quantity: number }>
    ) {
      const item = state.items.find(
        i => i.productId === action.payload.productId &&
             i.variantId === action.payload.variantId
      )
      if (item) item.quantity = action.payload.quantity
    },
    clearCart(state) {
      state.items = []
    },
    toggleCart(state) {
      state.isOpen = !state.isOpen
    },
    openCart(state) {
      state.isOpen = true
    },
    closeCart(state) {
      state.isOpen = false
    },
  },
})

export const { addItem, removeItem, updateQuantity, clearCart, toggleCart, openCart, closeCart } =
  cartSlice.actions
export default cartSlice.reducer
