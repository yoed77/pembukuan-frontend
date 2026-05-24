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
        fetch(`${BACKEND_URL}/api/categories`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/transactions`).then(r => r.json())
      ]);
      setCategories(Array.isArray(resCat) ? resCat : []);
      setTransactions(Array.isArray(resTrans) ? resTrans : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${BACKEND_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id: parseInt(categoryId), amount: parseFloat(amount), description, date, payment_method: paymentMethod })
    });
    fetchData();
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${BACKEND_URL}/api/transactions/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) { alert("Gagal menghapus transaksi"); }
  };

  // Filter logika
  const filtered = transactions.filter(t => t.date?.substring(0, 7) === selectedMonth);
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((a, b) => a + parseFloat(b.amount || 0), 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((a, b) => a + parseFloat(b.amount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Pencatatan Keuangan Toko</h1>
      
      {/* DASHBOARD */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow border">
          <p className="text-sm text-gray-500">Pemasukan</p>
          <p className="text-xl font-bold text-green-600">Rp {totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border">
          <p className="text-sm text-gray-500">Pengeluaran</p>
          <p className="text-xl font-bold text-red-600">Rp {totalExpense.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border">
          <p className="text-sm text-gray-500">Sisa</p>
          <p className="text-xl font-bold">Rp {(totalIncome - totalExpense).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FORM */}
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow border">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border p-2 mb-2" />
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => setType('income')} className={`flex-1 p-2 ${type === 'income' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>Masuk</button>
            <button type="button" onClick={() => setType('expense')} className={`flex-1 p-2 ${type === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>Keluar</button>
          </div>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full border p-2 mb-2">
            <option value="">Pilih Kategori</option>
            {categories.filter(c => c.type === type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Jumlah" className="w-full border p-2 mb-2" />
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Keterangan" className="w-full border p-2 mb-2" />
          <button type="submit" className="w-full bg-blue-600 text-white p-2">Simpan</button>
        </form>

        {/* LIST */}
        <div className="bg-white p-4 rounded shadow border">
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full border p-2 mb-4" />
          {filtered.map(t => (
            <div key={t.id} className="flex justify-between border-b py-2">
              <span>{t.date} - {t.description}</span>
              <span className="font-bold">{parseFloat(t.amount).toLocaleString()}</span>
              <button onClick={() => handleDelete(t.id)} className="text-red-500 font-bold ml-2">X</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
