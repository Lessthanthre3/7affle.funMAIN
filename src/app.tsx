import { AppProviders } from '@/components/app-providers.tsx'
import { AppLayout } from '@/components/app-layout.tsx'
import { RouteObject, useRoutes, useLocation } from 'react-router'
import { lazy, Suspense } from 'react'
import { ReferralHandler } from '@/components/referral-handler'
import { WalletInitializationGuard } from '@/components/wallet-initialization-guard'

const links = [
  //
  { label: 'Home', path: '/' },
  { label: 'Register', path: '/dashboard' },
  // Token page temporarily hidden for beta testing
  // Will be re-enabled after initial investor testing phase
  // { label: '$7F', path: '/token' },
]

const LazyBasic = lazy(() => import('@/basic/basic-feature'))
const LazyDashboard = lazy(() => import('@/components/dashboard/dashboard-feature'))
const LazyTokenInfo = lazy(() => import('@/components/token/token-info').then(m => ({ default: m.TokenInfo })))

const routes: RouteObject[] = [
  { index: true, element: <LazyBasic /> },
  { path: 'dashboard', element: <LazyDashboard /> },
  { path: 'token', element: <LazyTokenInfo /> },
]

console.log({ links, routes })

export function App() {
  const router = useRoutes(routes)
  const { pathname } = useLocation()
  
  // Determine if we should apply the wallet initialization guard
  // Only apply it for specific routes that require wallet initialization
  const needsWalletGuard = pathname !== '/' && pathname !== '/dashboard'
  
  const content = (
    <AppLayout links={links}>
      <Suspense fallback={
        <div className="flex justify-center items-center h-64">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <div className="absolute top-2 left-2 w-12 h-12 border-4 border-green-400/20 border-t-green-400 rounded-full animate-spin-slow"></div>
          </div>
        </div>
      }>
        {router}
      </Suspense>
    </AppLayout>
  )
  
  return (
    <AppProviders>
      {/* Process any referral links */}
      <ReferralHandler />
      
      {/* Only apply WalletInitializationGuard for routes that need it */}
      {needsWalletGuard ? (
        <WalletInitializationGuard>
          {content}
        </WalletInitializationGuard>
      ) : (
        content
      )}
    </AppProviders>
  )
}
