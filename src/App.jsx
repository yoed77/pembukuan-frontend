import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

function App() {
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); 
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [formTransactionType, setFormTransactionType] = useState('expense');

  // Filter Periode Bulanan Global (Untuk Dashboard Saldo Atas)
  const currentYearMonth = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth);

  // ================= BARU: STATE FILTER WAKTU UNTUK TABEL RIWAYAT =================
  const [historyPeriodMode, setHistoryPeriodMode] = useState('month'); // PILIHAN: 'all', 'month', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // State untuk Panel Filter Dropdown Kategori & Metode
  const [filterType, setFilterType] = useState('all');       
  const [filterMethod, setFilterMethod] = useState('all');   
  const [filterCategory, setFilterCategory] = useState('all'); 

  // State Dashboard Akuntansi
  const [summary, setSummary] = useState({ 
    pastCashBalance: 0, pastBankBalance: 0, pastGrandBalance: 0,
    monthIncome: 0, monthExpense: 0, monthNetBalance: 0, 
    cashIncome: 0, cashExpense: 0, bankIncome: 0, bankExpense: 0,
    finalCashBalance: 0, finalBankBalance: 0, finalGrandBalance: 0
  });

  // 1. Mengambil Data Awal dari Server Backend API
  const fetchData = async () => {
    try {
      const resCat = await fetch('http://lzagr-158-140-171-93.run.pinggy-free.link/api/categories');
      const dataCat = await resCat.json();
      setCategories(dataCat);

      const resTrans = await fetch('http://lzagr-158-140-171-93.run.pinggy-free.link/api/transactions');
      const dataTrans = await resTrans.json();
      setTransactions(dataTrans);
    } catch (err) {
      console.error('Gagal mengambil data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filteredCats = categories.filter(cat => cat.type === formTransactionType);
    if (filteredCats.length > 0) setCategoryId(filteredCats[0].id);
  }, [formTransactionType, categories]);

  // 2. Logika Hitung Akuntansi Kumulatif (Dashboard Atas Mengikuti Acuan Bulan Global)
  useEffect(() => {
    let mIncome = 0; let mExpense = 0; let cIncome = 0; let cExpense = 0;
    let bIncome = 0; let bExpense = 0; let pCash = 0; let pBank = 0;

    transactions.forEach((t) => {
      const nominal = parseFloat(t.amount);
      const d = new Date(t.date);
      const formatTahunBulan = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (formatTahunBulan < selectedMonth) {
        if (t.category_type === 'income') {
          if (t.payment_method === 'bank') pBank += nominal; else pCash += nominal;
        } else {
          if (t.payment_method === 'bank') pBank -= nominal; else pCash -= nominal;
        }
      } 
      else if (formatTahunBulan === selectedMonth) {
        if (t.category_type === 'income') {
          mIncome += nominal;
          if (t.payment_method === 'bank') bIncome += nominal; else cIncome += nominal;
        } else {
          mExpense += nominal;
          if (t.payment_method === 'bank') bExpense += nominal; else cExpense += nominal;
        }
      }
    });

    setSummary({
      pastCashBalance: pCash, pastBankBalance: pBank, pastGrandBalance: pCash + pBank,
      monthIncome: mIncome, monthExpense: mExpense, monthNetBalance: mIncome - mExpense,
      cashIncome: cIncome, cashExpense: cExpense, bankIncome: bIncome, bankExpense: bExpense,
      finalCashBalance: pCash + (cIncome - cExpense), finalBankBalance: pBank + (bIncome - bExpense),
      finalGrandBalance: (pCash + pBank) + (mIncome - mExpense)
    });
  }, [transactions, selectedMonth]);

  const filteredCategoriesForForm = categories.filter(cat => cat.type === formTransactionType);
  const inputAmount = amount ? parseFloat(amount) : 0;
  
  let isSaldoMinus = false;
  if (formTransactionType === 'expense') {
    if (paymentMethod === 'cash' && inputAmount > summary.finalCashBalance) isSaldoMinus = true;
    else if (paymentMethod === 'bank' && inputAmount > summary.finalBankBalance) isSaldoMinus = true;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaldoMinus) return; 
    const transaksiBaru = {
      category_id: parseInt(categoryId), amount: inputAmount, description,
      receipt_url: receiptUrl || null, date, payment_method: paymentMethod
    };
    try {
      const response = await fetch('https://lzagr-158-140-171-93.run.pinggy-free.link/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaksiBaru),
      });
      if (response.ok) {
        setMessage('✅ Catatan Keuangan Berhasil Disimpan!');
        setAmount(''); setDescription(''); setReceiptUrl(''); setDate(''); setPaymentMethod('cash'); setFormTransactionType('expense');
        setTimeout(() => fetchData(), 500);
      }
    } catch (error) { setMessage('❌ Hubungan ke server Backend terputus.'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
      try {
        const response = await fetch(`http://lzagr-158-140-171-93.run.pinggy-free.link/api/transactions/${id}`, { method: 'DELETE' });
        if (response.ok) { setMessage('🗑️ Catatan keuangan berhasil dihapus!'); fetchData(); }
      } catch (error) { setMessage('❌ Hubungan ke server Backend terputus.'); }
    }
  };

  // ================= 3. LOGIKA MULTI-FILTER PENYARINGAN DATA TABEL TERBARU =================
  const displayedTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    const formatTahunBulan = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const formatTanggalLokal = t.date.split('T')[0]; // Format: "YYYY-MM-DD"

    // A. Validasi Filter Waktu Jangka Pendek/Panjang
    let matchWaktu = false;
    if (historyPeriodMode === 'all') {
      matchWaktu = true; // Lolos semua tanggal
    } else if (historyPeriodMode === 'month') {
      matchWaktu = formatTahunBulan === selectedMonth; // Hanya bulan berjalan
    } else if (historyPeriodMode === 'custom') {
      const start = customStartDate || '1970-01-01';
      const end = customEndDate || '9999-12-31';
      matchWaktu = formatTanggalLokal >= start && formatTanggalLokal <= end; // Rentang tanggal kustom
    }

    // B. Validasi Filter Tambahan (Jenis, Metode, Kategori)
    const matchType = filterType === 'all' || t.category_type === filterType;
    const matchMethod = filterMethod === 'all' || t.payment_method === filterMethod;
    const matchCategory = filterCategory === 'all' || t.category_name === filterCategory;

    return matchWaktu && matchType && matchMethod && matchCategory;
  });

  // ================= 4. FUNGSI EKSPOR EXCEL VERSI UPDATE TOTAL FORMULA =================
  const exportToExcel = () => {
    if (displayedTransactions.length === 0) {
      alert("Tidak ada data transaksi pada periode filter ini untuk diekspor!");
      return;
    }

    const dataUntukExcel = displayedTransactions.map((t) => ({
      'Tanggal': new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      'Jenis': t.category_type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      'Kategori': t.category_name,
      'Metode': t.payment_method === 'bank' ? '🏦 Bank' : '💵 Cash',
      'Keterangan / Deskripsi': t.description,
      'Nominal (Rp)': parseFloat(t.amount)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataUntukExcel);
    const workbook = XLSX.utils.book_new();

    const totalDataBaris = dataUntukExcel.length;
    const barisPemasukan = totalDataBaris + 3; 
    const barisPengeluaran = totalDataBaris + 4;

    XLSX.utils.sheet_add_aoa(worksheet, [["TOTAL PEMASUKAN"]], { origin: `A${barisPemasukan}` });
    XLSX.utils.sheet_add_aoa(worksheet, [["TOTAL PENGELUARAN"]], { origin: `A${barisPengeluaran}` });

    worksheet[`F${barisPemasukan}`] = { 
      t: 'n', f: `SUMIF(B2:B${totalDataBaris + 1}, "Pemasukan", F2:F${totalDataBaris + 1})` 
    };
    worksheet[`F${barisPengeluaran}`] = { 
      t: 'n', f: `SUMIF(B2:B${totalDataBaris + 1}, "Pengeluaran", F2:F${totalDataBaris + 1})` 
    };

    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Keuangan");
    const max_widths = [ {wch: 18}, {wch: 15}, {wch: 18}, {wch: 12}, {wch: 35}, {wch: 18} ];
    worksheet['!cols'] = max_widths;

    XLSX.writeFile(workbook, `Laporan_Keuangan_Terfilter.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-6 space-y-6">
      
      {/* FILTER ACUAN DASHBOARD ATAS */}
      <div className="w-full max-w-4xl bg-white p-4 rounded-xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-md font-bold text-gray-800">📅 Acuan Dashboard Bulanan</h2>
          <p className="text-xs text-gray-500">Menentukan perhitungan Saldo Awal & Saldo Berjalan di kotak atas</p>
        </div>
        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="p-2 border border-gray-300 rounded-lg font-semibold text-blue-600 focus:ring-2 focus:ring-blue-400 bg-gray-50 text-center" />
      </div>

      {/* DASHBOARD AKUNTANSI KUMULATIF */}
      <div className="w-full max-w-4xl space-y-4">
        <div className="bg-gray-200/60 p-4 rounded-xl border border-gray-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-xs font-black text-gray-600 uppercase">⏳ SALDO AWAL (Bulan Sebelumnya)</h3>
          <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-700">
            <span>💵 Cash: <span className="text-amber-700">Rp {summary.pastCashBalance.toLocaleString('id-ID')}</span></span>
            <span>🏦 Bank: <span className="text-sky-700">Rp {summary.pastBankBalance.toLocaleString('id-ID')}</span></span>
            <span className="bg-gray-300 px-2 py-0.5 rounded">Total: Rp {summary.pastGrandBalance.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-md border-t-4 border-blue-500 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-green-50 p-3 rounded-xl border border-green-200">
            <p className="text-gray-500 text-[11px] font-bold uppercase">Pemasukan Bulan Ini</p>
            <p className="text-base font-black text-green-600">Rp {summary.monthIncome.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-xl border border-red-200">
            <p className="text-gray-400 text-[11px] font-bold uppercase">Pengeluaran Bulan Ini</p>
            <p className="text-base font-black text-red-600">Rp {summary.monthExpense.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
            <p className="text-blue-700 text-[11px] font-black uppercase">Saldo Berjalan</p>
            <p className={`text-base font-black ${summary.monthNetBalance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>Rp {summary.monthNetBalance.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-5 rounded-2xl shadow-lg text-white grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><p className="text-slate-400 text-[11px] font-bold">💵 SALDO AKHIR CASH</p><p className="text-lg font-bold text-amber-400">Rp {summary.finalCashBalance.toLocaleString('id-ID')}</p></div>
          <div><p className="text-slate-400 text-[11px] font-bold">🏦 SALDO AKHIR BANK</p><p className="text-lg font-bold text-sky-400">Rp {summary.finalBankBalance.toLocaleString('id-ID')}</p></div>
          <div className="bg-slate-900/40 p-2 rounded-xl border border-slate-600"><p className="text-blue-300 text-[11px] font-black">💎 TOTAL SALDO AKHIR FINAL</p><p className="text-xl font-black text-blue-300">Rp {summary.finalGrandBalance.toLocaleString('id-ID')}</p></div>
        </div>
      </div>

      {/* FORM INPUT TRANSAKSI */}
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-2">Pencatatan Keuangan</h1>
        {message && <div className={`p-3 rounded-lg mb-4 text-sm font-medium text-center ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Transaksi</label>
            <div className="flex space-x-4">
              <button type="button" onClick={() => setFormTransactionType('income')} className={`flex-1 p-2.5 text-sm font-bold rounded-lg border ${formTransactionType === 'income' ? 'bg-green-500 text-white' : 'bg-gray-50 text-gray-700'}`}>📈 Pemasukan</button>
              <button type="button" onClick={() => setFormTransactionType('expense')} className={`flex-1 p-2.5 text-sm font-bold rounded-lg border ${formTransactionType === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-50 text-gray-700'}`}>📉 Pengeluaran</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori</label>
            <select value={categoryId} required onChange={(e) => setCategoryId(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg bg-white">
              {filteredCategoriesForForm.map(cat => <option key={cat.id} value={cat.id}>📁 {cat.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Metode Pembayaran</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 bg-gray-50 p-2.5 rounded-lg border flex-1"><input type="radio" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} /><span>💵 Cash</span></label>
              <label className="flex items-center space-x-2 bg-gray-50 p-2.5 rounded-lg border flex-1"><input type="radio" value="bank" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} /><span>🏦 Bank</span></label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Jumlah Uang (Rp)</label>
            <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-full p-2.5 border rounded-lg ${isSaldoMinus ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
            {isSaldoMinus && <p className="text-red-500 text-xs font-bold mt-1.5 animate-pulse">❌ Gagal! Saldo tidak mencukupi.</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Keterangan</label>
            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg h-20 resize-none"></textarea>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Link Foto Nota</label>
            <input type="url" value={receiptUrl} onChange={(e) => setReceiptUrl(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg" />
          </div>
          <button type="submit" disabled={isSaldoMinus} className={`w-full font-semibold p-3 rounded-lg ${isSaldoMinus ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white'}`}>
            {isSaldoMinus ? 'Saldo Tidak Mencukupi' : 'Simpan Catatan'}
          </button>
        </form>
      </div>

      {/* TABEL RIWAYAT TRANSAKSI DENGAN ADVANCED TIME FILTERS */}
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-4xl overflow-hidden">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b border-gray-100 pb-3">
          <h2 className="text-xl font-bold text-gray-800">📋 Riwayat Transaksi Keuangan</h2>
          <button
            onClick={exportToExcel}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow transition duration-150"
          >
            <span>📥 Export ke Excel</span>
          </button>
        </div>

        {/* PANEL KONTROL FILTER WAKTU BARU (PILIHAN PERIODE) */}
        <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
          <div className="w-full md:w-1/3">
            <label className="block text-xs font-black text-blue-700 uppercase mb-1">Rentang Waktu Tabel</label>
            <select
              value={historyPeriodMode}
              onChange={(e) => setHistoryPeriodMode(e.target.value)}
              className="w-full p-2 text-sm border border-blue-300 rounded-md bg-white font-bold text-gray-700 focus:ring-2 focus:ring-blue-400"
            >
              <option value="month">📅 Hanya Bulan Berjalan</option>
              <option value="all">♾️ Semua Periode (Tanpa Batas)</option>
              <option value="custom">🛠️ Periode Tertentu (Kustom Tanggal)</option>
            </select>
          </div>

          {/* INPUT FORM TANGGAL KUSTOM KELUAR JIKA MODE CUSTOM DIPILIH */}
          {historyPeriodMode === 'custom' && (
            <div className="w-full md:w-2/3 grid grid-cols-2 gap-3 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Dari Tanggal</label>
                <input 
                  type="date" 
                  value={customStartDate} 
                  onChange={(e) => setCustomStartDate(e.target.value)} 
                  className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Sampai Tanggal</label>
                <input 
                  type="date" 
                  value={customEndDate} 
                  onChange={(e) => setCustomEndDate(e.target.value)} 
                  className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                />
              </div>
            </div>
          )}
        </div>

        {/* PANEL FILTER KLASIK (JENIS, METODE, KATEGORI) */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jenis Kas</label><select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full p-2 text-sm border border-gray-300 rounded-md bg-white font-semibold text-gray-700"><option value="all">Semua</option><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select></div>
          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Metode</label><select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} className="w-full p-2 text-sm border border-gray-300 rounded-md bg-white font-semibold text-gray-700"><option value="all">Semua</option><option value="cash">💵 Cash</option><option value="bank">🏦 Bank</option></select></div>
          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Kategori</label><select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full p-2 text-sm border border-gray-300 rounded-md bg-white font-semibold text-gray-700"><option value="all">Semua Kategori</option>{Array.from(new Set(categories.map(c => c.name))).map((catName, index) => <option key={index} value={catName}>📁 {catName}</option>)}</select></div>
        </div>
        
        {/* TABEL DATA */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-sm font-semibold border-b border-gray-200">
                <th className="p-3">Tanggal</th><th className="p-3">Kategori</th><th className="p-3">Metode</th><th className="p-3">Keterangan</th><th className="p-3 text-right">Nominal</th><th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
              {displayedTransactions.length === 0 ? (
                <tr><td colSpan="6" className="p-4 text-center text-gray-400 italic">Tidak ada transaksi yang cocok dengan periode / filter ini.</td></tr>
              ) : (
                displayedTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition">
                    <td className="p-3 whitespace-nowrap">{new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded-md text-xs font-semibold ${t.category_type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.category_name}</span></td>
                    <td className="p-3 font-semibold">{t.payment_method === 'bank' ? '🏦 Bank' : '💵 Cash'}</td>
                    <td className="p-3 font-medium text-gray-800">{t.description}</td>
                    <td className={`p-3 text-right font-bold ${t.category_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.category_type === 'income' ? '+' : '-'} Rp {parseFloat(t.amount).toLocaleString('id-ID')}</td>
                    <td className="p-3 text-center"><button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 font-bold text-xs bg-red-50 px-2 py-1 rounded">✕ Hapus</button></td>
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