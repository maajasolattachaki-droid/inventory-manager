export function arrayToCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.map(escape).join(","),
    ...rows.map(row => row.map(escape).join(",")),
  ];
  return lines.join("\n");
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportProductsCsv(products: any[]): void {
  const headers = ["ID", "Name", "Brand", "Category", "Quantity", "Unit", "Price (₹)", "Cost Price (₹)", "Margin (%)", "Status", "Barcode", "Expiry Date", "Last Updated"];
  const rows = products.map(p => [
    p.id, p.name, p.brand, p.categoryName,
    p.quantity, p.unit, p.price, p.costPrice ?? "",
    p.margin != null ? `${p.margin}%` : "",
    p.status, p.barcode, p.expiryDate,
    p.updatedAt?.slice(0, 10),
  ]);
  const filename = `inventory-products-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsv(arrayToCsv(headers, rows), filename);
}

export function exportCustomersCsv(customers: any[]): void {
  const headers = ["ID", "Name", "Phone", "Email", "Address", "Total Orders", "Joined"];
  const rows = customers.map(c => [c.id, c.name, c.phone, c.email, c.address, c.totalOrders, c.createdAt?.slice(0, 10)]);
  downloadCsv(arrayToCsv(headers, rows), `customers-${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportMovementsCsv(movements: any[]): void {
  const headers = ["Date", "Product", "Type", "Quantity", "Reason"];
  const rows = movements.map(m => [m.createdAt?.slice(0, 10), m.productName, m.type, m.quantity, m.reason]);
  downloadCsv(arrayToCsv(headers, rows), `stock-movements-${new Date().toISOString().slice(0, 10)}.csv`);
}
