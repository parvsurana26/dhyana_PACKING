import jsPDF from 'jspdf';
import logoImage from '../assets/logo.jpeg';

const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
const PACKAGING_CHARGE_PER_BUNDLE = 350;
const packagingCharges = (slip) => Number(slip.packaging_charges ?? Number(slip.bundle_count || 0) * PACKAGING_CHARGE_PER_BUNDLE);

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
  let y = 15;

  const ensureSpace = (height, nextY = 18) => {
    if (y + height <= pageHeight - 15) return false;
    pdf.addPage();
    y = nextY;
    return true;
  };

  try {
    const logoDataUrl = await loadImageDataUrl(logoImage);
    pdf.addImage(logoDataUrl, 'JPEG', 14, 7, 86, 26);
  } catch {
    pdf.setTextColor(11, 94, 168);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.text('Dhyana', 14, 22);
  }
  pdf.setDrawColor(226, 232, 240);
  pdf.line(12, 35, pageWidth - 12, 35);
  pdf.setTextColor(11, 94, 168);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text('PACKING SLIP', pageWidth - 55, 22);

  y = 45;
  pdf.setTextColor(25, 35, 55);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Packing Slip No: ${slip.slip_no || '-'}`, 15, y);
  pdf.text(`Date: ${slip.slip_date || '-'}`, pageWidth - 65, y);

  y += 10;
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Party Name: ${slip.party_name || '-'}`, 15, y);
  pdf.text(`Transport: ${slip.transport || '-'}`, pageWidth - 85, y);
  y += 7;
  pdf.text(`Phone: ${slip.phone || '-'}`, 15, y);
  pdf.text(`Location: ${slip.location || '-'}`, pageWidth - 85, y);
  y += 7;
  pdf.text(`No. of Bundles: ${slip.bundle_count || 0}`, 15, y);

  const columns = ['Brand', 'Item', 'Size', 'Qty', 'Type', 'Rate', 'Disc %', 'Amount'];
  const widths = [24, 58, 16, 14, 15, 20, 17, 23];
  const starts = widths.reduce((positions, width, index) => {
    positions.push(index === 0 ? 12 : positions[index - 1] + widths[index - 1]);
    return positions;
  }, []);
  const drawTableHeader = () => {
    let x = 12;
    pdf.setFillColor(243, 246, 250);
    pdf.rect(10, y - 5, pageWidth - 20, 9, 'F');
    pdf.setTextColor(25, 35, 55);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    columns.forEach((col, index) => {
      pdf.text(col, x, y);
      x += widths[index];
    });
    y += 8;
    pdf.setFont('helvetica', 'normal');
  };

  y += 13;
  drawTableHeader();

  pdf.setFont('helvetica', 'normal');
  items.forEach((item) => {
    const row = [
      item.brand_name,
      item.item_name,
      item.size,
      item.qty,
      item.qty_type,
      money(item.rate),
      `${Number(item.discount || 0).toFixed(2)}`,
      money(item.amount),
    ];
    const cellLines = row.map((value, index) => (
      pdf.splitTextToSize(String(value || '-'), widths[index] - 2)
    ));
    const rowHeight = Math.max(8, Math.max(...cellLines.map((lines) => lines.length)) * 5 + 3);

    if (y + rowHeight > pageHeight - 32) {
      pdf.addPage();
      pdf.setTextColor(11, 94, 168);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(`Packing Slip ${slip.slip_no || '-'} (continued)`, 12, 14);
      y = 25;
      drawTableHeader();
    }

    cellLines.forEach((lines, index) => {
      pdf.text(lines, starts[index], y);
    });
    pdf.setDrawColor(226, 232, 240);
    pdf.line(10, y + rowHeight - 3, pageWidth - 10, y + rowHeight - 3);
    y += rowHeight;
  });

  y += 5;
  ensureSpace(72);
  const totalsTop = y;
  const totalsLeft = pageWidth - 88;
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(totalsLeft, totalsTop - 6, 76, 38, 2, 2, 'FD');
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Subtotal', totalsLeft + 5, y);
  pdf.text(money(slip.subtotal), pageWidth - 17, y, { align: 'right' });
  y += 7;
  pdf.text('Discount', totalsLeft + 5, y);
  pdf.text(money(slip.discount_total), pageWidth - 17, y, { align: 'right' });
  y += 7;
  pdf.text('Packaging', totalsLeft + 5, y);
  pdf.text(money(packagingCharges(slip)), pageWidth - 17, y, { align: 'right' });
  y += 10;
  pdf.setDrawColor(226, 232, 240);
  pdf.line(totalsLeft + 4, y - 6, pageWidth - 16, y - 6);
  pdf.setTextColor(11, 94, 168);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('GRAND TOTAL', totalsLeft + 5, y);
  pdf.text(money(slip.grand_total), pageWidth - 17, y, { align: 'right' });

  y = totalsTop + 45;
  pdf.setTextColor(25, 35, 55);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const remarkLines = pdf.splitTextToSize(`Remark: ${slip.remark || '-'}`, pageWidth - 30);
  ensureSpace(remarkLines.length * 5 + 27);
  pdf.text(remarkLines, 15, y);
  y += remarkLines.length * 5 + 10;
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(8.5);
  pdf.text('Please verify the quantity and condition of goods at the time of receipt.', 15, y);
  y += 17;
  pdf.setTextColor(25, 35, 55);
  pdf.setFontSize(10);
  pdf.text('Prepared By', 20, y);
  pdf.text('Receiver Signature', pageWidth - 65, y);

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(226, 232, 240);
    pdf.line(12, pageHeight - 13, pageWidth - 12, pageHeight - 13);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('Dhyana Kitchenware', 12, pageHeight - 7);
    pdf.text(`Page ${page} of ${pageCount}`, pageWidth - 12, pageHeight - 7, { align: 'right' });
  }
  return pdf;
}

export async function getSlipPdfFile(slip, items = []) {
  const pdf = await createSlipPdf(slip, items);
  const filename = `${slip.slip_no || 'packing-slip'}.pdf`;
  const blob = pdf.output('blob');
  return new File([blob], filename, { type: 'application/pdf' });
}

export async function downloadSlipPdf(slip, items = []) {
  const pdf = await createSlipPdf(slip, items);
  pdf.save(`${slip.slip_no || 'packing-slip'}.pdf`);
}
