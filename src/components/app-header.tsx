import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { WalletButton } from '@/components/solana/solana-provider'
import { Link, useLocation } from 'react-router'
import logoImg from '../images/F7logo2.png'
import telegramImg from '../images/Telegram.png'
import dexscreenerImg from '../images/dexscreener.png'
import { useWalletInitialized } from './wallet-initialization-guard'
import { WhitepaperButton } from './whitepaper'

export function AppHeader({ links = [] }: { links: { label: string; path: string }[] }) {
  const { pathname } = useLocation()
  const [showMenu, setShowMenu] = useState(false)
  const isWalletInitialized = useWalletInitialized()
  
  // Filter navigation links based on wallet initialization status
  const filteredLinks = links.filter(link => {
    // For initialized users: show all links except the Register/dashboard link
    if (isWalletInitialized) {
      return link.path !== '/dashboard';
    }
    
    // For uninitialized users: only show Home and Register links, hide the token link
    return link.path === '/' || link.path === '/dashboard';
    // This effectively hides the $7F token link for uninitialized users
  })

  function isActive(path: string) {
    return path === '/' ? pathname === '/' : pathname.startsWith(path)
  }

  return (
    <header className="relative z-50 px-4 py-2 bg-gradient-to-r from-purple-900 to-purple-800 text-white shadow-md">
      {/* Devnet BETA badge is now positioned inline with the code below */}
      <div className="mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center">  
            <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img src={logoImg} alt="7affle Logo" className="h-7 w-auto" />
              <span className="font-audiowide text-lg tracking-wide">
                <span className="text-purple-300">7affle</span>
                <span className="text-green-500">.fun</span>
              </span>
            </Link>
          </div>
        </div>

        <div className="hidden md:flex items-center">
          <ul className="flex gap-6 flex-nowrap items-center mr-4">
            {filteredLinks.map(({ label, path }) => (
              <li key={path}>
                <Link
                  className={`px-4 py-2 rounded-md hover:bg-purple-700/30 transition-all ${isActive(path) 
                    ? 'text-white font-medium bg-purple-700/40' 
                    : 'text-purple-100/90'}`}
                  to={path}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <Button variant="ghost" size="icon" className="md:hidden text-white hover:text-purple-200 hover:bg-purple-800/50" onClick={() => setShowMenu(!showMenu)}>
          {showMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>

        <div className="hidden md:flex items-center gap-3">
          {/* Social Links */}
          <div className="flex items-center gap-2 mr-3">
            <a 
              href="https://t.me/Raffle_fun" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center p-1 rounded-full bg-purple-800/50 hover:bg-purple-700/70 transition-colors"
              title="Join our Telegram"
            >
              <img src={telegramImg} alt="Telegram" className="h-5 w-5" />
            </a>
            <a 
              href="#" /* Replace with actual Dexscreener URL when available */
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center p-1 rounded-full bg-purple-800/50 hover:bg-purple-700/70 transition-colors"
              title="View on Dexscreener"
            >
              <img src={dexscreenerImg} alt="Dexscreener" className="h-5 w-5" />
            </a>
            <WhitepaperButton />
          </div>
          
          <WalletButton />
        </div>

        {showMenu && (
          <div className="md:hidden fixed inset-x-0 top-[52px] bottom-0 bg-purple-900/95 backdrop-blur-sm z-50">
            <div className="flex flex-col p-4 gap-5 border-t border-purple-700">
              <ul className="flex flex-col gap-4">
                {filteredLinks.map(({ label, path }) => (
                  <li key={path}>
                    <Link
                      className={`block text-lg px-4 py-3 rounded-md transition-all ${isActive(path) 
                        ? 'text-white font-medium bg-purple-700/40' 
                        : 'text-purple-200/90 hover:bg-purple-700/30 hover:text-white'}`}
                      to={path}
                      onClick={() => setShowMenu(false)}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
              {/* Social Links for Mobile */}
              <div className="flex gap-3 justify-center mb-4 flex-wrap">
                <a 
                  href="https://t.me/Raffle_fun" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 py-1 px-3 rounded-full bg-purple-800/50 hover:bg-purple-700/70 transition-colors"
                >
                  <img src={telegramImg} alt="Telegram" className="h-5 w-5" />
                  <span>Telegram</span>
                </a>
                <a 
                  href="#" /* Replace with actual Dexscreener URL when available */
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 py-1 px-3 rounded-full bg-purple-800/50 hover:bg-purple-700/70 transition-colors"
                >
                  <img src={dexscreenerImg} alt="Dexscreener" className="h-5 w-5" />
                  <span>Dexscreener</span>
                </a>
                <button 
                  onClick={() => document.querySelector('[title="View Whitepaper"]')?.dispatchEvent(new MouseEvent('click'))} 
                  className="flex items-center gap-1 py-1 px-3 rounded-full bg-purple-800/50 hover:bg-purple-700/70 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  <span>Whitepaper</span>
                </button>
              </div>

              <div className="flex flex-col gap-5 mt-2">
                <div className="w-full">
                  <WalletButton />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
