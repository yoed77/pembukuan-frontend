import React, { useState, useEffect } from 'react';

function App() {
  // 1. STATE DATA UTAMA CLOUD
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // 2. STATE FORM INPUT TRANSAKSI BARU
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('expense'); 
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // 3. STATE ACUAN DASHBOARD UTAMA (BULANAN)
  const currentYear = String(new Date().getFullYear());
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const [selectedMonth, setSelectedMonth] = useState(`${currentYear}-${currentMonth}`);

  // 4. STATE FILTER PENCARIAN LOG TABEL (TAHUN & BULAN TERPISAH)
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useState(currentMonth); // "all" atau "01"-"12"
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


  // 6. 🧮 LOGIKA PERHITUNGAN SALDO REAL KUMULATIF (STRICT ANTI-MINUS)
  const totalIncomeCashAllTime = transactions
    .filter(t => (t.category_type === 'income' || t.type === 'income') && t.payment_method === 'cash')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalExpenseCashAllTime = transactions
    .filter(t => (t.category_type === 'expense' || t.type === 'expense') && t.payment_method === 'cash')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalIncomeBankAllTime = transactions
    .filter(t => (t.category_type === 'income' || t.type === 'income') && t.payment_method === 'bank')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalExpenseBankAllTime = transactions
    .filter(t => (t.category_type === 'expense' || t.type === 'expense') && t.payment_method === 'bank')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const realCurrentCashWallet = totalIncomeCashAllTime - totalExpenseCashAllTime;
  const realCurrentBankWallet = totalIncomeBankAllTime - totalExpenseBankAllTime;


  // --- PERHITUNGAN UNTUK DATA DASHBOARD (BERDASARKAN ACUAN BULANAN DI ATAS) ---
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

  const initialCash = Math.max(0, priorIncomeCash - priorExpenseCash);
  const initialBank = Math.max(0, priorIncomeBank - priorExpenseBank);
  const initialTotal = initialCash + initialBank;

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
  const totalMonthSaldo = Math.max(0, totalMonthIncome - totalMonthExpense);

  const finalCash = Math.max(0, initialCash + currentIncomeCash - currentExpenseCash);
  const finalBank = Math.max(0, initialBank + currentIncomeBank - currentExpenseBank);
  const finalTotal = finalCash + finalBank;


  // 7. 🔥 HANDLER SIMPAN TRANSAKSI (SISTEM CEK SALDO KAS-BON)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId || !amount) {
      alert('Mohon pilih kategori dan isi jumlah uang!');
      return;
    }

    const inputAmount = parseFloat(amount);

    if (type === 'expense') {
      if (paymentMethod === 'cash' && inputAmount > realCurrentCashWallet) {
        alert(`❌ INPUT DITOLAK!\nSisa Uang Cash riil Anda sekarang tinggal Rp ${Math.max(0, realCurrentCashWallet).toLocaleString('id-ID')}.\nTidak boleh menginput pengeluaran sebesar Rp ${inputAmount.toLocaleString('id-ID')} (Menyebabkan Kas Minus).`);
        return; 
      }
      if (paymentMethod === 'bank' && inputAmount > realCurrentBankWallet) {
        alert(`❌ INPUT DITOLAK!\nSisa Saldo Rekening Bank Anda sekarang tinggal Rp ${Math.max(0, realCurrentBankWallet).toLocaleString('id-ID')}.\nTidak boleh menginput pengeluaran sebesar Rp ${inputAmount.toLocaleString('id-ID')} (Menyebabkan Rekening Minus).`);
        return; 
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
        alert('✅ Catatan berhasil disimpan ke Cloud!');
      } else {
        alert('Gagal menyimpan transaksi');
      }
    } catch (err) {
      console.error('Eror simpan:', err);
    }
  };

  // 8. 🔍 LOGIKA PENYARINGAN RIWAYAT TABEL (BERDASARKAN TAHUN DAN BULAN TERPISAH)
  const filteredTransactions = transactions.filter(t => {
    if (!t.date) return false;
    const transDate = new Date(t.date);
    const transYear = String(transDate.getFullYear());
    const transMonth = String(transDate.getMonth() + 1).padStart(2, '0');
    const transType = t.category_type || t.type || '';

    // Filter Tahun
    if (filterYear !== 'all' && transYear !== filterYear) return false;

    // Filter Bulan
    if (filterMonth !== 'all' && transMonth !== filterMonth) return false;

    // Filter Atribut Lainnya
    if (filterType !== 'all' && transType !== filterType) return false;
    if (filterCategory !== 'all' && String(t.category_id) !== filterCategory) return false;
    if (filterPaymentMethod !== 'all' && t.payment_method !== filterPaymentMethod) return false;

    return true;
  });


  // 9. 📥 FUNGSI EXPORT DATA KE EXCEL (.CSV SEMICOLON SEPARATED)
  const handleExportToExcel = () => {
    if (filteredTransactions.length === 0) {
      alert("Tidak ada data untuk diexport!");
      return;
    }

    const headers = ["Tanggal", "Kategori", "Metode", "Keterangan", "Nominal (Rp)"];
    
    const rows = [...filteredTransactions]
      .sort((a,b) => b.date.localeCompare(a.date))
      .map(t => {
        const isIncome = t.category_type === 'income' || t.type === 'income';
        return [
          t.date ? t.date.substring(0, 10) : '',
          t.category_name || 'Umum',
          t.payment_method ? t.payment_method.toUpperCase() : '',
          t.description || '-',
          `${isIncome ? '' : '-'}${t.amount}`
        ];
      });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Toko_Thn_${filterYear}_Bln_${filterMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen pb-12 font-sans antialiased text-gray-800">
      
      {/* NAVBAR */}
      <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <h1 className="text-xl font-black tracking-tight text-blue-600">Pencatatan Keuangan Toko</h1>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl">
          <span className="text-xs font-bold text-gray-500">DASHBOARD ACUAN:</span>
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
            <span>⏳</span> <span>SALDO AWAL BULAN ACUAN</span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="text-gray-500">💵 Cash: <b className="text-gray-800 font-extrabold">Rp {initialCash.toLocaleString('id-ID')}</b></span>
            <span className="text-gray-500">🏦 Bank: <b className="text-gray-800 font-extrabold">Rp {initialBank.toLocaleString('id-ID')}</b></span>
            <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg font-black">Total: Rp {initialTotal.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* PANEL 2: MUTASI BULAN INI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border-l-4 border-emerald-500 p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mb-1">Pemasukan Bulan Ini</p>
            <p className="text-lg font-black text-emerald-700">Rp {totalMonthIncome.toLocaleString('id-ID')}</p>
          </div>

          <div className="bg-white border-l-4 border-rose-500 p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-[10px] uppercase font-bold text-rose-600 tracking-wider mb-1">Pengeluaran Bulan Ini</p>
            <p className="text-lg font-black text-rose-700">Rp {totalMonthExpense.toLocaleString('id-ID')}</p>
          </div>

          <div className="bg-white border-l-4 border-blue-500 p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider mb-1">Saldo Berjalan Bulan Ini</p>
            <p className="text-lg font-black text-blue-700">Rp {totalMonthSaldo.toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* PANEL 3: TOTAL REAL SALDO AKHIR FINAL */}
        <div className="p-4 bg-slate-900 text-white rounded-xl shadow-md grid grid-cols-1 md:grid-cols-3 gap-3 text-center text-xs font-bold">
          <div>
            <p className="text-slate-400 text-[10px] font-medium tracking-wider mb-0.5">💵 SALDO AKHIR CASH</p>
            <p className="text-amber-400 text-base font-black">Rp {finalCash.toLocaleString('id-ID')}</p>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-medium tracking-wider mb-0.5">🏦 SALDO AKHIR BANK</p>
            <p className="text-sky-400 text-base font-black">Rp {finalBank.toLocaleString('id-ID')}</p>
          </div>
          <div>
            <p className="text-slate-300 text-[10px] font-black tracking-wider mb-0.5">🎯 TOTAL REAL SALDO AKHIR</p>
            <p className="text-white text-lg font-black">Rp {finalTotal.toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* WORKSPACE AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          
          {/* FORM INPUT DATA */}
          <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4 lg:col-span-1">
            <h3 className="text-xs font-black text-gray-500 border-b pb-2 uppercase tracking-wide">✍️ Input Transaksi</h3>
            
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Tanggal</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Jenis Transaksi</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setType('income')} className={`p-2 rounded-lg font-bold text-xs border ${type === 'income' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>📈 Pemasukan</button>
                <button type="button" onClick={() => setType('expense')} className={`p-2 rounded-lg font-bold text-xs border ${type === 'expense' ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-gray-50 text-gray-400'}`}>📉 Pengeluaran</button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Kategori</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg bg-white text-xs">
                <option value="">-- Pilih Kategori --</option>
                {categories.filter(c => c.type === type).map(c => (
                  <option key={c.id} value={c.id}>📁 {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Metode Pembayaran</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setPaymentMethod('cash')} className={`p-2 rounded-lg font-bold text-xs border ${paymentMethod === 'cash' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>💵 Cash</button>
                <button type="button" onClick={() => setPaymentMethod('bank')} className={`p-2 rounded-lg font-bold text-xs border ${paymentMethod === 'bank' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>🏦 Bank</button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Jumlah Uang (Rp)</label>
              <input type="number" placeholder="Contoh: 50000" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50" />
              {type === 'expense' && (
                <p className="text-[10px] text-gray-500 mt-1">
                  * Limit aman: <span className="text-red-600 font-bold">Rp {paymentMethod === 'cash' ? Math.max(0, realCurrentCashWallet).toLocaleString('id-ID') : Math.max(0, realCurrentBankWallet).toLocaleString('id-ID')}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Keterangan</label>
              <input type="text" placeholder="Keterangan barang" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50" />
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg text-xs font-black uppercase animate-pulse">
              💾 Simpan Catatan
            </button>
          </form>

          {/* RIWAYAT LOG DATA */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* 🛠️ BARU: FILTER PERIODE TAHUN & BULAN YANG DIPISAH */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-3">
              <div className="text-[11px] font-black text-gray-400 uppercase tracking-wider">🔍 Panel Saring Riwayat Pembukuan</div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {/* Filter Tahun */}
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold uppercase mb-0.5">Tahun</label>
                  <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs font-bold text-gray-700">
                    <option value="all">🌐 Semua Tahun</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>

                {/* Filter Bulan */}
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold uppercase mb-0.5">Bulan</label>
                  <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs font-bold text-gray-700">
                    <option value="all">📅 Semua Bulan</option>
                    <option value="01">Januari</option>
                    <option value="02">Februari</option>
                    <option value="03">Maret</option>
                    <option value="04">April</option>
                    <option value="05">Mei</option>
                    <option value="06">Juni</option>
                    <option value="07">Juli</option>
                    <option value="08">Agustus</option>
                    <option value="09">September</option>
                    <option value="10">Oktober</option>
                    <option value="11">November</option>
                    <option value="12">Desember</option>
                  </select>
                </div>

                {/* Filter Jenis */}
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold uppercase mb-0.5">Jenis</label>
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs text-gray-600 font-medium">
                    <option value="all">🔄 Semua</option>
                    <option value="income">📈 Masuk</option>
                    <option value="expense">📉 Keluar</option>
                  </select>
                </div>

                {/* Filter Kategori */}
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold uppercase mb-0.5">Kategori</label>
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs text-gray-600 font-medium">
                    <option value="all">📁 Semua</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Filter Metode */}
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold uppercase mb-0.5">Metode</label>
                  <select value={filterPaymentMethod} onChange={(e) => setFilterPaymentMethod(e.target.value)} className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs text-gray-600 font-medium">
                    <option value="all">💸 Semua</option>
                    <option value="cash">💵 Cash</option>
                    <option value="bank">🏦 Bank</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TABEL DATA UTAMA */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-1">
                  <span className="text-sm">📋</span>
                  <h2 className="text-xs font-black text-gray-700 uppercase">Log Riwayat Transaksi</h2>
                </div>
                
                {/* TOMBOL EXPORT EXCEL BERDASARKAN HASIL FILTER */}
                <button 
                  onClick={handleExportToExcel}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                >
                  🟢 Export Excel (.CSV)
                </button>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-gray-400 font-bold text-[10px] uppercase">
                      <th className="pb-2">Tanggal</th>
                      <th className="pb-2">Kategori</th>
                      <th className="pb-2">Metode</th>
                      <th className="pb-2">Keterangan</th>
                      <th className="pb-2 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-gray-400 italic">Tidak ada data transaksi yang cocok.</td>
                      </tr>
                    ) : (
                      [...filteredTransactions].sort((a,b) => b.date.localeCompare(a.date)).map((t) => {
                        const isIncome = t.category_type === 'income' || t.type === 'income';
                        return (
                          <tr key={t.id} className="border-b hover:bg-gray-50 text-[11px]">
                            <td className="py-2.5 text-gray-500">
                              {t.date ? new Date(t.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) : '-'}
                            </td>
                            <td className="py-2.5">
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">{t.category_name || 'Umum'}</span>
                            </td>
                            <td className="py-2.5 font-bold text-gray-500 uppercase">{t.payment_method}</td>
                            <td className="py-2.5 text-gray-700 truncate max-w-[120px]">{t.description || '-'}</td>
                            <td className={`py-2.5 text-right font-black ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
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
