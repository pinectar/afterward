"use client";
export function PrintButton() {
  return <button className="btn-secondary ml-auto text-sm no-print" onClick={() => window.print()}>Print</button>;
}
