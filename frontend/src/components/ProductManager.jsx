import { useState } from 'react';
import PropTypes from 'prop-types';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function ProductManager({ network = 'devnet' }) {
  const { publicKey, connected } = useWallet();
  const [productId, setProductId] = useState('');
  const [metadata, setMetadata] = useState('');
  const [nextOwner, setNextOwner] = useState('');
  const [searchId, setSearchId] = useState('');
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const showMessage = (msg, isError = false) => {
    setMessage({ text: msg, error: isError });
    setTimeout(() => setMessage(''), 5000);
  };

  const createProduct = async () => {
    if (!connected) {
      showMessage('Please connect your wallet first', true);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/products`, {
        productId,
        metadata,
        manufacturerPublicKey: publicKey.toString()
      });

      showMessage(`Product created! Transaction: ${response.data.transaction}`);
      setProductId('');
      setMetadata('');
    } catch (error) {
      showMessage(`Error: ${error.response?.data?.error || error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const transferProduct = async () => {
    if (!connected) {
      showMessage('Please connect your wallet first', true);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/products/${productId}/transfer`, {
        currentOwnerPublicKey: publicKey.toString(),
        nextOwnerPublicKey: nextOwner
      });

      showMessage(`Ownership transferred! Transaction: ${response.data.transaction}`);
      setNextOwner('');
    } catch (error) {
      showMessage(`Error: ${error.response?.data?.error || error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const recordRepair = async () => {
    if (!connected) {
      showMessage('Please connect your wallet first', true);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/products/${productId}/repair`, {
        ownerPublicKey: publicKey.toString(),
        repairMetadata: metadata
      });

      showMessage(`Repair recorded! Transaction: ${response.data.transaction}`);
      setMetadata('');
    } catch (error) {
      showMessage(`Error: ${error.response?.data?.error || error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const searchProduct = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/products/${searchId}/history`);
      setHistory(response.data.history);
    } catch (error) {
      showMessage(`Error: ${error.response?.data?.error || error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-manager">
      <div className="wallet-section">
        <WalletMultiButton />
        <div className="connection-info">
          <p className="network-status">
            Network: <span className="network-badge">{network.toUpperCase()}</span>
          </p>
          {connected && (
            <p className="wallet-address">
              Connected: {publicKey.toString().slice(0, 8)}...
            </p>
          )}
        </div>
      </div>

      {message && (
        <div className={`message ${message.error ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      <div className="actions-grid">
        <div className="action-card">
          <h2>Create Product</h2>
          <input
            type="text"
            placeholder="Product ID (S/N)"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          />
          <textarea
            placeholder="Metadata (optional)"
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
          />
          <button onClick={createProduct} disabled={loading || !connected}>
            {loading ? 'Creating...' : 'Create Product'}
          </button>
        </div>

        <div className="action-card">
          <h2>Transfer Ownership</h2>
          <input
            type="text"
            placeholder="Product ID"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          />
          <input
            type="text"
            placeholder="New Owner Public Key"
            value={nextOwner}
            onChange={(e) => setNextOwner(e.target.value)}
          />
          <button onClick={transferProduct} disabled={loading || !connected}>
            {loading ? 'Transferring...' : 'Transfer'}
          </button>
        </div>

        <div className="action-card">
          <h2>Record Repair</h2>
          <input
            type="text"
            placeholder="Product ID"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          />
          <textarea
            placeholder="Repair details"
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
          />
          <button onClick={recordRepair} disabled={loading || !connected}>
            {loading ? 'Recording...' : 'Record Repair'}
          </button>
        </div>

        <div className="action-card">
          <h2>Search Product History</h2>
          <input
            type="text"
            placeholder="Product ID"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <button onClick={searchProduct} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>

          {history && (
            <div className="history">
              <h3>Product History</h3>
              {history.map((record, idx) => (
                <div key={idx} className="history-record">
                  <strong>{record.type}</strong>
                  <p>Owner: {record.owner}</p>
                  <p>Time: {new Date(record.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ProductManager.propTypes = {
  network: PropTypes.oneOf(['devnet', 'validator'])
};

export default ProductManager;
