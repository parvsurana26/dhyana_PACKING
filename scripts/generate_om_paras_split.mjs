import fs from 'node:fs';
import XLSX from 'xlsx';

const workbookPath = 'C:/Users/Lenovo/Downloads/Om Paras PRICE LIST Feb 26.xlsx';
const workbook = XLSX.readFile(workbookPath);

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const numeric = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = clean(value);
  if (!text || /NA|COMING|AVAILABLE/i.test(text)) return null;
  const parsed = Number(text.replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};
const sql = (value) => String(value ?? '').replace(/'/g, "''");

function add(rows, itemName, size, rate, qtyType = 'Pcs') {
  const amount = numeric(rate);
  if (!itemName || !size || amount === null) return;
  rows.push({
    itemName: clean(itemName).toUpperCase(),
    size: clean(size).toUpperCase(),
    rate: amount,
    qtyType,
  });
}

function rowsOf(sheetName) {
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
}

function parseChalni() {
  const rows = rowsOf('Table 1');
  const products = [];

  rows.slice(4, 17).forEach((row) => {
    const itemName = clean(row[2]);
    const size = clean(row[7]);
    const rate = clean(row[8]);
    if (!itemName || !size || !rate) return;
    if (rate.includes('/')) {
      const [regular, box] = rate.split('/');
      add(products, itemName, `${size} REGULAR`, regular);
      add(products, itemName, `${size} BOX`, box);
    } else {
      add(products, itemName, size, rate);
    }
  });

  rows.slice(20, 28).forEach((row) => {
    const size = clean(row[7]);
    add(products, 'FIX CHALNI WHEAT / RICE', size, row[8]);
    add(products, 'FIX CHALNI BAJRI', size, row[9]);
    add(products, 'FIX CHALNI CHANNA', size, row[10]);
  });

  rows.slice(31, 36).forEach((row) => {
    const size = clean(row[2]);
    add(products, 'FOLDING CHALNI 4 JALI', size, row[3]);
    add(products, 'FOLDING CHALNI 3 JALI', size, row[4]);
    add(products, 'FOLDING CHALNI 2 JALI', size, row[5]);
  });

  rows.slice(37, 44).forEach((row) => {
    add(products, row[2], row[7], row[9]);
  });

  return products;
}

function parseStandardRows(sheetName, specs) {
  const rows = rowsOf(sheetName);
  const products = [];
  specs.forEach(({ start, end, nameCol, sizeCol, rateCol, itemName, qtyType = 'Pcs' }) => {
    rows.slice(start - 1, end).forEach((row) => {
      add(products, itemName || row[nameCol], row[sizeCol], row[rateCol], qtyType);
    });
  });
  return products;
}

function parseGalni() {
  return [
    ...parseStandardRows('Table 2', [
      { start: 3, end: 9, nameCol: 1, sizeCol: 2, rateCol: 3 },
      { start: 11, end: 19, nameCol: 1, sizeCol: 2, rateCol: 3 },
      { start: 21, end: 29, nameCol: 1, sizeCol: 2, rateCol: 3 },
      { start: 31, end: 36, nameCol: 1, sizeCol: 2, rateCol: 3 },
      { start: 38, end: 43, nameCol: 1, sizeCol: 2, rateCol: 3 },
      { start: 45, end: 49, nameCol: 1, sizeCol: 2, rateCol: 3 },
    ]),
    ...parseStandardRows('Table 3', [
      { start: 3, end: 8, nameCol: 1, sizeCol: 2, rateCol: 4 },
      { start: 10, end: 13, nameCol: 1, sizeCol: 2, rateCol: 4 },
      { start: 16, end: 20, nameCol: 1, sizeCol: 2, rateCol: 4 },
      { start: 22, end: 27, nameCol: 1, sizeCol: 2, rateCol: 4 },
      { start: 29, end: 34, nameCol: 1, sizeCol: 2, rateCol: 4 },
      { start: 36, end: 41, nameCol: 1, sizeCol: 2, rateCol: 4 },
      { start: 43, end: 46, nameCol: 1, sizeCol: 2, rateCol: 4 },
    ]),
    ...parseStandardRows('Table 4', [
      { start: 11, end: 14, nameCol: 3, sizeCol: 5, rateCol: 6 },
      { start: 17, end: 20, nameCol: 3, sizeCol: 5, rateCol: 6 },
      { start: 24, end: 28, nameCol: 3, sizeCol: 5, rateCol: 6 },
      { start: 31, end: 33, nameCol: 3, sizeCol: 5, rateCol: 6 },
      { start: 38, end: 39, nameCol: 3, sizeCol: 5, rateCol: 6, qtyType: 'Set' },
    ]),
    ...parseTeaAndCoffee(),
    ...parseStandardRows('Table 5', [
      { start: 9, end: 11, nameCol: 3, sizeCol: 5, rateCol: 6 },
      { start: 23, end: 25, nameCol: 3, sizeCol: 5, rateCol: 6 },
      { start: 28, end: 28, nameCol: 0, sizeCol: 4, rateCol: 6 },
      { start: 30, end: 30, nameCol: 0, sizeCol: 4, rateCol: 6 },
    ]),
  ];
}

function parseTeaAndCoffee() {
  return rowsOf('Table 4').slice(3, 8).flatMap((row) => {
    const size = clean(row[4]);
    return [
      { itemName: 'TEA & COFFEE STRAINER SINGLE/J', size, rate: numeric(row[5]), qtyType: 'Doz' },
      { itemName: 'TEA & COFFEE STRAINER DOUBLE/J', size, rate: numeric(row[6]), qtyType: 'Doz' },
    ].filter((product) => product.rate !== null);
  });
}

function unique(products) {
  const map = new Map();
  products.forEach((product) => {
    const key = `${product.itemName}|${product.size}|${product.qtyType}`;
    map.set(key, product);
  });
  return [...map.values()].sort((a, b) => (
    a.itemName.localeCompare(b.itemName) || a.size.localeCompare(b.size, undefined, { numeric: true })
  ));
}

function writeSeed(filename, brandName, products, sourceSheets) {
  const finalProducts = unique(products);
  const values = finalProducts.map((product, index) => (
    `    ('${sql(product.itemName)}', '${sql(product.size)}', ${product.rate.toFixed(2)}, '${sql(product.qtyType)}')${index === finalProducts.length - 1 ? '' : ','}`
  )).join('\n');

  const content = `-- Seed ${brandName} products from Om Paras PRICE LIST Feb 26.xlsx
-- Source sheets: ${sourceSheets}
-- Rows: ${finalProducts.length}

insert into public.brands (name)
values ('${sql(brandName)}')
on conflict (name) do nothing;

with brand_row as (
  select id from public.brands where name = '${sql(brandName)}'
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

  fs.writeFileSync(filename, content);
  console.log(`${filename}: ${finalProducts.length} rows`);
}

writeSeed('seed_products_om_paras_chalni.sql', 'OM PARAS CHALNI', parseChalni(), 'Table 1');
writeSeed('seed_products_om_paras_galni.sql', 'OM PARAS GALNI', parseGalni(), 'Table 2, Table 3, Table 4, Table 5');
