import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [epochs, setEpochs] = useState(1);
  const [megabytes, setMegabytes] = useState(1);
  const [walPriceUSD, setWalPriceUSD] = useState<number | null>(null); // Initialize as null
  const [sizeUnit, setSizeUnit] = useState<'MB' | 'GB'>('MB'); // State for size unit
  const [storagePrice, setStoragePrice] = useState<number | null>(null);
  const [writePrice, setWritePrice] = useState<number | null>(null);

  useEffect(() => {
    console.log('Fetching WAL price...');
    fetch('https://cryptoprices.cc/WAL')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((data) => {
        console.log('Raw WAL price response:', data); // Debugging log
        const price = parseFloat(data);
        console.log('Parsed WAL price:', price); // Debugging log
        if (!isNaN(price)) {
          setWalPriceUSD(price);
        } else {
          console.warn('Invalid WAL price:', data);
        }
      })
      .catch((error) => {
        console.error('Error fetching WAL price:', error);
      });

    console.log('Fetching storage and write prices...');
    fetch('https://fullnode.mainnet.sui.io:443', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'sui_getObject',
        params: [
          '0xc5e430c7c517e99da14e67928b360f3260de47cb61f55338cdd9119f519c282c',
          { showContent: true, showStorageRebate: true },
        ],
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Storage and write prices fetched:', data);
        const result = data.result.data.content.fields.value.fields;
        if (result) {
          const storagePrice = parseFloat(result.storage_price_per_unit_size);
          const writePrice = parseFloat(result.write_price_per_unit_size);
          console.log('Parsed storage price:', storagePrice);
          console.log('Parsed write price:', writePrice);
          if (!isNaN(storagePrice)) setStoragePrice(storagePrice);
          if (!isNaN(writePrice)) setWritePrice(writePrice);
        } else {
          console.warn('Unexpected API response for storage/write prices:', data);
        }
      })
      .catch((error) => {
        console.error('Error fetching storage and write prices:', error);
      });
  }, []);

  const FROST_PER_WAL = 1000000000; // 1 WAL = 1 billion FROST
  const SUBSIDY_RATE = 0.8;

  const adjustedMegabytes = sizeUnit === 'GB' ? megabytes * 1000 : megabytes; // Adjust size based on unit

  // Calculate Total USD Cost
  const totalUSDCost =
    walPriceUSD !== null && storagePrice !== null && writePrice !== null
      ? ((writePrice + epochs * storagePrice) * adjustedMegabytes / FROST_PER_WAL) * walPriceUSD * SUBSIDY_RATE
      : 0; // Default to 0 if any price is not yet loaded

  return (
    <div className="walrus-container">
      <header className="walrus-header">
        <h1>Walrus Storage Cost Calculator by Ruby Nodes</h1>
      </header>

      <main className="walrus-main">
        <div className="form-container">
          <ul className="notes-list">
            <li><strong>Fee token: </strong> Storage is paid in WAL</li>
            <li><strong>Epoch:</strong> 14 days</li>
            <li><strong>Max epochs: </strong> 52 (2 years)</li>
            <li><strong>Storage Price:</strong> {storagePrice !== null ? storagePrice.toLocaleString() : 'Loading...'} FROST</li>
            <li><strong>Write Price:</strong> {writePrice !== null ? writePrice.toLocaleString() : 'Loading...'} FROST</li>
            <li><strong>Conversion:</strong> 1 WAL = 1,000,000,000 FROST</li>
            <li><strong>Subsidy rate:</strong> All storage costs are currently <a href="https://www.walrus.xyz/blog/wal-staking-rewards" target="_blank">subsidized</a> by 20% by the Walrus foundation</li>
          </ul>
          <section className="calculation-section">
            <h2>Calculate Total USD Cost</h2>

            <div className="input-group">
              <label>
                Epochs:
                <input
                  type="range"
                  min="1"
                  max="52" // Updated max value for epochs slider
                  value={epochs}
                  onChange={(e) => setEpochs(Number(e.target.value))}
                />
                <input
                  type="number"
                  value={epochs}
                  onChange={(e) => setEpochs(Number(e.target.value))}
                />
              </label>
              <p>
                Equivalent to {epochs * 14} days or {(epochs * 2).toFixed(0)} weeks
              </p>
            </div>

            <div className="input-group">
              <label>
                Size:
                <input
                  type="range"
                  min="1"
                  max="1000"
                  step="5" // Set step to 5
                  value={megabytes}
                  onChange={(e) => setMegabytes(Number(e.target.value))}
                />
                <input
                  type="number"
                  value={megabytes}
                  onChange={(e) => setMegabytes(Number(e.target.value))}
                />
                <select
                  value={sizeUnit}
                  onChange={(e) => setSizeUnit(e.target.value as 'MB' | 'GB')}
                >
                  <option value="MB">MB</option>
                  <option value="GB">GB</option>
                </select>
              </label>
            </div>

            <div className="input-group">
              <label>
                WAL Price (USD):
                <input
                  type="number"
                  value={walPriceUSD !== null ? walPriceUSD : ''}
                  onChange={(e) => setWalPriceUSD(Number(e.target.value))}
                  placeholder="Loading..."
                />
              </label>
            </div>

            <p className="result">Total USD Cost: ${totalUSDCost.toFixed(2)}</p>
          </section>
          <img
            src="/Walrus_Logo_4e51f3e010.jpg"
            alt="Walrus Logo"
            className="walrus-logo"
          />
        </div>
        <p>For more information please check official <a href='https://docs.wal.app/' target='_blank'>Walrus documentation</a>.</p>
      </main>

      <footer className="walrus-footer">
        <p>Powered by <a href='https://rubynodes.io' target='_blank'>Ruby Nodes</a> - your storage node operator on Walrus!</p>
      </footer>
    </div>
  );
}

export default App;
