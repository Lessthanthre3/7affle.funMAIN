import { RaffleLogo } from '@/components/7affle-logo'

export function LogoExample() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-2xl font-bold mb-8 text-white">800x800px Logo Example</h2>
      
      {/* Use the fullSize parameter for a quick way to get 800x800px */}
      <RaffleLogo fullSize={true} />
      
      {/* Alternatively, you can use the size='full' prop */}
      {/* <RaffleLogo size="full" /> */}
    </div>
  )
}
