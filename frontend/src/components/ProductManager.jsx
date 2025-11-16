import { useState } from 'react';
import PropTypes from 'prop-types';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function ProductManager({ network = 'devnet' }) {
  const { publicKey, connected } = useWallet();
  const [currentView, setCurrentView] = useState('create');
  const [productId, setProductId] = useState('');
  const [metadata, setMetadata] = useState('');
  const [nextOwner, setNextOwner] = useState('');
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
    setHistory(null);
    try {
      const response = await axios.get(`${API_URL}/products/${productId}/history`);
      setHistory(response.data.history);
    } catch (error) {
      showMessage(`Error: ${error.response?.data?.error || error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (currentView) {
      case 'create':
        return (
          <div className="product-form">
            <div className="form-group">
              <label htmlFor="productId">Product ID (Serial Number)</label>
              <input
                id="productId"
                type="text"
                placeholder="Enter product serial number"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="metadata">Metadata (Optional)</label>
              <textarea
                id="metadata"
                placeholder="Product description, specifications, etc."
                value={metadata}
                onChange={(e) => setMetadata(e.target.value)}
              />
            </div>
            <button className="submit-button" onClick={createProduct} disabled={loading || !connected}>
              {loading ? 'Creating Product...' : 'Create Product'}
            </button>
          </div>
        );

      case 'transfer':
        return (
          <div className="product-form">
            <div className="form-group">
              <label htmlFor="productId">Product ID</label>
              <input
                id="productId"
                type="text"
                placeholder="Enter product ID to transfer"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="nextOwner">New Owner Public Key</label>
              <input
                id="nextOwner"
                type="text"
                placeholder="Enter new owner's wallet address"
                value={nextOwner}
                onChange={(e) => setNextOwner(e.target.value)}
              />
            </div>
            <button className="submit-button" onClick={transferProduct} disabled={loading || !connected}>
              {loading ? 'Transferring Ownership...' : 'Transfer Ownership'}
            </button>
          </div>
        );

      case 'repair':
        return (
          <div className="product-form">
            <div className="form-group">
              <label htmlFor="productId">Product ID</label>
              <input
                id="productId"
                type="text"
                placeholder="Enter product ID"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="metadata">Repair Details</label>
              <textarea
                id="metadata"
                placeholder="Describe the repair work performed"
                value={metadata}
                onChange={(e) => setMetadata(e.target.value)}
              />
            </div>
            <button className="submit-button" onClick={recordRepair} disabled={loading || !connected}>
              {loading ? 'Recording Repair...' : 'Record Repair'}
            </button>
          </div>
        );

      case 'search':
        return (
          <div className="product-form">
            <div className="form-group">
              <label htmlFor="productId">Product ID</label>
              <input
                id="productId"
                type="text"
                placeholder="Enter product ID to search"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              />
            </div>
            <button className="submit-button" onClick={searchProduct} disabled={loading}>
              {loading ? 'Searching...' : 'Search Product History'}
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
        );

      default:
        return null;
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
              Wallet Connected
            </p>
          )}
        </div>
      </div>

      {message && (
        <div className={`message ${message.error ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      <div className="product-manager-container">
        <div className="view-selector">
          <button
            className={`view-tab ${currentView === 'create' ? 'active' : ''}`}
            onClick={() => setCurrentView('create')}
          >
            Create Product
          </button>
          <button
            className={`view-tab ${currentView === 'transfer' ? 'active' : ''}`}
            onClick={() => setCurrentView('transfer')}
          >
            Transfer Ownership
          </button>
          <button
            className={`view-tab ${currentView === 'repair' ? 'active' : ''}`}
            onClick={() => setCurrentView('repair')}
          >
            Record Repair
          </button>
          <button
            className={`view-tab ${currentView === 'search' ? 'active' : ''}`}
            onClick={() => setCurrentView('search')}
          >
            Search History
          </button>
        </div>

        {renderForm()}
      </div>
    </div>
  );
}

ProductManager.propTypes = {
  network: PropTypes.oneOf(['devnet', 'validator'])
};

export default ProductManager;
