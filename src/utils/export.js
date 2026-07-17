import * as XLSX from 'xlsx';

const DEFAULT_WHATSAPP_NUMBER = '917498383679';
const PACKAGING_CHARGE_PER_BUNDLE = 350;

const packagingCharges = (slip) => Number(slip.packaging_charges ?? Number(slip.bundle_count || 0) * PACKAGING_CHARGE_PER_BUNDLE);

function buildWhatsAppMessage(slip) {
  return [
    `Packing Slip ${slip.slip_no} - Dhyana Kitchenware`,
    `Party: ${slip.party_name || '-'}`,
    `Transport: ${slip.transport || '-'}`,
    `No. of Bundles: ${slip.bundle_count || 0}`,
    `Packaging Charges: Rs. ${packagingCharges(slip).toFixed(2)}`,
    `Total Amount: Rs. ${Number(slip.grand_total || 0).toFixed(2)}`,
  ].join('\n');
}

export function exportSlipsToExcel(slips) {
  const rows = slips.map((slip) => ({
    'Slip No': slip.slip_no,
    Date: slip.slip_date,
    'Party Name': slip.party_name,
    Transport: slip.transport,
    Phone: slip.phone,
    Location: slip.location,
    Bundles: slip.bundle_count || 0,
    'Packaging Charges': packagingCharges(slip),
    Subtotal: slip.subtotal,
    Discount: slip.discount_total,
    Total: slip.grand_total,
  }));
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Packing Slips');
  XLSX.writeFile(workbook, `dhyana-packing-slips-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function buildWhatsAppUrl(slip) {
  const text = buildWhatsAppMessage(slip);
  return `https://wa.me/${DEFAULT_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppChatUrl(slip) {
  const text = buildWhatsAppMessage(slip);
  return `whatsapp://send/?phone=${DEFAULT_WHATSAPP_NUMBER}&text=${encodeURIComponent(text)}`;
}

export function buildMailTo(slip) {
  const to = 'info.shobhagchand@gmail.com';
  const subject = `Packing Slip ${slip.slip_no} - Dhyana Kitchenware`;
  const body = [
    `Dear ${slip.party_name || 'Customer'},`,
    '',
    `Please find packing slip ${slip.slip_no}.`,
    `No. of Bundles: ${slip.bundle_count || 0}`,
    `Packaging Charges: Rs. ${packagingCharges(slip).toFixed(2)}`,
    `Total Amount: Rs. ${Number(slip.grand_total || 0).toFixed(2)}`,
    '',
    'Regards,',
    'Dhyana Kitchenware',
  ].join('\n');
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to,
    su: subject,
    body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}
