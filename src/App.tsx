import React, { useState, useEffect } from 'react';
import {
  Crown,
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  Package,
  MessageCircle,
  Edit3,
  Check,
  Sparkles,
  RefreshCw,
  Lock
} from 'lucide-react';

const API_BASE = 'https://hanut-server.vercel.app/api';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [newPriceVal, setNewPriceVal] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Fetch Live Data from MongoDB Cloud
  const fetchCloudData = async () => {
    setLoading(true);
    try {
      const [prodRes, custRes, salesRes] = await Promise.all([
        fetch(`${API_BASE}/products`),
        fetch(`${API_BASE}/customers`),
        fetch(`${API_BASE}/sales`)
      ]);

      const [prods, custs, sls] = await Promise.all([
        prodRes.json(),
        custRes.json(),
        salesRes.json()
      ]);

      setProducts(prods || []);
      setCustomers(custs || []);
      setSales(sls || []);
    } catch (err) {
      console.error('Failed to load MongoDB cloud data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCloudData();
      const interval = setInterval(fetchCloudData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleOwnerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '9999' || pinInput === '1234') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Remote Price Editor Handler (Updates MongoDB Cloud directly!)
  const handleSavePriceCloud = async (productId: string) => {
    const priceNum = parseFloat(newPriceVal);
    if (isNaN(priceNum) || priceNum <= 0) return;

    const targetProd = products.find((p) => p.id === productId);
    if (!targetProd) return;

    const updatedProd = { ...targetProd, price: priceNum };

    try {
      await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProd)
      });

      setProducts(products.map((p) => (p.id === productId ? updatedProd : p)));
      setEditingPriceId(null);
      setNewPriceVal('');
      showToast('تم تحديث السعر على سحابة MongoDB بنجاح! ☁️🏷️');
    } catch (err) {
      alert('خطأ في الاتصال بالخادم');
    }
  };

  // 1-Click Individual Customer WhatsApp Debt Reminder
  const handleSendWhatsAppReminder = (customer: any) => {
    if (!customer.phone) {
      alert('رقم هاتف الزبون غير مسجل');
      return;
    }

    const cleanPhone = customer.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('0') ? '212' + cleanPhone.slice(1) : cleanPhone;

    const message = `أهلاً ${customer.name} 👋\nنذكركم بلطف بأن مجموع الدين المعلق لحسابكم لدى خالد هو: *${customer.total_owed.toFixed(2)} MAD*.\nشكراً جزيلاً لتعاونكم معنا! 🙏`;

    const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  // Calculate Aggregates
  const totalRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const cashSalesTotal = sales
    .filter((s) => s.payment_method === 'paid')
    .reduce((sum, s) => sum + s.total_amount, 0);
  const creditSalesTotal = sales
    .filter((s) => s.payment_method === 'credit')
    .reduce((sum, s) => sum + s.total_amount, 0);

  const totalDebtOwed = customers.reduce((sum, c) => sum + (c.total_owed || 0), 0);
  const activeDebtors = customers.filter((c) => (c.total_owed || 0) > 0);
  const overdueDebtors = activeDebtors.filter((c) => {
    const timeDiff = new Date().getTime() - new Date(c.last_activity).getTime();
    return timeDiff > 30 * 24 * 60 * 60 * 1000;
  });

  const lowStockProducts = products.filter((p) => p.stock_quantity <= 10);
  const topSellingProducts = [...products]
    .sort((a, b) => (b.times_sold_total || 0) - (a.times_sold_total || 0))
    .slice(0, 5);

  // OWNER PIN LOCK SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <form
          onSubmit={handleOwnerLogin}
          className="w-full max-w-sm glass-panel p-8 rounded-3xl border border-amber-500/30 text-center space-y-5 shadow-2xl"
        >
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 mx-auto flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
            <Crown className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">تطبيق المالك الخاص | Hanut Executive</h1>
            <p className="text-xs text-slate-400 mt-1">تطبيق مستقل خاص بالمالك فقط (أدخل رمز PIN الخاص)</p>
          </div>

          <div className="space-y-2">
            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              dir="ltr"
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 text-center text-2xl font-mono text-amber-400 tracking-widest focus:outline-none focus:border-amber-500 dir-ltr"
            />
            {pinError && (
              <p className="text-xs text-rose-500 font-bold">رمز PIN غير صحيح ❌</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20"
          >
            دخول مالك المحل 👑
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 start-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2">
          <Check className="w-5 h-5" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER TITLE & CONTROLS */}
        <div className="glass-panel p-6 rounded-3xl border border-amber-500/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white flex items-center gap-2">
                <span>تطبيق مالك حَانُوت المستقل</span>
                <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-mono">
                  MongoDB Cloud Live
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                تطبيق منفصل 100% خاص بالمالك لقراءة بيانات السحابة وتعديل الأسعار عن بعد
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchCloudData}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>تحديث بيانات MongoDB</span>
            </button>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="p-2.5 rounded-2xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800"
              title="قفل التخصيص"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FINANCIAL STAT CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="glass-panel p-4 rounded-3xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                إجمالي المبيعات (سحابي)
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight dir-ltr block mt-1">
                {totalRevenue.toFixed(2)} <span className="text-xs text-slate-400 font-normal">MAD</span>
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {sales.length} عملية بيع
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-3xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                الكاش / الديون
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base font-black text-emerald-400 font-mono">
                  {cashSalesTotal.toFixed(0)} <span className="text-[10px] text-slate-400 font-normal">كاش</span>
                </span>
                <span className="text-slate-700">|</span>
                <span className="text-base font-black text-amber-400 font-mono">
                  {creditSalesTotal.toFixed(0)} <span className="text-[10px] text-slate-400 font-normal">دين</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                تحصيل: {totalRevenue > 0 ? ((cashSalesTotal / totalRevenue) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-3xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                مجموع الديون المعلقة
              </span>
              <span className="text-2xl font-black text-rose-400 font-mono tracking-tight dir-ltr block mt-1">
                {totalDebtOwed.toFixed(2)} <span className="text-xs text-slate-400 font-normal">MAD</span>
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                لدى {activeDebtors.length} زبون
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-3xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                ديون متأخرة (+30 يوم)
              </span>
              <span className="text-2xl font-black text-orange-400 font-mono tracking-tight block mt-1">
                {overdueDebtors.length} <span className="text-xs text-slate-400 font-normal">حساب</span>
              </span>
              <span className="text-[11px] text-orange-400 mt-1 block font-bold">
                تتطلب تذكير مباشر
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* MAIN AUDIT & REMOTE CONTROLS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* CUSTOMER DEBT AUDIT & 1-CLICK WHATSAPP */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <h2 className="font-black text-sm text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>سجل جميع الزبناء والتذكيرات</span>
                </h2>
                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full font-bold">
                  {customers.length} زبون مسجل
                </span>
              </div>

              <div className="space-y-2.5 max-h-[320px] overflow-y-auto no-scrollbar pe-1">
                {customers.length > 0 ? (
                  customers.map((customer) => {
                    const hasDebt = (customer.total_owed || 0) > 0;
                    const isOverdue =
                      hasDebt &&
                      new Date().getTime() - new Date(customer.last_activity).getTime() >
                      30 * 24 * 60 * 60 * 1000;

                    return (
                      <div
                        key={customer.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                          isOverdue
                            ? 'bg-rose-500/5 border-rose-500/40'
                            : hasDebt
                            ? 'bg-slate-900/80 border-slate-800'
                            : 'bg-emerald-500/5 border-emerald-500/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-white">
                              {customer.name}
                            </h4>
                            {isOverdue && (
                              <span className="text-[9px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                                متأخر ⚠️
                              </span>
                            )}
                            {!hasDebt && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                                سديد (0 MAD) ✨
                              </span>
                            )}
                          </div>
                          {customer.phone && (
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5 dir-ltr">
                              📱 {customer.phone}
                            </p>
                          )}
                          {hasDebt && (
                            <p className="text-[11px] font-mono text-rose-400 font-black mt-0.5">
                              {customer.total_owed.toFixed(2)} MAD
                            </p>
                          )}
                        </div>

                        {hasDebt && (
                          <button
                            onClick={() => handleSendWhatsAppReminder(customer)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>تذكير WhatsApp 📲</span>
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    لا يوجد زبناء مسجلون حالياً
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* REMOTE PRICE EDITOR (Updates MongoDB Cloud directly!) */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <h2 className="font-black text-sm text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-400" />
                  <span>تعديل أسعار المنتجات بالسحابة عن بُعد</span>
                </h2>
                <span className="text-xs text-slate-400 font-bold">تحديث فوري لـ MongoDB</span>
              </div>

              <div className="space-y-2.5 max-h-[320px] overflow-y-auto no-scrollbar pe-1">
                {products.map((product) => {
                  const isEditing = editingPriceId === product.id;

                  return (
                    <div
                      key={product.id}
                      className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={product.image_url}
                          alt={product.name_ar}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-800"
                        />
                        <div>
                          <h4 className="font-bold text-xs text-white">
                            {product.name_ar}
                          </h4>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            المخزون: {product.stock_quantity} قطعة
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.5"
                              value={newPriceVal}
                              onChange={(e) => setNewPriceVal(e.target.value)}
                              placeholder={product.price.toString()}
                              className="w-20 bg-slate-950 border border-emerald-500 rounded-lg px-2 py-1 text-xs text-white font-mono font-bold focus:outline-none"
                            />
                            <button
                              onClick={() => handleSavePriceCloud(product.id)}
                              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs font-mono text-emerald-400">
                              {product.price.toFixed(2)} MAD
                            </span>
                            <button
                              onClick={() => {
                                setEditingPriceId(product.id);
                                setNewPriceVal(product.price.toString());
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              title="تعديل السعر"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* LOW STOCK & TOP SELLERS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-panel p-5 rounded-3xl border border-rose-500/30">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <h2 className="font-black text-sm text-rose-400 flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>تنبيهات المخزون المنخفض (أقل من 10 قطع)</span>
              </h2>
              <span className="text-xs bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full font-bold font-mono">
                {lowStockProducts.length} منتجات
              </span>
            </div>

            <div className="space-y-2">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((p) => (
                  <div
                    key={'low-' + p.id}
                    className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between"
                  >
                    <span className="font-bold text-xs text-slate-200">
                      {p.name_ar}
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-400">
                      متبقي {p.stock_quantity} قطعة فقط ⚠️
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  جميع المنتجات متوفرة بالمخزون 👍
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel p-5 rounded-3xl border border-amber-500/30">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <h2 className="font-black text-sm text-amber-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>أكثر 5 منتجات مبيعاً بالمتجر ⭐</span>
              </h2>
            </div>

            <div className="space-y-2">
              {topSellingProducts.map((p, idx) => (
                <div
                  key={'top-' + p.id}
                  className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-slate-200">
                      {p.name_ar}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    تم بيع {p.times_sold_total || 0} وحدة 🔥
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
