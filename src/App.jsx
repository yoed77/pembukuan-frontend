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

  // ─── STATE TAMBAHAN UNTUK FILTER PENCARIAN RIWAYAT DI BAWAH ─────────
  const [filterMode, setFilterMode] = useState('month'); // 'month' atau 'day'
  const [filterSpecificDate, setFilterSpecificDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  // ────────────────────────────────────────────────────────────────────

  // URL Backend Vercel Cloud
  const BACKEND_URL = 'https://aplikasi-keuangan-backend.vercel.app';

  // 4. AMBIL DATA DARI BACKEND
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

  // Otomatis pasang kategori pertama kalau tipe berubah
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
        fetchData();
        alert('Transaksi berhasil disimpan!');
      } else {
        alert('Gagal menyimpan transaksi');
      }
    } catch (err) {
      console.error('Eror simpan:', err);
    }
  };

  // 6. SISTEM PERHITUNGAN AKUNTANSI DASHBOARD ASLI MAS YUDI
  // Ambil semua data SEBELUM bulan terpilih (Untuk Saldo Awal)
  const priorTransactions = transactions.filter(t => {
    const rawDate = t.date || '';
    return rawDate.substring(0, 7) < selectedMonth;
  });

  const priorIncomeCash = priorTransactions.filter(t => (t.category_type === 'income' || t.type === 'income') && t.payment_method === 'cash').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const priorExpenseCash = priorTransactions.filter(t => (t.category_type === 'expense' || t.type === 'expense') && t.payment_method === 'cash').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const priorIncomeBank = priorTransactions.filter(t => (t.category_type === 'income' || t.type === 'income') && t.payment_method === 'bank').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const priorExpenseBank = priorTransactions.filter(t => (t.category_type === 'expense' || t.type === 'expense') && t.payment_method === 'bank').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const initialCash = priorIncomeCash - priorExpenseCash;
  const initialBank = priorIncomeBank - priorExpenseBank;
  const initialTotal = initialCash + initialBank;

  // Data transaksi khusus di bulan berjalan
  const currentMonthTransactions = transactions.filter(t => {
    const rawDate = t.date || '';
    return rawDate.substring(0, 7) === selectedMonth;
  });

  const currentIncomeCash = currentMonthTransactions.filter(t => (t.category_type === 'income' || t.type === 'income') && t.payment_method === 'cash').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const currentIncomeBank = currentMonthTransactions.filter(t => (t.category_type === 'income' || t.type === 'income') && t.payment_method === 'bank').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const currentExpenseCash = currentMonthTransactions.filter(t => (t.category_type === 'expense' || t.type === 'expense') && t.payment_method === 'cash').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const currentExpenseBank = currentMonthTransactions.filter(t => (t.category_type === 'expense' || t.type === 'expense') && t.payment_method === 'bank').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalMonthIncome = currentIncomeCash + currentIncomeBank;
  const totalMonthExpense = currentExpenseCash + currentExpenseBank;
  const totalMonthSaldo = totalMonthIncome - totalMonthExpense;

  // Saldo Akhir Final akumulasi
  const finalCash = initialCash + currentIncomeCash - currentExpenseCash;
  const finalBank = initialBank + currentIncomeBank - currentExpenseBank;
  const finalTotal = finalCash + finalBank;

  // 7. MULTI-FILTER PENCARIAN RIWAYAT TABEL (BAGIAN BAWAH)
  const searchedTransactions = transactions.filter(t => {
    const rawDate = t.date || '';
    
    // Filter Periode Tanggal (Bulan Aktif vs Tanggal Tertentu)
    if (filterMode === 'month') {
      if (rawDate.substring(0, 7) !== selectedMonth) return false;
    } else if (filterMode === 'day') {
      if (rawDate.substring(0, 10) !== filterSpecificDate) return false;
    }

    // Filter Kategori
    if (filterCategory !== 'all') {
      if (String(t.category_id) !== filterCategory) return false;
    }

    // Filter Metode Pembayaran
    if (filterPaymentMethod !== 'all') {
      if (t.payment_method !== filterPaymentMethod) return false;
    }

    return true;
  });

  return (
    <div className="max-w-xl mx-auto bg-gray-100 min-h-screen pb-10 font-sans antialiased text-gray-800">
      
      {/* HEADER UTAMA */}
      <div className="bg-white p-4 flex justify-between items-center shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h1 className="text-lg font-black tracking-tight text-blue-600">Pencatatan Keuangan</h1>
        </div>
        <div className="flex items-center gap-1 bg-gray-50 border p-1 rounded-lg">
          <span className="text-[10px] font-bold text-gray-400 px-1 uppercase">Acuan Dashboard:</span>
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-bold text-blue-600 bg-transparent focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* BLOCK 1: SALDO AWAL (BULAN SEBELUMNYA) */}
      <div className="m-3 p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center text-xs font-medium text-gray-500">
        <div className="flex items-center gap-1">⏳ <span>SALDO AWAL (BULAN SEBELUMNYA)</span></div>
        <div className="flex gap-3 text-[11px]">
          <span>💵 Cash: <b className="text-gray-700">Rp {initialCash.toLocaleString('id-ID')}</b></span>
          <span>🏦 Bank: <b className="text-gray-700">Rp {initialBank.toLocaleString('id-ID')}</b></span>
          <span className="bg-gray-200 px-1.5 py-0.2 rounded font-bold text-gray-800">Total: Rp {initialTotal.toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* BLOCK 2: TIGA KARTU INDIKATOR UTAMA */}
      <div className="mx-3 mb-3 grid grid-cols-3 gap-2.5">
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl shadow-sm">
          <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 mb-1">Pemasukan Bulan Ini</p>
          <p className="text-sm font-black text-emerald-700">Rp {totalMonthIncome.toLocaleString('id-ID')}</p>
          <div className="text-[9px] text-emerald-500 mt-1 space-y-0.5">
            <p>Cash: Rp {currentIncomeCash.toLocaleString('id-ID')}</p>
            <p>Bank: Rp {currentIncomeBank.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl shadow-sm">
          <p className="text-[10px] uppercase tracking-wider font-bold text-rose-600 mb-1">Pengeluaran Bulan Ini</p>
          <p className="text-sm font-black text-rose-700">Rp {totalMonthExpense.toLocaleString('id-ID')}</p>
          <div className="text-[9px] text-rose-500 mt-1 space-y-0.5">
            <p>Cash: Rp {currentExpenseCash.toLocaleString('id-ID')}</p>
            <p>Bank: Rp {currentExpenseBank.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl shadow-sm">
          <p className="text-[10px] uppercase tracking-wider font-bold text-blue-600 mb-1">Saldo Berjalan</p>
          <p className="text-sm font-black text-blue-700">Rp {totalMonthSaldo.toLocaleString('id-ID')}</p>
          <div className="text-[9px] text-blue-500 mt-1 space-y-0.5">
            <p>Cash: Rp {(currentIncomeCash - currentExpenseCash).toLocaleString('id-ID')}</p>
            <p>Bank: Rp {(currentIncomeBank - currentExpenseBank).toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      {/* BLOCK 3: BANNER SALDO AKHIR FINAL AKUMULASI */}
      <div className="mx-3 mb-4 p-3 bg-slate-900 text-white rounded-xl shadow-md grid grid-cols-3 gap-2 text-center text-xs font-bold divide-x divide-slate-700">
        <div>
          <p className="text-slate-400 font-normal text-[10px] mb-0.5">💵 SALDO AKHIR CASH</p>
          <p className="text-amber-400 font-extrabold">Rp {finalCash.toLocaleString('id-ID')}</p>
        </div>
        <div>
          <p className="text-slate-400 font-normal text-[10px] mb-0.5">🏦 SALDO AKHIR BANK</p>
          <p className="text-sky-400 font-extrabold">Rp {finalBank.toLocaleString('id-ID')}</p>
        </div>
        <div>
          <p className="text-slate-300 font-black text-[10px] mb-0.5">🎯 TOTAL SALDO AKHIR FINAL</p>
          <p className="text-white text-sm font-black">Rp {finalTotal.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* FORM INPUT TRANSAKSI (KOTAK PUTIH TENGAH) */}
      <form onSubmit={handleSubmit} className="m-3 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-3.5">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Tanggal</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Jenis Transaksi</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setType('income')} className={`p-2 rounded-xl font-bold text-xs border transition-all ${type === 'income' ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>📈 Pemasukan</button>
            <button type="button" onClick={() => setType('expense')} className={`p-2 rounded-xl font-bold text-xs border transition-all ${type === 'expense' ? 'bg-rose-50 border-rose-500 text-rose-600 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>📉 Pengeluaran</button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Kategori</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-xl bg-gray-50 text-xs font-medium text-gray-700 focus:outline-none">
            <option value="">-- Pilih Kategori --</option>
            {categories.filter(c => c.type === type).map(c => (
              <option key={c.id} value={c.id}>📁 {c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Metode Pembayaran</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setPaymentMethod('cash')} className={`p-2 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1 ${paymentMethod === 'cash' ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
              <input type="radio" checked={paymentMethod === 'cash'} readOnly className="accent-blue-600" /> 💵 Cash
            </button>
            <button type="button" onClick={() => setPaymentMethod('bank')} className={`p-2 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1 ${paymentMethod === 'bank' ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
              <input type="radio" checked={paymentMethod === 'bank'} readOnly className="accent-blue-600" /> 🏦 Bank
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Jumlah Uang (Rp)</label>
          <input type="number" placeholder="Contoh: 50000" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border border-gray-300 rounded-xl bg-gray-50 text-sm focus:outline-none" />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Keterangan</label>
          <input type="text" placeholder="Contoh: Belanja plastik sembako" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border border-gray-300 rounded-xl bg-gray-50 text-sm focus:outline-none" />
        </div>

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl text-xs font-black transition shadow-sm uppercase tracking-wider">
          Simpan Catatan
        </button>
      </form>

      {/* 🔍 PANEL FILTER PENCARIAN RIWAYAT (YANG BARU DITAMBAHKAN) */}
      <div className="m-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <div className="flex items-center gap-1 pb-1 border-b border-gray-100">
          <span className="text-sm">🔍</span>
          <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Panel Cari Riwayat Transaksi</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {/* Filter 1: Pilih Mode Rentang Tanggal */}
          <div>
            <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">1. Rentang Tanggal</label>
            <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-medium focus:outline-none">
              <option value="month">📅 Mengikuti Acuan Bulan</option>
              <option value="day">📆 Cari Tanggal Spesifik</option>
            </select>
          </div>

          {/* Form Input Muncul Jika Pilih Tanggal Spesifik */}
          <div>
            {filterMode === 'day' ? (
              <>
                <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Pilih Hari Spesifik</label>
                <input type="date" value={filterSpecificDate} onChange={(e) => setFilterSpecificDate(e.target.value)} className="w-full p-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs focus:outline-none" />
              </>
            ) : (
              <>
                <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Informasi</label>
                <div className="w-full p-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-semibold text-center">Menyaring Bulan Di Atas</div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Filter 2: Kategori */}
          <div>
            <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">2. Filter Kategori</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-medium focus:outline-none">
              <option value="all">📁 Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.type === 'income' ? '📈' : '📉'} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Filter 3: Metode Pembayaran */}
          <div>
            <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">3. Filter Metode</label>
            <select value={filterPaymentMethod} onChange={(e) => setFilterPaymentMethod(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-medium focus:outline-none">
              <option value="all">💸 Semua Metode</option>
              <option value="cash">💵 CASH</option>
              <option value="bank">🏦 BANK</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABEL DATA RIWAYAT TRANSAKSI TERFILTER */}
      <div className="m-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1">
            <span className="text-sm">📋</span>
            <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">Daftar Log Transaksi</h2>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 font-bold rounded-full">{searchedTransactions.length} Baris ditemukan</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-bold text-[10px] uppercase">
                <th className="pb-2">Tanggal</th>
                <th className="pb-2">Kategori</th>
                <th className="pb-2">Metode</th>
                <th className="pb-2">Keterangan</th>
                <th className="pb-2 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {searchedTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-400 italic text-[11px]">Tidak ada kecocokan riwayat transaksi.</td>
                </tr>
              ) : (
                // Diurutkan dari tanggal paling baru ke paling lama
                [...searchedTransactions].sort((a,b) => b.date.localeCompare(a.date)).map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition text-[11px]">
                    <td className="py-2.5 text-gray-500 whitespace-nowrap">
                      {t.date ? new Date(t.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : '-'}
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-medium rounded-md">{t.category_name || 'Umum'}</span>
                    </td>
                    <td className="py-2.5 font-bold text-slate-500 uppercase">{t.payment_method}</td>
                    <td className="py-2.5 text-gray-700 font-medium">{t.description || '-'}</td>
                    <td className={`py-2.5 text-right font-black whitespace-nowrap ${t.category_type === 'income' || t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.category_type === 'income' || t.type === 'income' ? '+ ' : '- '}Rp {parseFloat(t.amount || 0).toLocaleString('id-ID')}
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
