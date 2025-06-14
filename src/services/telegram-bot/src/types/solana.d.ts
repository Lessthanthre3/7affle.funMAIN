declare module '../utils/solana' {
  export function getConnection(): import('@solana/web3.js').Connection;
  export function getProvider(): any;
  export function getRaffleProgram(): any;
  export function getProgramId(): import('@solana/web3.js').PublicKey;
}
