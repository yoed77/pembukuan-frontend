import React, { useState, useEffect } from 'react';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('2026-05');

  const BACKEND_URL = 'https://aplikasi-keuangan-backend.vercel.app';

  const fetchData = async () => {
    try {
      const [resTrans, resCat] = await Promise.all([
        fetch(`${BACKEND_URL}/api/transactions`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/categories`).then(r => r.json())
      ]);
      setTransactions(Array.isArray(resTrans) ? resTrans : []);
      setCategories(Array.isArray(resCat) ? resCat : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  // Filter data berdasarkan bulan
  const filteredData = transactions.filter(t => t.date?.startsWith(selectedMonth));

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* HEADER */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Pencatatan Keuangan Toko v2.2</h1>
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="border p-2 rounded" />
      </div>

      {/* DASHBOARD RINGKASAN */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
          <p className="text-gray-500 text-sm">PEMASUKAN</p>
          <h2 className="text-2xl font-bold">Rp 0</h2>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-red-500">
          <p className="text-gray-500 text-sm">PENGELUARAN</p>
          <h2 className="text-2xl font-bold text-red-600">Rp 0</h2>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm">SALDO BERJALAN</p>
          <h2 className="text-2xl font-bold text-blue-600">Rp 0</h2>
        </div>
      </div>

      {/* BODY UTAMA: FORM & RIWAYAT */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 bg-white p-6 rounded-lg shadow">
          <h2 className="font-bold mb-4">PENCATATAN KEUANGAN</h2>
          {/* Form Input Anda akan diletakkan di sini */}
          <div className="space-y-4">
             <input type="date" className="w-full border p-2 rounded" />
             <button className="w-full bg-blue-600 text-white py-2 rounded font-bold">SIMPAN CATATAN</button>
          </div>
        </div>

        <div className="col-span-2 bg-white p-6 rounded-lg shadow">
          <h2 className="font-bold mb-4">LOG RIWAYAT TRANSAKSI</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">TANGGAL</th>
                <th className="py-2">KETERANGAN</th>
                <th className="py-2">NOMINAL</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(t => (
                <tr key={t.id} className="border-b">
                  <td className="py-3">{t.date?.substring(0, 10)}</td>
                  <td className="py-3">{t.description}</td>
                  <td className="py-3 font-bold">{parseFloat(t.amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
