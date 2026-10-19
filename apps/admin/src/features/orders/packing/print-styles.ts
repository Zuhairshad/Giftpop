/**
 * Print rules for the packing sheet. Hides the admin chrome, strips the inset margins, forces
 * black on white and keeps the checklist and label whole. One A4 page for a 10 item bouquet.
 */
export const PACKING_PRINT_CSS = `
@page { size: A4; margin: 12mm; }
@media print {
  [data-slot="sidebar"],
  [data-slot="sidebar-gap"],
  [data-slot="sidebar-container"],
  [data-sidebar],
  [data-slot="sidebar-inset"] > header,
  [data-sonner-toaster],
  .packing-no-print { display: none !important; }
  html, body, [data-slot="sidebar-wrapper"], [data-slot="sidebar-inset"] {
    background: #fff !important;
    color: #000 !important;
    margin: 0 !important;
    padding: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    min-height: 0 !important;
  }
  [data-slot="sidebar-wrapper"] { display: block !important; }
  .packing-sheet {
    padding: 0 !important;
    max-width: none !important;
    color: #000 !important;
    background: #fff !important;
    gap: 3mm !important;
  }
  .packing-sheet * { color: #000 !important; border-color: #000 !important; }
  .packing-sheet .packing-grid { grid-template-columns: minmax(0, 5fr) minmax(0, 6fr) !important; }
  .packing-sheet .packing-scene { width: 68mm !important; max-width: 68mm !important; }
  .packing-sheet .packing-checklist li { padding-top: 0.5mm !important; padding-bottom: 0.5mm !important; }
  .packing-sheet address { font-size: 15pt !important; }
  .packing-sheet .packing-h1 { font-size: 22pt !important; }
  .packing-sheet .packing-qty { font-size: 20pt !important; width: 12mm !important; }
  .packing-sheet .packing-name { font-size: 13pt !important; }
  .packing-sheet .packing-custom { font-size: 15pt !important; }
  .packing-sheet .packing-personal { padding: 2mm !important; }
  .packing-sheet .packing-personal p { font-size: 13pt !important; line-height: 1.25 !important; }
  .packing-keep { break-inside: avoid; page-break-inside: avoid; }
  .packing-swatch, .packing-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;
