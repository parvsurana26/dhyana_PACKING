import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Download,
  Edit,
  Eye,
  FilePlus2,
  LoaderCircle,
  PackagePlus,
  Search,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from './lib/supabase';
import { downloadPurchaseOrderPdf } from './utils/purchaseOrderPdf';

const QTY_TYPES = ['Pcs', 'Set', 'Kg', 'Doz', 'Box'];
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;
const emptyRow = () => ({
  _key: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
  brand_id: '',
  item_name: '',
  product_id: '',
  product_name: '',
  item_remark: '',
  size: '',
  qty: 1,
  qty_type: 'Pcs',
  rate: 0,
  amount: 0,
});
const defaultOrder = () => ({
  po_no: '',
  po_date: today(),
  party_id: '',
  supplier_name: '',
  supplier_phone: '',
  payment_terms: '',
  delivery_within: '',
  delivery_at: 'VASAI (Godown)',
  delivery_contact: 'Darshit Gandhi - 9769158284',
  remark: 'Kindly mention the purchase order number and date on your invoice.',
  status: 'Saved',
});
const calculateRow = (row) => ({
  ...row,
  amount: Number((Number(row.qty || 0) * Number(row.rate || 0)).toFixed(2)),
});
const sortItems = (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0);
const databaseMissing = (error) => ['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error?.code)
  || /purchase_orders|purchase_order_items|save_purchase_order/i.test(error?.message || '');

function PageHeading({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-dhyanaOrange dark:bg-orange-950/50 dark:text-orange-300">
          <ShoppingCart size={14} /> Procurement
        </p>
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

function MigrationNotice() {
  return (
    <div className="panel border-orange-200 bg-orange-50/80 dark:border-orange-900 dark:bg-orange-950/30">
      <h2 className="font-bold text-orange-900 dark:text-orange-200">One-time database setup required</h2>
      <p className="mt-2 text-sm leading-6 text-orange-800 dark:text-orange-300">
        Run <code className="rounded bg-white/80 px-2 py-1 font-bold dark:bg-slate-900">sql/add_purchase_orders.sql</code> in the Supabase SQL Editor, then refresh this page.
      </p>
    </div>
  );
}

async function fetchPurchaseOrders() {
  const [ordersResult, itemsResult] = await Promise.all([
    supabase.from('purchase_orders').select('*').order('po_date', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('purchase_order_items').select('*').order('sort_order').order('created_at'),
  ]);
  const error = ordersResult.error || itemsResult.error;
  return {
    orders: ordersResult.data || [],
    items: itemsResult.data || [],
    error,
  };
}

export function PurchaseOrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  const load = async () => {
    setLoading(true);
    const result = await fetchPurchaseOrders();
    setMissing(databaseMissing(result.error));
    if (result.error && !databaseMissing(result.error)) toast.error(result.error.message);
    setOrders(result.orders);
    setItems(result.items);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    if (!needle) return orders;
    return orders.filter((order) => [
      order.po_no,
      order.po_date,
      order.supplier_name,
      order.supplier_phone,
    ].some((value) => String(value || '').toLowerCase().includes(needle)));
  }, [orders, query]);

  const remove = async (order) => {
    if (!window.confirm(`Delete purchase order ${order.po_no}?`)) return;
    const { error } = await supabase.from('purchase_orders').delete().eq('id', order.id);
    if (error) toast.error(error.message);
    else {
      toast.success('Purchase order deleted');
      load();
    }
  };

  if (missing) return <div className="space-y-6"><PageHeading title="Purchase Orders" subtitle="Create, manage, and download supplier purchase orders." /><MigrationNotice /></div>;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Purchase Orders"
        subtitle="Create, track, edit, and download polished supplier orders."
        actions={(
          <Link className="btn-primary" to="/purchase-orders/new">
            <FilePlus2 size={17} /> New Purchase Order
          </Link>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="panel border-l-4 border-l-dhyanaBlue">
          <p className="text-sm font-semibold text-slate-500">Total Orders</p>
          <p className="mt-2 text-3xl font-bold">{orders.length}</p>
        </div>
        <div className="panel border-l-4 border-l-emerald-500">
          <p className="text-sm font-semibold text-slate-500">Products Ordered</p>
          <p className="mt-2 text-3xl font-bold">{items.length}</p>
        </div>
      </div>

      <div className="panel">
        <label className="relative block max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="input pl-10"
            value={query}
            placeholder="Search PO number, supplier, or phone..."
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="mt-5 grid gap-4 lg:hidden">
          {filtered.map((order) => {
            const orderItems = items.filter((item) => item.purchase_order_id === order.id).sort(sortItems);
            return (
              <article key={order.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-dhyanaBlue">{order.po_no}</p>
                    <h3 className="mt-1 font-bold">{order.supplier_name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{order.po_date} · {orderItems.length} items</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={() => navigate(`/purchase-orders/${order.id}`)}><Eye size={15} /> View</button>
                  <button className="icon-btn" title="Download PDF" onClick={() => downloadPurchaseOrderPdf(order, orderItems)}><Download size={15} /></button>
                  <button className="icon-btn" title="Edit" onClick={() => navigate(`/purchase-orders/${order.id}/edit`)}><Edit size={15} /></button>
                  <button className="icon-btn text-red-600" title="Delete" onClick={() => remove(order)}><Trash2 size={15} /></button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-5 hidden overflow-x-auto lg:block">
          <table className="table min-w-[900px]">
            <thead><tr>{['PO Number', 'Date', 'Supplier', 'Items', 'Order Value', 'Actions'].map((head) => <th key={head}>{head}</th>)}</tr></thead>
            <tbody>
              {filtered.map((order) => {
                const orderItems = items.filter((item) => item.purchase_order_id === order.id).sort(sortItems);
                return (
                  <tr key={order.id}>
                    <td className="font-bold text-dhyanaBlue">{order.po_no}</td>
                    <td>{order.po_date}</td>
                    <td><p className="font-semibold">{order.supplier_name}</p><p className="text-xs text-slate-500">{order.supplier_phone || '-'}</p></td>
                    <td>{orderItems.length}</td>
                    <td className="font-semibold">{money(order.subtotal)}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="icon-btn" title="View" onClick={() => navigate(`/purchase-orders/${order.id}`)}><Eye size={15} /></button>
                        <button className="icon-btn" title="Download PDF" onClick={() => downloadPurchaseOrderPdf(order, orderItems)}><Download size={15} /></button>
                        <button className="icon-btn" title="Edit" onClick={() => navigate(`/purchase-orders/${order.id}/edit`)}><Edit size={15} /></button>
                        <button className="icon-btn text-red-600" title="Delete" onClick={() => remove(order)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && !filtered.length && <p className="py-12 text-center text-slate-500">No purchase orders found. Create your first purchase order.</p>}
        {loading && <p className="py-12 text-center text-slate-500">Loading purchase orders...</p>}
      </div>
    </div>
  );
}

export function PurchaseOrderEditor({ products, brands, parties, user }) {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultOrder());
  const [rows, setRows] = useState([emptyRow()]);
  const [savedOrderId, setSavedOrderId] = useState(id || '');
  const [autoSaveState, setAutoSaveState] = useState('waiting');
  const savingRef = useRef(false);
  const [loading, setLoading] = useState(editing);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const load = async () => {
      const result = await fetchPurchaseOrders();
      if (result.error) {
        setMissing(databaseMissing(result.error));
        if (!databaseMissing(result.error)) toast.error(result.error.message);
        setLoading(false);
        return;
      }
      if (editing) {
        const order = result.orders.find((entry) => entry.id === id);
        if (!order) {
          toast.error('Purchase order not found');
          navigate('/purchase-orders');
          return;
        }
        setForm({
          po_no: order.po_no || '',
          po_date: order.po_date || today(),
          party_id: order.party_id || '',
          supplier_name: order.supplier_name || '',
          supplier_phone: order.supplier_phone || '',
          payment_terms: order.payment_terms || '',
          delivery_within: order.delivery_within || '',
          delivery_at: order.delivery_at || 'VASAI (Godown)',
          delivery_contact: order.delivery_contact || 'Darshit Gandhi - 9769158284',
          remark: order.remark || '',
          status: 'Saved',
        });
        const orderItems = result.items.filter((item) => item.purchase_order_id === id).sort(sortItems);
        setRows(orderItems.length ? orderItems.map((item) => {
          const product = products.find((entry) => entry.id === item.product_id);
          return {
            ...item,
            _key: item.id,
            brand_id: product?.brand_id || '',
            item_name: product?.item_name || item.product_name || '',
          };
        }) : [emptyRow()]);
      } else {
        const max = result.orders.reduce((highest, order) => {
          const number = Number(String(order.po_no || '').match(/(\d+)$/)?.[1] || 0);
          return Math.max(highest, number);
        }, 0);
        setForm((current) => ({ ...current, po_no: String(max + 1) }));
      }
      setLoading(false);
    };
    load();
  }, [editing, id]);

  const subtotal = useMemo(() => Number(rows.reduce((sum, row) => sum + Number(row.amount || 0), 0).toFixed(2)), [rows]);
  const updateRow = (index, patch) => setRows((current) => current.map((row, rowIndex) => (
    rowIndex === index ? calculateRow({ ...row, ...patch }) : row
  )));
  const chooseParty = (partyId) => {
    const party = parties.find((entry) => entry.id === partyId);
    setForm({
      ...form,
      party_id: party?.id || '',
      supplier_name: party?.name || '',
      supplier_phone: party?.phone || '',
    });
  };
  const chooseBrand = (index, brandId) => {
    updateRow(index, {
      brand_id: brandId,
      item_name: '',
      product_id: '',
      product_name: '',
      size: '',
      qty_type: 'Pcs',
      rate: 0,
    });
  };
  const chooseItemName = (index, itemName) => {
    const firstProduct = products.find((product) => (
      product.is_active
      && product.brand_id === rows[index].brand_id
      && product.item_name === itemName
    ));
    updateRow(index, {
      item_name: itemName,
      product_id: '',
      product_name: itemName,
      size: '',
      qty_type: firstProduct?.qty_type || 'Pcs',
      rate: 0,
    });
  };
  const chooseProduct = (index, productId) => {
    const product = products.find((entry) => entry.id === productId);
    if (!product) {
      updateRow(index, { product_id: '' });
      return;
    }
    const brand = brands.find((entry) => entry.id === product.brand_id);
    updateRow(index, {
      product_id: product.id,
      brand_id: product.brand_id,
      item_name: product.item_name,
      product_name: `${brand?.name ? `${brand.name} - ` : ''}${product.item_name}`,
      size: product.size || '',
      qty_type: product.qty_type || 'Pcs',
      rate: product.rate || 0,
    });
  };

  const persistOrder = async ({ showErrors = false } = {}) => {
    if (savingRef.current) return savedOrderId;
    if (!form.po_no.trim() || !form.supplier_name.trim()) {
      setAutoSaveState('waiting');
      if (showErrors) toast.error('Select a supplier before finishing');
      return '';
    }
    const cleanRows = rows.filter((row) => row.product_name.trim() && Number(row.qty) > 0);
    savingRef.current = true;
    setAutoSaveState('saving');
    const orderPayload = {
      ...form,
      id: savedOrderId || null,
      status: 'Saved',
      subtotal,
      created_by: user.id,
    };
    try {
      const itemPayload = cleanRows.map((row, sortOrder) => ({
        product_id: row.product_id || '',
        product_name: row.product_name.trim(),
        item_remark: row.item_remark?.trim() || '',
        size: row.size || '',
        qty: Number(row.qty || 0),
        qty_type: row.qty_type || 'Pcs',
        rate: Number(row.rate || 0),
        amount: Number(row.amount || 0),
        sort_order: sortOrder,
      }));
      const { data: orderId, error } = await supabase.rpc('save_purchase_order', {
        p_order: orderPayload,
        p_items: itemPayload,
      });
      if (error) throw error;
      setSavedOrderId(orderId);
      setAutoSaveState('saved');
      return orderId;
    } catch (error) {
      if (databaseMissing(error)) setMissing(true);
      setAutoSaveState('error');
      if (showErrors) toast.error(error.message || 'Could not save purchase order');
      return '';
    } finally {
      savingRef.current = false;
    }
  };

  useEffect(() => {
    if (loading || missing || !form.supplier_name.trim()) {
      if (!form.supplier_name.trim()) setAutoSaveState('waiting');
      return undefined;
    }
    setAutoSaveState('pending');
    const timer = window.setTimeout(() => persistOrder(), 850);
    return () => window.clearTimeout(timer);
  }, [form, rows, loading, missing]);

  const finish = async () => {
    const orderId = await persistOrder({ showErrors: true });
    if (orderId) navigate(`/purchase-orders/${orderId}`);
  };

  if (missing) return <div className="space-y-6"><PageHeading title="Purchase Orders" subtitle="Create supplier purchase orders." /><MigrationNotice /></div>;
  if (loading) return <div className="panel">Loading purchase order...</div>;

  return (
    <div className="space-y-6">
      <PageHeading
        title={editing ? 'Edit Purchase Order' : 'New Purchase Order'}
        subtitle="Build a clear supplier order and download a professional PDF."
        actions={<Link className="btn-secondary" to="/purchase-orders"><ArrowLeft size={17} /> All Orders</Link>}
      />

      <div className="panel grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Input label="Purchase Order Number" value={form.po_no} onChange={(value) => setForm({ ...form, po_no: value })} />
        <Input label="Order Date" type="date" value={form.po_date} onChange={(value) => setForm({ ...form, po_date: value })} />
        <label>
          <span className="label">Supplier / M/s.</span>
          <select className="input" value={form.party_id} onChange={(event) => chooseParty(event.target.value)}>
            <option value="">Select party from Manage Parties</option>
            {parties.filter((party) => party.is_active).map((party) => (
              <option key={party.id} value={party.id}>{party.name}{party.phone ? ` - ${party.phone}` : ''}</option>
            ))}
          </select>
        </label>
        <Input label="Supplier Phone" value={form.supplier_phone} onChange={(value) => setForm({ ...form, supplier_phone: value })} placeholder="Auto-filled from party" />
        <div className="flex items-end">
          <Link className="btn-secondary w-full" to="/parties">Add or Manage Supplier Party</Link>
        </div>
      </div>

      <div className="panel overflow-x-auto">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Products to Order</h2>
            <p className="mt-1 text-sm text-slate-500">Choose brand, product, and size from saved Manage Products data.</p>
          </div>
          <button className="btn-secondary" type="button" onClick={() => setRows([...rows, emptyRow()])}><PackagePlus size={17} /> Add Row</button>
        </div>
        <table className="table min-w-[1050px]">
          <thead>
            <tr>{['Brand', 'Product Search', 'Size', 'Qty', 'Type', 'Remark', ''].map((head, index) => <th key={`${head}-${index}`}>{head}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const brandProducts = products.filter((product) => product.is_active && product.brand_id === row.brand_id);
              const itemNames = [...new Set(brandProducts.map((product) => product.item_name))]
                .sort((a, b) => a.localeCompare(b));
              const sizes = brandProducts
                .filter((product) => product.item_name === row.item_name)
                .sort((a, b) => String(a.size || '').localeCompare(String(b.size || ''), undefined, { numeric: true }));
              return (
                <tr key={row._key}>
                  <td>
                    <select className="cell-input min-w-40" value={row.brand_id} onChange={(event) => chooseBrand(index, event.target.value)}>
                      <option value="">Brand</option>
                      {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="cell-input min-w-64" value={row.item_name} onChange={(event) => chooseItemName(index, event.target.value)} disabled={!row.brand_id}>
                      <option value="">Search product</option>
                      {itemNames.map((name) => <option key={name} value={name}>{name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="cell-input min-w-36" value={row.product_id} onChange={(event) => chooseProduct(index, event.target.value)} disabled={!row.item_name}>
                      <option value="">Size</option>
                      {sizes.map((product) => <option key={product.id} value={product.id}>{product.size}</option>)}
                    </select>
                  </td>
                  <td><input className="cell-input min-w-28" type="number" min="0" value={row.qty} onChange={(event) => updateRow(index, { qty: event.target.value })} /></td>
                  <td>
                    <select className="cell-input min-w-28" value={row.qty_type} onChange={(event) => updateRow(index, { qty_type: event.target.value })}>
                      {QTY_TYPES.map((type) => <option key={type}>{type}</option>)}
                    </select>
                  </td>
                  <td>
                    <input
                      className="cell-input min-w-52"
                      value={row.item_remark || ''}
                      placeholder="Item remark"
                      onChange={(event) => updateRow(index, { item_remark: event.target.value })}
                    />
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="icon-btn text-red-600" type="button" title="Delete row" onClick={() => setRows(rows.length > 1 ? rows.filter((_, rowIndex) => rowIndex !== index) : [emptyRow()])}><Trash2 size={16} /></button>
                      <button className="icon-btn" type="button" title="Add row below" onClick={() => setRows([...rows.slice(0, index + 1), emptyRow(), ...rows.slice(index + 1)])}><PackagePlus size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="panel grid gap-4 md:grid-cols-2">
          <Input label="Payment Terms" value={form.payment_terms} onChange={(value) => setForm({ ...form, payment_terms: value })} placeholder="e.g. 30 days" />
          <Input label="Delivery Within" value={form.delivery_within} onChange={(value) => setForm({ ...form, delivery_within: value })} placeholder="e.g. 7 days" />
          <Input label="Delivery At" value={form.delivery_at} onChange={(value) => setForm({ ...form, delivery_at: value })} />
          <Input label="Delivery Contact" value={form.delivery_contact} onChange={(value) => setForm({ ...form, delivery_contact: value })} />
          <label className="md:col-span-2">
            <span className="label">Remark / Instructions</span>
            <textarea className="input min-h-24 py-3" value={form.remark} onChange={(event) => setForm({ ...form, remark: event.target.value })} />
          </label>
        </div>
        <div className="panel h-fit bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/50 dark:to-slate-900">
          <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Order Summary</p>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-slate-500">Products</span>
            <span className="font-bold">{rows.filter((row) => row.product_name && Number(row.qty) > 0).length}</span>
          </div>
          <div className="mt-6">
            <div className={`hidden ${
              autoSaveState === 'error'
                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950'
            }`}>
              {(autoSaveState === 'saving' || autoSaveState === 'pending') && <LoaderCircle className="animate-spin" size={17} />}
              {autoSaveState === 'waiting' && 'Select supplier to start auto-save'}
              {autoSaveState === 'pending' && 'Changes waiting to save...'}
              {autoSaveState === 'saving' && 'Saving automatically...'}
              {autoSaveState === 'saved' && 'All changes saved'}
              {autoSaveState === 'error' && 'Auto-save failed — try again'}
            </div>
            <button className="btn-primary w-full" disabled={autoSaveState === 'saving'} onClick={finish}>
              {autoSaveState === 'saving' ? <LoaderCircle className="animate-spin" size={17} /> : <Eye size={17} />}
              Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PurchaseOrderView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const result = await fetchPurchaseOrders();
      if (result.error) {
        setMissing(databaseMissing(result.error));
        if (!databaseMissing(result.error)) toast.error(result.error.message);
      }
      setOrder(result.orders.find((entry) => entry.id === id) || null);
      setItems(result.items.filter((item) => item.purchase_order_id === id).sort(sortItems));
      setLoading(false);
    };
    load();
  }, [id]);

  if (missing) return <MigrationNotice />;
  if (loading) return <div className="panel">Loading purchase order...</div>;
  if (!order) return <div className="panel"><p>Purchase order not found.</p><Link className="btn-secondary mt-4" to="/purchase-orders">Back to orders</Link></div>;

  return (
    <div className="space-y-6">
      <PageHeading
        title={`Purchase Order ${order.po_no}`}
        subtitle={`${order.supplier_name} · ${order.po_date}`}
        actions={(
          <>
            <button className="btn-secondary" onClick={() => downloadPurchaseOrderPdf(order, items)}><Download size={17} /> Download PDF</button>
            <button className="btn-primary" onClick={() => navigate(`/purchase-orders/${id}/edit`)}><Edit size={17} /> Edit Order</button>
          </>
        )}
      />
      <div className="panel overflow-hidden p-0">
        <div className="bg-gradient-to-r from-dhyanaBlue to-blue-700 px-5 py-6 text-white sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-100">Supplier / M/s.</p>
              <h2 className="mt-2 text-2xl font-bold">{order.supplier_name}</h2>
              <p className="mt-2 max-w-2xl text-sm text-blue-100">{order.supplier_phone || 'No supplier phone added'}</p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-8">
          <Info label="PO Number" value={order.po_no} />
          <Info label="Order Date" value={order.po_date} icon={<CalendarDays size={16} />} />
          <Info label="Supplier Phone" value={order.supplier_phone || '-'} />
          <Info label="Order Value" value={money(order.subtotal)} strong />
        </div>
        <div className="overflow-x-auto px-5 pb-6 sm:px-8">
          <table className="table min-w-[820px]">
            <thead><tr>{['#', 'Product', 'Remark', 'Size', 'Quantity', 'Unit', 'Rate', 'Amount'].map((head) => <th key={head}>{head}</th>)}</tr></thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td className="font-semibold">{item.product_name}</td>
                  <td>{item.item_remark || '-'}</td>
                  <td>{item.size || '-'}</td>
                  <td>{item.qty}</td>
                  <td>{item.qty_type}</td>
                  <td>{money(item.rate)}</td>
                  <td className="font-bold">{money(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-4 border-t border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/50 sm:grid-cols-2 lg:grid-cols-4 sm:p-8">
          <Info label="Payment Terms" value={order.payment_terms || '-'} />
          <Info label="Delivery Within" value={order.delivery_within || '-'} />
          <Info label="Delivery At" value={order.delivery_at || '-'} />
          <Info label="Delivery Contact" value={order.delivery_contact || '-'} />
          <div className="sm:col-span-2 lg:col-span-4"><Info label="Remark" value={order.remark || '-'} /></div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <label>
      <span className="label">{label}</span>
      <input
        className="input"
        type={type}
        value={value}
        min={type === 'number' ? '0' : undefined}
        step={type === 'number' ? '0.01' : undefined}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Info({ label, value, icon, strong }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">{icon}{label}</p>
      <p className={`mt-2 break-words ${strong ? 'text-xl font-bold text-dhyanaBlue' : 'font-semibold text-slate-800 dark:text-slate-100'}`}>{value}</p>
    </div>
  );
}
