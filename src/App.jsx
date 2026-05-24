import React, { useState, useEffect } from 'react';

function App() {
  // 1. STATE UTAMA DATA (SUPABASE / VERCEL BACKEND)
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // 2. STATE FORM INPUT TRANSAKSI BARU ASLI
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('expense'); // 'income' atau 'expense'
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // 3. STATE ACUAN DASHBOARD BULANAN ASLI
  const currentYearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth);

  // ─── STATE FILTER PENCARIAN TANGGAL & JENIS TRANSAKSI BARU ────────
  const [filterMode, setFilterMode] = useState('month'); // 'month' atau 'range'
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  // ────────────────────────────────────────────────────────────────────

  const BACKEND_URL = 'https://aplikasi-keuangan-backend.vercel.app';

  // 4. FETCH DATA FROM CLOUD
  const fetchData = async () => {
    try {
      const resCat = await fetch(`${BACKEND_URL}/api/categories`);
      const dataCat = await resCat.json();
      setCategories(Array.isArray(dataCat) ? dataCat : []);

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

  useEffect(() => {
    const filteredCats = categories.filter(c => c.type === type);
    if (filteredCats.length > 0) {
      setCategoryId(filteredCats[0].id);
    } else {
      setCategoryId('');
    }
  }, [type, categories]);

  // 5. HANDLER SIMPAN DATA
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
        fetchData();
        alert('Transaksi berhasil disimpan!');
      } else {
        alert('Gagal menyimpan transaksi');
      }
    } catch (err) {
      console.error('Eror simpan:', err);
    }
  };

  // 6. LOGIKA HITUNG AKUNTANSI DASHBOARD KARTU ATAS (TETAP IKUT ACUAN BULANAN)
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

  // 7. SISTEM FILTER PENCARIAN LOG RIWAYAT TRANSAKSI (YANG SUDAH DIUPGRADE)
  const filteredTransactions = transactions.filter(t => {
    const rawDate = t.date ? t.date.substring(0, 10) : '';
    const transType = t.category_type || t.type || '';

    // Filter A: Tanggal (Bulan Acuan VS Dari Tanggal s/d Tanggal)
    if (filterMode === 'month') {
      if (rawDate.substring(0, 7) !== selectedMonth) return false;
    } else if (filterMode === 'range') {
      if (rawDate < startDate || rawDate > endDate) return false;
    }

    // Filter B: Jenis Uang (Pemasukan / Pengeluaran)
    if (filterType !== 'all') {
      if (transType !== filterType) return false;
    }

    // Filter C: Kategori Komponen
    if (filterCategory !== 'all') {
      if (String(t.category_id) !== filterCategory) return false;
    }

    // Filter D: Metode Pembayaran (Cash / Bank)
    if (filterPaymentMethod !== 'all') {
      if (t.payment_method !== filterPaymentMethod) return false;
    }

    return true;
  });

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-10 font-sans antialiased text-gray-800">
      
      {/* HEADER BIRU ELEGAN ASLI MAS YUDI */}
      <div className="bg-blue-600 text-white p-5 text-center rounded-b-2xl shadow-md">
        <h1 className="text-xl font-bold tracking-wide">Pencatatan Keuangan Toko</h1>
        <p className="text-xs text-blue-100 mt-1">Sistem Cloud Mas Yudi v2.0</p>
      </div>

      {/* KOTAK ACUAN DASHBOARD BULANAN ASLI */}
      <div className="m-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          📊 ACUAN DASHBOARD BULANAN
        </label>
        <input 
          type="month" 
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-gray-700"
        />
      </div>

      {/* 3 KOTAK SALDO BERWARNA CERAH UTUH ASLI MAS YUDI */}
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

      {/* LAYOUT FORM INPUT PUTIH BERSIH ASLI MAS YUDI */}
      <form onSubmit={handleSubmit} className="m-4 p-5 bg-white rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Tanggal</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Jenis Transaksi</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setType('income')} className={`p-2 rounded-lg font-bold text-sm border flex items-center justify-center gap-1 transition-all ${type === 'income' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>📊 Pemasukan</button>
            <button type="button" onClick={() => setType('expense')} className={`p-2 rounded-lg font-bold text-sm border flex items-center justify-center gap-1 transition-all ${type === 'expense' ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>📉 Pengeluaran</button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Kategori</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none">
            <option value="">-- Pilih Kategori --</option>
            {categories.filter(c => c.type === type).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Jumlah Uang (Rp)</label>
          <input type="number" placeholder="Contoh: 50000" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none" />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Keterangan</label>
          <input type="text" placeholder="Contoh: Belanja plastik sembako" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none" />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Metode Pembayaran</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setPaymentMethod('cash')} className={`p-2 rounded-lg font-medium text-sm border flex items-center justify-center gap-1 transition-all ${paymentMethod === 'cash' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>💵 Cash</button>
            <button type="button" onClick={() => setPaymentMethod('bank')} className={`p-2 rounded-lg font-medium text-sm border flex items-center justify-center gap-1 transition-all ${paymentMethod === 'bank' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>🏦 Bank</button>
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-bold transition shadow-md text-sm">
          💾 Simpan Transaksi Cloud
        </button>
      </form>

      {/* KARTU DAFTAR RIWAYAT TRANSAKSI ASLI */}
      <div className="m-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1">
            📋 Riwayat Transaksi
          </h2>
          <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-bold text-gray-500">
            {filteredTransactions.length} baris
          </span>
        </div>

        {/* 🛠️ PANEL FILTER MINIMALIS (BARU & COCOK DENGAN TEMA PUTIH MAS YUDI) */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4 space-y-2 text-xs">
          
          {/* Baris Filter 1: Opsi Model Tanggal */}
          <div className="grid grid-cols-3 gap-1.5 items-end">
            <div>
              <label className="block text-[9px] text-gray-400 font-bold uppercase mb-0.5">Filter Waktu</label>
              <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)} className="w-full p-1 bg-white border border-gray-300 rounded text-gray-700 focus:outline-none">
                <option value="month">Ikut Bulan Atas</option>
                <option value="range">Rentang Tanggal</option>
              </select>
            </div>

            {/* Input Rentang Tanggal dinamis S/D Tanggal */}
            {filterMode === 'range' ? (
              <>
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold uppercase mb-0.5">Dari Tgl</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-0.5 bg-white border border-gray-300 rounded text-[11px] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold uppercase mb-0.5">s/d Tgl</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-0.5 bg-white border border-gray-300 rounded text-[11px] focus:outline-none" />
                </div>
              </>
            ) : (
              <div className="col-span-2 text-center text-blue-500 font-semibold bg-blue-50 py-1 rounded text-[10px]">
                Menyaring otomatis bulan di atas
              </div>
            )}
          </div>

          {/* Baris Filter 2: Jenis Pemasukan/Pengeluaran & Kat/Metode */}
          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label className="block text-[9px] text-gray-400 font-bold uppercase mb-0.5">Jenis Uang</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full p-1 bg-white border border-gray-300 rounded text-gray-700 focus:outline-none">
                <option value="all">Semua Data</option>
                <option value="income">📈 Pemasukan</option>
                <option value="expense">📉 Pengeluaran</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] text-gray-400 font-bold uppercase mb-0.5">Kategori</label>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full p-1 bg-white border border-gray-300 rounded text-gray-700 focus:outline-none">
                <option value="all">Semua Kategori</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] text-gray-400 font-bold uppercase mb-0.5">Metode</label>
              <select value={filterPaymentMethod} onChange={(e) => setFilterPaymentMethod(e.target.value)} className="w-full p-1 bg-white border border-gray-300 rounded text-gray-700 focus:outline-none">
                <option value="all">Semua</option>
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABEL DATA STRUKTUR ASLI MAS YUDI v2.0 */}
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
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-gray-400 italic">Data pencarian tidak ditemukan.</td>
                </tr>
              ) : (
                // Diurutkan berdasarkan input tanggal terbaru ke terlama
                [...filteredTransactions].sort((a,b) => b.date.localeCompare(a.date)).map((t) => (
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
