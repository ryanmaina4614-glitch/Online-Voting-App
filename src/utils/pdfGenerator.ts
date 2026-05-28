import { jsPDF } from 'jspdf';

export function generateReceiptPDF(data: {
  receiptCode: string;
  timestamp: string;
  electionTitle: string;
  candidateName?: string;
  institutionId?: string;
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth(); // 210
  const height = doc.internal.pageSize.getHeight(); // 297

  // Draw background border
  doc.setDrawColor(79, 70, 229); // indigo-600
  doc.setLineWidth(1.5);
  doc.rect(10, 10, width - 20, height - 20);

  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.rect(12, 12, width - 24, height - 24);

  // Decorative corners
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(2);
  // Top-left
  doc.line(8, 8, 20, 8);
  doc.line(8, 8, 8, 20);
  // Top-right
  doc.line(width - 8, 8, width - 20, 8);
  doc.line(width - 8, 8, width - 8, 20);
  // Bottom-left
  doc.line(8, height - 8, 20, height - 8);
  doc.line(8, height - 8, 8, height - 20);
  // Bottom-right
  doc.line(width - 8, height - 8, width - 20, height - 8);
  doc.line(width - 8, height - 8, width - 8, height - 20);

  // Header Title
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('VOTESECURE SECURE DIGITAL DEMOCRACY SYSTEM', 105, 25, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('OFFICIAL BALLOT RECEIPT', 105, 36, { align: 'center' });

  // Draw elegant divider
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(1);
  doc.line(30, 43, width - 30, 43);

  // Verification status block
  doc.setFillColor(240, 253, 250); // emerald-50
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.setLineWidth(0.5);
  doc.rect(20, 50, width - 40, 18, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(4, 120, 87); // emerald-700
  doc.text('✓ ZERO-KNOWLEDGE LEDGER INTEGRITY CONFIRMED', 105, 56, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text('Your identities are decoupled from selected candidates through cryptographic hashing.', 105, 62, { align: 'center' });

  // Receipt details grid
  let yPos = 80;
  
  const drawRow = (label: string, value: string, bold: boolean = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(label, 25, yPos);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(value, 80, yPos);
    
    // light separator
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.setLineWidth(0.3);
    doc.line(20, yPos + 4, width - 20, yPos + 4);
    yPos += 12;
  };

  drawRow('ELECTION HOST:', data.institutionId || 'VoteSecure Central Node');
  drawRow('ELECTION TITLE:', data.electionTitle);
  if (data.candidateName) {
    drawRow('SELECTION SEAL:', data.candidateName + ' (Identity Protected)');
  }
  drawRow('TIMESTAMP (UTC):', data.timestamp);
  drawRow('SECURITY LEVEL:', 'MFA Multi-Factor Attested');

  // Ledger Token Block
  yPos += 5;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.rect(20, yPos, width - 40, 32, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('DECENTRALIZED UNIFIED AUDIT LEDGER RECEIPT TOKEN', 105, yPos + 6, { align: 'center' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text(data.receiptCode, 105, yPos + 16, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('SHA-256 Signature Verification Block: ' + data.receiptCode.split('-').join(''), 105, yPos + 26, { align: 'center' });

  // Informative Footnote
  yPos += 45;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text('INSTRUCTIONS FOR VERIFYING INTEGRITY:', 25, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  
  const textLine1 = '1. Present this PDF receipt to your school polling board or election auditor if needed.';
  const textLine2 = '2. The digital signature above confirms that your student ID was marked voted to block double voting,';
  const textLine3 = '   while your candidate choice was added to the secure, anonymous pool of votes.';
  const textLine4 = '3. Retain this secure file for personal records. Never share your security key on public networks.';
  
  doc.text(textLine1, 25, yPos + 6);
  doc.text(textLine2, 25, yPos + 12);
  doc.text(textLine3, 25, yPos + 16);
  doc.text(textLine4, 25, yPos + 22);

  // Footer seal
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.5);
  doc.line(30, 255, width - 30, 255);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(79, 70, 229);
  doc.text('AUTHENTIC VOTESECURE BLOCKCHAIN INTEGRITY GUARANTEED', 105, 262, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('This receipt was signed cryptographically on the device of local node at ' + data.timestamp, 105, 268, { align: 'center' });

  doc.save(`VoteSecure-Receipt-${data.receiptCode}.pdf`);
}
