import { useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import ProductManager from './components/ProductManager';
import '@solana/wallet-adapter-react-ui/styles.css';
import './App.css';

function App() {
  // Get configuration from environment variables
  const validatorUrl = import.meta.env.VITE_SOLANA_VALIDATOR_URL || 'http://localhost:8899';
  const defaultNetwork = import.meta.env.VITE_SOLANA_NETWORK || 'devnet';

  // State for network selection
  const [useValidator, setUseValidator] = useState(defaultNetwork === 'validator');

  // Determine endpoint based on network selection
  const endpoint = useMemo(() => {
    if (useValidator) {
      return validatorUrl;
    }
    const network = WalletAdapterNetwork.Devnet;
    return clusterApiUrl(network);
  }, [useValidator, validatorUrl]);

  // Wallets configuration
  const wallets = useMemo(
    () => [new PhantomWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="App">
            <header className="App-header">
              <h1>🔗 Product Provenance Tracker</h1>
              <p>Secure, blockchain-based product lifecycle tracking</p>

              {/* Network Selection */}
              <div className="network-selector">
                <label>
                  <input
                    type="radio"
                    name="network"
                    value="devnet"
                    checked={!useValidator}
                    onChange={() => setUseValidator(false)}
                  />
                  Devnet
                </label>
                <label>
                  <input
                    type="radio"
                    name="network"
                    value="validator"
                    checked={useValidator}
                    onChange={() => setUseValidator(true)}
                  />
                  Local Validator
                </label>
                <span className="network-info">
                  Endpoint: {useValidator ? validatorUrl : 'https://api.devnet.solana.com'}
                </span>
              </div>
            </header>
            <ProductManager network={useValidator ? 'validator' : 'devnet'} />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
