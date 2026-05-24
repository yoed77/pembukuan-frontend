import React, { useState, useEffect } from 'react';

function App() {
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  const [editingId, setEditingId] = useState(null); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('expense'); 
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const currentYear = String(new Date().getFullYear());
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const [selectedMonth, setSelectedMonth] = useState(`${currentYear}-${currentMonth}`);

  const BACKEND_URL = 'https://aplikasi-keuangan-backend.vercel.app';

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

  useEffect(() => { fetchData(); }, []);

  // --- LOGIKA PERHITUNGAN ---
  const currentMonthTransactions = transactions.filter(t => t.date?.substring(0, 7) === selectedMonth);

  const incomeCash = currentMonthTransactions.filter(t => (t.category_type === 'income' || t.type === 'income') && t.payment_method === 'cash').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const incomeBank = currentMonthTransactions.filter(t => (t.category_type === 'income' || t.type === 'income') && t.payment_method === 'bank').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const expenseCash = currentMonthTransactions.filter(t => (t.category_type === 'expense' || t.type === 'expense') && t.payment_method === 'cash').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const expenseBank = currentMonthTransactions.filter(t => (t.category_type === 'expense' || t.type === 'expense') && t.payment_method === 'bank').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalIncome = incomeCash + incomeBank;
  const totalExpense = expenseCash + expenseBank;
  const saldoBerjalan = totalIncome - totalExpense;

  // --- HANDLER SIMPAN DENGAN VALIDASI HISTORIS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId || !amount) return alert('Lengkapi data!');

    const inputAmount = parseFloat(amount);
    
    // Validasi Historis
    if (type === 'expense') {
      const hist = transactions.filter(t => t.date <= date && t.id !== editingId);
      const inc = hist.filter(t => (t.category_type === 'income' || t.type === 'income') && t.payment_method === paymentMethod).reduce((s, t) => s + parseFloat(t.amount || 0), 0);
      const exp = hist.filter(t => (t.category_type === 'expense' || t.type === 'expense') && t.payment_method === paymentMethod).reduce((s, t) => s + parseFloat(t.amount || 0), 0);
      
      if (inputAmount > (inc - exp)) {
        return alert(`❌ Saldo ${paymentMethod.toUpperCase()} pada ${date} tidak cukup (Sisa: Rp ${(inc-exp).toLocaleString()})`);
      }
    }

    const payload = { category_id: parseInt(categoryId), amount: inputAmount, description, date, payment_method: paymentMethod };
    
    await fetch(`${BACKEND_URL}/api/transactions${editingId ? `/${editingId}` : ''}`, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    resetForm();
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus transaksi ini?')) return;
    await fetch(`${BACKEND_URL}/api/transactions/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const resetForm = () => { setEditingId(null); setAmount(''); setDescription(''); };

  return (
    <div className="max-w-xl mx-auto p-4 bg-gray-50 min-h-screen">
      <h1 className="text-xl font-bold mb-4">Pencatatan Keuangan v2.0</h1>
      
      {/* PANEL DASHBOARD */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-emerald-100 p-2 rounded text-center"><p className="text-[10px]">Pemasukan</p><p className="font-bold">Rp {totalIncome.toLocaleString()}</p></div>
        <div className="bg-rose-100 p-2 rounded text-center"><p className="text-[10px]">Pengeluaran</p><p className="font-bold">Rp {totalExpense.toLocaleString()}</p></div>
        <div className="bg-blue-100 p-2 rounded text-center"><p className="text-[10px]">Sisa</p><p className="font-bold">Rp {saldoBerjalan.toLocaleString()}</p></div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border p-2 mb-2 rounded" />
        <div className="flex gap-2 mb-2">
          <button type="button" onClick={() => setType('income')} className={`flex-1 p-2 ${type === 'income' ? 'bg-emerald-500 text-white' : 'bg-gray-200'}`}>Masuk</button>
          <button type="button" onClick={() => setType('expense')} className={`flex-1 p-2 ${type === 'expense' ? 'bg-rose-500 text-white' : 'bg-gray-200'}`}>Keluar</button>
        </div>
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full border p-2 mb-2">
          <option value="">Pilih Kategori</option>
          {categories.filter(c => c.type === type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border p-2 mb-2">
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
        </select>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Jumlah" className="w-full border p-2 mb-2" />
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Simpan</button>
      </form>

      {/* TABEL */}
      <div className="bg-white p-4 rounded shadow">
        {transactions.sort((a,b) => new Date(b.date) - new Date(a.date)).map(t => (
          <div key={t.id} className="flex justify-between border-b py-2 text-sm">
            <span>{t.date} - {t.description}</span>
            <span className={t.category_type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
              {t.amount.toLocaleString()} 
              <button onClick={() => handleDelete(t.id)} className="ml-4 text-red-500 font-bold">X</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
export default App;
