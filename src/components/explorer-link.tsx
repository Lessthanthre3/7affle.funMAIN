import { useCluster } from './cluster/cluster-data-access'

interface ExplorerLinkProps {
  path: string
  label: string
  className?: string
}

export function ExplorerLink({ path, label, className = '' }: ExplorerLinkProps) {
  const { cluster } = useCluster()
  
  // Create explorer URL based on the network
  const getExplorerUrl = () => {
    const baseUrl = 'https://explorer.solana.com'
    
    // Check if the network is local or custom
    const isLocalOrCustom = ['localnet', 'custom'].includes(cluster.network as string)
    
    if (isLocalOrCustom) {
      // For local development, link to devnet explorer as a fallback
      return `${baseUrl}/${path}?cluster=devnet`
    }
    
    return `${baseUrl}/${path}?cluster=${cluster.network}`
  }
  
  return (
    <a 
      href={getExplorerUrl()} 
      target="_blank" 
      rel="noopener noreferrer"
      className={className}
    >
      {label}
    </a>
  )
}
