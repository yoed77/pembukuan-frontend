import React, { useState, useEffect } from 'react';

function App() {
  // 1. STATE UNTUK MENYIMPAN DATA
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // 2. STATE UNTUK INPUT FORM BARU
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('expense'); // 'income' atau 'expense'
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // 3. STATE FILTER ACUAN DASHBOARD UTAMA (BULANAN)
  const currentYearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth);

  // ─── STATE TAMBAHAN UNTUK FILTER PENCARIAN RIWAYAT ──────────────────
  const [filterMode, setFilterMode] = useState('month'); // 'month' atau 'day'
  const [filterSpecificDate, setFilterSpecificDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  // ────────────────────────────────────────────────────────────────────

  // URL Backend Mas Yudi Bersih Tanpa Garis Miring Ganda
  const BACKEND_URL = 'https://aplikasi-keuangan-backend.vercel.app';

  // 4. AMBIL DATA DARI BACKEND CLOUD
  const fetchData = async () => {
    try {
      // Ambil Kategori
      const resCat = await fetch(`${BACKEND_URL}/api/categories`);
      const dataCat = await resCat.json();
      setCategories(Array.isArray(dataCat) ? dataCat : []);

      // Ambil Transaksi
      const resTrans = await fetch(`${BACKEND_URL}/api/transactions`);
      const dataTrans = await resTrans.json();
      setTransactions(Array.isArray(dataTrans) ? dataTrans : []);
    } catch (err) {
      console.error('Gagal mengambil data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Otomatis memilih kategori pertama jika tipe transaksi berubah
  useEffect(() => {
    const filteredCats = categories.filter(c => c.type === type);
    if (filteredCats.length > 0) {
      setCategoryId(filteredCats[0].id);
    } else {
      setCategoryId('');
    }
  }, [type, categories]);

  // 5. PROSES SIMPAN TRANSAKSI BARU
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId || !amount) {
      alert('Mohon pilih kategori dan isi jumlah uang!');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: parseInt(categoryId),
          amount: parseFloat(amount),
          description: description || 'Tanpa keterangan',
          date,
          payment_method: paymentMethod
        })
      });

      if (response.ok) {
        setAmount('');
        setDescription('');
        fetchData(); // Muat ulang data otomatis
        alert('Transaksi berhasil disimpan!');
      } else {
        alert('Gagal menyimpan transaksi');
      }
    } catch (err) {
      console.error('Eror simpan:', err);
    }
  };

  // 6. LOGIKA HITUNG DASHBOARD BULANAN UTAMA (KOTAK ATAS)
  const dashboardTransactions = transactions.filter(t => {
    const rawDate = t.date || '';
    return rawDate.substring(0, 7) === selectedMonth;
  });

  const totalIncome = dashboardTransactions
    .filter(t => t.category_type === 'income' || t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalExpense = dashboardTransactions
    .filter(t => t.category_type === 'expense' || t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalSaldo = totalIncome - totalExpense;

  // 7. LOGIKA MULTI-FILTER PENCARIAN RIWAYAT TABEL (BAGIAN BAWAH)
  const searchedTransactions = transactions.filter(t => {
    const rawDate = t.date || '';
    
    // A. Filter Periode Tanggal (Bulan-Tahun ATAU Tanggal Spesifik)
    if (filterMode === 'month') {
      if (rawDate.substring(0, 7) !== selectedMonth) return false;
    } else if (filterMode === 'day') {
      if (rawDate.substring(0, 10) !== filterSpecificDate) return false;
    }

    // B. Filter Berdasarkan Kategori
    if (filterCategory !== 'all') {
      if (String(t.category_id) !== filterCategory) return false;
    }

    // C. Filter Berdasarkan Metode Pembayaran
    if (filterPaymentMethod !== 'all') {
      if (t.payment_method !== filterPaymentMethod) return false;
    }

    return true;
  });

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-10 font-sans antialiased text-gray-800">
      {/* HEADER */}
      <div className="bg-blue-600 text-white p-5 text-center rounded-b-2xl shadow-md">
        <h1 className="text-xl font-bold tracking-wide">Pencatatan Keuangan Toko</h1>
        <p className="text-xs text-blue-100 mt-1">Sistem Cloud Mas Yudi v2.1</p>
      </div>

      {/* FILTER ACUAN BULANAN (DASHBOARD UTAMA) */}
      <div className="m-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          📅 Acuan Dashboard Bulanan
        </label>
        <input 
          type="month" 
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
        />
      </div>

      {/* KARTU RINGKASAN SALDO BULANAN */}
      <div className="mx-4 mb-6 grid grid-cols-3 gap-2 text-center text-white font-bold text-xs">
        <div className="bg-emerald-500 p-3 rounded-xl shadow-sm">
          <p className="opacity-90 font-normal mb-1">Pemasukan</p>
          <p className="text-sm">Rp {totalIncome.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-rose-500 p-3 rounded-xl shadow-sm">
          <p className="opacity-90 font-normal mb-1">Pengeluaran</p>
          <p className="text-sm">Rp {totalExpense.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-blue-500 p-3 rounded-xl shadow-sm">
          <p className="opacity-90 font-normal mb-1">Sisa Saldo</p>
          <p className="text-sm">Rp {totalSaldo.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* FORM INPUT TRANSAKSI BARU */}
      <form onSubmit={handleSubmit} className="m-4 p-5 bg-white rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Tanggal</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Jenis Transaksi</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setType('income')} className={`p-2 rounded-lg font-bold text-sm border ${type === 'income' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-gray-50 text-gray-500'}`}>📈 Pemasukan</button>
            <button type="button" onClick={() => setType('expense')} className={`p-2 rounded-lg font-bold text-sm border ${type === 'expense' ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-gray-50 text-gray-500'}`}>📉 Pengeluaran</button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Kategori</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full p-2 border rounded-lg bg-white">
            <option value="">-- Pilih Kategori --</option>
            {categories.filter(c => c.type === type).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Jumlah Uang (Rp)</label>
          <input type="number" placeholder="Contoh: 50000" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Keterangan</label>
          <input type="text" placeholder="Contoh: Belanja plastik sembako" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Metode Pembayaran</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setPaymentMethod('cash')} className={`p-2 rounded-lg font-medium text-sm border ${paymentMethod === 'cash' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>💵 Cash</button>
            <button type="button" onClick={() => setPaymentMethod('bank')} className={`p-2 rounded-lg font-medium text-sm border ${paymentMethod === 'bank' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>🏦 Bank</button>
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-bold transition shadow-sm">
          💾 Simpan Transaksi Cloud
        </button>
      </form>

      {/* 🛠️ BARU: PANEL PENCARIAN & FILTER MULTI-OPSI TRANSAKSI */}
      <div className="m-4 p-4 bg-slate-800 text-white rounded-xl shadow-md border border-slate-700 space-y-3">
        <h3 className="text-xs font-black text-blue-400 uppercase tracking-wider">🔍 Panel Pencarian Riwayat</h3>
        
        {/* Opsi 1: Pilihan Jenis Periode (Bulanan vs Tanggal Tertentu) */}
        <div>
          <label className="block text-[10px] text-slate-400 font-bold mb-1">1. Mode Periode Waktu</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setFilterMode('month')} className={`py-1 rounded text-xs font-semibold border ${filterMode === 'month' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-700 border-slate-600 text-slate-300'}`}>📅 Ikut Acuan Bulan</button>
            <button type="button" onClick={() => setFilterMode('day')} className={`py-1 rounded text-xs font-semibold border ${filterMode === 'day' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-700 border-slate-600 text-slate-300'}`}>📆 Tanggal Tertentu</button>
          </div>
        </div>

        {/* Form Tanggal Tertentu Jika Dipilih */}
        {filterMode === 'day' && (
          <div>
            <input type="date" value={filterSpecificDate} onChange={(e) => setFilterSpecificDate(e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 text-white rounded text-xs focus:outline-none" />
          </div>
        )}

        {/* Opsi 2 & 3: Kategori dan Metode Pembayaran */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">2. Filter Kategori</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 text-white rounded text-xs focus:outline-none">
              <option value="all">📁 Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">3. Filter Metode</label>
            <select value={filterPaymentMethod} onChange={(e) => setFilterPaymentMethod(e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 text-white rounded text-xs focus:outline-none">
              <option value="all">💸 Semua Metode</option>
              <option value="cash">💵 Cash</option>
              <option value="bank">🏦 Bank</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABEL RIWAYAT TRANSAKSI TERFILTER OTOMATIS */}
      <div className="m-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-gray-700">📋 Hasil Penelusuran</h2>
          <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 font-bold rounded-full">{searchedTransactions.length} Data</span>
        </div>
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-semibold">
                <th className="pb-2">Tanggal</th>
                <th className="pb-2">Keterangan/Kat</th>
                <th className="pb-2 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {searchedTransactions.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-gray-400 italic">Pencarian tidak ditemukan / data kosong.</td>
                </tr>
              ) : (
                searchedTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-2.5 text-gray-500">
                      {t.date ? new Date(t.date).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit'}) : '-'}
                    </td>
                    <td className="py-2.5">
                      <span className="font-medium block text-gray-900">{t.description || '-'}</span>
                      <div className="flex gap-1 mt-0.5 items-center">
                        <span className="text-[9px] text-gray-400 px-1.5 py-0.2 bg-gray-100 rounded inline-block">{t.category_name || 'Umum'}</span>
                        <span className="text-[9px] uppercase font-bold text-slate-400 px-1 py-0.2 bg-slate-100 rounded inline-block">{t.payment_method}</span>
                      </div>
                    </td>
                    <td className={`py-2.5 text-right font-bold ${t.category_type === 'income' || t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.category_type === 'income' || t.type === 'income' ? '+' : '-'} Rp {parseFloat(t.amount || 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
