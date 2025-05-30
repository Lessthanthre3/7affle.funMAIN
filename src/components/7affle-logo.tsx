// Component uses JSX which implicitly uses React
import f7LogoImg from '../images/F7logo2.png'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showImage?: boolean
  fullSize?: boolean // Alternative way to show 800x800px
}

export function RaffleLogo({ size = 'md', showImage = true, fullSize = false }: LogoProps) {
  // If fullSize is true, override the size to 'full'
  const actualSize = fullSize ? 'full' : size

  // Size mapping for image
  const imageSizes = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64',
    full: 'w-[800px] h-[800px]'
  }

  return (
    <div className="flex flex-col items-center">
      {showImage && (
        <div>
          <img 
            src={f7LogoImg} 
            alt="7affle Logo" 
            className={`object-contain ${imageSizes[actualSize]}`} 
          />
        </div>
      )}
    </div>
  )
}
