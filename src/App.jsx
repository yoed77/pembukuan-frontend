import React, { useState, useEffect } from 'react';

function App() {
  // 1. STATE DATA UTAMA
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  
  // 2. STATE FORM
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('expense');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // 3. STATE DASHBOARD & FILTER
  const currentMonth = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const BACKEND_URL = 'https://aplikasi-keuangan-backend.vercel.app';

  // 4. FETCH DATA
  const fetchData = async () => {
    try {
      const [resCat, resTrans] = await Promise.all([
        fetch(`${BACKEND_URL}/api/categories`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/transactions`).then(r => r.json())
      ]);
      setCategories(Array.isArray(resCat) ? resCat : []);
      setTransactions(Array.isArray(resTrans) ? resTrans : []);
    } catch (err) { console.error("Gagal ambil data:", err); }
  };

  useEffect(() => { fetchData(); }, []);

  // 5. LOGIKA PERHITUNGAN (Sesuai Dashboard v2.2)
  const prior = transactions.filter(t => t.date?.substring(0, 7) < selectedMonth);
  const initialCash = prior.filter(t => (t.category_type==='income'||t.type==='income')&&t.payment_method==='cash').reduce((s,t)=>s+parseFloat(t.amount||0),0) - prior.filter(t => (t.category_type==='expense'||t.type==='expense')&&t.payment_method==='cash').reduce((s,t)=>s+parseFloat(t.amount||0),0);
  const initialBank = prior.filter(t => (t.category_type==='income'||t.type==='income')&&t.payment_method==='bank').reduce((s,t)=>s+parseFloat(t.amount||0),0) - prior.filter(t => (t.category_type==='expense'||t.type==='expense')&&t.payment_method==='bank').reduce((s,t)=>s+parseFloat(t.amount||0),0);

  const cur = transactions.filter(t => t.date?.substring(0, 7) === selectedMonth);
  const incC = cur.filter(t => (t.category_type==='income'||t.type==='income')&&t.payment_method==='cash').reduce((s,t)=>s+parseFloat(t.amount||0),0);
  const incB = cur.filter(t => (t.category_type==='income'||t.type==='income')&&t.payment_method==='bank').reduce((s,t)=>s+parseFloat(t.amount||0),0);
  const expC = cur.filter(t => (t.category_type==='expense'||t.type==='expense')&&t.payment_method==='cash').reduce((s,t)=>s+parseFloat(t.amount||0),0);
  const expB = cur.filter(t => (t.category_type==='expense'||t.type==='expense')&&t.payment_method==='bank').reduce((s,t)=>s+parseFloat(t.amount||0),0);

  // 6. HANDLER
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
    setDescription('');
    fetchData();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus transaksi?')) {
        await fetch(`${BACKEND_URL}/api/transactions/${id}`, { method: 'DELETE' });
        fetchData();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-black text-blue-600">Pencatatan Keuangan Toko v2.2</h1>
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="p-2 border rounded" />
      </div>

      {/* DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
           <p className="text-xs font-bold text-gray-500">SALDO AWAL</p>
           <p className="font-black">Cash: Rp {initialCash.toLocaleString()}</p>
           <p className="font-black">Bank: Rp {initialBank.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
           <p className="text-xs font-bold text-green-600">PEMASUKAN BULAN INI</p>
           <p className="text-lg font-black">Rp {(incC + incB).toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
           <p className="text-xs font-bold text-red-600">PENGELUARAN BULAN INI</p>
           <p className="text-lg font-black">Rp {(expC + expB).toLocaleString()}</p>
        </div>
      </div>

      {/* FORM & TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-1 bg-white p-4 rounded-xl border shadow-sm">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded mb-2"/>
            <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setType('income')} className={`flex-1 p-2 rounded ${type==='income'?'bg-green-100 text-green-700 font-bold':''}`}>Masuk</button>
                <button type="button" onClick={() => setType('expense')} className={`flex-1 p-2 rounded ${type==='expense'?'bg-red-100 text-red-700 font-bold':''}`}>Keluar</button>
            </div>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-2 border rounded mb-2">
                <option value="">Pilih Kategori</option>
                {categories.filter(c => c.type === type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Jumlah" className="w-full p-2 border rounded mb-2"/>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Keterangan" className="w-full p-2 border rounded mb-4"/>
            <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded font-bold">SIMPAN CATATAN</button>
        </form>

        <div className="lg:col-span-2 bg-white p-4 rounded-xl border shadow-sm">
            <h2 className="font-bold mb-4">Log Riwayat Transaksi</h2>
            {transactions.map(t => (
                <div key={t.id} className="flex justify-between items-center border-b py-2 text-sm">
                    <span>{t.date?.substring(0,10)} - {t.description}</span>
                    <span className={`font-bold ${t.category_type==='income'?'text-green-600':'text-red-600'}`}>
                        Rp {parseFloat(t.amount).toLocaleString()}
                    </span>
                    <button onClick={() => handleDelete(t.id)} className="text-red-500">🗑️</button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
export default App;
