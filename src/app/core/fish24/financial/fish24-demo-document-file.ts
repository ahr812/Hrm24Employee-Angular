export function createFish24DemoPdf(label: string, paddingBytes = 0): Blob {
  const stream = `BT /F1 10 Tf 24 100 Td (${pdfText(label)}) Tj ET\n% ${'x'.repeat(Math.max(0, paddingBytes))}`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 140] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  ];
  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let index = 0; index < objects.length; index++) {
    offsets.push(new TextEncoder().encode(body).length);
    body += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = new TextEncoder().encode(body).length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.map(offset => `${offset.toString().padStart(10, '0')} 00000 n \n`).join('');
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new Blob([body], { type: 'application/pdf' });
}

function pdfText(value: string): string {
  return value.replace(/[^\x20-\x7e]/g, '?').replace(/[()\\]/g, character => `\\${character}`);
}
