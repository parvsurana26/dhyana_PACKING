import logoImage from '../assets/logo.jpeg';

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const PACKAGING_CHARGE_PER_BUNDLE = 350;
const packagingCharges = (slip) => Number(slip.packaging_charges ?? Number(slip.bundle_count || 0) * PACKAGING_CHARGE_PER_BUNDLE);

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

const safeFilename = (value) => String(value || '')
  .trim()
  .replace(/[^a-z0-9._-]+/gi, '-')
  .replace(/^-+|-+$/g, '') || 'packing-slip';

function fitText(context, value, maxWidth) {
  const text = String(value || '-');
  if (context.measureText(text).width <= maxWidth) return text;
  let shortened = text;
  while (shortened.length > 1 && context.measureText(`${shortened}...`).width > maxWidth) shortened = shortened.slice(0, -1);
  return `${shortened}...`;
}

export async function downloadSlipImage(slip, items = []) {
  const cleanItems = items.filter((item) => item.item_name && Number(item.qty) > 0);
  const width = 1400;
  const rowHeight = 62;
  const height = Math.max(1050, 900 + cleanItems.length * rowHeight);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#0b5ea8';
  context.fillRect(0, 0, width, 14);

  try {
    const logo = await loadImage(logoImage);
    context.drawImage(logo, 55, 45, 360, 108);
  } catch {
    context.fillStyle = '#0b5ea8';
    context.font = '700 52px Arial';
    context.fillText('Dhyana Kitchenware', 55, 110);
  }

  context.textAlign = 'right';
  context.fillStyle = '#0b5ea8';
  context.font = '800 34px Arial';
  context.fillText('PACKING SLIP', width - 55, 82);
  context.fillStyle = '#64748b';
  context.font = '600 20px Arial';
  context.fillText(`Date: ${slip.slip_date || '-'}`, width - 55, 122);

  context.strokeStyle = '#e2e8f0';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(55, 175);
  context.lineTo(width - 55, 175);
  context.stroke();

  context.textAlign = 'left';
  context.fillStyle = '#f8fafc';
  context.beginPath();
  context.roundRect(55, 200, width - 110, 120, 18);
  context.fill();
  context.strokeStyle = '#e2e8f0';
  context.stroke();

  context.fillStyle = '#64748b';
  context.font = '700 18px Arial';
  context.fillText('PARTY NAME', 85, 238);
  context.fillText('PACKING SLIP / BILL NO.', 930, 238);
  context.fillStyle = '#0f172a';
  context.font = '800 31px Arial';
  context.fillText(fitText(context, slip.party_name || '-', 760), 85, 285);
  context.fillStyle = '#0b5ea8';
  context.fillText(String(slip.slip_no || '-'), 930, 285);

  context.fillStyle = '#475569';
  context.font = '600 18px Arial';
  context.fillText(`Transport: ${slip.transport || '-'}`, 55, 362);
  context.fillText(`Phone: ${slip.phone || '-'}`, 420, 362);
  context.fillText(`Location: ${slip.location || '-'}`, 750, 362);
  context.fillText(`Bundles: ${slip.bundle_count || 0}`, 1180, 362);

  const columns = [
    { label: '#', x: 65, width: 45 },
    { label: 'Brand', x: 115, width: 225 },
    { label: 'Item', x: 345, width: 360 },
    { label: 'Size', x: 710, width: 120 },
    { label: 'Qty', x: 835, width: 85 },
    { label: 'Type', x: 925, width: 100 },
    { label: 'Rate', x: 1030, width: 120 },
    { label: 'Disc.', x: 1155, width: 90 },
    { label: 'Amount', x: 1250, width: 120 },
  ];
  let y = 395;
  context.fillStyle = '#0b5ea8';
  context.fillRect(55, y, width - 110, 52);
  context.fillStyle = '#ffffff';
  context.font = '700 17px Arial';
  columns.forEach((column) => context.fillText(column.label, column.x, y + 33));
  y += 52;

  cleanItems.forEach((item, index) => {
    context.fillStyle = index % 2 ? '#f8fafc' : '#ffffff';
    context.fillRect(55, y, width - 110, rowHeight);
    context.fillStyle = '#1e293b';
    context.font = '600 16px Arial';
    const values = [
      index + 1,
      item.brand_name,
      item.qty_type === 'Kg' && item.item_remark
        ? `${item.item_name} (${item.item_remark})`
        : item.item_name,
      item.size,
      item.qty,
      item.qty_type,
      money(item.rate),
      `${Number(item.discount || 0).toFixed(2)}%`,
      money(item.amount),
    ];
    values.forEach((value, columnIndex) => {
      const column = columns[columnIndex];
      context.fillText(fitText(context, value, column.width - 12), column.x, y + 38);
    });
    context.strokeStyle = '#e2e8f0';
    context.beginPath();
    context.moveTo(55, y + rowHeight);
    context.lineTo(width - 55, y + rowHeight);
    context.stroke();
    y += rowHeight;
  });

  y += 35;
  const totalsX = 920;
  context.fillStyle = '#f8fafc';
  context.beginPath();
  context.roundRect(totalsX, y, 425, 190, 18);
  context.fill();
  context.strokeStyle = '#cbd5e1';
  context.stroke();
  const totals = [
    ['Subtotal', money(slip.subtotal)],
    ['Discount', money(slip.discount_total)],
    ['Packaging', money(packagingCharges(slip))],
  ];
  context.font = '600 19px Arial';
  totals.forEach(([label, amount], index) => {
    context.textAlign = 'left';
    context.fillStyle = '#64748b';
    context.fillText(label, totalsX + 25, y + 38 + index * 38);
    context.textAlign = 'right';
    context.fillStyle = '#1e293b';
    context.fillText(amount, totalsX + 400, y + 38 + index * 38);
  });
  context.textAlign = 'left';
  context.fillStyle = '#0b5ea8';
  context.font = '800 22px Arial';
  context.fillText('GRAND TOTAL', totalsX + 25, y + 165);
  context.textAlign = 'right';
  context.fillText(money(slip.grand_total), totalsX + 400, y + 165);

  context.textAlign = 'left';
  context.fillStyle = '#64748b';
  context.font = '600 17px Arial';
  context.fillText(fitText(context, `Remark: ${slip.remark || '-'}`, 780), 55, y + 45);
  context.fillText('Prepared By', 80, height - 85);
  context.textAlign = 'right';
  context.fillText('Receiver Signature', width - 80, height - 85);
  context.fillStyle = '#0b5ea8';
  context.fillRect(0, height - 18, width, 18);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1));
  if (!blob) throw new Error('Could not create packing slip image.');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeFilename(slip.party_name)}-Bill-${safeFilename(slip.slip_no)}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
