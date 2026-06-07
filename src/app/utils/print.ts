import { Order, AppSettings } from '../data/types'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function printOrderReceipt(order: Order, settings: AppSettings) {
  const win = window.open('', '_blank', 'width=400,height=600')
  if (!win) return
  const content = `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Struk Pesanan ${order.orderNumber}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; font-size: 12px; padding: 16px; max-width: 300px; margin: 0 auto; }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .divider { border-top: 1px dashed #000; margin: 8px 0; }
      .row { display: flex; justify-content: space-between; margin: 4px 0; }
      .total { font-size: 14px; font-weight: bold; }
      @media print { body { padding: 0; } }
    </style></head><body>
    <div class="center bold" style="font-size:14px">${settings.restaurantName}</div>
    <div class="center">${settings.address}</div>
    <div class="center">Tel: ${settings.phone}</div>
    <div class="divider"></div>
    <div class="row"><span>No. Pesanan:</span><span class="bold">${order.orderNumber}</span></div>
    <div class="row"><span>Pelanggan:</span><span>${order.customerName}</span></div>
    <div class="row"><span>Telepon:</span><span>${order.customerPhone}</span></div>
    <div class="row"><span>Waktu:</span><span>${formatDate(order.createdAt)}</span></div>
    <div class="divider"></div>
    ${order.items.map(i => `
      <div class="row"><span>${i.menuName} x${i.quantity}</span><span>${formatCurrency(i.subtotal)}</span></div>
    `).join('')}
    <div class="divider"></div>
    <div class="row"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
    ${order.miscCosts.map(mc => `
      <div class="row"><span>${mc.name}${mc.type === 'percentage' ? ` (${mc.value}%)` : ''}</span>
      <span>${formatCurrency(mc.type === 'percentage' ? order.subtotal * mc.value / 100 : mc.value)}</span></div>
    `).join('')}
    ${order.discount > 0 ? `<div class="row"><span>Diskon (${order.promoCode})</span><span>-${formatCurrency(order.discount)}</span></div>` : ''}
    <div class="divider"></div>
    <div class="row total"><span>TOTAL</span><span>${formatCurrency(order.total)}</span></div>
    <div class="divider"></div>
    <div class="center">Pembayaran: QRIS ✓</div>
    <div class="center" style="margin-top:8px">Terima kasih sudah makan di sini!</div>
    <div class="center">Silakan ambil pesanan dengan nomor:</div>
    <div class="center bold" style="font-size:24px;margin:8px 0">${order.orderNumber}</div>
    </body></html>`
  win.document.write(content)
  win.document.close()
  setTimeout(() => win.print(), 300)
}

export function printKitchenTicket(order: Order) {
  const win = window.open('', '_blank', 'width=400,height=400')
  if (!win) return
  const content = `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Tiket Dapur ${order.orderNumber}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; font-size: 14px; padding: 16px; max-width: 300px; }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .divider { border-top: 2px solid #000; margin: 8px 0; }
      .item { font-size: 16px; margin: 6px 0; }
      @media print { body { padding: 0; } }
    </style></head><body>
    <div class="center bold" style="font-size:18px">DAPUR / KITCHEN</div>
    <div class="divider"></div>
    <div class="center bold" style="font-size:28px">${order.orderNumber}</div>
    <div class="center">${formatDate(order.createdAt)}</div>
    <div class="divider"></div>
    ${order.items.map(i => `<div class="item bold">${i.quantity}x ${i.menuName}</div>`).join('')}
    <div class="divider"></div>
    <div class="center">Untuk: ${order.customerName}</div>
    </body></html>`
  win.document.write(content)
  win.document.close()
  setTimeout(() => win.print(), 300)
}

export function exportOrdersCSV(orders: Order[]) {
  const headers = ['No. Pesanan', 'Nama', 'Telepon', 'Item', 'Subtotal', 'Biaya Lain', 'Diskon', 'Total', 'Status', 'Tanggal']
  const rows = orders.map(o => [
    o.orderNumber, o.customerName, o.customerPhone,
    o.items.map(i => `${i.menuName}(${i.quantity})`).join('; '),
    o.subtotal, o.miscTotal, o.discount, o.total, o.status, formatDate(o.createdAt)
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'laporan-pesanan.csv'; a.click()
  URL.revokeObjectURL(url)
}

export function printFinancialReport(orders: Order[], settings: AppSettings) {
  const completed = orders.filter(o => o.status === 'completed' || o.status === 'ready')
  const totalRevenue = completed.reduce((s, o) => s + o.total, 0)
  const totalMisc = completed.reduce((s, o) => s + o.miscTotal, 0)
  const totalDiscount = completed.reduce((s, o) => s + o.discount, 0)
  const totalFoodCost = completed.reduce((s, o) => s + o.subtotal, 0)

  const win = window.open('', '_blank', 'width=800,height=600')
  if (!win) return
  const content = `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Laporan Keuangan - ${settings.restaurantName}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 32px; max-width: 800px; margin: 0 auto; font-size: 13px; }
      h1 { font-size: 20px; margin-bottom: 4px; } h2 { font-size: 15px; margin: 20px 0 8px; }
      .info { color: #666; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      th { background: #f5f5f5; text-align: left; padding: 8px; border: 1px solid #ddd; }
      td { padding: 8px; border: 1px solid #ddd; }
      .summary td:first-child { font-weight: bold; }
      .total-row { background: #fff3e0; font-weight: bold; }
      @media print { body { padding: 16px; } }
    </style></head><body>
    <h1>${settings.restaurantName}</h1>
    <div class="info">${settings.address} | ${settings.phone} | Dicetak: ${new Date().toLocaleString('id-ID')}</div>
    <h2>Ringkasan Keuangan</h2>
    <table class="summary">
      <tr><td>Total Pesanan Selesai</td><td>${completed.length} pesanan</td></tr>
      <tr><td>Total Pendapatan Kotor</td><td>${formatCurrency(totalRevenue)}</td></tr>
      <tr><td>Total Biaya Makanan</td><td>${formatCurrency(totalFoodCost)}</td></tr>
      <tr><td>Total Biaya Lain-lain</td><td>${formatCurrency(totalMisc)}</td></tr>
      <tr><td>Total Diskon</td><td>-${formatCurrency(totalDiscount)}</td></tr>
      <tr class="total-row"><td>KEUNTUNGAN BERSIH (Est.)</td><td>${formatCurrency(totalRevenue - totalFoodCost * 0.4)}</td></tr>
    </table>
    <h2>Detail Pesanan</h2>
    <table>
      <thead><tr><th>No.</th><th>Pelanggan</th><th>Item</th><th>Total</th><th>Status</th><th>Tanggal</th></tr></thead>
      <tbody>
        ${orders.map(o => `<tr>
          <td>${o.orderNumber}</td><td>${o.customerName}</td>
          <td>${o.items.map(i => `${i.menuName} x${i.quantity}`).join(', ')}</td>
          <td>${formatCurrency(o.total)}</td><td>${o.status}</td><td>${formatDate(o.createdAt)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    </body></html>`
  win.document.write(content)
  win.document.close()
  setTimeout(() => win.print(), 300)
}
