const puppeteer = require('puppeteer');

const generatePledgePDF = async (pledge, user) => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    const signedDate = new Date(pledge.signed_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    const pledgeItems = pledge.items || [];

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          background: #ffffff;
          color: #1e293b;
          padding: 48px;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 28px;
          margin-bottom: 36px;
        }
        .badge {
          display: inline-block;
          background: linear-gradient(135deg, #1e3a5f, #2563eb);
          color: white;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 6px 20px;
          border-radius: 20px;
          margin-bottom: 16px;
        }
        h1 {
          font-size: 32px;
          font-weight: 800;
          color: #1e3a5f;
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }
        .subtitle { color: #64748b; font-size: 14px; }
        .cert-body { background: #f8fafc; border-radius: 12px; padding: 32px; margin-bottom: 28px; border-left: 5px solid #2563eb; }
        .cert-body p { font-size: 15px; color: #374151; line-height: 1.8; }
        .cert-body strong { color: #1e3a5f; font-size: 18px; }
        .pledge-section h3 { font-size: 13px; font-weight: 700; color: #6b7280; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 16px; }
        .pledge-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
          padding: 12px 16px;
          background: #fff;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .checkmark { color: #16a34a; font-size: 18px; flex-shrink: 0; }
        .pledge-item p { font-size: 14px; color: #374151; line-height: 1.6; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 28px 0; }
        .meta-item { background: #f1f5f9; padding: 16px; border-radius: 8px; }
        .meta-label { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
        .meta-value { font-size: 15px; font-weight: 600; color: #1e293b; }
        .status-badge {
          display: inline-block;
          padding: 4px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          background: ${pledge.status === 'approved' ? '#dcfce7' : pledge.status === 'rejected' ? '#fee2e2' : '#fef9c3'};
          color: ${pledge.status === 'approved' ? '#16a34a' : pledge.status === 'rejected' ? '#dc2626' : '#854d0e'};
        }
        .footer {
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .footer .signature { text-align: center; }
        .signature-line { border-top: 1px solid #94a3b8; padding-top: 8px; margin-top: 40px; font-size: 12px; color: #64748b; }
        .watermark { font-size: 11px; color: #94a3b8; text-align: right; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="badge">Certificate of Pledge</div>
        <h1>Digital Culture Pledge</h1>
        <p class="subtitle">Official Record of Cultural Commitment</p>
      </div>

      <div class="cert-body">
        <p>This is to certify that <strong>${user.name}</strong> from the <strong>${user.department || 'General'}</strong> department has formally acknowledged and committed to upholding the organizational culture pledge on <strong>${signedDate}</strong>.</p>
      </div>

      ${pledgeItems.length > 0 ? `
      <div class="pledge-section">
        <h3>Pledge Commitments</h3>
        ${pledgeItems.map(item => `
          <div class="pledge-item">
            <span class="checkmark">✓</span>
            <p>${item.item_text}</p>
          </div>
        `).join('')}
      </div>
      ` : `
      <div class="pledge-section">
        <h3>Pledge Statement</h3>
        <div class="pledge-item">
          <span class="checkmark">✓</span>
          <p>${pledge.pledge_text}</p>
        </div>
      </div>
      `}

      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Employee</div>
          <div class="meta-value">${user.name}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Email</div>
          <div class="meta-value">${user.email}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Department</div>
          <div class="meta-value">${user.department || 'N/A'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Status</div>
          <div class="meta-value"><span class="status-badge">${pledge.status.toUpperCase()}</span></div>
        </div>
      </div>

      <div class="footer">
        <div class="signature">
          <div class="signature-line">Employee Signature (Digital)<br><strong>${user.name}</strong></div>
        </div>
        <div class="watermark">
          <p>Pledge ID: #${pledge.id}</p>
          <p>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p>Digital Culture Pledge System</p>
        </div>
      </div>
    </body>
    </html>
  `;

    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
    });

    await browser.close();
    return pdfBuffer;
};

module.exports = { generatePledgePDF };
