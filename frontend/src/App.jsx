import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import ProductManager from './components/ProductManager';
import '@solana/wallet-adapter-react-ui/styles.css';
import './App.css';

function HeaderContent({ useValidator, setUseValidator }) {
  const { publicKey, connected } = useWallet();

  return (
    <header className="App-header">
      <div className="header-title">
        <h1><span className="true-text">True</span>Source</h1>
        <p>Track a Product's Life Story</p>
      </div>

      <div className="header-controls">
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
            <span>Devnet</span>
          </label>
          <label>
            <input
              type="radio"
              name="network"
              value="validator"
              checked={useValidator}
              onChange={() => setUseValidator(true)}
            />
            <span>Local Validator</span>
          </label>
        </div>

        {/* Wallet Button */}
        <div className="wallet-button-container">
          <WalletMultiButton />
        </div>

        {/* Public Key Display */}
        {connected && publicKey && (
          <div className="user-pubkey">
            <span className="pubkey-label">Your Public Key:</span>
            <span className="pubkey-value">{publicKey.toString()}</span>
          </div>
        )}
      </div>
    </header>
  );
}

HeaderContent.propTypes = {
  useValidator: PropTypes.bool.isRequired,
  setUseValidator: PropTypes.func.isRequired
};

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

  // Empty wallets array for auto-discovery of Standard Wallets
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="App">
            <HeaderContent useValidator={useValidator} setUseValidator={setUseValidator} />
            <ProductManager network={useValidator ? 'validator' : 'devnet'} />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
