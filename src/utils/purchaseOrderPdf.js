import { jsPDF } from 'jspdf';

const BLUE = [11, 94, 168];
const ORANGE = [243, 107, 33];
const INK = [15, 23, 42];
const MUTED = [71, 85, 105];
const LINE = [203, 213, 225];
const SOFT = [248, 250, 252];

const COMPANY = {
  name: 'Shah Sobhagchand Dipchand & Co.',
  address: '226, Kika Street, Gulalwadi, Mumbai - 400 002. Tel.: 022-22420896',
  godown: 'Gala No.10, Bldg. No.2/B, Rajprabha Landmark Ind. Estate, Bhoidapada, Vasai (E)',
  contact: '+91 9967969052',
  email: 'info.sobhagchand@gmail.com',
  gstin: '27AABPJ9352P1Z5',
  state: 'MAHARASHTRA',
  stateCode: '27',
};

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const safeFilename = (value) => String(value || '')
  .trim()
  .replace(/[^a-z0-9._-]+/gi, '-')
  .replace(/^-+|-+$/g, '') || 'purchase-order';
const daysLabel = (value) => {
  const text = String(value || '').trim();
  if (!text) return '-';
  return /^\d+(\.\d+)?$/.test(text) ? `${text} Days` : text;
};

export function createPurchaseOrderPdf(order, items = []) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const rows = items.filter((item) => item.product_name && Number(item.qty) > 0);
  let y = 0;

  const drawHeader = (continued = false) => {
    pdf.setFillColor(...BLUE);
    pdf.rect(0, 0, pageWidth, 4, 'F');
    pdf.setFillColor(...ORANGE);
    pdf.rect(0, 4, pageWidth, 1.5, 'F');
    pdf.setTextColor(...BLUE);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(continued ? 17 : 21);
    pdf.text(COMPANY.name, pageWidth / 2, continued ? 15 : 17, { align: 'center' });
    if (!continued) {
      pdf.setTextColor(...INK);
      pdf.setFontSize(8);
      pdf.text(COMPANY.address, pageWidth / 2, 23, { align: 'center' });
      pdf.setFontSize(7.5);
      pdf.text(`Godown: ${COMPANY.godown}`, pageWidth / 2, 28, { align: 'center' });
      pdf.text(`Tel.: ${COMPANY.contact}   |   Email: ${COMPANY.email}`, pageWidth / 2, 33, { align: 'center' });
      pdf.setFont('helvetica', 'bold');
      pdf.text(`GSTIN: ${COMPANY.gstin}   |   STATE: ${COMPANY.state}   |   STATE CODE: ${COMPANY.stateCode}`, pageWidth / 2, 38, { align: 'center' });
    }
    pdf.setDrawColor(...LINE);
    pdf.line(margin, continued ? 20 : 42, pageWidth - margin, continued ? 20 : 42);
    return continued ? 26 : 48;
  };

  const drawOrderInfo = () => {
    pdf.setTextColor(...BLUE);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('PURCHASE ORDER', pageWidth / 2, y, { align: 'center' });
    pdf.setDrawColor(...ORANGE);
    pdf.setLineWidth(0.8);
    pdf.line(pageWidth / 2 - 24, y + 3, pageWidth / 2 + 24, y + 3);
    pdf.setLineWidth(0.2);

    y += 9;
    const halfWidth = (contentWidth - 4) / 2;
    pdf.setFillColor(...SOFT);
    pdf.setDrawColor(...LINE);
    pdf.roundedRect(margin, y, halfWidth, 24, 2.5, 2.5, 'FD');
    pdf.roundedRect(margin + halfWidth + 4, y, halfWidth, 24, 2.5, 2.5, 'FD');

    pdf.setTextColor(...MUTED);
    pdf.setFontSize(6.8);
    pdf.text('SUPPLIER / M/S.', margin + 5, y + 6);
    pdf.text('ORDER DETAILS', margin + halfWidth + 9, y + 6);
    pdf.setTextColor(...INK);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(pdf.splitTextToSize(order.supplier_name || '-', halfWidth - 10).slice(0, 1), margin + 5, y + 12);
    pdf.setTextColor(...MUTED);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.2);
    pdf.text(`Phone: ${order.supplier_phone || '-'}`, margin + 5, y + 20);

    const detailsX = margin + halfWidth + 9;
    pdf.setTextColor(...MUTED);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.text('PO NUMBER', detailsX, y + 12);
    pdf.text('ORDER DATE', detailsX, y + 20);
    pdf.setTextColor(...BLUE);
    pdf.setFontSize(9);
    pdf.text(order.po_no || '-', pageWidth - margin - 5, y + 12, { align: 'right' });
    pdf.setTextColor(...INK);
    pdf.setFontSize(8);
    pdf.text(order.po_date || '-', pageWidth - margin - 5, y + 20, { align: 'right' });
    y += 30;
  };

  const columns = [
    { label: '#', width: 8, align: 'left' },
    { label: 'PRODUCT', width: 83, align: 'left' },
    { label: 'SIZE', width: 25, align: 'left' },
    { label: 'QTY.', width: 20, align: 'right' },
    { label: 'UNIT', width: 17, align: 'left' },
    { label: 'RATE', width: 34, align: 'right' },
  ];
  const starts = [];
  columns.reduce((x, column) => {
    starts.push(x);
    return x + column.width;
  }, margin);

  const drawTableHeader = () => {
    pdf.setFillColor(...BLUE);
    pdf.rect(margin, y, contentWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    columns.forEach((column, index) => {
      const x = column.align === 'right' ? starts[index] + column.width - 2 : starts[index] + 2;
      pdf.text(column.label, x, y + 5.2, { align: column.align });
    });
    y += 8;
  };

  const addPage = () => {
    pdf.addPage();
    y = drawHeader(true);
    drawTableHeader();
  };

  y = drawHeader();
  drawOrderInfo();
  drawTableHeader();

  rows.forEach((item, index) => {
    const values = [
      String(index + 1),
      item.item_remark ? `${item.product_name}\nRemark: ${item.item_remark}` : item.product_name,
      item.size || '-',
      String(item.qty || 0),
      item.qty_type || 'Pcs',
      money(item.rate),
    ];
    const lines = values.map((value, columnIndex) => pdf.splitTextToSize(String(value), columns[columnIndex].width - 4));
    const rowHeight = Math.max(10, Math.max(...lines.map((entry) => entry.length)) * 3.8 + 3);
    if (y + rowHeight > pageHeight - 60) addPage();
    if (index % 2) {
      pdf.setFillColor(250, 252, 255);
      pdf.rect(margin, y, contentWidth, rowHeight, 'F');
    }
    pdf.setTextColor(...INK);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.2);
    lines.forEach((entry, columnIndex) => {
      const column = columns[columnIndex];
      const x = column.align === 'right' ? starts[columnIndex] + column.width - 2 : starts[columnIndex] + 2;
      pdf.text(entry, x, y + 5, { align: column.align });
    });
    pdf.setDrawColor(...LINE);
    pdf.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
    y += rowHeight;
  });

  if (!rows.length) {
    pdf.setTextColor(...MUTED);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.text('No purchase-order items.', pageWidth / 2, y + 14, { align: 'center' });
    y += 23;
  }

  if (y > pageHeight - 72) {
    pdf.addPage();
    y = drawHeader(true);
  }
  y += 8;
  const detailsHeight = 22;
  const rowHeight = detailsHeight / 3;
  const detailColumnWidth = contentWidth / 3;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...LINE);
  pdf.rect(margin, y, contentWidth, detailsHeight, 'FD');
  pdf.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
  pdf.line(margin, y + rowHeight * 2, pageWidth - margin, y + rowHeight * 2);
  pdf.line(margin + detailColumnWidth, y + rowHeight * 2, margin + detailColumnWidth, y + detailsHeight);
  pdf.line(margin + detailColumnWidth * 2, y + rowHeight * 2, margin + detailColumnWidth * 2, y + detailsHeight);

  pdf.setTextColor(...INK);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.text('REMARK:', margin + 3, y + 4.8);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.2);
  const remark = order.remark || 'Kindly mention the purchase order number and date on your invoice.';
  pdf.text(pdf.splitTextToSize(remark, contentWidth - 24).slice(0, 1), margin + 21, y + 4.8);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.text('DELIVERY CONTACT:', margin + 3, y + rowHeight + 4.8);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.2);
  pdf.text(order.delivery_contact || '-', margin + 34, y + rowHeight + 4.8);

  const detailCells = [
    ['PAYMENT TERMS', daysLabel(order.payment_terms)],
    ['DELIVERY WITHIN', daysLabel(order.delivery_within)],
    ['DELIVERY AT', order.delivery_at || 'VASAI (Godown)'],
  ];
  detailCells.forEach(([label, value], index) => {
    const x = margin + detailColumnWidth * index;
    pdf.setTextColor(...INK);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.text(label, x + 3, y + rowHeight * 2 + 4.8);
    pdf.setFontSize(7.5);
    pdf.text(pdf.splitTextToSize(String(value), detailColumnWidth / 2 - 5).slice(0, 1), x + detailColumnWidth - 3, y + rowHeight * 2 + 4.8, { align: 'right' });
  });

  const signY = y + detailsHeight + 23;
  pdf.setDrawColor(...LINE);
  pdf.line(margin + 2, signY, margin + 64, signY);
  pdf.line(pageWidth - margin - 64, signY, pageWidth - margin - 2, signY);
  pdf.setTextColor(...MUTED);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text('SUPPLIER SIGNATURE', margin + 33, signY + 6, { align: 'center' });
  pdf.setTextColor(...ORANGE);
  pdf.text(`FOR ${COMPANY.name.toUpperCase()}`, pageWidth - margin - 33, signY + 6, { align: 'center' });
  pdf.setTextColor(...MUTED);
  pdf.text('AUTHORISED SIGNATORY', pageWidth - margin - 33, signY + 14, { align: 'center' });

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setFillColor(...BLUE);
    pdf.rect(0, pageHeight - 4, pageWidth, 4, 'F');
    pdf.setTextColor(...MUTED);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.text(`Purchase Order ${order.po_no || ''}  |  Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }
  return pdf;
}

export function downloadPurchaseOrderPdf(order, items = []) {
  const pdf = createPurchaseOrderPdf(order, items);
  pdf.save(`${safeFilename(order.supplier_name)}-PO-${safeFilename(order.po_no)}.pdf`);
}
