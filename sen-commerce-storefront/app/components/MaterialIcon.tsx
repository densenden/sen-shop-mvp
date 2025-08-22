import React from 'react'

interface MaterialIconProps {
  icon: string
  className?: string
  size?: 'small' | 'medium' | 'large' | 'xlarge'
  filled?: boolean
}

const sizeMap = {
  small: 'text-base',
  medium: 'text-xl',
  large: 'text-2xl',
  xlarge: 'text-3xl'
}

export default function MaterialIcon({ 
  icon, 
  className = '', 
  size = 'medium',
  filled = false 
}: MaterialIconProps) {
  const sizeClass = sizeMap[size]
  
  return (
    <span 
      className={`material-symbols-outlined ${sizeClass} ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 100, 'GRAD' 0, 'opsz' 24`
      }}
    >
      {icon}
    </span>
  )
}

// Common icon mappings for easy reference
export const MaterialIcons = {
  // Shopping & Commerce
  shoppingCart: 'shopping_cart',
  shoppingBag: 'shopping_bag',
  addShoppingCart: 'add_shopping_cart',
  removeShoppingCart: 'remove_shopping_cart',
  
  // Downloads & Files
  download: 'download',
  downloadDone: 'download_done',
  downloading: 'downloading',
  fileDownload: 'file_download',
  cloudDownload: 'cloud_download',
  
  // Art & Creative
  palette: 'palette',
  brush: 'brush',
  colorLens: 'color_lens',
  image: 'image',
  photo: 'photo',
  photoLibrary: 'photo_library',
  collections: 'collections',
  
  // User & Account
  person: 'person',
  accountCircle: 'account_circle',
  login: 'login',
  logout: 'logout',
  
  // Navigation
  menu: 'menu',
  close: 'close',
  arrowBack: 'arrow_back',
  arrowForward: 'arrow_forward',
  home: 'home',
  
  // Actions
  favorite: 'favorite',
  favoriteBorder: 'favorite_border',
  share: 'share',
  search: 'search',
  filter: 'filter_alt',
  
  // Status
  checkCircle: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
  
  // Shipping & Delivery
  localShipping: 'local_shipping',
  inventory: 'inventory_2',
  package: 'package_2',
  
  // Payment
  creditCard: 'credit_card',
  payments: 'payments',
  accountBalance: 'account_balance_wallet',
  
  // Security
  lock: 'lock',
  lockOpen: 'lock_open',
  security: 'security',
  verifiedUser: 'verified_user'
}