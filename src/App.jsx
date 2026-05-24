import React, { useState, useEffect } from 'react';

function App() {
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('expense');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));

  const BACKEND_URL = 'https://aplikasi-keuangan-backend.vercel.app';

  const fetchData = async () => {
    try {
      const [resCat, resTrans] = await Promise.all([
        fetch(`${BACKEND_URL}/api/categories`),
        fetch(`${BACKEND_URL}/api/transactions`)
      ]);
      setCategories(await resCat.json());
      setTransactions(await resTrans.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIKA PERHITUNGAN DASHBOARD ---
  const filtered = transactions.filter(t => t.date?.substring(0, 7) === selectedMonth);
  const incomeCash = filtered.filter(t => (t.category_type === 'income' || t.type === 'income') && t.payment_method === 'cash').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const incomeBank = filtered.filter(t => (t.category_type === 'income' || t.type === 'income') && t.payment_method === 'bank').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const expenseCash = filtered.filter(t => (t.category_type === 'expense' || t.type === 'expense') && t.payment_method === 'cash').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const expenseBank = filtered.filter(t => (t.category_type === 'expense' || t.type === 'expense') && t.payment_method === 'bank').reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const inputAmount = parseFloat(amount);
    
    // Validasi Historis
    if (type === 'expense') {
      const hist = transactions.filter(t => t.date <= date);
      const inc = hist.filter(t => (t.category_type === 'income' || t.type === 'income') && t.payment_method === paymentMethod).reduce((s, t) => s + parseFloat(t.amount || 0), 0);
      const exp = hist.filter(t => (t.category_type === 'expense' || t.type === 'expense') && t.payment_method === paymentMethod).reduce((s, t) => s + parseFloat(t.amount || 0), 0);
      if (inputAmount > (inc - exp)) return alert(`Saldo ${paymentMethod} pada ${date} tidak cukup!`);
    }

    await fetch(`${BACKEND_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id: parseInt(categoryId), amount: inputAmount, description, date, payment_method: paymentMethod })
    });
    fetchData();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Pencatatan Keuangan Toko</h1>
      
      {/* DASHBOARD CARD */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6">
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="mb-4 p-2 border rounded" />
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <p className="text-xs text-emerald-600 font-bold">Pemasukan</p>
            <p className="text-lg font-black text-emerald-700">Rp {(incomeCash + incomeBank).toLocaleString()}</p>
          </div>
          <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
            <p className="text-xs text-rose-600 font-bold">Pengeluaran</p>
            <p className="text-lg font-black text-rose-700">Rp {(expenseCash + expenseBank).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border mb-6 space-y-4">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 border rounded-xl" />
        <div className="flex gap-2">
          <button type="button" onClick={() => setType('income')} className={`flex-1 p-3 rounded-xl font-bold ${type === 'income' ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}>Masuk</button>
          <button type="button" onClick={() => setType('expense')} className={`flex-1 p-3 rounded-xl font-bold ${type === 'expense' ? 'bg-rose-600 text-white' : 'bg-gray-100'}`}>Keluar</button>
        </div>
        <select onChange={e => setCategoryId(e.target.value)} className="w-full p-3 border rounded-xl">
          <option value="">Pilih Kategori</option>
          {categories.filter(c => c.type === type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select onChange={e => setPaymentMethod(e.target.value)} className="w-full p-3 border rounded-xl">
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
        </select>
        <input type="number" placeholder="Jumlah (Rp)" onChange={e => setAmount(e.target.value)} className="w-full p-3 border rounded-xl" />
        <button className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold">Simpan Transaksi</button>
      </form>
    </div>
  );
}
export default App;
