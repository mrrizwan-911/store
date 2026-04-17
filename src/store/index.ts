import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import createWebStorage from 'redux-persist/lib/storage/createWebStorage'
import cartReducer from './slices/cartSlice'
import authReducer from './slices/authSlice'
import wishlistReducer from './slices/wishlistSlice'

// Create a fallback storage for SSR
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null)
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value)
    },
    removeItem(_key: string) {
      return Promise.resolve()
    },
  }
}

const storage = typeof window !== 'undefined' ? createWebStorage('local') : createNoopStorage()

const rootReducer = combineReducers({
  cart: cartReducer,
  auth: authReducer,
  wishlist: wishlistReducer,
})

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['cart', 'auth', 'wishlist'], // Persist these slices
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
