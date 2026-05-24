import React, { useState, useEffect } from 'react';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = 'https://aplikasi-keuangan-backend.vercel.app';

  // Mengambil data transaksi dengan penanganan error yang lebih aman
  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/transactions`);
      const data = await response.json();
      // Pastikan data adalah array sebelum diset ke state
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Pencatatan Keuangan</h1>
      
      {/* Area Form (Disederhanakan untuk memastikan tampil) */}
      <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
        <h3>Form Input (Sedang dalam perbaikan)</h3>
        {/* Placeholder untuk form */}
      </div>

      {/* Area List Transaksi */}
      <div style={{ border: '1px solid #ccc', padding: '20px' }}>
        <h3>Riwayat Transaksi</h3>
        {loading ? (
          <p>Memuat data...</p>
        ) : (
          transactions.length > 0 ? (
            transactions.map((t) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <span>{t.date ? t.date.substring(0, 10) : 'Tanpa Tanggal'} - {t.description}</span>
                <span>{parseFloat(t.amount || 0).toLocaleString()}</span>
              </div>
            ))
          ) : (
            <p>Tidak ada data transaksi.</p>
          )
        )}
      </div>
    </div>
  );
}

export default App;
