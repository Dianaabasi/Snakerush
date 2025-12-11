// 'use client';

// import { OnchainKitProvider } from '@coinbase/onchainkit';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { base } from 'wagmi/chains';
// import { WagmiProvider, createConfig, http } from 'wagmi';
// import { coinbaseWallet, injected } from 'wagmi/connectors';
// import { type ReactNode, useState } from 'react';

// const wagmiConfig = createConfig({
//   chains: [base],
//   connectors: [
//     injected(),
//     coinbaseWallet({
//       appName: 'SnakeRush',
//     }),
//   ],
//   transports: {
//     [base.id]: http(),
//   },
// });

// export function Providers({ children }: { children: ReactNode }) {
//   const [queryClient] = useState(() => new QueryClient());

//   return (
//     <WagmiProvider config={wagmiConfig}>
//       <QueryClientProvider client={queryClient}>
//         <OnchainKitProvider
//           apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
//           chain={base}
//         >
//           {children}
//         </OnchainKitProvider>
//       </QueryClientProvider>
//     </WagmiProvider>
//   );
// }

'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base } from 'wagmi/chains';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'; 
import { type ReactNode, useState } from 'react';

// 1. Get the Project ID from environment variables
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

// 2. Safety check to warn you during development
if (!projectId) {
  console.warn('Missing NEXT_PUBLIC_WC_PROJECT_ID in .env.local. WalletConnect features will not work.');
}

const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected(), // Required for Farcaster internal wallet
    coinbaseWallet({
      appName: 'SnakeRush',
      headlessMode: true, // keeps it smooth inside miniapps
    }),
    // 3. Add WalletConnect for broader support (MetaMask, Rainbow, etc.)
    walletConnect({
      projectId: projectId || 'BE_SURE_TO_ADD_YOUR_ID', 
      metadata: {
        name: 'SnakeRush',
        description: 'SnakeRush Miniapp',
        url: 'https://snakerush.vercel.app',
        icons: ['https://snakerush.vercel.app/logo.png'],
      },
    }),
  ],
  transports: {
    [base.id]: http(),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={base}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}