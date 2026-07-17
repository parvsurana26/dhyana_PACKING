import fs from 'node:fs';
import XLSX from 'xlsx';

const workbookPath = 'C:/Users/Lenovo/Downloads/Price list 01-04-2026 with effect.xlsx';
const workbook = XLSX.readFile(workbookPath);

const clean = (value) => String(value ?? '')
  .replace(/[–—]/g, '-')
  .replace(/\s+/g, ' ')
  .trim();

const sql = (value) => String(value ?? '').replace(/'/g, "''");

const isSerial = (value) => Number.isInteger(Number(value)) && Number(value) > 0 && Number(value) < 1000;
const isQtyType = (value) => /^(Pc\.?|Pcs\.?|Box\.?|Set\.?)$/i.test(clean(value).replace(/,/g, ''));
const isPackaging = (value) => /Printed|Plain|Bag|Box|Tag/i.test(clean(value)) && !/Pcs?\.? ?Set/i.test(clean(value));
const isPrice = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;

function normalizeQtyType(row) {
  const joined = row.map(clean).join(' ');
  if (/\bBox\.?\b/i.test(joined) && /Pcs?\.? ?Set/i.test(joined)) return 'Box';
  return 'Pcs';
}

function findPrice(row, serialIndex) {
  const numbers = row
    .map((value, index) => ({ value, index }))
    .filter(({ value, index }) => index !== serialIndex && isPrice(value));
  if (!numbers.length) return null;
  return numbers[numbers.length - 1];
}

function findItemText(row, serialIndex, priceIndex) {
  const candidates = row
    .map((value, index) => ({ text: clean(value), index }))
    .filter(({ text, index }) => {
      if (!text || index === serialIndex || index === priceIndex) return false;
      if (isQtyType(text) || isPackaging(text)) return false;
      if (/^\d+$/.test(text)) return false;
      return true;
    });
  if (!candidates.length) return '';
  return candidates.sort((a, b) => b.text.length - a.text.length)[0].text;
}

function extractSize(itemText, row) {
  let item = clean(itemText);
  let size = '';

  const explicitSet = row.map(clean).find((value) => /Pcs?\.? ?Set/i.test(value));
  if (explicitSet) size = explicitSet.replace(/\s+/g, ' ');

  const rules = [
    {
      pattern: /\b(\d+(?:\.\d+)?\s*(?:ml|cm|mm|oz|inch))\.?\)?\s*$/i,
      makeSize: (match) => match[1],
    },
    {
      pattern: /\bNo\.?\s*([A-Za-z0-9]+)\)?\s*$/i,
      makeSize: (match) => `No. ${match[1]}`,
    },
    {
      pattern: /(\d+\s*x\s*\d+)/i,
      makeSize: (match) => match[1],
    },
    {
      pattern: /\b(Three|Four|Five|Six|3|4|5|6)\s+Plates?\b/i,
      makeSize: (match) => `${match[1]} Plates`,
    },
    {
      pattern: /\b(Small|Medium|Big|Jumbo|Mini)\b/i,
      makeSize: (match) => match[1],
    },
  ];

  for (const rule of rules) {
    const match = item.match(rule.pattern);
    if (match && !size) {
      size = rule.makeSize(match);
      item = clean(item.replace(match[0], ''));
      break;
    }
  }

  if (explicitSet) item = clean(item.replace(explicitSet, ''));
  item = item
    .replace(/\s*-\s*$/, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    itemName: item || clean(itemText),
    size: clean(size).toUpperCase() || 'STANDARD',
  };
}

function parseProducts() {
  const products = [];

  workbook.SheetNames.forEach((sheetName) => {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
    rows.forEach((row) => {
      const serialIndex = row.findIndex(isSerial);
      if (serialIndex === -1) return;

      const price = findPrice(row, serialIndex);
      if (!price) return;

      const itemText = findItemText(row, serialIndex, price.index);
      if (!itemText) return;

      const { itemName, size } = extractSize(itemText, row);
      products.push({
        itemName: clean(itemName).toUpperCase(),
        size,
        rate: price.value,
        qtyType: normalizeQtyType(row),
      });
    });
  });

  const map = new Map();
  products.forEach((product) => {
    const key = `${product.itemName}|${product.size}|${product.qtyType}`;
    map.set(key, product);
  });

  return [...map.values()].sort((a, b) => (
    a.itemName.localeCompare(b.itemName) || a.size.localeCompare(b.size, undefined, { numeric: true })
  ));
}

const products = parseProducts();
const values = products.map((product, index) => (
  `    ('${sql(product.itemName)}', '${sql(product.size)}', ${product.rate.toFixed(2)}, '${sql(product.qtyType)}')${index === products.length - 1 ? '' : ','}`
)).join('\n');

const content = `-- Seed KOMAL products from Price list 01-04-2026 with effect.xlsx
-- Rows: ${products.length}
-- Zero-rate rows are skipped.

insert into public.brands (name)
values ('KOMAL')
on conflict (name) do nothing;

with brand_row as (
  select id from public.brands where name = 'KOMAL'
), seed(item_name, size, rate, qty_type) as (
  values
${values}
), updated as (
  update public.products p
  set rate = seed.rate,
      is_active = true
  from seed, brand_row
  where p.brand_id = brand_row.id
    and upper(trim(p.item_name)) = upper(trim(seed.item_name))
    and upper(trim(p.size)) = upper(trim(seed.size))
    and upper(trim(p.qty_type)) = upper(trim(seed.qty_type))
  returning p.id
)
insert into public.products (brand_id, item_name, size, rate, qty_type, is_active)
select brand_row.id, seed.item_name, seed.size, seed.rate, seed.qty_type, true
from seed
cross join brand_row
where not exists (
  select 1
  from public.products p
  where p.brand_id = brand_row.id
    and upper(trim(p.item_name)) = upper(trim(seed.item_name))
    and upper(trim(p.size)) = upper(trim(seed.size))
    and upper(trim(p.qty_type)) = upper(trim(seed.qty_type))
);
`;

fs.writeFileSync('seed_products_komal.sql', content);
console.log(`seed_products_komal.sql: ${products.length} rows`);
