import jsPDF from 'jspdf';
import logoImage from '../assets/logo.jpeg';

const BLUE = [11, 94, 168];
const INK = [15, 23, 42];
const MUTED = [100, 116, 139];
const LINE = [226, 232, 240];
const SOFT = [248, 250, 252];
const PACKAGING_CHARGE_PER_BUNDLE = 350;

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;
const packagingCharges = (slip) => Number(
  slip.packaging_charges ?? Number(slip.bundle_count || 0) * PACKAGING_CHARGE_PER_BUNDLE,
);
const safeFilename = (value) => String(value || '')
  .trim()
  .replace(/[^a-z0-9._-]+/gi, '-')
  .replace(/^-+|-+$/g, '') || 'packing-slip';
const slipFilename = (slip) => `${safeFilename(slip.party_name)}-Bill-${safeFilename(slip.slip_no)}.pdf`;

async function loadImageDataUrl(src) {
  const response = await fetch(src);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function createSlipPdf(slip, items = []) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let logoDataUrl = null;
  let y = 0;

  try {
    logoDataUrl = await loadImageDataUrl(logoImage);
  } catch {
    logoDataUrl = null;
  }

  const drawBrandHeader = (continued = false) => {
    pdf.setFillColor(...BLUE);
    pdf.rect(1.5, 2.5, pageWidth - 3, 2, 'F');
    if (logoDataUrl) {
      pdf.addImage(logoDataUrl, 'JPEG', margin, continued ? 8 : 8, continued ? 38 : 52, continued ? 12 : 16);
    } else {
      pdf.setTextColor(...BLUE);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(continued ? 18 : 25);
      pdf.text('Dhyana Kitchenware', margin, continued ? 18 : 23);
    }

    if (continued) {
      pdf.setTextColor(...MUTED);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(`PACKING SLIP #${slip.slip_no || '-'}  /  CONTINUED`, pageWidth - margin, 16, { align: 'right' });
      pdf.setDrawColor(...LINE);
      pdf.line(margin, 27, pageWidth - margin, 27);
      return 35;
    }

    pdf.setTextColor(...BLUE);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('PACKING SLIP', pageWidth - margin, 14, { align: 'right' });
    pdf.setTextColor(...MUTED);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.text(`Date: ${slip.slip_date || '-'}`, pageWidth - margin, 21, { align: 'right' });
    pdf.setDrawColor(...LINE);
    pdf.line(margin, 31, pageWidth - margin, 31);
    return 36;
  };

  const infoValue = (label, value, x, top, maxWidth, valueColor = INK) => {
    pdf.setTextColor(...MUTED);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.text(label.toUpperCase(), x, top);
    pdf.setTextColor(...valueColor);
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(String(value || '-'), maxWidth);
    pdf.text(lines.slice(0, 2), x, top + 6);
  };

  const drawPartyCard = () => {
    pdf.setFillColor(...SOFT);
    pdf.setDrawColor(...LINE);
    pdf.roundedRect(margin, y, contentWidth, 20, 3, 3, 'FD');
    infoValue('Party name', slip.party_name, margin + 5, y + 7, 105);
    infoValue('Packing slip / bill no.', slip.slip_no, margin + 126, y + 7, 48, BLUE);
    const detailsY = y + 27;
    pdf.setTextColor(...INK);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.2);
    pdf.text(`Transport: ${slip.transport || '-'}`, margin, detailsY);
    pdf.text(`Phone: ${slip.phone || '-'}`, margin + 53, detailsY);
    pdf.text(`Location: ${slip.location || '-'}`, margin + 101, detailsY);
    pdf.text(`Bundles: ${slip.bundle_count || 0}`, pageWidth - margin, detailsY, { align: 'right' });
    y += 33;
  };

  const columns = [
    { label: '#', width: 6, align: 'left' },
    { label: 'Brand', width: 28, align: 'left' },
    { label: 'Item', width: 48, align: 'left' },
    { label: 'Size', width: 16, align: 'left' },
    { label: 'Qty', width: 11, align: 'right' },
    { label: 'Type', width: 14, align: 'left' },
    { label: 'Rate', width: 21, align: 'right' },
    { label: 'Disc.', width: 18, align: 'right' },
    { label: 'Amount', width: 24, align: 'right' },
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
    pdf.setFontSize(6.8);
    columns.forEach((column, index) => {
      const x = column.align === 'right' ? starts[index] + column.width - 2 : starts[index] + 2;
      pdf.text(column.label, x, y + 5.3, { align: column.align });
    });
    y += 9.5;
  };

  const addContinuationPage = () => {
    pdf.addPage();
    y = drawBrandHeader(true);
    drawTableHeader();
  };

  y = drawBrandHeader(false);
  drawPartyCard();
  drawTableHeader();

  const cleanItems = items.filter((item) => item.item_name && Number(item.qty) > 0);
  cleanItems.forEach((item, rowIndex) => {
    const values = [
      String(rowIndex + 1),
      item.brand_name,
      item.item_name,
      item.size,
      String(item.qty || 0),
      item.qty_type,
      money(item.rate),
      `${Number(item.discount || 0).toFixed(2)}%`,
      money(item.amount),
    ];
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.6);
    const cellLines = values.map((value, index) => pdf.splitTextToSize(String(value || '-'), columns[index].width - 3));
    const rowHeight = Math.max(9, Math.max(...cellLines.map((lines) => lines.length)) * 3.4 + 3);
    if (y + rowHeight > pageHeight - 21) addContinuationPage();

    if (rowIndex % 2 === 1) {
      pdf.setFillColor(250, 252, 255);
      pdf.rect(margin, y - 1, contentWidth, rowHeight, 'F');
    }
    pdf.setTextColor(...INK);
    cellLines.forEach((lines, index) => {
      const column = columns[index];
      const x = column.align === 'right' ? starts[index] + column.width - 2 : starts[index] + 2;
      pdf.text(lines, x, y + 3.4, { align: column.align });
    });
    pdf.setDrawColor(...LINE);
    pdf.line(margin, y + rowHeight - 1, pageWidth - margin, y + rowHeight - 1);
    y += rowHeight;
  });

  const ensureSpace = (needed) => {
    if (y + needed <= pageHeight - 21) return;
    pdf.addPage();
    y = drawBrandHeader(true);
  };

  y += 7;
  ensureSpace(82);
  const sectionTop = y;
  const totalsX = 136;
  const totalsWidth = pageWidth - margin - totalsX;
  const remarkWidth = totalsX - margin - 7;

  pdf.setTextColor(...INK);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.2);
  const remarkLines = pdf.splitTextToSize(`Remark: ${slip.remark || '-'}`, remarkWidth - 5);
  pdf.text(remarkLines.slice(0, 5), margin, sectionTop + 7);

  pdf.setTextColor(...INK);
  pdf.setFillColor(...SOFT);
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(totalsX, sectionTop, totalsWidth, 48, 3, 3, 'FD');
  const totalRows = [
    ['Subtotal', money(slip.subtotal)],
    ['Discount', money(slip.discount_total)],
    ['Packaging', money(packagingCharges(slip))],
  ];
  pdf.setFontSize(8.5);
  totalRows.forEach(([label, amount], index) => {
    const rowY = sectionTop + 8 + index * 8;
    pdf.setTextColor(...MUTED);
    pdf.setFont('helvetica', 'normal');
    pdf.text(label, totalsX + 6, rowY);
    pdf.setTextColor(...INK);
    pdf.setFont('helvetica', 'bold');
    pdf.text(amount, pageWidth - margin - 6, rowY, { align: 'right' });
  });
  pdf.setDrawColor(...LINE);
  pdf.line(totalsX + 5, sectionTop + 31, pageWidth - margin - 5, sectionTop + 31);
  pdf.setTextColor(...BLUE);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('GRAND TOTAL', totalsX + 9, sectionTop + 39.8);
  pdf.text(money(slip.grand_total), pageWidth - margin - 9, sectionTop + 39.8, { align: 'right' });

  y = Math.max(sectionTop + 60, pageHeight - 42);
  pdf.setDrawColor(...LINE);
  pdf.line(margin + 6, y + 12, margin + 62, y + 12);
  pdf.line(pageWidth - margin - 62, y + 12, pageWidth - margin - 6, y + 12);
  pdf.setTextColor(...MUTED);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('PREPARED BY', margin + 34, y + 18, { align: 'center' });
  pdf.text('RECEIVER SIGNATURE', pageWidth - margin - 34, y + 18, { align: 'center' });

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setFillColor(...BLUE);
    pdf.rect(1.5, pageHeight - 4.5, pageWidth - 3, 2.5, 'F');
    if (pageCount > 1) {
      pdf.setTextColor(...MUTED);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    }
  }
  return pdf;
}

export async function getSlipPdfFile(slip, items = []) {
  const pdf = await createSlipPdf(slip, items);
  const filename = slipFilename(slip);
  const blob = pdf.output('blob');
  return new File([blob], filename, { type: 'application/pdf' });
}

export async function downloadSlipPdf(slip, items = []) {
  const pdf = await createSlipPdf(slip, items);
  pdf.save(slipFilename(slip));
}
