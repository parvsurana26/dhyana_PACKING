import fs from 'node:fs';
import XLSX from 'xlsx';

const workbookPath = 'C:/Users/DELL/Downloads/Komal_Price_List_01-06-2026.xlsx';
const workbook = XLSX.readFile(workbookPath);

const clean = (value) => String(value ?? '')
  .replace(/[–—]/g, '-')
  .replace(/\s+/g, ' ')
  .trim();
const sql = (value) => String(value ?? '').replace(/'/g, "''");
const numeric = (value) => {
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : null;
};
const normalizeQtyType = (unit) => /^Box\.?$/i.test(clean(unit)) ? 'Box' : 'Pcs';

function extractSize(itemText) {
  let item = clean(itemText);
  let size = '';
  const rules = [
    { pattern: /\b(\d+(?:\.\d+)?\s*(?:ml|cm|mm|oz|inch))\.?\)?\s*$/i, makeSize: (match) => match[1] },
    { pattern: /\b(\d+\s*Pcs?\.?\s*Set)\b/i, makeSize: (match) => match[1] },
    { pattern: /\bNo\.?\s*([A-Za-z0-9]+)\)?\s*$/i, makeSize: (match) => `No. ${match[1]}` },
    { pattern: /(\d+\s*x\s*\d+)/i, makeSize: (match) => match[1] },
    { pattern: /\b(Three|Four|Five|Six|3|4|5|6)\s+Plates?\b/i, makeSize: (match) => `${match[1]} Plates` },
    { pattern: /^\s*(Small|Medium|Big|Jumbo|Mini)\b/i, makeSize: (match) => match[1] },
  ];

  for (const rule of rules) {
    const match = item.match(rule.pattern);
    if (match) {
      size = rule.makeSize(match);
      item = clean(item.replace(match[0], ''));
      break;
    }
  }

  item = item
    .replace(/\s*-\s*$/, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    itemName: (item || clean(itemText)).toUpperCase(),
    size: clean(size).toUpperCase() || 'STANDARD',
  };
}

function parseProducts() {
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Price List'], { defval: '' });
  const products = rows.flatMap((row) => {
    const itemText = clean(row.Product);
    const rate = numeric(row.Price);
    if (!itemText || rate === null) return [];
    const { itemName, size } = extractSize(itemText);
    return [{ itemName, size, rate, qtyType: normalizeQtyType(row.Unit) }];
  });

  const unique = new Map();
  products.forEach((product) => {
    unique.set(`${product.itemName}|${product.size}|${product.qtyType}`, product);
  });
  return [...unique.values()].sort((a, b) => (
    a.itemName.localeCompare(b.itemName) || a.size.localeCompare(b.size, undefined, { numeric: true })
  ));
}

const products = parseProducts();
const values = products.map((product, index) => (
  `    ('${sql(product.itemName)}', '${sql(product.size)}', ${product.rate.toFixed(2)}, '${sql(product.qtyType)}')${index === products.length - 1 ? '' : ','}`
)).join('\n');

const content = `-- Seed KOMAL products from Komal_Price_List_01-06-2026.xlsx
-- Rows: ${products.length}
-- Product name, size, rate and quantity type come from the workbook.
-- The workbook Packing column is intentionally ignored.

insert into public.brands (name)
values ('KOMAL')
on conflict (name) do nothing;

update public.products
set is_active = false
where brand_id = (select id from public.brands where name = 'KOMAL');

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
    and regexp_replace(upper(trim(p.size)), '\\s+', '', 'g') = regexp_replace(upper(trim(seed.size)), '\\s+', '', 'g')
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
    and regexp_replace(upper(trim(p.size)), '\\s+', '', 'g') = regexp_replace(upper(trim(seed.size)), '\\s+', '', 'g')
    and upper(trim(p.qty_type)) = upper(trim(seed.qty_type))
);

select p.item_name, p.size, p.rate, p.qty_type
from public.products p
join public.brands b on b.id = p.brand_id
where upper(trim(b.name)) = 'KOMAL'
order by p.item_name, p.size;
`;

fs.writeFileSync('seed_products_komal.sql', content);
console.log(`seed_products_komal.sql: ${products.length} rows`);
