import { useState, useEffect } from 'react';

function App() {
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); 
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [formTransactionType, setFormTransactionType] = useState('expense');

  const currentYearMonth = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth);

  const [summary, setSummary] = useState({ 
    pastCashBalance: 0, pastBankBalance: 0, pastGrandBalance: 0,
    monthIncome: 0, monthExpense: 0, monthNetBalance: 0, 
    cashIncome: 0, cashExpense: 0, bankIncome: 0, bankExpense: 0,
    monthCashNet: 0, monthBankNet: 0, 
    finalCashBalance: 0, finalBankBalance: 0, finalGrandBalance: 0
  });

  // URL Ngrok Resmi Mas Yudi Yang Sudah Terbukti Aktif Sempurna
  const BACKEND_URL = 'https://voice-eastcoast-platypus.ngrok-free.dev';

  const fetchData = async () => {
    try {
      const resCat = await fetch(`${BACKEND_URL}/api/categories`, {
        headers: { 'ngrok-skip-browser-warning': '69420' }
      });
      const dataCat = await resCat.json();
      setCategories(Array.isArray(dataCat) ? dataCat : []);

      const resTrans = await fetch(`${BACKEND_URL}/api/transactions`, {
        headers: { 'ngrok-skip-browser-warning': '69420' }
      });
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
    if (categories.length > 0) {
      const filteredCats = categories.filter(cat => cat.type === formTransactionType || cat.category_type === formTransactionType);
      if (filteredCats.length > 0) setCategoryId(filteredCats[0].id);
    }
  }, [formTransactionType, categories]);

  useEffect(() => {
    let mIncome = 0; let mExpense = 0; let cIncome = 0; let cExpense = 0;
    let bIncome = 0; let bExpense = 0; let pCash = 0; let pBank = 0;

    transactions.forEach((t) => {
      const nominal = parseFloat(t.amount || 0);
      const d = new Date(t.date || t.tanggal);
      const formatTahunBulan = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const type = t.category_type || t.jenis_transaksi || 'expense';
      const method = t.payment_method || t.metode_pembayaran || 'cash';

      if (formatTahunBulan < selectedMonth) {
        if (type === 'income' || type === 'Pemasukan') {
          if (method === 'bank' || method === 'Bank') pBank += nominal; else pCash += nominal;
        } else {
          if (method === 'bank' || method === 'Bank') pBank -= nominal; else pCash -= nominal;
        }
      } 
      else if (formatTahunBulan === selectedMonth) {
        if (type === 'income' || type === 'Pemasukan') {
          mIncome += nominal;
          if (method === 'bank' || method === 'Bank') bIncome += nominal; else cIncome += nominal;
        } else {
          mExpense += nominal;
          if (method === 'bank' || method === 'Bank') bExpense += nominal; else cExpense += nominal;
        }
      }
    });

    setSummary({
      pastCashBalance: pCash, pastBankBalance: pBank, pastGrandBalance: pCash + pBank,
      monthIncome: mIncome, monthExpense: mExpense, monthNetBalance: mIncome - mExpense,
      cashIncome: cIncome, cashExpense: cExpense, bankIncome: bIncome, bankExpense: bExpense,
      monthCashNet: cIncome - cExpense, 
      monthBankNet: bIncome - bExpense, 
      finalCashBalance: pCash + (cIncome - cExpense), finalBankBalance: pBank + (bIncome - bExpense),
      finalGrandBalance: (pCash + pBank) + (mIncome - mExpense)
    });
  }, [transactions, selectedMonth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !categoryId || !amount) {
      alert('Mohon isi Tanggal, Kategori, dan Jumlah Uang!');
      return;
    }

    const transaksiBaru = {
      category_id: parseInt(categoryId), 
      amount: parseFloat(amount), 
      description: description || 'Tanpa keterangan',
      receipt_url: null, 
      date: date, 
      payment_method: paymentMethod
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/transactions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '69420'
        },
        body: JSON.stringify(transaksiBaru),
      });

      if (response.ok) {
        setMessage('✅ Catatan Keuangan Berhasil Disimpan!');
        setAmount(''); setDescription(''); setDate('');
        fetchData();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) { 
      setMessage('❌ Hubungan ke server terputus.'); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-6 space-y-6">
      
      <div className="w-full max-w-4xl bg-white p-4 rounded-xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-md font-bold text-gray-800">📅 Acuan Dashboard Bulanan</h2>
        </div>
        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="p-2 border border-gray-300 rounded-lg font-semibold text-blue-600 bg-gray-50 text-center" />
      </div>

      <div className="w-full max-w-4xl space-y-4">
        {/* SALDO AWAL */}
        <div className="bg-gray-200/60 p-4 rounded-xl border border-gray-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-xs font-black text-gray-600 uppercase">⏳ SALDO AWAL (BULAN SEBELUMNYA)</h3>
          <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-700">
            <span>💵 Cash: <span className="text-amber-700">Rp {summary.pastCashBalance.toLocaleString('id-ID')}</span></span>
            <span>🏦 Bank: <span className="text-sky-700">Rp {summary.pastBankBalance.toLocaleString('id-ID')}</span></span>
            <span className="bg-gray-300 px-2 py-0.5 rounded">Total: Rp {summary.pastGrandBalance.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* SALDO BULAN BERJALAN */}
        <div className="bg-white p-5 rounded-2xl shadow-md border-t-4 border-blue-500 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-green-50 p-3 rounded-xl border border-green-200">
            <p className="text-gray-500 text-[11px] font-bold uppercase">Pemasukan Bulan Ini</p>
            <p className="text-base font-black text-green-600">Rp {summary.monthIncome.toLocaleString('id-ID')}</p>
            <div className="text-[10px] text-gray-500 mt-1 flex justify-between border-t border-green-100 pt-1">
              <span>Cash: Rp {summary.cashIncome.toLocaleString('id-ID')}</span>
              <span>Bank: Rp {summary.bankIncome.toLocaleString('id-ID')}</span>
            </div>
          </div>
          <div className="bg-red-50 p-3 rounded-xl border border-red-200">
            <p className="text-gray-400 text-[11px] font-bold uppercase">Pengeluaran Bulan Ini</p>
            <p className="text-base font-black text-red-600">Rp {summary.monthExpense.toLocaleString('id-ID')}</p>
            <div className="text-[10px] text-gray-400 mt-1 flex justify-between border-t border-red-100 pt-1">
              <span>Cash: Rp {summary.cashExpense.toLocaleString('id-ID')}</span>
              <span>Bank: Rp {summary.bankExpense.toLocaleString('id-ID')}</span>
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
            <p className="text-blue-700 text-[11px] font-black uppercase">Saldo Berjalan</p>
            <p className={`text-base font-black ${summary.monthNetBalance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>Rp {summary.monthNetBalance.toLocaleString('id-ID')}</p>
            <div className="text-[10px] text-blue-500 mt-1 flex justify-between border-t border-blue-100 pt-1">
              <span>Cash: Rp {summary.monthCashNet.toLocaleString('id-ID')}</span>
              <span>Bank: Rp {summary.monthBankNet.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* KOTAK SALDO AKHIR FINAL */}
        <div className="bg-slate-800 text-white p-4 rounded-xl shadow-md grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-700">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">💵 SALDO AKHIR CASH</p>
            <p className="text-base font-black text-amber-400">Rp {summary.finalCashBalance.toLocaleString('id-ID')}</p>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">🏦 SALDO AKHIR BANK</p>
            <p className="text-base font-black text-sky-400">Rp {summary.finalBankBalance.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700 flex flex-col justify-center">
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-wider">💎 TOTAL SALDO AKHIR FINAL</p>
            <p className="text-lg font-black text-white">Rp {summary.finalGrandBalance.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      {/* FORM PENCATATAN KEUANGAN */}
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-2">Pencatatan Keuangan</h1>
        {message && <div className="p-3 rounded-lg mb-4 text-sm font-medium text-center bg-blue-100 text-blue-700">{message}</div>}
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
              <option value="">-- Pilih Kategori --</option>
              {categories.filter(cat => (cat.type || cat.category_type) === formTransactionType).map(cat => (
                <option key={cat.id} value={cat.id}>📁 {cat.name || cat.nama_kategori}</option>
              ))}
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
            <input type="number" required placeholder="Contoh: 50000" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Keterangan</label>
            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg h-20 resize-none"></textarea>
          </div>
          <button type="submit" className="w-full font-semibold p-3 rounded-lg bg-blue-600 text-white">Simpan Catatan</button>
        </form>
      </div>

      {/* TABEL RIWAYAT TRANSAKSI */}
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-4xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-sm font-semibold border-b border-gray-200">
                <th className="p-3">Tanggal</th><th className="p-3">Kategori</th><th className="p-3">Metode</th><th className="p-3">Keterangan</th><th className="p-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
              {transactions.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center text-gray-400 italic">Tidak ada transaksi.</td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition">
                    <td className="p-3 whitespace-nowrap">{new Date(t.date || t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="p-3"><span className="px-2 py-1 rounded-md text-xs font-semibold bg-gray-100">{t.category_name || t.nama_kategori}</span></td>
                    <td className="p-3">{t.payment_method || t.metode_pembayaran}</td>
                    <td className="p-3">{t.description || t.keterangan}</td>
                    <td className="p-3 text-right font-bold">Rp {parseFloat(t.amount || t.jumlah_uang || 0).toLocaleString('id-ID')}</td>
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
