import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { MenuItem, CartItem, Order, Promo, AppSettings, OrderStatus, MiscCost } from '../data/types'
import { dummyMenuItems, dummyOrders, dummyPromos, defaultSettings } from '../data/dummy'

interface AppState {
  isAdminLoggedIn: boolean
  menuItems: MenuItem[]
  orders: Order[]
  promos: Promo[]
  settings: AppSettings
  cart: CartItem[]
  appliedPromo: Promo | null
}

type Action =
  | { type: 'SET_INITIAL_DATA'; payload: { menuItems: MenuItem[]; orders: Order[]; promos: Promo[]; settings: AppSettings } }
  | { type: 'LOGIN_ADMIN' }
  | { type: 'LOGOUT_ADMIN' }
  | { type: 'ADD_MENU_ITEM'; payload: MenuItem }
  | { type: 'UPDATE_MENU_ITEM'; payload: MenuItem }
  | { type: 'DELETE_MENU_ITEM'; payload: string }
  | { type: 'UPDATE_STOCK'; payload: { id: string; stock: number } }
  | { type: 'ADD_TO_CART'; payload: { item: MenuItem; quantity: number; notes?: string; spiceLevel?: string } }
  | { type: 'UPDATE_CART_ITEM'; payload: { index: number; notes?: string; spiceLevel?: string } }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { index: number; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: number }
  | { type: 'CLEAR_CART' }
  | { type: 'PLACE_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { id: string; status: OrderStatus } }
  | { type: 'ADD_PROMO'; payload: Promo }
  | { type: 'UPDATE_PROMO'; payload: Promo }
  | { type: 'DELETE_PROMO'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'UPDATE_MISC_COSTS'; payload: MiscCost[] }
  | { type: 'APPLY_PROMO'; payload: Promo | null }

const STORAGE_KEY = 'warung_sari_state'

function loadState(): Partial<AppState> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return {}
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      menuItems: state.menuItems,
      orders: state.orders,
      promos: state.promos,
      settings: state.settings,
    }))
  } catch {}
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_INITIAL_DATA':
      return {
        ...state,
        menuItems: action.payload.menuItems,
        orders: action.payload.orders,
        promos: action.payload.promos,
        settings: action.payload.settings,
      }

    case 'LOGIN_ADMIN': return { ...state, isAdminLoggedIn: true }
    case 'LOGOUT_ADMIN': return { ...state, isAdminLoggedIn: false }

    case 'ADD_MENU_ITEM': return { ...state, menuItems: [...state.menuItems, action.payload] }
    case 'UPDATE_MENU_ITEM':
      return { 
        ...state, 
        menuItems: state.menuItems.map(m => 
          (m._id === action.payload._id || m.id === action.payload.id) ? action.payload : m
        ) 
      }
    case 'DELETE_MENU_ITEM':
      return { 
        ...state, 
        menuItems: state.menuItems.filter(m => m._id !== action.payload && m.id !== action.payload) 
      }
    case 'UPDATE_STOCK':
      return {
        ...state,
        menuItems: state.menuItems.map(m =>
          (m._id === action.payload.id || m.id === action.payload.id) 
            ? { ...m, stock: Math.max(0, action.payload.stock) } 
            : m
        )
      }

    case 'ADD_TO_CART': {
      const existing = state.cart.find(c =>
        (c.menuItem._id === action.payload.item._id || c.menuItem.id === action.payload.item.id) &&
        c.notes === action.payload.notes &&
        c.spiceLevel === action.payload.spiceLevel
      )
      if (existing) {
        return {
          ...state,
          cart: state.cart.map(c =>
            (c.menuItem._id === action.payload.item._id || c.menuItem.id === action.payload.item.id) && c.notes === action.payload.notes && c.spiceLevel === action.payload.spiceLevel
              ? { ...c, quantity: c.quantity + action.payload.quantity }
              : c
          )
        }
      }
      return {
        ...state,
        cart: [...state.cart, {
          menuItem: action.payload.item,
          quantity: action.payload.quantity,
          notes: action.payload.notes,
          spiceLevel: action.payload.spiceLevel
        }]
      }
    }
    case 'UPDATE_CART_ITEM':
      return {
        ...state,
        cart: state.cart.map((c, i) =>
          i === action.payload.index
            ? { ...c, notes: action.payload.notes, spiceLevel: action.payload.spiceLevel }
            : c
        )
      }
    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart.map((c, i) =>
          i === action.payload.index ? { ...c, quantity: action.payload.quantity } : c
        ).filter(c => c.quantity > 0)
      }
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter((c, i) => i !== action.payload) }
    case 'CLEAR_CART': return { ...state, cart: [], appliedPromo: null }

    case 'PLACE_ORDER':
      return {
        ...state,
        orders: [action.payload, ...state.orders],
        menuItems: state.menuItems.map(m => {
          const orderItem = action.payload.items.find(i => i.menuId === m._id || i.menuId === m.id)
          if (orderItem) {
            const newStock = Math.max(0, m.stock - orderItem.quantity)
            return {
              ...m,
              stock: newStock,
              available: newStock > 0,
              orderCount: (m.orderCount || 0) + orderItem.quantity
            }
          }
          return m
        })
      }
    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map(o => 
          (o._id === action.payload.id || o.id === action.payload.id) 
            ? { ...o, status: action.payload.status } 
            : o
        )
      }

    case 'ADD_PROMO': return { ...state, promos: [...state.promos, action.payload] }
    case 'UPDATE_PROMO':
      return { 
        ...state, 
        promos: state.promos.map(p => 
          (p._id === action.payload._id || p.id === action.payload.id) ? action.payload : p
        ) 
      }
    case 'DELETE_PROMO':
      return { 
        ...state, 
        promos: state.promos.filter(p => p._id !== action.payload && p.id !== action.payload) 
      }

    case 'UPDATE_SETTINGS': return { ...state, settings: { ...state.settings, ...action.payload } }
    case 'UPDATE_MISC_COSTS':
      return { ...state, settings: { ...state.settings, miscCosts: action.payload } }
    case 'APPLY_PROMO': return { ...state, appliedPromo: action.payload }

    default: return state
  }
}

const saved = loadState()
const initialState: AppState = {
  isAdminLoggedIn: false,
  menuItems: saved.menuItems ?? dummyMenuItems,
  orders: saved.orders ?? dummyOrders,
  promos: saved.promos ?? dummyPromos,
  settings: saved.settings ?? defaultSettings,
  cart: [],
  appliedPromo: null,
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    saveState(state)
  }, [state.menuItems, state.orders, state.promos, state.settings])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}