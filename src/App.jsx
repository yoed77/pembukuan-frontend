import React, { useState, useEffect } from 'react';

function App() {
  // 1. STATE DATA UTAMA CLOUD
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // 2. STATE FORM INPUT TRANSAKSI BARU / EDIT
  const [editingId, setEditingId] = useState(null); 
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

  // 4. STATE FILTER PENCARIAN LOG TABEL
  const [filterRangeMode, setFilterRangeMode] = useState('dropdown'); 
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useState(currentMonth); 
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
    if (!editingId) { 
      const filteredCats = categories.filter(c => c.type === type);
      if (filteredCats.length > 0) {
        setCategoryId(filteredCats[0].id);
      } else {
        setCategoryId('');
      }
    }
  }, [type, categories, editingId]);


  // 6. 🧮 LOGIKA PERHITUNGAN SALDO REAL KUMULATIF
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


  // --- PERHITUNGAN DATA SALDO AWAL (BULAN SEBELUMNYA) ---
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

  const initialCash = priorIncomeCash - priorExpenseCash;
  const initialBank = priorIncomeBank - priorExpenseBank;
  const initialTotal = initialCash + initialBank;


  // --- PERHITUNGAN MUTASI TRANSAKSI BULAN INI (DENGAN REKAP CASH & BANK) ---
  const currentMonthTransactions = transactions.filter(t => {
    if (!t.date) return false;
    return t.date.substring(0, 7) === selectedMonth;
  });

  // Pemasukan Bulan Ini (Cash & Bank)
  const currentIncomeCash = currentMonthTransactions
    .filter(t => (t.category_type === 'income' || t.type === 'income') && t.payment_method === 'cash')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const currentIncomeBank = currentMonthTransactions
    .filter(t => (t.category_type === 'income' || t.type === 'income') && t.payment_method === 'bank')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalMonthIncome = currentIncomeCash + currentIncomeBank;

  // Pengeluaran Bulan Ini (Cash & Bank)
  const currentExpenseCash = currentMonthTransactions
    .filter(t => (t.category_type === 'expense' || t.type === 'expense') && t.payment_method === 'cash')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const currentExpenseBank = currentMonthTransactions
    .filter(t => (t.category_type === 'expense' || t.type === 'expense') && t.payment_method === 'bank')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalMonthExpense = currentExpenseCash + currentExpenseBank;

  // Saldo Berjalan Bulan Ini (Selisih Mutasi Bulan Terkait)
  const walkingCash = currentIncomeCash - currentExpenseCash;
  const walkingBank = currentIncomeBank - currentExpenseBank;
  const totalMonthSaldo = totalMonthIncome - totalMonthExpense;


  // --- SALDO AKHIR FINAL KUMULATIF ---
  const finalCash = initialCash + currentIncomeCash - currentExpenseCash;
  const finalBank = initialBank + currentIncomeBank - currentExpenseBank;
  const finalTotal = finalCash + finalBank;


  // 7. 🔥 HANDLER SIMPAN & PERBARUI TRANSAKSI
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId || !amount) {
      alert('Mohon pilih kategori dan isi jumlah uang!');
      return;
    }

    const inputAmount = parseFloat(amount);

    if (type === 'expense') {
      let currentLimit = paymentMethod === 'cash' ? realCurrentCashWallet : realCurrentBankWallet;
      
      if (editingId) {
        const oldTx = transactions.find(t => t.id === editingId);
        if (oldTx && oldTx.payment_method === paymentMethod && (oldTx.category_type === 'expense' || oldTx.type === 'expense')) {
          currentLimit += parseFloat(oldTx.amount || 0);
        }
      }

      if (inputAmount > currentLimit) {
        alert(`❌ INPUT DITOLAK!\nBatas aman pengeluaran metode ${paymentMethod.toUpperCase()} adalah Rp ${Math.max(0, currentLimit).toLocaleString('id-ID')}.\nTransaksi dibatalkan demi mencegah saldo minus.`);
        return; 
      }
    }

    const payload = {
      category_id: parseInt(categoryId),
      amount: inputAmount,
      description: description || 'Tanpa keterangan',
      date,
      payment_method: paymentMethod
    };

    try {
      let response;
      if (editingId) {
        response = await fetch(`${BACKEND_URL}/api/transactions/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${BACKEND_URL}/api/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        resetForm();
        fetchData();
        alert(editingId ? '✅ Data berhasil diperbarui di Cloud!' : '✅ Catatan berhasil disimpan ke Cloud!');
      } else {
        alert('Gagal memproses data ke server backend');
      }
    } catch (err) {
      console.error('Eror simpan/edit:', err);
    }
  };

  const handleDelete = async (id, nominal, ket) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus transaksi "${ket}" senilai Rp ${parseFloat(nominal).toLocaleString('id-ID')}?`)) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/transactions/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchData();
          alert('🗑️ Catatan berhasil dihapus!');
        } else {
          alert('Gagal menghapus transaksi dari server');
        }
      } catch (err) {
        console.error('Eror hapus:', err);
      }
    }
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setDate(t.date ? t.date.substring(0, 10) : new Date().toISOString().split('T')[0]);
    setType(t.category_type || t.type || 'expense');
    setCategoryId(t.category_id || '');
    setAmount(t.amount || '');
    setDescription(t.description || '');
    setPaymentMethod(t.payment_method || 'cash');
  };

  const resetForm = () => {
    setEditingId(null);
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setType('expense');
  };


  // 8. 🔍 LOGIKA PENYARINGAN FILTER
  const filteredTransactions = transactions.filter(t => {
    if (!t.date) return false;
    
    const rawDateStr = t.date.substring(0, 10); 
    const transYear = rawDateStr.substring(0, 4);
    const transMonth = rawDateStr.substring(5, 7);
    const transType = t.category_type || t.type || '';

    if (filterRangeMode === 'dropdown') {
      if (filterYear !== 'all' && transYear !== filterYear) return false;
      if (filterMonth !== 'all' && transMonth !== filterMonth) return false;
    } else if (filterRangeMode === 'custom') {
      if (rawDateStr < startDate || rawDateStr > endDate) return false;
    }

    if (filterType !== 'all' && transType !== filterType) return false;
    if (filterCategory !== 'all' && String(t.category_id) !== filterCategory) return false;
    if (filterPaymentMethod !== 'all' && t.payment_method !== filterPaymentMethod) return false;

    return true;
  });


  // 9. 📥 FUNGSI EXPORT DATA EXCEL
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
    const fileName = filterRangeMode === 'dropdown' 
      ? `Laporan_Toko_Thn_${filterYear}_Bln_${filterMonth}.csv`
      : `Laporan_Toko_Periode_${startDate}_sd_${endDate}.csv`;

    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
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
          <div>
            <h1 className="text-xl font-black tracking-tight text-blue-600 leading-none">Pencatatan Keuangan Toko</h1>
            <span className="text-[10px] text-gray-400 font-bold tracking-wider">Sistem Cloud Mas Yudi v2.2</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl">
          <span className="text-xs font-bold text-gray-500">ACUAN DASHBOARD BULANAN:</span>
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-extrabold text-blue-600 bg-transparent focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        
        {/* PANEL DASHBOARD: SALDO AWAL */}
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

        {/* PANEL UTAMA DENGAN SUB-CASH DAN BANK DETAIL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* PEMASUKAN */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mb-0.5">Pemasukan Bulan Ini</p>
              <p className="text-lg font-black text-emerald-700">Rp {totalMonthIncome.toLocaleString('id-ID')}</p>
            </div>
            <div className="border-t pt-2 mt-2 grid grid-cols-2 text-[10px] text-gray-500 font-medium">
              <div>Cash: <b className="text-gray-700">Rp {currentIncomeCash.toLocaleString('id-ID')}</b></div>
              <div>Bank: <b className="text-gray-700">Rp {currentIncomeBank.toLocaleString('id-ID')}</b></div>
            </div>
          </div>

          {/* PENGELUARAN */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-rose-600 tracking-wider mb-0.5">Pengeluaran Bulan Ini</p>
              <p className="text-lg font-black text-rose-700">Rp {totalMonthExpense.toLocaleString('id-ID')}</p>
            </div>
            <div className="border-t pt-2 mt-2 grid grid-cols-2 text-[10px] text-gray-500 font-medium">
              <div>Cash: <b className="text-gray-700">Rp {currentExpenseCash.toLocaleString('id-ID')}</b></div>
              <div>Bank: <b className="text-gray-700">Rp {currentExpenseBank.toLocaleString('id-ID')}</b></div>
            </div>
          </div>

          {/* SALDO BERJALAN */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider mb-0.5">Saldo Berjalan Bulan Ini</p>
              <p className={`text-lg font-black ${totalMonthSaldo >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                Rp {totalMonthSaldo.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="border-t pt-2 mt-2 grid grid-cols-2 text-[10px] text-gray-500 font-medium">
              <div>Cash: <b className={walkingCash >= 0 ? 'text-gray-700' : 'text-red-600'}>Rp {walkingCash.toLocaleString('id-ID')}</b></div>
              <div>Bank: <b className={walkingBank >= 0 ? 'text-gray-700' : 'text-red-600'}>Rp {walkingBank.toLocaleString('id-ID')}</b></div>
            </div>
          </div>

        </div>

        {/* PANEL HITAM: REAL TOTAL SALDO AKHIR FINAL (AKUMULASI PINDAHAN + BULAN INI) */}
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
          <form onSubmit={handleSubmit} className={`bg-white p-5 rounded-xl shadow-sm border space-y-4 lg:col-span-1 transition-all ${editingId ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-wide">
                {editingId ? '✏️ Mode Edit Transaksi' : 'Pencatatan Keuangan'}
              </h3>
              {editingId && (
                <button type="button" onClick={resetForm} className="text-[10px] bg-gray-200 hover:bg-gray-300 px-2 py-0.5 rounded font-bold text-gray-600">
                  Batal
                </button>
              )}
            </div>
            
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
              <input type="number" placeholder="Contoh: 50000" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 font-bold text-gray-700" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Keterangan</label>
              <input type="text" placeholder="Keterangan barang" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50" />
            </div>

            <button type="submit" className={`w-full text-white p-2.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${editingId ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {editingId ? '🔄 Perbarui Catatan' : 'Simpan Catatan'}
            </button>
          </form>

          {/* LOG TABEL & FILTER */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* PANEL FILTER */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-3">
              <div className="flex justify-between items-center border-b pb-1.5">
                <div className="text-[11px] font-black text-gray-400 uppercase tracking-wider">🔍 Saring Riwayat Pembukuan</div>
                <div className="flex bg-gray-100 p-0.5 rounded-lg border text-[10px] font-bold">
                  <button type="button" onClick={() => setFilterRangeMode('dropdown')} className={`px-2.5 py-1 rounded-md transition-all ${filterRangeMode === 'dropdown' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-400'}`}>Bulan & Tahun</button>
                  <button type="button" onClick={() => setFilterRangeMode('custom')} className={`px-2.5 py-1 rounded-md transition-all ${filterRangeMode === 'custom' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-400'}`}>Kustom Tanggal</button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {filterRangeMode === 'dropdown' ? (
                  <>
                    <div>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase mb-0.5">Tahun</label>
                      <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs font-bold text-gray-700">
                        <option value="all">🌐 Semua Tahun</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase mb-0.5">Bulan</label>
                      <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs font-bold text-gray-700">
                        <option value="all">📅 Semua Bulan</option>
                        <option value="01">Januari</option><option value="02">Februari</option><option value="03">Maret</option>
                        <option value="04">April</option><option value="05">Mei</option><option value="06">Juni</option>
                        <option value="07">Juli</option><option value="08">Agustus</option><option value="09">September</option>
                        <option value="10">Oktober</option><option value="11">November</option><option value="12">Desember</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase mb-0.5">Dari Tanggal</label>
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-1 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-gray-700" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase mb-0.5">Sampai Tanggal</label>
                      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-1 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold text-gray-700" />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[9px] text-gray-400 font-bold uppercase mb-0.5">Jenis</label>
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs text-gray-600 font-medium">
                    <option value="all">🔄 Semua</option>
                    <option value="income">📈 Masuk</option>
                    <option value="expense">📉 Keluar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold uppercase mb-0.5">Kategori</label>
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs text-gray-600 font-medium">
                    <option value="all">📁 Semua</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
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

            {/* TABEL DATA */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-1">
                  <span className="text-sm">📋</span>
                  <h2 className="text-xs font-black text-gray-700 uppercase">Log Riwayat Transaksi</h2>
                </div>
                <button onClick={handleExportToExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
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
                      <th className="pb-2 text-center w-[80px]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-gray-400 italic">Tidak ada data transaksi yang cocok.</td>
                      </tr>
                    ) : (
                      [...filteredTransactions].sort((a,b) => b.date.localeCompare(a.date)).map((t) => {
                        const isIncome = t.category_type === 'income' || t.type === 'income';
                        return (
                          <tr key={t.id} className={`border-b hover:bg-gray-50 text-[11px] ${editingId === t.id ? 'bg-amber-50/70 hover:bg-amber-50' : ''}`}>
                            <td className="py-2.5 text-gray-500">
                              {t.date ? new Date(t.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) : '-'}
                            </td>
                            <td className="py-2.5">
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">{t.category_name || 'Umum'}</span>
                            </td>
                            <td className="py-2.5 font-bold text-gray-500 uppercase">{t.payment_method}</td>
                            <td className="py-2.5 text-gray-700 truncate max-w-[100px]">{t.description || '-'}</td>
                            <td className={`py-2.5 text-right font-black ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {isIncome ? '+ ' : '- '}Rp {parseFloat(t.amount || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="py-2.5 text-center">
                              <div className="flex justify-center gap-1.5">
                                <button type="button" onClick={() => startEdit(t)} title="Edit Catatan" className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition">✏️</button>
                                <button type="button" onClick={() => handleDelete(t.id, t.amount, t.description)} title="Hapus Catatan" className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition">🗑️</button>
                              </div>
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
