export function printProductLabel(product: {
  name: string;
  brand?: string | null;
  price: number;
  unit: string;
  barcode?: string | null;
  categoryName?: string;
}): void {
  const win = window.open("", "_blank", "width=400,height=300");
  if (!win) return;

  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Product Label</title>
      <style>
        @page { size: 80mm 50mm; margin: 0; }
        body { font-family: Arial, sans-serif; margin: 0; padding: 8px; width: 80mm; }
        .label { border: 1px solid #333; padding: 8px; border-radius: 4px; }
        .store { font-size: 8px; color: #666; text-align: center; margin-bottom: 4px; }
        .name { font-size: 12px; font-weight: bold; line-height: 1.2; }
        .brand { font-size: 9px; color: #555; margin-top: 1px; }
        .price { font-size: 18px; font-weight: bold; color: #16a34a; margin: 6px 0 4px; }
        .unit { font-size: 9px; color: #666; }
        .barcode { font-family: monospace; font-size: 10px; letter-spacing: 2px; text-align: center; margin-top: 6px; padding-top: 4px; border-top: 1px dashed #ccc; }
        .category { font-size: 8px; color: #888; }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="store">Mahadev Kirana & General Store</div>
        <div class="name">${product.name}</div>
        ${product.brand ? `<div class="brand">${product.brand}</div>` : ""}
        ${product.categoryName ? `<div class="category">${product.categoryName}</div>` : ""}
        <div class="price">₹${product.price} <span class="unit">/ ${product.unit}</span></div>
        ${product.barcode ? `<div class="barcode">||||| ${product.barcode} |||||</div>` : ""}
      </div>
      <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
    </body>
    </html>
  `);
  win.document.close();
}
