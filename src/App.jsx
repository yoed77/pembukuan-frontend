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

  const [filterRangeMode, setFilterRangeMode] = useState('dropdown'); 
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useState(currentMonth); 
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState('all'); 
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');

  const BACKEND_URL = 'https://aplikasi-keuangan-backend.vercel.app';

  const fetchData = async () => {
    try {
      const resCat = await fetch(`${BACKEND_URL}/api/categories`);
      const dataCat = await resCat.json();
      setCategories(Array.isArray(dataCat) ? dataCat : []);

      const resTrans = await fetch(`${BACKEND_URL}/api/transactions`);
      const dataTrans = await resTrans.json();
      setTransactions(Array.isArray(dataTrans) ? dataTrans : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIKA VALIDASI SALDO HISTORIS (ANTI-MINUS) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId || !amount) return alert('Lengkapi data!');

    const inputAmount = parseFloat(amount);
    
    if (type === 'expense') {
      // Menghitung saldo tersedia tepat pada tanggal input (historis)
      const hist = transactions.filter(t => t.date <= date && t.id !== editingId);
      const inc = hist.filter(t => (t.category_type === 'income' || t.type === 'income') && t.payment_method === paymentMethod).reduce((s, t) => s + parseFloat(t.amount || 0), 0);
      const exp = hist.filter(t => (t.category_type === 'expense' || t.type === 'expense') && t.payment_method === paymentMethod).reduce((s, t) => s + parseFloat(t.amount || 0), 0);
      
      const saldoTersedia = inc - exp;
      if (inputAmount > saldoTersedia) {
        return alert(`❌ INPUT DITOLAK!\nPada tanggal ${date}, saldo ${paymentMethod.toUpperCase()} Anda hanya Rp ${saldoTersedia.toLocaleString('id-ID')}.`);
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

  // --- PERHITUNGAN DATA (SALDO AWAL & BULAN INI) ---
  const prior = transactions.filter(t => t.date?.substring(0, 7) < selectedMonth);
  const initialCash = prior.filter(t => (t.category_type==='income'||t.type==='income')&&t.payment_method==='cash').reduce((s,t)=>s+parseFloat(t.amount||0),0) - prior.filter(t => (t.category_type==='expense'||t.type==='expense')&&t.payment_method==='cash').reduce((s,t)=>s+parseFloat(t.amount||0),0);
  const initialBank = prior.filter(t => (t.category_type==='income'||t.type==='income')&&t.payment_method==='bank').reduce((s,t)=>s+parseFloat(t.amount||0),0) - prior.filter(t => (t.category_type==='expense'||t.type==='expense')&&t.payment_method==='bank').reduce((s,t)=>s+parseFloat(t.amount||0),0);
  
  const cur = transactions.filter(t => t.date?.substring(0, 7) === selectedMonth);
  const incC = cur.filter(t => (t.category_type==='income'||t.type==='income')&&t.payment_method==='cash').reduce((s,t)=>s+parseFloat(t.amount||0),0);
  const incB = cur.filter(t => (t.category_type==='income'||t.type==='income')&&t.payment_method==='bank').reduce((s,t)=>s+parseFloat(t.amount||0),0);
  const expC = cur.filter(t => (t.category_type==='expense'||t.type==='expense')&&t.payment_method==='cash').reduce((s,t)=>s+parseFloat(t.amount||0),0);
  const expB = cur.filter(t => (t.category_type==='expense'||t.type==='expense')&&t.payment_method==='bank').reduce((s,t)=>s+parseFloat(t.amount||0),0);

  const finalCash = initialCash + incC - expC;
  const finalBank = initialBank + incB - expB;

  const filteredTransactions = transactions.filter(t => {
      if (!t.date) return false;
      const raw = t.date.substring(0, 10);
      if (filterRangeMode === 'dropdown') {
        if (filterYear !== 'all' && raw.substring(0, 4) !== filterYear) return false;
        if (filterMonth !== 'all' && raw.substring(5, 7) !== filterMonth) return false;
      } else if (raw < startDate || raw > endDate) return false;
      if (filterType !== 'all' && (t.category_type || t.type) !== filterType) return false;
      if (filterCategory !== 'all' && String(t.category_id) !== filterCategory) return false;
      if (filterPaymentMethod !== 'all' && t.payment_method !== filterPaymentMethod) return false;
      return true;
  });

  const handleDelete = async (id) => {
    if (window.confirm('Hapus transaksi ini?')) {
      await fetch(`${BACKEND_URL}/api/transactions/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const resetForm = () => { setEditingId(null); setAmount(''); setDescription(''); setDate(new Date().toISOString().split('T')[0]); };
  const startEdit = (t) => { setEditingId(t.id); setDate(t.date?.substring(0,10)); setType(t.category_type || t.type); setCategoryId(t.category_id); setAmount(t.amount); setDescription(t.description); setPaymentMethod(t.payment_method); };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50 min-h-screen">
      {/* Tampilan dashboard dan form di sini (mengikuti struktur Anda sebelumnya) */}
      {/* ... (isi dengan bagian return dari script lama Anda) ... */}
    </div>
  );
}
export default App;
