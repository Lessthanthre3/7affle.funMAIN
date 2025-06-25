import { useConnection } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import * as React from 'react'

import { useCluster } from './cluster-data-access'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { addConnectionError } from '@/components/admin-debug-console'

export function ExplorerLink({ path, label, className }: { path: string; label: string; className?: string }) {
  const { getExplorerUrl } = useCluster()
  return (
    <a
      href={getExplorerUrl(path)}
      target="_blank"
      rel="noopener noreferrer"
      className={className ? className : `link font-mono`}
    >
      {label}
    </a>
  )
}

export function ClusterChecker({ children }: { children: React.ReactNode }) {
  const { cluster } = useCluster()
  const { connection } = useConnection()

  const query = useQuery({
    queryKey: ['version', { cluster, endpoint: connection.rpcEndpoint }],
    queryFn: () => connection.getVersion(),
    retry: 1,
  })
  
  // Log errors to admin debug console
  React.useEffect(() => {
    if (query.isError || (!query.isLoading && !query.data)) {
      addConnectionError(cluster.name, `Error connecting to cluster ${cluster.name}.`)
    }
  }, [query.isError, query.isLoading, query.data, cluster.name])

  if (query.isLoading) {
    return null
  }
  if (query.isError || !query.data) {
    // Instead of showing error to all users, just return children
    // Error is now logged to admin debug console
    return children
  }
  return children
}

export function ClusterUiSelect() {
  const { clusters, setCluster, cluster } = useCluster()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{cluster.name}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {clusters.map((item) => (
          <DropdownMenuItem key={item.name} onClick={() => setCluster(item)}>
            {item.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
