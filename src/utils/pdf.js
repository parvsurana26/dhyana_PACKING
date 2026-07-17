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
  let y = 15;

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

    if (y + rowHeight > 265) {
      pdf.addPage();
      y = 18;
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
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Subtotal: ${money(slip.subtotal)}`, pageWidth - 75, y);
  y += 7;
  pdf.text(`Discount: ${money(slip.discount_total)}`, pageWidth - 75, y);
  y += 7;
  pdf.text(`Packaging: ${money(packagingCharges(slip))}`, pageWidth - 75, y);
  y += 8;
  pdf.setTextColor(11, 94, 168);
  pdf.setFontSize(13);
  pdf.text(`Grand Total: ${money(slip.grand_total)}`, pageWidth - 75, y);

  y += 15;
  pdf.setTextColor(25, 35, 55);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Remark: ${slip.remark || '-'}`, 15, y);
  y += 22;
  pdf.text('Prepared By', 20, y);
  pdf.text('Receiver Signature', pageWidth - 65, y);
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
