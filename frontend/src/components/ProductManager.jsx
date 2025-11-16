import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useWallet } from '@solana/wallet-adapter-react';
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
  const [existingProduct, setExistingProduct] = useState(null);
  const [originalOwner, setOriginalOwner] = useState('');
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [ownerFilter, setOwnerFilter] = useState('');
  const [previousOwnerFilter, setPreviousOwnerFilter] = useState('');
  const [startTimeFilter, setStartTimeFilter] = useState('');
  const [endTimeFilter, setEndTimeFilter] = useState('');

  useEffect(() => {
    if (currentView === 'entries') {
      fetchAllTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

  // Auto-populate original owner after 1 second of no typing
  useEffect(() => {
    if (productId.trim() === '') {
      setOriginalOwner('');
      setExistingProduct(null);
      return;
    }

    // For transfer and repair views, use 1-second debounce
    if (currentView === 'transfer' || currentView === 'repair') {
      const timer = setTimeout(() => {
        searchExistingProduct(productId);
      }, 1000);

      return () => clearTimeout(timer);
    }

    // For create view, search immediately to show warning
    if (currentView === 'create') {
      searchExistingProduct(productId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, currentView]);

  const showMessage = (msg, isError = false) => {
    setMessage({ text: msg, error: isError });
    setTimeout(() => setMessage(''), 5000);
  };

  const searchExistingProduct = async (id) => {
    if (!id || id.trim() === '') {
      setExistingProduct(null);
      setOriginalOwner('');
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/products/${id}/history`);
      if (response.data.history && response.data.history.length > 0) {
        const firstTransaction = response.data.history[0];
        setExistingProduct(firstTransaction);
        setOriginalOwner(firstTransaction.owner || '');
      } else {
        setExistingProduct(null);
        setOriginalOwner('');
      }
    } catch (error) {
      // Product doesn't exist, which is fine
      setExistingProduct(null);
      setOriginalOwner('');
    }
  };

  const handleProductIdChange = (id) => {
    setProductId(id);
    // Auto-search is now handled by useEffect with debounce
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

  const fetchRecentTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/products/recent/transactions?limit=10`);
      setRecentTransactions(response.data.transactions);
    } catch (error) {
      showMessage(`Error: ${error.response?.data?.error || error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (ownerFilter) params.append('owner', ownerFilter);
      if (previousOwnerFilter) params.append('previousOwner', previousOwnerFilter);
      if (startTimeFilter) params.append('startTime', new Date(startTimeFilter).getTime());
      if (endTimeFilter) params.append('endTime', new Date(endTimeFilter).getTime());

      const response = await axios.get(`${API_URL}/products/all/transactions?${params.toString()}`);
      setRecentTransactions(response.data.transactions);
    } catch (error) {
      showMessage(`Error: ${error.response?.data?.error || error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setOwnerFilter('');
    setPreviousOwnerFilter('');
    setStartTimeFilter('');
    setEndTimeFilter('');
  };

  const renderForm = () => {
    switch (currentView) {
    case 'create':
      return (
        <div className="product-form">
          <div className="form-group">
            <label htmlFor="productId">Product ID</label>
            <input
              id="productId"
              type="text"
              placeholder="Enter product ID"
              value={productId}
              onChange={(e) => handleProductIdChange(e.target.value)}
            />
            {existingProduct && (
              <div className="product-exists-warning">
                  ⚠️ Product already exists! First owner: {existingProduct.owner}
              </div>
            )}
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
              onChange={(e) => handleProductIdChange(e.target.value)}
            />
            {existingProduct && (
              <div className="product-exists-info">
                  ✓ Product found! First owner: {existingProduct.owner}
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="originalOwner">Original Owner (Manufacturer)</label>
            <input
              id="originalOwner"
              type="text"
              placeholder="Original owner public key"
              value={originalOwner}
              readOnly
              className="readonly-field"
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
              onChange={(e) => handleProductIdChange(e.target.value)}
            />
            {existingProduct && (
              <div className="product-exists-info">
                  ✓ Product found! First owner: {existingProduct.owner}
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="originalOwner">Original Owner (Manufacturer)</label>
            <input
              id="originalOwner"
              type="text"
              placeholder="Original owner public key"
              value={originalOwner}
              readOnly
              className="readonly-field"
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

    case 'check':
      return (
        <div className="product-form">
          <div className="form-group">
            <label htmlFor="productId">Product ID</label>
            <input
              id="productId"
              type="text"
              placeholder="Enter product ID to check"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            />
          </div>
          <button className="submit-button" onClick={searchProduct} disabled={loading}>
            {loading ? 'Checking...' : 'Check ID'}
          </button>

          {history && (
            <div className="history">
              <h3>Product History</h3>
              {history.map((record, idx) => (
                <div key={idx} className="history-record">
                  <div className="record-header">
                    <strong>{record.type}</strong>
                    <span className="record-time">{new Date(record.timestamp).toLocaleString()}</span>
                  </div>
                  <p><strong>Owner:</strong> {record.owner}</p>
                  {record.previousOwner && <p><strong>Previous Owner:</strong> {record.previousOwner}</p>}
                  {record.metadata && <p><strong>Details:</strong> {record.metadata}</p>}
                  {record.signature && (
                    <p className="signature"><strong>Transaction:</strong> <code>{record.signature}</code></p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case 'entries':
      return (
        <div className="product-form">
          <div className="entries-header">
            <h3>All Entries</h3>
            <div className="filter-controls">
              <button className="search-button" onClick={fetchAllTransactions} disabled={loading}>
                {loading ? 'Searching...' : '🔍 Search'}
              </button>
              <button className="clear-button" onClick={() => { clearFilters(); fetchAllTransactions(); }} disabled={loading}>
                  Clear Filters
              </button>
            </div>
          </div>

          <div className="filters-section">
            <div className="form-group filter-group">
              <label htmlFor="ownerFilter">Owner (Public Key)</label>
              <input
                id="ownerFilter"
                type="text"
                placeholder="Filter by owner address"
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
              />
            </div>

            <div className="form-group filter-group">
              <label htmlFor="previousOwnerFilter">Previous Owner (Public Key)</label>
              <input
                id="previousOwnerFilter"
                type="text"
                placeholder="Filter by previous owner address"
                value={previousOwnerFilter}
                onChange={(e) => setPreviousOwnerFilter(e.target.value)}
              />
            </div>

            <div className="time-filters">
              <div className="form-group filter-group">
                <label htmlFor="startTimeFilter">Start Time</label>
                <input
                  id="startTimeFilter"
                  type="datetime-local"
                  value={startTimeFilter}
                  onChange={(e) => setStartTimeFilter(e.target.value)}
                />
              </div>

              <div className="form-group filter-group">
                <label htmlFor="endTimeFilter">End Time</label>
                <input
                  id="endTimeFilter"
                  type="datetime-local"
                  value={endTimeFilter}
                  onChange={(e) => setEndTimeFilter(e.target.value)}
                />
              </div>
            </div>
          </div>

          {recentTransactions.length > 0 ? (
            <div className="entries-list">
              <p className="results-count">Found {recentTransactions.length} entries</p>
              {recentTransactions.map((record, idx) => (
                <div key={idx} className="transaction-card">
                  <div className="transaction-header">
                    <span className="transaction-type">{record.type}</span>
                    <span className="transaction-time">
                      {new Date(record.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="transaction-details">
                    <p><strong>Product ID:</strong> {record.productId}</p>
                    <p><strong>Owner:</strong> {record.owner}</p>
                    {record.metadata && <p><strong>Details:</strong> {record.metadata}</p>}
                    {record.previousOwner && <p><strong>Previous Owner:</strong> {record.previousOwner}</p>}
                    {record.signature && (
                      <p className="signature"><strong>Transaction:</strong> <code>{record.signature}</code></p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-transactions">
              <p>No entries found. {ownerFilter || previousOwnerFilter || startTimeFilter || endTimeFilter ? 'Try adjusting your filters.' : 'Create a product to get started!'}</p>
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
            className={`view-tab ${currentView === 'check' ? 'active' : ''}`}
            onClick={() => setCurrentView('check')}
          >
            Check ID
          </button>
          <button
            className={`view-tab ${currentView === 'entries' ? 'active' : ''}`}
            onClick={() => setCurrentView('entries')}
          >
            Entries
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
