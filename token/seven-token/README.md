# $7F Token Security Guide

## Development Environment Setup

For local development and testing, the token mint keypair is loaded directly in code. **This is not secure for production deployments**.

## Production Deployment Security

When deploying to devnet or mainnet, follow these security practices:

### 1. Environment Variable Configuration

Create a `.env.local` file (copied from `.env.local.example`) with your keypair data:

```
# Convert your keypair to Base64 format
solana-keygen pubkey --outfile keypair.json /path/to/keypair.json
base64 -w 0 keypair.json > keypair_base64.txt

# Add this value to your .env.local file
NEXT_PUBLIC_KEYPAIR_CONFIG=[array,of,numbers]
```

### 2. Token Mint Authority Management

After initializing your token, consider transferring the mint authority to:
- A multisig account requiring multiple signers
- An on-chain governance program
- A Solana Program with specific constraints

### 3. Secure Build Process

For Vercel or other hosting platforms:
1. Set environment variables in the hosting platform's secure environment
2. Keep all keypair files out of version control
3. Ensure all builds use HTTPS and proper content security policies

## Security Recommendations

1. Never hardcode private keys in your source code
2. Use environment variables for deployment configuration
3. Keep keypair files in `.gitignore` to prevent accidental commits
4. For high-value tokens, use hardware wallets for signing
5. Monitor your token mint for unexpected activity
6. Consider freezing the mint after initial supply distribution

## Local Development

The current implementation supports both:
- Local testing with hardcoded keypair (for development only)
- Production deployment with secure environment variables
