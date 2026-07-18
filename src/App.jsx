import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import {
  Boxes,
  ClipboardList,
  Copy,
  Download,
  Edit,
  Eye,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  Mail,
  Moon,
  PackagePlus,
  Printer,
  Search,
  Send,
  Sun,
  Trash2,
  Upload,
  Users,
  Percent,
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { buildMailTo, buildWhatsAppChatUrl, exportSlipsToExcel } from './utils/export';
import { downloadSlipPdf, getSlipPdfFile } from './utils/pdf';
import logoImage from './assets/logo.jpeg';

const emptyItem = {
  brand_id: '',
  product_id: '',
  item_query: '',
  brand_name: '',
  item_name: '',
  size: '',
  qty: 1,
  qty_type: 'Pcs',
  rate: 0,
  discount: 0,
  amount: 0,
};

const PACKAGING_CHARGE_PER_BUNDLE = 350;

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const dashboardPeriods = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
];
const dateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const today = () => dateKey();
const productLabel = (product) => (product ? product.item_name : '');
const qtyTypes = ['Pcs', 'Set', 'Kg', 'Doz', 'Box'];

function Logo() {
  return (
    <img
      src={logoImage}
      alt="Dhyana The Spirit of Kitchenware"
      className="h-14 w-auto max-w-full object-contain mix-blend-multiply dark:mix-blend-normal"
    />
  );
}

function useSupabaseData(user) {
  const [brands, setBrands] = useState([]);
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [slips, setSlips] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);
    const [brandRes, partyRes, productRes, discountRes, slipRes, itemRes] = await Promise.all([
      supabase.from('brands').select('*').order('name'),
      supabase.from('parties').select('*').order('name'),
      supabase.from('products').select('*, brands(name)').order('created_at', { ascending: false }).range(0, 4999),
      supabase.from('party_brand_discounts').select('*, parties(name), brands(name)').order('created_at', { ascending: false }),
      supabase.from('packing_slips').select('*').order('created_at', { ascending: false }),
      supabase.from('packing_items').select('*').order('sort_order').order('created_at').order('id'),
    ]);
    [brandRes, partyRes, productRes, discountRes, slipRes, itemRes].forEach((res) => {
      if (res.error) toast.error(res.error.message);
    });
    setBrands(brandRes.data || []);
    setParties(partyRes.data || []);
    setProducts(productRes.data || []);
    setDiscounts(discountRes.data || []);
    setSlips(slipRes.data || []);
    setItems(itemRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [user?.id]);

  return { brands, parties, products, discounts, slips, items, loading, reload: loadAll };
}

function Login({ session }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  if (session) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success('Welcome back');
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 dark:bg-slate-950">
      <section className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-7">
          <Logo />
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-dhyanaOrange">Dhyana Kitchenware</p>
            <h1 className="mt-3 text-4xl font-bold text-slate-950 dark:text-white sm:text-5xl">
              Packing Slip Management System
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
              Create, track, print, email, and export professional packing slips from a clean office-ready dashboard.
            </p>
          </div>
          <div className="grid max-w-2xl gap-4 sm:grid-cols-3">
            {['Auto Slip No', 'PDF Export', 'WhatsApp Share'].map((label) => (
              <div key={label} className="rounded-lg bg-white p-4 shadow-soft dark:bg-slate-900">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <form onSubmit={submit} className="rounded-lg bg-white p-7 shadow-soft dark:bg-slate-900">
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Login</h2>
          <p className="mt-1 text-sm text-slate-500">Use your Supabase email and password.</p>
          <label className="mt-6 block text-sm font-semibold">Email</label>
          <input className="input mt-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label className="mt-4 block text-sm font-semibold">Password</label>
          <input
            className="input mt-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="btn-primary mt-6 w-full" disabled={busy}>
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}

function Shell({ children, session, dark, setDark }) {
  const nav = [
    ['/', LayoutDashboard, 'Dashboard'],
    ['/new', FilePlus2, 'New Packing Slip'],
    ['/slips', ClipboardList, 'View Slips'],
    ['/parties', Users, 'Manage Parties'],
    ['/discounts', Percent, 'Discounts'],
    ['/products', Boxes, 'Manage Products'],
  ];
  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:block">
        <Logo />
        <nav className="mt-8 space-y-2">
          {nav.map(([to, Icon, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => clsx('nav-link', isActive && 'nav-link-active')}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85 lg:ml-72">
        <div className="flex items-center justify-between gap-3">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm text-slate-500">Logged in as</p>
            <p className="font-semibold">{session.user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="icon-btn" onClick={() => setDark(!dark)} title="Toggle theme">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="icon-btn" onClick={() => supabase.auth.signOut()} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <div className="mt-3 flex gap-2 overflow-auto lg:hidden">
          {nav.map(([to, Icon, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => clsx('mobile-nav', isActive && 'mobile-nav-active')}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>
      </header>
      <main className="p-4 lg:ml-72 lg:p-7">{children}</main>
    </div>
  );
}

function Dashboard({ slips, parties, items }) {
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState('today');
  const periodSlips = useMemo(() => slips.filter((slip) => isSlipInPeriod(slip, period)), [slips, period]);
  const filtered = useMemo(() => filterSlips(periodSlips, query), [periodSlips, query]);
  const total = periodSlips.reduce((sum, slip) => sum + Number(slip.grand_total || 0), 0);
  const periodParties = new Set(periodSlips.map((slip) => slip.party_name).filter(Boolean)).size;
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <PageTitle title="Dashboard" subtitle="Business overview for packing slip activity." />
        <div className="flex flex-wrap gap-2">
          {dashboardPeriods.map((entry) => (
            <button
              key={entry.value}
              className={clsx('btn-secondary h-10 px-3', period === entry.value && 'border-dhyanaBlue bg-blue-50 text-dhyanaBlue dark:bg-blue-950 dark:text-blue-200')}
              onClick={() => setPeriod(entry.value)}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Packing Slips" value={periodSlips.length} />
        <Stat label="All Parties" value={parties.length} />
        <Stat label="Period Parties" value={periodParties} />
        <Stat label="Total Amount" value={money(total)} />
      </div>
      <div className="panel">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <SearchBox value={query} onChange={setQuery} placeholder="Search by party, transport, date, phone..." />
          <div className="flex flex-wrap gap-2">
            <Link className="btn-primary" to="/new">
              <FilePlus2 size={17} /> New Packing Slip
            </Link>
            <Link className="btn-secondary" to="/products">
              <PackagePlus size={17} /> Manage Products
            </Link>
            <Link className="btn-secondary" to="/slips">
              <ClipboardList size={17} /> View Slips
            </Link>
          </div>
        </div>
        <SlipTable slips={filtered.slice(0, 8)} itemCount={items.length} compact />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="panel">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function SlipEditor({ brands, parties, products, discounts, slips, items, reload, user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = id && id !== 'duplicate';
  const duplicateId = new URLSearchParams(location.search).get('from');
  const sourceId = editing ? id : duplicateId;
  const sourceSlip = slips.find((slip) => slip.id === sourceId);
  const sourceItems = items
    .filter((item) => item.packing_slip_id === sourceId)
    .sort(comparePackingItems);
  const [form, setForm] = useState(defaultSlip());
  const [rows, setRows] = useState([emptyItem]);

  useEffect(() => {
    if (!sourceSlip) {
      generateSlipNo(slips).then((slip_no) => setForm((old) => ({ ...old, slip_no })));
      return;
    }
    setForm({
      slip_no: editing ? sourceSlip.slip_no : '',
      party_id: sourceSlip.party_id || '',
      party_name: sourceSlip.party_name || '',
      transport: sourceSlip.transport || '',
      phone: sourceSlip.phone || '',
      location: sourceSlip.location || '',
      slip_date: editing ? sourceSlip.slip_date : today(),
      bundle_count: sourceSlip.bundle_count || 0,
      packaging_charges: sourceSlip.packaging_charges ?? Number(sourceSlip.bundle_count || 0) * PACKAGING_CHARGE_PER_BUNDLE,
      remark: sourceSlip.remark || '',
      status: editing ? sourceSlip.status : 'Draft',
    });
    setRows(sourceItems.length ? sourceItems.map(({ id: _id, packing_slip_id, created_at, sort_order, ...item }) => item) : [emptyItem]);
    if (!editing) generateSlipNo(slips).then((slip_no) => setForm((old) => ({ ...old, slip_no })));
  }, [sourceSlip?.id, slips.length]);

  const totals = useMemo(() => calculateTotals(rows, form.packaging_charges), [rows, form.packaging_charges]);

  const updateRow = (index, patch) => {
    setRows((old) => old.map((row, rowIndex) => (rowIndex === index ? calculateRow({ ...row, ...patch }) : row)));
  };

  const addRowAfter = (index) => {
    const current = rows[index];
    const nextRow = current?.brand_id && current?.item_name
      ? calculateRow({
        ...emptyItem,
        brand_id: current.brand_id,
        brand_name: current.brand_name,
        item_name: current.item_name,
        item_query: current.item_name,
        qty: 1,
        qty_type: current.qty_type || 'Pcs',
        discount: current.discount || 0,
      })
      : emptyItem;
    setRows([...rows.slice(0, index + 1), nextRow, ...rows.slice(index + 1)]);
  };

  const chooseProduct = (index, productId) => {
    const product = products.find((entry) => entry.id === productId);
    const brand = brands.find((entry) => entry.id === product?.brand_id);
    if (!product) return;
    const discount = getPartyBrandDiscount(discounts, form.party_id, product.brand_id);
    updateRow(index, {
      product_id: product.id,
      item_query: product.item_name,
      brand_id: product.brand_id,
      brand_name: brand?.name || '',
      item_name: product.item_name,
      size: product.size,
      qty_type: product.qty_type,
      rate: product.rate,
      discount,
    });
  };

  const chooseParty = (partyId) => {
    const party = parties.find((entry) => entry.id === partyId);
    if (!party) {
      setForm({ ...form, party_id: '', party_name: '', transport: '', phone: '', location: '' });
      setRows((old) => old.map((row) => calculateRow({ ...row, discount: 0 })));
      return;
    }
    setForm({
      ...form,
      party_id: party.id,
      party_name: party.name,
      transport: party.transport || '',
      phone: party.phone || '',
      location: party.location || '',
    });
    setRows((old) =>
      old.map((row) =>
        calculateRow({
          ...row,
          discount: row.brand_id ? getPartyBrandDiscount(discounts, party.id, row.brand_id) : 0,
        }),
      ),
    );
  };

  const save = async (status = form.status) => {
    if (!form.party_name.trim()) return toast.error('Party name is required');
    const cleanRows = rows.filter((row) => row.product_id && Number(row.qty) > 0);
    if (!cleanRows.length) return toast.error('Add at least one packing item');
    const { subtotal, discount_total, packaging_charges, grand_total } = totals;
    const payload = {
      ...form,
      id: editing ? id : null,
      bundle_count: Number(form.bundle_count || 0),
      packaging_charges,
      subtotal,
      discount_total,
      grand_total,
      status,
      created_by: user.id,
    };
    const itemPayload = cleanRows.map(({ item_query, ...row }, sort_order) => ({ ...row, sort_order }));
    const rpcPayload = { ...payload, slip_no: editing ? payload.slip_no : '' };
    const rpcRes = await supabase.rpc('save_packing_slip', { p_slip: rpcPayload, p_items: itemPayload });
    if (rpcRes.error) {
      if (isMissingRpcError(rpcRes.error)) {
        return toast.error('Database upgrade required: run production_safety_upgrades.sql before saving slips.');
      }
      return toast.error(rpcRes.error.message);
    }
    toast.success(status === 'Completed' ? 'Packing slip completed' : 'Packing slip saved');
    await reload();
    navigate('/slips');
  };

  const printableSlip = { ...form, ...totals };
  return (
    <div className="space-y-6">
      <PageTitle title={editing ? 'Edit Packing Slip' : 'New Packing Slip'} subtitle="Create a polished slip with product-driven pricing." />
      <div className="panel grid gap-4 md:grid-cols-3">
        <label className="md:col-span-2">
          <span className="label">Select Party</span>
          <select className="input" value={form.party_id} onChange={(e) => chooseParty(e.target.value)}>
            <option value="">Select saved party</option>
            {parties.filter((party) => party.is_active).map((party) => (
              <option key={party.id} value={party.id}>
                {party.name} {party.phone ? `- ${party.phone}` : ''}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <Link className="btn-secondary w-full" to="/parties">
            <Users size={17} /> Add Party Details
          </Link>
        </div>
        <Field label="Party Name" value={form.party_name} onChange={(v) => setForm({ ...form, party_name: v })} />
        <Field label="Transport" value={form.transport} onChange={(v) => setForm({ ...form, transport: v })} />
        <Field label="Phone Number" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
        <Field label="Date" type="date" value={form.slip_date} onChange={(v) => setForm({ ...form, slip_date: v })} />
        <Field label="Packing Slip Number" value={form.slip_no} onChange={(v) => setForm({ ...form, slip_no: v })} />
        <label className="md:col-span-2">
          <span className="label">Optional Remark</span>
          <textarea className="input min-h-24" value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} />
        </label>
        <Field label="Number of Bundles" type="number" value={form.bundle_count} onChange={(v) => setForm({ ...form, bundle_count: v, packaging_charges: Number(v || 0) * PACKAGING_CHARGE_PER_BUNDLE })} />
      </div>
      <div className="panel overflow-x-auto">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Packing Items</h2>
          <button className="btn-secondary" onClick={() => setRows([...rows, emptyItem])}>
            <PackagePlus size={17} /> Add Row
          </button>
        </div>
        <table className="table min-w-[980px]">
          <thead>
            <tr>
              {['Brand', 'Item', 'Size', 'Qty', 'Type', 'Rate', 'Discount %', 'Amount', ''].map((head) => (
                <th key={head}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const brandProducts = products.filter((product) => product.brand_id === row.brand_id && product.is_active);
              const itemProducts = brandProducts.filter((product) => !row.item_name || product.item_name === row.item_name);
              const searchableProducts = products.filter((product) => product.is_active && (!row.brand_id || product.brand_id === row.brand_id));
              const itemInputValue = row.item_query || (row.product_id ? productLabel(products.find((product) => product.id === row.product_id)) : row.item_name);
              const itemSearch = itemInputValue.toLowerCase().trim();
              const searchableItemNames = [...new Set(
                searchableProducts
                  .filter((product) => !itemSearch || product.item_name.toLowerCase().includes(itemSearch))
                  .map((product) => product.item_name),
              )].slice(0, 80);
              return (
                <tr key={index}>
                  <td>
                    <select className="cell-input" value={row.brand_id} onChange={(e) => updateRow(index, { ...emptyItem, brand_id: e.target.value, brand_name: brands.find((b) => b.id === e.target.value)?.name || '', discount: getPartyBrandDiscount(discounts, form.party_id, e.target.value) })}>
                      <option value="">Brand</option>
                      {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <input
                      className="cell-input"
                      list={`item-options-${index}`}
                      value={itemInputValue}
                      placeholder="Search item"
                      onChange={(e) => {
                        const value = e.target.value;
                        const exactMatches = searchableProducts.filter((product) => productLabel(product) === value);
                        const matchedProduct = exactMatches.length === 1 ? exactMatches[0] : exactMatches.find((product) => product.id === row.product_id);
                        if (matchedProduct) chooseProduct(index, matchedProduct.id);
                        else updateRow(index, { item_query: value, item_name: value, product_id: '', size: '', rate: 0, discount: row.brand_id ? getPartyBrandDiscount(discounts, form.party_id, row.brand_id) : 0 });
                      }}
                    />
                    <datalist id={`item-options-${index}`}>
                      {searchableItemNames.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </td>
                  <td>
                    <select className="cell-input" value={row.product_id} onChange={(e) => chooseProduct(index, e.target.value)}>
                      <option value="">Size</option>
                      {itemProducts.map((product) => <option key={product.id} value={product.id}>{product.size}</option>)}
                    </select>
                  </td>
                  <td><input className="cell-input" type="number" min="0" value={row.qty} onChange={(e) => updateRow(index, { qty: e.target.value })} /></td>
                  <td>
                    <select className="cell-input" value={row.qty_type} onChange={(e) => updateRow(index, { qty_type: e.target.value })}>
                      {qtyTypes.map((type) => <option key={type}>{type}</option>)}
                    </select>
                  </td>
                  <td><input className="cell-input" type="number" value={row.rate} onChange={(e) => updateRow(index, { rate: e.target.value })} /></td>
                  <td>
                    <input
                      className="cell-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.discount}
                      onChange={(e) => updateRow(index, { discount: e.target.value })}
                    />
                  </td>
                  <td className="font-semibold">{money(row.amount)}</td>
                  <td>
                    <div className="flex gap-2">
                    <button title="Delete row" className="icon-btn" onClick={() => setRows(rows.length > 1 ? rows.filter((_, rowIndex) => rowIndex !== index) : [emptyItem])}>
                      <Trash2 size={16} />
                    </button>
                    <button title={row.item_name ? 'Add another size below' : 'Add row below'} className="icon-btn" onClick={() => addRowAfter(index)}>
                      <PackagePlus size={16} />
                    </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="panel flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => save('Draft')}><Upload size={17} /> Save Packing Slip</button>
          <button className="btn-primary" onClick={() => save('Completed')}><Send size={17} /> Complete</button>
          <button className="btn-secondary" onClick={() => downloadSlipPdf(printableSlip, rows)}><Download size={17} /> Save as PDF</button>
          <button className="btn-secondary" onClick={() => window.print()}><Printer size={17} /> Print</button>
          <button className="btn-secondary" onClick={() => emailSlipPdfWithGmail(printableSlip, rows)}><Mail size={17} /> Email</button>
        </div>
        <div className="panel space-y-3">
          <Summary label="Subtotal" value={money(totals.subtotal)} />
          <Summary label="Discount Amount" value={money(totals.discount_total)} />
          <EditableSummary label="Packaging Charges" value={form.packaging_charges} onChange={(value) => setForm({ ...form, packaging_charges: value })} />
          <Summary label="Final Total" value={money(totals.grand_total)} strong />
        </div>
      </div>
    </div>
  );
}

function SlipsPage({ slips, items, reload }) {
  const [query, setQuery] = useState('');
  const [date, setDate] = useState('');
  const [brand, setBrand] = useState('');
  const filtered = slips.filter((slip) => {
    const slipItems = items.filter((item) => item.packing_slip_id === slip.id);
    return filterSlips([slip], query).length && (!date || slip.slip_date === date) && (!brand || slipItems.some((item) => item.brand_name === brand));
  });
  const brands = [...new Set(items.map((item) => item.brand_name).filter(Boolean))];
  return (
    <div className="space-y-6">
      <PageTitle title="Packing Slip List" subtitle="Search, filter, duplicate, export, and manage slips." />
      <div className="panel space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
          <SearchBox value={query} onChange={setQuery} placeholder="Search party, transport, phone, date..." />
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <select className="input" value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">All brands</option>
            {brands.map((name) => <option key={name}>{name}</option>)}
          </select>
          <button className="btn-secondary" onClick={() => exportSlipsToExcel(filtered)}><Download size={17} /> Export Excel</button>
        </div>
        <SlipTable slips={filtered} items={items} reload={reload} />
      </div>
    </div>
  );
}

async function shareSlipPdfToWhatsApp(slip, items) {
  try {
    const file = await getSlipPdfFile(slip, items);
    const shareData = {
      title: `Packing Slip ${slip.slip_no}`,
      files: [file],
    };

    if (navigator.canShare?.({ files: [file] }) && navigator.share) {
      await navigator.share(shareData);
      toast.success('PDF ready to share on WhatsApp');
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(fileUrl);

    toast.success('PDF downloaded. WhatsApp is opening; attach the downloaded PDF.');
    window.location.href = buildWhatsAppChatUrl(slip);
  } catch (error) {
    if (error?.name === 'AbortError') return;
    toast.error('Could not prepare the PDF for WhatsApp.');
  }
}

async function emailSlipPdfWithGmail(slip, items) {
  try {
    const file = await getSlipPdfFile(slip, items);
    const fileUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(fileUrl);

    window.open(buildMailTo(slip), '_blank', 'noreferrer');
    toast.success('PDF downloaded. Gmail is open; attach the downloaded PDF before sending.');
  } catch (error) {
    toast.error('Could not prepare the PDF for email.');
  }
}

function SlipView({ slips, items }) {
  const { id } = useParams();
  const slip = slips.find((entry) => entry.id === id);
  const slipItems = items
    .filter((item) => item.packing_slip_id === id)
    .sort(comparePackingItems);
  if (!slip) return <div className="panel">Packing slip not found.</div>;
  return (
    <div className="space-y-6">
      <PageTitle title={`Packing Slip ${slip.slip_no}`} subtitle={`${slip.party_name} | ${slip.slip_date}`} />
      <div className="panel flex flex-wrap gap-2">
        <button className="btn-secondary" onClick={() => downloadSlipPdf(slip, slipItems)}><Download size={17} /> Download PDF</button>
        <button className="btn-secondary" onClick={() => window.print()}><Printer size={17} /> Print</button>
        <button className="btn-secondary" onClick={() => emailSlipPdfWithGmail(slip, slipItems)}><Mail size={17} /> Email</button>
        <button className="btn-secondary" onClick={() => shareSlipPdfToWhatsApp(slip, slipItems)}><Send size={17} /> WhatsApp PDF</button>
      </div>
      <div className="panel" id="packing-slip-preview">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 md:flex-row">
          <Logo />
          <div className="text-left md:text-right">
            <p className="text-sm font-semibold text-slate-500">Packing Slip No</p>
            <p className="text-xl font-bold text-dhyanaBlue">{slip.slip_no}</p>
            <p className="mt-2 text-sm">{slip.slip_date}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <Summary label="Party" value={slip.party_name} />
          <Summary label="Transport" value={slip.transport || '-'} />
          <Summary label="Phone" value={slip.phone || '-'} />
          <Summary label="Location" value={slip.location || '-'} />
          <Summary label="Bundles" value={slip.bundle_count || 0} />
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="table min-w-[820px]">
            <thead><tr>{['Brand', 'Item', 'Size', 'Qty', 'Type', 'Rate', 'Discount', 'Amount'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {slipItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.brand_name}</td>
                  <td>{item.item_name}</td>
                  <td>{item.size}</td>
                  <td>{item.qty}</td>
                  <td>{item.qty_type}</td>
                  <td>{money(item.rate)}</td>
                  <td>{item.discount}%</td>
                  <td className="font-semibold">{money(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ml-auto mt-5 max-w-sm space-y-3">
          <Summary label="Subtotal" value={money(slip.subtotal)} />
          <Summary label="Discount Amount" value={money(slip.discount_total)} />
          <Summary label="Packaging Charges" value={money(slip.packaging_charges ?? Number(slip.bundle_count || 0) * PACKAGING_CHARGE_PER_BUNDLE)} />
          <Summary label="Grand Total" value={money(slip.grand_total)} strong />
        </div>
        <p className="mt-5 text-sm text-slate-500">Remark: {slip.remark || '-'}</p>
      </div>
    </div>
  );
}

function SlipTable({ slips, items = [], reload, compact }) {
  const navigate = useNavigate();
  const remove = async (slip) => {
    if (!confirm(`Delete packing slip ${slip.slip_no}?`)) return;
    const { error } = await supabase.from('packing_slips').delete().eq('id', slip.id);
    if (error) toast.error(error.message);
    else {
      toast.success('Packing slip deleted');
      reload?.();
    }
  };
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="table min-w-[980px]">
        <thead>
          <tr>
            {['Slip No', 'Date', 'Party Name', 'Transport', 'Phone', 'Location', 'Bundles', 'Total Amount', compact ? '' : 'Actions'].map((head) => <th key={head}>{head}</th>)}
          </tr>
        </thead>
        <tbody>
          {slips.map((slip) => {
            const slipItems = items
              .filter((item) => item.packing_slip_id === slip.id)
              .sort(comparePackingItems);
            return (
              <tr key={slip.id}>
                <td className="font-semibold text-dhyanaBlue">{slip.slip_no}</td>
                <td>{slip.slip_date}</td>
                <td>{slip.party_name}</td>
                <td>{slip.transport}</td>
                <td>{slip.phone}</td>
                <td>{slip.location}</td>
                <td>{slip.bundle_count || 0}</td>
                <td className="font-semibold">{money(slip.grand_total)}</td>
                {!compact && (
                  <td>
                    <div className="flex gap-1">
                      <button title="View" className="icon-btn" onClick={() => navigate(`/slips/${slip.id}`)}><Eye size={15} /></button>
                      <button title="Download PDF" className="icon-btn" onClick={() => downloadSlipPdf(slip, slipItems)}><Download size={15} /></button>
                      <button title="Edit" className="icon-btn" onClick={() => navigate(`/slips/${slip.id}/edit`)}><Edit size={15} /></button>
                      <button title="Duplicate" className="icon-btn" onClick={() => navigate(`/new?from=${slip.id}`)}><Copy size={15} /></button>
                      <button title="Email PDF" className="icon-btn" onClick={() => emailSlipPdfWithGmail(slip, slipItems)}><Mail size={15} /></button>
                      <button title="WhatsApp PDF" className="icon-btn" onClick={() => shareSlipPdfToWhatsApp(slip, slipItems)}><Send size={15} /></button>
                      <button title="Delete" className="icon-btn text-red-600" onClick={() => remove(slip)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
          {!slips.length && <tr><td colSpan="9" className="py-8 text-center text-slate-500">No packing slips found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function ProductsPage({ brands, products, reload }) {
  const [form, setForm] = useState({ brand_name: '', brand_id: '', item_name: '', qty_type: 'Pcs', is_active: true });
  const [sizeRows, setSizeRows] = useState([{ size: '', rate: '' }]);
  const [editingGroup, setEditingGroup] = useState(null);
  const [query, setQuery] = useState('');
  const save = async (event) => {
    event.preventDefault();
    const cleanRows = sizeRows.filter((row) => row.size.trim() && row.rate !== '');
    if (!form.brand_id && !form.brand_name.trim()) return toast.error('Brand name is required');
    if (!form.item_name.trim()) return toast.error('Item name is required');
    if (!cleanRows.length) return toast.error('Add at least one size and rate');
    let brandId = form.brand_id;
    if (!brandId) {
      const { data, error } = await supabase.from('brands').insert({ name: form.brand_name.trim() }).select().single();
      if (error) return toast.error(error.message);
      brandId = data.id;
    }
    const payload = cleanRows.map((row) => ({
      id: row.id,
      brand_id: brandId,
      item_name: form.item_name,
      size: row.size.trim(),
      rate: Number(row.rate),
      qty_type: form.qty_type,
      is_active: form.is_active,
    }));
    let error;
    if (editingGroup) {
      const existingRows = payload.filter((row) => row.id);
      const newRows = payload.filter((row) => !row.id).map(({ id, ...row }) => row);
      const removedIds = editingGroup.products
        .map((product) => product.id)
        .filter((id) => !existingRows.some((row) => row.id === id));

      for (const row of existingRows) {
        const { id, ...updatePayload } = row;
        const updateRes = await supabase.from('products').update(updatePayload).eq('id', id);
        if (updateRes.error) {
          error = updateRes.error;
          break;
        }
      }
      if (!error && newRows.length) {
        const insertRes = await supabase.from('products').insert(newRows);
        error = insertRes.error;
      }
      if (!error && removedIds.length) {
        const deleteRes = await supabase.from('products').delete().in('id', removedIds);
        error = deleteRes.error;
      }
    } else {
      const insertRes = await supabase.from('products').insert(payload.map(({ id, ...row }) => row));
      error = insertRes.error;
    }
    if (error) toast.error(error.message);
    else {
      toast.success(editingGroup ? 'Product updated' : `${payload.length} product size${payload.length > 1 ? 's' : ''} added`);
      setForm({ brand_name: '', brand_id: '', item_name: '', qty_type: 'Pcs', is_active: true });
      setSizeRows([{ size: '', rate: '' }]);
      setEditingGroup(null);
      reload();
    }
  };
  const groupedProducts = useMemo(() => {
    const groups = new Map();
    products.forEach((product) => {
      const key = `${product.brand_id}-${product.item_name}-${product.qty_type}`;
      const existing = groups.get(key) || {
        key,
        brand: product.brands?.name,
        item_name: product.item_name,
        qty_type: product.qty_type,
        products: [],
      };
      existing.products.push(product);
      groups.set(key, existing);
    });
    return Array.from(groups.values()).map((group) => ({
      ...group,
      products: group.products.sort((a, b) => String(a.size).localeCompare(String(b.size), undefined, { numeric: true })),
    }));
  }, [products]);
  const filteredGroups = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return groupedProducts;
    return groupedProducts.filter((group) => {
      const searchable = [
        group.brand,
        group.item_name,
        group.qty_type,
        group.products.some((product) => product.is_active) ? 'active' : 'inactive',
        ...group.products.flatMap((product) => [product.size, product.rate]),
      ].join(' ').toLowerCase();
      return searchable.includes(term);
    });
  }, [groupedProducts, query]);
  const toggleGroup = async (group) => {
    const shouldActivate = !group.products.some((product) => product.is_active);
    const { error } = await supabase
      .from('products')
      .update({ is_active: shouldActivate })
      .in('id', group.products.map((product) => product.id));
    if (error) toast.error(error.message);
    else reload();
  };
  const editGroup = (group) => {
    const first = group.products[0];
    setEditingGroup(group);
    setForm({
      brand_name: '',
      brand_id: first.brand_id,
      item_name: group.item_name,
      qty_type: group.qty_type,
      is_active: group.products.some((product) => product.is_active),
    });
    setSizeRows(group.products.map((product) => ({ id: product.id, size: product.size, rate: product.rate })));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const removeGroup = async (group) => {
    if (!confirm(`Delete ${group.item_name} and all its sizes?`)) return;
    const { error } = await supabase.from('products').delete().in('id', group.products.map((product) => product.id));
    if (error) toast.error(error.message);
    else {
      toast.success('Product deleted');
      if (editingGroup?.key === group.key) {
        setEditingGroup(null);
        setForm({ brand_name: '', brand_id: '', item_name: '', qty_type: 'Pcs', is_active: true });
        setSizeRows([{ size: '', rate: '' }]);
      }
      reload();
    }
  };
  return (
    <div className="space-y-6">
      <PageTitle title="Manage Products" subtitle="Maintain brand, item, size, rate, and quantity type master data." />
      <form onSubmit={save} className="panel space-y-5">
        {editingGroup && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-blue-50 p-3 text-sm font-semibold text-dhyanaBlue dark:bg-blue-950 dark:text-blue-200">
            Editing {editingGroup.item_name}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setEditingGroup(null);
                setForm({ brand_name: '', brand_id: '', item_name: '', qty_type: 'Pcs', is_active: true });
                setSizeRows([{ size: '', rate: '' }]);
              }}
            >
              Cancel Edit
            </button>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-4">
        <label>
          <span className="label">Brand</span>
          <select className="input" value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value, brand_name: '' })}>
            <option value="">New brand</option>
            {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </select>
        </label>
        {!form.brand_id && <Field label="Brand Name" value={form.brand_name} onChange={(v) => setForm({ ...form, brand_name: v })} />}
        <Field label="Item Name" value={form.item_name} onChange={(v) => setForm({ ...form, item_name: v })} />
        <label>
          <span className="label">Quantity Type</span>
          <select className="input" value={form.qty_type} onChange={(e) => setForm({ ...form, qty_type: e.target.value })}>
            {qtyTypes.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-3 pt-7">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          Active
        </label>
        </div>
        <div className="overflow-x-auto">
          <table className="table min-w-[560px]">
            <thead><tr>{['Size', 'Rate', ''].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {sizeRows.map((row, index) => (
                <tr key={index}>
                  <td>
                    <input
                      className="cell-input"
                      value={row.size}
                      placeholder="Example: 9, 10, 11"
                      onChange={(e) => setSizeRows(sizeRows.map((entry, rowIndex) => rowIndex === index ? { ...entry, size: e.target.value } : entry))}
                    />
                  </td>
                  <td>
                    <input
                      className="cell-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.rate}
                      placeholder="Rate"
                      onChange={(e) => setSizeRows(sizeRows.map((entry, rowIndex) => rowIndex === index ? { ...entry, rate: e.target.value } : entry))}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="icon-btn text-red-600"
                      onClick={() => setSizeRows(sizeRows.length > 1 ? sizeRows.filter((_, rowIndex) => rowIndex !== index) : [{ size: '', rate: '' }])}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => setSizeRows([...sizeRows, { size: '', rate: '' }])}>
            <PackagePlus size={17} /> Add Size
          </button>
          <button className="btn-primary flex-1"><PackagePlus size={17} /> {editingGroup ? 'Update Product Sizes' : 'Add Product Sizes'}</button>
        </div>
      </form>
      <div className="panel space-y-4">
        <SearchBox value={query} onChange={setQuery} placeholder="Search product by brand, item, size, rate, type..." />
        <div className="overflow-x-auto">
          <table className="table min-w-[820px]">
            <thead><tr>{['Brand', 'Item', 'Sizes & Rates', 'Type', 'Status', 'Action'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filteredGroups.map((group) => {
              const activeCount = group.products.filter((product) => product.is_active).length;
              const status = activeCount === group.products.length ? 'Active' : activeCount === 0 ? 'Inactive' : 'Mixed';
              return (
              <tr key={group.key}>
                <td>{group.brand}</td>
                <td className="font-semibold">{group.item_name}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    {group.products.map((product) => (
                      <span key={product.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-950">
                        {product.size} - {money(product.rate)}
                      </span>
                    ))}
                  </div>
                </td>
                <td>{group.qty_type}</td>
                <td><span className={clsx('status', status === 'Active' ? 'status-complete' : 'status-draft')}>{status}</span></td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-secondary" onClick={() => editGroup(group)}><Edit size={16} /> Edit</button>
                    <button className="btn-secondary" onClick={() => toggleGroup(group)}>{activeCount ? 'Deactivate' : 'Activate'}</button>
                    <button className="icon-btn text-red-600" onClick={() => removeGroup(group)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
              );
            })}
              {!filteredGroups.length && <tr><td colSpan="6" className="py-8 text-center text-slate-500">No products found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DiscountsPage({ brands, parties, discounts, reload }) {
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [brandDiscounts, setBrandDiscounts] = useState({});
  const [query, setQuery] = useState('');
  const selectedParty = parties.find((party) => party.id === selectedPartyId);
  const filtered = discounts.filter((discount) =>
    [discount.parties?.name, discount.brands?.name, discount.discount].some((value) =>
      String(value || '').toLowerCase().includes(query.toLowerCase().trim()),
    ),
  );

  useEffect(() => {
    const next = {};
    brands.forEach((brand) => {
      const existing = discounts.find((entry) => entry.party_id === selectedPartyId && entry.brand_id === brand.id);
      next[brand.id] = existing ? existing.discount : 0;
    });
    setBrandDiscounts(next);
  }, [selectedPartyId, brands.length, discounts.length]);

  const save = async (event) => {
    event.preventDefault();
    if (!selectedPartyId) return toast.error('Select party');
    const payload = brands.map((brand) => ({
      party_id: selectedPartyId,
      brand_id: brand.id,
      discount: Number(brandDiscounts[brand.id] || 0),
      is_active: true,
    }));
    const { error } = await supabase.from('party_brand_discounts').upsert(payload, { onConflict: 'party_id,brand_id' });
    if (error) toast.error(error.message);
    else {
      toast.success('Discount list saved');
      reload();
    }
  };

  const toggle = async (discount) => {
    const { error } = await supabase
      .from('party_brand_discounts')
      .update({ is_active: !discount.is_active })
      .eq('id', discount.id);
    if (error) toast.error(error.message);
    else reload();
  };

  const remove = async (discount) => {
    if (!confirm(`Delete discount for ${discount.parties?.name || 'party'} and ${discount.brands?.name || 'brand'}?`)) return;
    const { error } = await supabase.from('party_brand_discounts').delete().eq('id', discount.id);
    if (error) toast.error(error.message);
    else {
      toast.success('Discount deleted');
      reload();
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Discounts" subtitle="Select a party and enter discount for every brand in one list." />
      <form onSubmit={save} className="panel space-y-5">
        <label className="block max-w-xl">
          <span className="label">Party</span>
          <select className="input" value={selectedPartyId} onChange={(e) => setSelectedPartyId(e.target.value)}>
            <option value="">Select party</option>
            {parties.filter((party) => party.is_active).map((party) => (
              <option key={party.id} value={party.id}>{party.name}</option>
            ))}
          </select>
        </label>
        <div className="overflow-x-auto">
          <table className="table min-w-[620px]">
            <thead><tr>{['Brand', 'Discount %'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {brands.map((brand) => (
                <tr key={brand.id}>
                  <td className="font-semibold">{brand.name}</td>
                  <td>
                    <input
                      className="cell-input max-w-xs"
                      type="number"
                      min="0"
                      step="0.01"
                      value={brandDiscounts[brand.id] ?? 0}
                      onChange={(e) => setBrandDiscounts({ ...brandDiscounts, [brand.id]: e.target.value })}
                      disabled={!selectedPartyId}
                    />
                  </td>
                </tr>
              ))}
              {!brands.length && <tr><td colSpan="2" className="py-8 text-center text-slate-500">No brands found.</td></tr>}
            </tbody>
          </table>
        </div>
        <button className="btn-primary" disabled={!selectedPartyId || !brands.length}>
          <Percent size={17} /> Save {selectedParty ? selectedParty.name : 'Party'} Discounts
        </button>
      </form>
      <div className="panel space-y-4">
        <SearchBox value={query} onChange={setQuery} placeholder="Search party, brand, discount..." />
        <div className="overflow-x-auto">
          <table className="table min-w-[760px]">
            <thead><tr>{['Party', 'Brand', 'Discount', 'Status', 'Actions'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((discount) => (
                <tr key={discount.id}>
                  <td className="font-semibold">{discount.parties?.name}</td>
                  <td>{discount.brands?.name}</td>
                  <td>{Number(discount.discount || 0).toFixed(2)}%</td>
                  <td><span className={clsx('status', discount.is_active ? 'status-complete' : 'status-draft')}>{discount.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn-secondary" onClick={() => setSelectedPartyId(discount.party_id)}>
                        <Edit size={16} /> Edit
                      </button>
                      <button className="btn-secondary" onClick={() => toggle(discount)}>{discount.is_active ? 'Deactivate' : 'Activate'}</button>
                      <button className="icon-btn text-red-600" onClick={() => remove(discount)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan="5" className="py-8 text-center text-slate-500">No discounts found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PartiesPage({ parties, reload }) {
  const [form, setForm] = useState({ name: '', transport: '', phone: '', location: '', is_active: true });
  const [editingPartyId, setEditingPartyId] = useState('');
  const [query, setQuery] = useState('');
  const filtered = parties.filter((party) =>
    [party.name, party.transport, party.phone, party.location].some((value) =>
      String(value || '').toLowerCase().includes(query.toLowerCase().trim()),
    ),
  );

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return toast.error('Party name is required');
    const payload = {
      name: form.name.trim(),
      transport: form.transport,
      phone: form.phone,
      location: form.location,
      is_active: form.is_active,
    };
    const { error } = editingPartyId
      ? await supabase.from('parties').update(payload).eq('id', editingPartyId)
      : await supabase.from('parties').insert(payload);
    if (error) toast.error(error.message);
    else {
      toast.success(editingPartyId ? 'Party updated' : 'Party details added');
      setForm({ name: '', transport: '', phone: '', location: '', is_active: true });
      setEditingPartyId('');
      reload();
    }
  };

  const toggle = async (party) => {
    const { error } = await supabase.from('parties').update({ is_active: !party.is_active }).eq('id', party.id);
    if (error) toast.error(error.message);
    else reload();
  };

  const remove = async (party) => {
    if (!confirm(`Delete party ${party.name}?`)) return;
    const { error } = await supabase.from('parties').delete().eq('id', party.id);
    if (error) toast.error(error.message);
    else {
      toast.success('Party deleted');
      reload();
    }
  };

  const editParty = (party) => {
    setEditingPartyId(party.id);
    setForm({
      name: party.name || '',
      transport: party.transport || '',
      phone: party.phone || '',
      location: party.location || '',
      is_active: party.is_active,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Manage Parties" subtitle="Save party details once, then select them while creating packing slips." />
      <form onSubmit={save} className="panel grid gap-4 md:grid-cols-5">
        {editingPartyId && (
          <div className="md:col-span-5 flex flex-wrap items-center justify-between gap-3 rounded-md bg-blue-50 p-3 text-sm font-semibold text-dhyanaBlue dark:bg-blue-950 dark:text-blue-200">
            Editing {form.name}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setEditingPartyId('');
                setForm({ name: '', transport: '', phone: '', location: '', is_active: true });
              }}
            >
              Cancel Edit
            </button>
          </div>
        )}
        <Field label="Party Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="Transport" value={form.transport} onChange={(v) => setForm({ ...form, transport: v })} />
        <Field label="Phone Number" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
        <label className="flex items-center gap-3 pt-7">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          Active
        </label>
        <button className="btn-primary md:col-span-5">
          <Users size={17} /> {editingPartyId ? 'Update Party' : 'Add Party'}
        </button>
      </form>
      <div className="panel space-y-4">
        <SearchBox value={query} onChange={setQuery} placeholder="Search party, transport, phone, location..." />
        <div className="overflow-x-auto">
          <table className="table min-w-[820px]">
            <thead><tr>{['Party Name', 'Transport', 'Phone', 'Location', 'Status', 'Actions'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((party) => (
                <tr key={party.id}>
                  <td className="font-semibold">{party.name}</td>
                  <td>{party.transport}</td>
                  <td>{party.phone}</td>
                  <td>{party.location}</td>
                  <td><span className={clsx('status', party.is_active ? 'status-complete' : 'status-draft')}>{party.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn-secondary" onClick={() => editParty(party)}><Edit size={16} /> Edit</button>
                      <button className="btn-secondary" onClick={() => toggle(party)}>{party.is_active ? 'Deactivate' : 'Activate'}</button>
                      <button className="icon-btn text-red-600" onClick={() => remove(party)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan="6" className="py-8 text-center text-slate-500">No parties found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PageTitle({ title, subtitle }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-950 dark:text-white">{title}</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label>
      <span className="label">{label}</span>
      <input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} required={label !== 'Optional Remark'} />
    </label>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <label className="relative block">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input className="input pl-10" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function Summary({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 dark:border-slate-800">
      <span className="text-slate-500">{label}</span>
      <span className={clsx('font-semibold', strong && 'text-xl text-dhyanaBlue dark:text-blue-300')}>{value}</span>
    </div>
  );
}

function EditableSummary({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 dark:border-slate-800">
      <span className="text-slate-500">{label}</span>
      <input
        className="w-36 rounded-md border border-slate-200 bg-white px-3 py-2 text-right font-semibold text-slate-900 outline-none transition focus:border-dhyanaBlue focus:ring-2 focus:ring-dhyanaBlue/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        type="number"
        min="0"
        step="0.01"
        value={value ?? 0}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function defaultSlip() {
  return { slip_no: '', party_id: '', party_name: '', transport: '', phone: '', location: '', slip_date: today(), bundle_count: 0, packaging_charges: 0, remark: '', status: 'Draft' };
}

async function generateSlipNo(slips) {
  const max = slips.reduce((highest, slip) => {
    const value = String(slip.slip_no || '').trim();
    const numericSlipNo = Number(value.match(/\d+$/)?.[0] || 0);
    return Math.max(highest, Number.isFinite(numericSlipNo) ? numericSlipNo : 0);
  }, 0);
  return String(max + 1);
}

function isMissingRpcError(error) {
  return ['PGRST202', '42883'].includes(error?.code) || /function .*not found|could not find the function/i.test(error?.message || '');
}

function getPartyBrandDiscount(discounts, partyId, brandId) {
  const match = discounts.find((entry) => entry.party_id === partyId && entry.brand_id === brandId && entry.is_active);
  return Number(match?.discount || 0);
}

function calculateRow(row) {
  const qty = Number(row.qty || 0);
  const rate = Number(row.rate || 0);
  const discount = Number(row.discount || 0);
  const gross = qty * rate;
  return { ...row, amount: Number((gross - gross * (discount / 100)).toFixed(2)) };
}

function calculateTotals(rows, packagingCharges = 0) {
  const gross = rows.reduce((sum, row) => sum + Number(row.qty || 0) * Number(row.rate || 0), 0);
  const itemsTotal = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const cleanPackagingCharges = Number(packagingCharges || 0);
  const grand = itemsTotal + cleanPackagingCharges;
  return {
    subtotal: Number(gross.toFixed(2)),
    discount_total: Number((gross - itemsTotal).toFixed(2)),
    packaging_charges: Number(cleanPackagingCharges.toFixed(2)),
    grand_total: Number(grand.toFixed(2)),
  };
}

function isSlipInPeriod(slip, period) {
  if (period === 'all') return true;
  if (!slip.slip_date) return false;

  const slipDate = new Date(`${slip.slip_date}T00:00:00`);
  const currentDate = new Date(`${today()}T00:00:00`);

  if (period === 'today') return dateKey(slipDate) === dateKey(currentDate);

  if (period === 'week') {
    const mondayOffset = (currentDate.getDay() + 6) % 7;
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - mondayOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return slipDate >= weekStart && slipDate <= weekEnd;
  }

  if (period === 'month') {
    return slipDate.getFullYear() === currentDate.getFullYear() && slipDate.getMonth() === currentDate.getMonth();
  }

  return true;
}

function filterSlips(slips, query) {
  const needle = query.toLowerCase().trim();
  if (!needle) return slips;
  return slips.filter((slip) => [slip.party_name, slip.transport, slip.phone, slip.location, slip.slip_date, slip.slip_no].some((value) => String(value || '').toLowerCase().includes(needle)));
}

function comparePackingItems(a, b) {
  const positionDifference = Number(a.sort_order || 0) - Number(b.sort_order || 0);
  if (positionDifference) return positionDifference;
  const createdDifference = String(a.created_at || '').localeCompare(String(b.created_at || ''));
  if (createdDifference) return createdDifference;
  return String(a.id || '').localeCompare(String(b.id || ''));
}

export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [dark, setDark] = useState(() => localStorage.theme === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.theme = dark ? 'dark' : 'light';
  }, [dark]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => data.subscription.unsubscribe();
  }, []);

  const data = useSupabaseData(session?.user);
  if (!ready) return <div className="grid min-h-screen place-items-center bg-slate-100 text-slate-500">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={<Login session={session} />} />
      <Route
        path="/*"
        element={
          session ? (
            <Shell session={session} dark={dark} setDark={setDark}>
              {data.loading ? (
                <div className="panel">Loading business data...</div>
              ) : (
                <Routes>
                  <Route path="/" element={<Dashboard {...data} />} />
                  <Route path="/new" element={<SlipEditor {...data} user={session.user} />} />
                  <Route path="/slips" element={<SlipsPage {...data} />} />
                  <Route path="/slips/:id" element={<SlipView {...data} />} />
                  <Route path="/slips/:id/edit" element={<SlipEditor {...data} user={session.user} />} />
                  <Route path="/parties" element={<PartiesPage {...data} />} />
                  <Route path="/discounts" element={<DiscountsPage {...data} />} />
                  <Route path="/products" element={<ProductsPage {...data} />} />
                </Routes>
              )}
            </Shell>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
