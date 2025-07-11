// Cluster configuration for 7affle Platform
// Cache buster: 2025-01-26-01:13 - Force deployment update
import { clusterApiUrl, Connection } from '@solana/web3.js'
import { atom, useAtomValue, useSetAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import React, { createContext, useContext } from 'react'

export interface SolanaCluster {
  name: string
  endpoint: string
  network?: ClusterNetwork
  active?: boolean
}

export enum ClusterNetwork {
  Mainnet = 'mainnet-beta',
  Testnet = 'testnet',
  Devnet = 'devnet',
  Custom = 'custom',
}

// By default, we don't configure the mainnet-beta cluster
// The endpoint provided by clusterApiUrl('mainnet-beta') does not allow access from the browser due to CORS restrictions
// To use the mainnet-beta cluster, provide a custom endpoint
export const defaultClusters: SolanaCluster[] = [
  { name: 'local', endpoint: 'http://localhost:8899', network: ClusterNetwork.Custom },
  {
    name: 'devnet',
    endpoint: clusterApiUrl('devnet'),
    network: ClusterNetwork.Devnet,
  },
  {
    name: 'testnet',
    endpoint: clusterApiUrl('testnet'),
    network: ClusterNetwork.Testnet,
  },
  {
    name: 'mainnet-beta',
    endpoint: 'https://mainnet.helius-rpc.com/?api-key=cf67b0f6-b113-4de7-859a-a7822710cda1',
    network: ClusterNetwork.Mainnet,
  },
]

// Changed default from devnet (index 1) to mainnet-beta (index 3)
const clusterAtom = atomWithStorage<SolanaCluster>('solana-cluster', defaultClusters[3])
const clustersAtom = atomWithStorage<SolanaCluster[]>('solana-clusters', defaultClusters)

const activeClustersAtom = atom<SolanaCluster[]>((get) => {
  const clusters = get(clustersAtom)
  const cluster = get(clusterAtom)
  return clusters.map((item) => ({
    ...item,
    active: item.name === cluster.name,
  }))
})

const activeClusterAtom = atom<SolanaCluster>((get) => {
  const clusters = get(activeClustersAtom)

  return clusters.find((item) => item.active) || clusters[0]
})

export interface ClusterProviderContext {
  cluster: SolanaCluster
  clusters: SolanaCluster[]
  addCluster: (cluster: SolanaCluster) => void
  deleteCluster: (cluster: SolanaCluster) => void
  setCluster: (cluster: SolanaCluster) => void

  getExplorerUrl(path: string): string
}

const Context = createContext<ClusterProviderContext>({} as ClusterProviderContext)

export function ClusterProvider({ children }: { children: React.ReactNode }) {
  const cluster = useAtomValue(activeClusterAtom)
  const clusters = useAtomValue(activeClustersAtom)
  const setCluster = useSetAtom(clusterAtom)
  const setClusters = useSetAtom(clustersAtom)

  const value: ClusterProviderContext = {
    cluster,
    clusters: clusters.sort((a, b) => (a.name > b.name ? 1 : -1)),
    addCluster: (cluster: SolanaCluster) => {
      try {
        new Connection(cluster.endpoint)
        setClusters([...clusters, cluster])
      } catch (err) {
        console.error(`${err}`)
      }
    },
    deleteCluster: (cluster: SolanaCluster) => {
      setClusters(clusters.filter((item) => item.name !== cluster.name))
    },
    setCluster: (cluster: SolanaCluster) => setCluster(cluster),
    getExplorerUrl: (path: string) => `https://explorer.solana.com/${path}${getClusterUrlParam(cluster)}`,
  }
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useCluster() {
  return useContext(Context)
}

function getClusterUrlParam(cluster: SolanaCluster): string {
  let suffix = ''
  switch (cluster.network) {
    case ClusterNetwork.Devnet:
      suffix = 'devnet'
      break
    case ClusterNetwork.Mainnet:
      suffix = ''
      break
    case ClusterNetwork.Testnet:
      suffix = 'testnet'
      break
    default:
      suffix = `custom&customUrl=${encodeURIComponent(cluster.endpoint)}`
      break
  }

  return suffix.length ? `?cluster=${suffix}` : ''
}
