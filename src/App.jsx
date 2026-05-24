import React, { useState, useEffect } from 'react';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = 'https://aplikasi-keuangan-backend.vercel.app';

  // Mengambil data transaksi
  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/transactions`);
      if (!response.ok) throw new Error('Gagal mengambil data');
      const data = await response.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Terjadi kesalahan:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>Pencatatan Keuangan Toko</h1>
      
      {/* Area Ringkasan */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Pemasukan</p>
          <h3 style={{ margin: '5px 0', color: 'green' }}>Rp 0</h3>
        </div>
        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Pengeluaran</p>
          <h3 style={{ margin: '5px 0', color: 'red' }}>Rp 0</h3>
        </div>
        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Sisa</p>
          <h3 style={{ margin: '5px 0' }}>Rp 0</h3>
        </div>
      </div>

      {/* Area Riwayat */}
      <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
        <h3>Riwayat Transaksi</h3>
        {loading ? (
          <p>Memuat...</p>
        ) : transactions.length > 0 ? (
          transactions.map((t) => (
            <div key={t.id || Math.random()} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
              <span>{t.date ? t.date.substring(0, 10) : 'N/A'} - {t.description || 'Tanpa keterangan'}</span>
              <span style={{ fontWeight: 'bold' }}>{parseFloat(t.amount || 0).toLocaleString()}</span>
            </div>
          ))
        ) : (
          <p>Tidak ada transaksi ditemukan.</p>
        )}
      </div>
    </div>
  );
}

export default App;
