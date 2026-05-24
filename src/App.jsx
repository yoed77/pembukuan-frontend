import React, { useState, useEffect } from 'react';

function App() {
  // 1. STATE DATA UTAMA CLOUD
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // 2. STATE FORM INPUT TRANSAKSI BARU
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('expense'); // 'income' atau 'expense'
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // 3. STATE ACUAN DASHBOARD BULANAN
  const currentYearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth);

  // 4. STATE FILTER PENCARIAN LOG TABEL BAWAH
  const [filterMode, setFilterMode] = useState('month'); 
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState('all'); 
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');

  const BACKEND_URL = 'https://aplikasi-keuangan-backend.vercel.app';

  // 5. FETCH DATA FROM SUPABASE BACKEND
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


  // 6. 🧮 LOGIKA HITUNG AKUNTANSI REAL-TIME (DIPAKAI DASHBOARD & VALIDASI FORM)
  
  // A. Transaksi BULAN-BULAN SEBELUMNYA (Untuk Saldo Awal)
  const priorTransactions = transactions.filter(t => {
    if (!t.date) return false;
    return t.date.substring(0, 7) < selectedMonth;
  });

  const priorIncomeCash = priorTransactions
    .filter(t => (t.category_type === 'income' || t.type === 'income') && t.payment_method === 'cash')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const priorExpenseCash = priorTransactions
    .filter(t => (t.category_type === 'expense' || t.type === 'expense') && t.payment_method === 'cash')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const priorIncomeBank = priorTransactions
    .filter(t => (t.category_type === 'income' || t.type === 'income') && t.payment_method === 'bank')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const priorExpenseBank = priorTransactions
    .filter(t => (t.category_type === 'expense' || t.type === 'expense') && t.payment_method === 'bank')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  // Kunci saldo awal minimal 0
  const initialCash = Math.max(0, priorIncomeCash - priorExpenseCash);
  const initialBank = Math.max(0, priorIncomeBank - priorExpenseBank);
  const initialTotal = initialCash + initialBank;

  // B. Transaksi KHUSUS BULAN INI YANG SEDANG DIPILIH
  const currentMonthTransactions = transactions.filter(t => {
    if (!t.date) return false;
    return t.date.substring(0, 7) === selectedMonth;
  });

  const currentIncomeCash = currentMonthTransactions
    .filter(t => (t.category_type === 'income' || t.type === 'income') && t.payment_method === 'cash')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const currentIncomeBank = currentMonthTransactions
    .filter(t => (t.category_type === 'income' || t.type === 'income') && t.payment_method === 'bank')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const currentExpenseCash = currentMonthTransactions
    .filter(t => (t.category_type === 'expense' || t.type === 'expense') && t.payment_method === 'cash')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const currentExpenseBank = currentMonthTransactions
    .filter(t => (t.category_type === 'expense' || t.type === 'expense') && t.payment_method === 'bank')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalMonthIncome = currentIncomeCash + currentIncomeBank;
  const totalMonthExpense = currentExpenseCash + currentExpenseBank;
  
  // FIX MINUS: Menggunakan Math.max(0, ...) agar Saldo Berjalan Bulan Ini tidak bisa minus di UI
  const totalMonthSaldo = Math.max(0, totalMonthIncome - totalMonthExpense);

  // C. Kalkulasi FINAL AKHIR REAL KUMULATIF
  const finalCash = Math.max(0, initialCash + currentIncomeCash - currentExpenseCash);
  const finalBank = Math.max(0, initialBank + currentIncomeBank - currentExpenseBank);
  const finalTotal = finalCash + finalBank;


  // 7. 🔥 HANDLER SIMPAN TRANSAKSI + SISTEM COCOK SALDO (ANTI-KAS-BON)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId || !amount) {
      alert('Mohon pilih kategori dan isi jumlah uang!');
      return;
    }

    const inputAmount = parseFloat(amount);

    // CEK VALIDASI: Jika jenis transaksi adalah pengeluaran, periksa sisa dompetnya
    if (type === 'expense') {
      if (paymentMethod === 'cash' && inputAmount > finalCash) {
        alert(`❌ INPUT DITOLAK!\nSisa Saldo Cash Anda saat ini Rp ${finalCash.toLocaleString('id-ID')}, tidak cukup untuk pengeluaran sebesar Rp ${inputAmount.toLocaleString('id-ID')}.`);
        return; // Menghentikan proses simpan ke database
      }
      if (paymentMethod === 'bank' && inputAmount > finalBank) {
        alert(`❌ INPUT DITOLAK!\nSisa Saldo Bank Anda saat ini Rp ${finalBank.toLocaleString('id-ID')}, tidak cukup untuk pengeluaran sebesar Rp ${inputAmount.toLocaleString('id-ID')}.`);
        return; // Menghentikan proses simpan ke database
      }
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: parseInt(categoryId),
          amount: inputAmount,
          description: description || 'Tanpa keterangan',
          date,
          payment_method: paymentMethod
        })
      });

      if (response.ok) {
        setAmount('');
        setDescription('');
        fetchData();
        alert('✅ Transaksi berhasil disimpan!');
      } else {
        alert('Gagal menyimpan transaksi');
      }
    } catch (err) {
      console.error('Eror simpan:', err);
    }
  };

  // 8. LOGIKA FILTER PENYARINGAN RIWAYAT TABEL BAWAH
  const filteredTransactions = transactions.filter(t => {
    if (!t.date) return false;
    const rawDate = t.date.substring(0, 10);
    const transType = t.category_type || t.type || '';

    if (filterMode === 'month') {
      if (rawDate.substring(0, 7) !== selectedMonth) return false;
    } else if (filterMode === 'range') {
      if (rawDate < startDate || rawDate > endDate) return false;
    }

    if (filterType !== 'all') {
      if (transType !== filterType) return false;
    }

    if (filterCategory !== 'all') {
      if (String(t.category_id) !== filterCategory) return false;
    }

    if (filterPaymentMethod !== 'all') {
      if (t.payment_method !== filterPaymentMethod) return false;
    }

    return true;
  });

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen pb-12 font-sans antialiased text-gray-800">
      
      {/* NAVBAR MODERN */}
      <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <h1 className="text-xl font-black tracking-tight text-blue-600">Pencatatan Keuangan Toko</h1>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ACUAN DASHBOARD:</span>
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-extrabold text-blue-600 bg-transparent focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        
        {/* PANEL 1: SALDO AWAL */}
        <div className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-gray-400">
            <span>⏳</span> <span>SALDO AWAL (KUMULATIF BULAN SEBELUMNYA)</span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="text-gray-500">💵 Cash: <b className="text-gray-800 font-extrabold">Rp {initialCash.toLocaleString('id-ID')}</b></span>
            <span className="text-gray-500">🏦 Bank: <b className="text-gray-800 font-extrabold">Rp {initialBank.toLocaleString('id-ID')}</b></span>
            <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg font-black">Total: Rp {initialTotal.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* PANEL 2: 3 KARTU MUTASI BULAN INI (SUDAH ANTI MINUS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border-l-4 border-emerald-500 p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mb-1">Pemasukan Bulan Ini</p>
            <p className="text-lg font-black text-emerald-700">Rp {totalMonthIncome.toLocaleString('id-ID')}</p>
            <div className="text-[10px] text-gray-400 mt-2 flex justify-between border-t pt-1.5 border-dashed">
              <span>Cash: Rp {currentIncomeCash.toLocaleString('id-ID')}</span>
              <span>Bank: Rp {currentIncomeBank.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="bg-white border-l-4 border-rose-500 p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-[10px] uppercase font-bold text-rose-600 tracking-wider mb-1">Pengeluaran Bulan Ini</p>
            <p className="text-lg font-black text-rose-700">Rp {totalMonthExpense.toLocaleString('id-ID')}</p>
            <div className="text-[10px] text-gray-400 mt-2 flex justify-between border-t pt-1.5 border-dashed">
              <span>Cash: Rp {currentExpenseCash.toLocaleString('id-ID')}</span>
              <span>Bank: Rp {currentExpenseBank.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="bg-white border-l-4 border-blue-500 p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider mb-1">Saldo Berjalan Bulan Ini</p>
            <p className="text-lg font-black text-blue-700">
              Rp {totalMonthSaldo.toLocaleString('id-ID')}
            </p>
            <div className="text-[10px] text-gray-400 mt-2 flex justify-between border-t pt-1.5 border-dashed">
              <span>Cash: Rp {Math.max(0, currentIncomeCash - currentExpenseCash).toLocaleString('id-ID')}</span>
              <span>Bank: Rp {Math.max(0, currentIncomeBank - currentExpenseBank).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* PANEL 3: TOTAL REAL SALDO AKHIR FINAL */}
        <div className="p-4 bg-slate-900 text-white rounded-xl shadow-md grid grid-cols-1 md:grid-cols-3 gap-3 text-center text-xs font-bold divide-y md:divide-y-0 md:divide-x divide-slate-800">
          <div className="py-1">
            <p className="text-slate-400 text-[10px] font-medium uppercase tracking-wider mb-0.5">💵 SALDO AKHIR CASH</p>
            <p className="text-amber-400 text-base font-black">Rp {finalCash.toLocaleString('id-ID')}</p>
          </div>
          <div className="py-1">
            <p className="text-slate-400 text-[10px] font-medium uppercase tracking-wider mb-0.5">🏦 SALDO AKHIR BANK</p>
            <p className="text-sky-400 text-base font-black">Rp {finalBank.toLocaleString('id-ID')}</p>
          </div>
          <div className="py-1">
            <p className="text-slate-300 text-[10px] font-black uppercase tracking-wider mb-0.5">🎯 TOTAL REAL SALDO AKHIR</p>
            <p className="text-white text-lg font-black">Rp {finalTotal.toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* WORKSPACE DUA KOLOM */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          
          {/* KOLOM INPUT FORM DENGAN OVERFLOW VALIDATION */}
          <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4 lg:col-span-1">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-wide">✍️ Input Transaksi</h3>
              <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-sm font-bold">ANTI KAS-BON ACTIVATED</span>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Tanggal</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Jenis Transaksi</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setType('income')} className={`p-2 rounded-lg font-bold text-xs border flex items-center justify-center gap-1 transition-all ${type === 'income' ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-xs' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>📈 Pemasukan</button>
                <button type="button" onClick={() => setType('expense')} className={`p-2 rounded-lg font-bold text-xs border flex items-center justify-center gap-1 transition-all ${type === 'expense' ? 'bg-rose-50 border-rose-500 text-rose-600 shadow-xs' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>📉 Pengeluaran</button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Kategori</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white text-xs font-medium text-gray-700 focus:outline-none">
                <option value="">-- Pilih Kategori --</option>
                {categories.filter(c => c.type === type).map(c => (
                  <option key={c.id} value={c.id}>📁 {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Metode Pembayaran</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setPaymentMethod('cash')} className={`p-2 rounded-lg font-bold text-xs border flex items-center justify-center gap-1 transition-all ${paymentMethod === 'cash' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                  <input type="radio" checked={paymentMethod === 'cash'} readOnly className="accent-blue-600" /> 💵 Cash
                </button>
                <button type="button" onClick={() => setPaymentMethod('bank')} className={`p-2 rounded-lg font-bold text-xs border flex items-center justify-center gap-1 transition-all ${paymentMethod === 'bank' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                  <input type="radio" checked={paymentMethod === 'bank'} readOnly className="accent-blue-600" /> 🏦 Bank
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Jumlah Uang (Rp)</label>
              <input type="number" placeholder="Contoh: 50000" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none" />
              {type === 'expense' && (
                <p className="text-[10px] text-gray-400 mt-1 font-medium">
                  * Maksimal input: <span className="text-amber-600 font-bold">Rp {paymentMethod === 'cash' ? finalCash.toLocaleString('id-ID') : finalBank.toLocaleString('id-ID')}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Keterangan</label>
              <input type="text" placeholder="Contoh: Belanja barang sembako" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none" />
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg text-xs font-black transition shadow-sm uppercase tracking-wider">
              💾 Simpan Catatan
            </button>
          </form>

          {/* FILTER & TABEL RIWAYAT */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* PANEL FILTER SEARCH */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-3">
              <div className="flex items-center gap-1.5 border-b pb-2">
                <span className="text-sm">🔍</span>
                <h4 className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Panel Cari & Filter Riwayat</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 items-end">
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Rentang Waktu</label>
                  <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium focus:outline-none">
                    <option value="month">📅 Sesuai Bulan Acuan Atas</option>
                    <option value="range">📆 Custom Rentang Tanggal</option>
                  </select>
                </div>

                {filterMode === 'range' ? (
                  <>
                    <div>
                      <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Dari Tanggal</label>
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">s/d Tanggal</label>
                      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs focus:outline-none" />
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2 p-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-semibold text-center border border-blue-100">
                    Menyaring otomatis mengikuti bulan acuan di pojok kanan atas navbar
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Jenis Transaksi</label>
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium focus:outline-none">
                    <option value="all">🔄 Semua Transaksi</option>
                    <option value="income">📈 Hanya Pemasukan</option>
                    <option value="expense">📉 Hanya Pengeluaran</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Kategori</label>
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium focus:outline-none">
                    <option value="all">📁 Semua Kategori</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.type === 'income' ? '📈' : '📉'} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Metode Bayar</label>
                  <select value={filterPaymentMethod} onChange={(e) => setFilterPaymentMethod(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium focus:outline-none">
                    <option value="all">💸 Semua Metode</option>
                    <option value="cash">💵 CASH</option>
                    <option value="bank">🏦 BANK</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TABEL DATA AKUNTANSI */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-1">
                  <span className="text-sm">📋</span>
                  <h2 className="text-xs font-black text-gray-700 uppercase tracking-wider">Log Riwayat Pembukuan</h2>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 font-bold rounded-full">
                  {filteredTransactions.length} baris cocok
                </span>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-bold text-[10px] uppercase">
                      <th className="pb-2.5">Tanggal</th>
                      <th className="pb-2.5">Kategori</th>
                      <th className="pb-2.5">Metode</th>
                      <th className="pb-2.5">Keterangan</th>
                      <th className="pb-2.5 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-6 text-center text-gray-400 italic text-[11px]">
                          Tidak ada data mutasi transaksi yang cocok dengan filter pencarian.
                        </td>
                      </tr>
                    ) : (
                      [...filteredTransactions].sort((a,b) => b.date.localeCompare(a.date)).map((t) => {
                        const isIncome = t.category_type === 'income' || t.type === 'income';
                        return (
                          <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition text-[11px]">
                            <td className="py-3 text-gray-500 whitespace-nowrap">
                              {t.date ? new Date(t.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : '-'}
                            </td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-medium rounded-md text-[10px]">{t.category_name || 'Umum'}</span>
                            </td>
                            <td className="py-3 font-bold text-slate-500 uppercase">{t.payment_method}</td>
                            <td className="py-3 text-gray-700 font-medium max-w-[150px] truncate" title={t.description}>{t.description || '-'}</td>
                            <td className={`py-3 text-right font-black whitespace-nowrap ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {isIncome ? '+ ' : '- '}Rp {parseFloat(t.amount || 0).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
