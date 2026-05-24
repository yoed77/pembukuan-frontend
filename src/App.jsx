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
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));

  const BACKEND_URL = 'https://aplikasi-keuangan-backend.vercel.app';

  const fetchData = async () => {
    try {
      const resCat = await fetch(`${BACKEND_URL}/api/categories`).then(r => r.json());
      const resTrans = await fetch(`${BACKEND_URL}/api/transactions`).then(r => r.json());
      setCategories(Array.isArray(resCat) ? resCat : []);
      setTransactions(Array.isArray(resTrans) ? resTrans : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { category_id: parseInt(categoryId), amount: parseFloat(amount), description, date, payment_method: paymentMethod };
    
    await fetch(`${BACKEND_URL}/api/transactions${editingId ? `/${editingId}` : ''}`, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    setEditingId(null);
    setAmount('');
    fetchData();
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white min-h-screen">
      <h1 className="text-xl font-bold mb-4">Pencatatan Keuangan</h1>
      
      {/* FORM SEDERHANA UNTUK MEMASTIKAN RENDER BERJALAN */}
      <form onSubmit={handleSubmit} className="p-4 border rounded shadow mb-6">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border p-2 mb-2" />
        <div className="flex gap-2 mb-2">
          <button type="button" onClick={() => setType('income')} className="flex-1 bg-green-500 text-white p-2">Masuk</button>
          <button type="button" onClick={() => setType('expense')} className="flex-1 bg-red-500 text-white p-2">Keluar</button>
        </div>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Jumlah" className="w-full border p-2 mb-2" />
        <button type="submit" className="w-full bg-blue-600 text-white p-2">Simpan</button>
      </form>

      {/* LIST TRANSAKSI */}
      <div>
        {transactions.map(t => (
          <div key={t.id} className="border-b p-2 flex justify-between">
            <span>{t.date} - {t.description}</span>
            <span>{t.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
