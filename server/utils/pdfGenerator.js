const puppeteer = require('puppeteer');

const generateCertificatePDF = async (pledge) => {
    // Generate avatar URL if no photo
    const participantName = pledge.user_name || 'Participant';
    const photoUrl = pledge.user_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(participantName)}&background=1e3a8a&color=fff&size=128`;

    // Format Date
    const submitDate = new Date(pledge.submitted_at || Date.now()).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    // Formatting helpers
    const practices = pledge.practices || [];
    const behaviours = pledge.behaviours || [];

    // Ensure we parse correctly if practices/behaviours come as JSON strings or arrays
    const parsedPractices = typeof practices === 'string' ? JSON.parse(practices) : practices;
    const parsedBehaviours = typeof behaviours === 'string' ? JSON.parse(behaviours) : behaviours;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            
            * { box-sizing: border-box; }
            body {
                font-family: 'Inter', sans-serif;
                margin: 0;
                padding: 0;
                background-color: #ffffff;
                color: #0f172a;
                width: 210mm;
                height: 297mm;
                position: relative;
            }
            .page-border {
                position: absolute;
                top: 10mm; left: 10mm; right: 10mm; bottom: 10mm;
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                z-index: -1;
            }
            .header-shape {
                position: absolute;
                top: 0; left: 0; right: 0; height: 160px;
                background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                z-index: 0;
                clip-path: polygon(0 0, 100% 0, 100% 100%, 0 85%);
            }
            .content {
                position: relative;
                z-index: 1;
                padding: 40px 50px;
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            .header-content {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 25px;
            }
            .company-logo {
                width: 140px;
                height: 45px;
                background-color: rgba(255,255,255,0.1);
                border: 1px dashed rgba(255,255,255,0.4);
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ffffff;
                font-weight: 700;
                font-size: 14px;
                letter-spacing: 1px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .cert-title-container {
                text-align: right;
                color: white;
            }
            .cert-title {
                font-size: 26px;
                font-weight: 800;
                margin: 0 0 5px 0;
                letter-spacing: -0.5px;
                text-transform: uppercase;
            }
            .cert-subtitle {
                font-size: 14px;
                font-weight: 500;
                opacity: 0.9;
                margin: 0;
            }
            
            .participant-card {
                background: white;
                border-radius: 12px;
                padding: 20px;
                display: flex;
                align-items: center;
                gap: 20px;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                margin-bottom: 25px;
                border: 1px solid #f1f5f9;
            }
            .photo {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                object-fit: cover;
                border: 3px solid #eff6ff;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .participant-info h2 { margin: 0 0 4px 0; font-size: 22px; font-weight: 700; color: #1e293b; }
            .participant-info p { margin: 0; font-size: 13px; color: #64748b; font-weight: 500; }
            .program-badge {
                display: inline-block;
                background: #eff6ff;
                color: #2563eb;
                padding: 4px 10px;
                border-radius: 999px;
                font-size: 11px;
                font-weight: 700;
                margin-top: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .section { margin-bottom: 20px; }
            .section-title {
                font-size: 14px;
                font-weight: 700;
                color: #334155;
                text-transform: uppercase;
                letter-spacing: 1px;
                border-bottom: 2px solid #e2e8f0;
                padding-bottom: 6px;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .section-title span { color: #3b82f6; }

            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            
            .card {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 12px 15px;
            }
            .card h4 { margin: 0 0 5px 0; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
            .card p { margin: 0; font-size: 13px; color: #0f172a; font-weight: 500; line-height: 1.4; }

            .practices-list { margin: 0; padding: 0 0 0 16px; font-size: 12px; color: #334155; line-height: 1.6; }
            .practices-list li::marker { color: #3b82f6; font-weight: bold; }
            
            table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                overflow: hidden;
            }
            th {
                background: #f1f5f9;
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                color: #475569;
                padding: 10px;
                text-align: left;
                letter-spacing: 0.5px;
                border-bottom: 1px solid #e2e8f0;
            }
            td {
                padding: 10px;
                font-size: 12px;
                color: #1e293b;
                border-bottom: 1px solid #e2e8f0;
                font-weight: 500;
                line-height: 1.4;
            }
            tr:last-child td { border-bottom: none; }
            
            .type-badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
            }
            .type-start { background: #dcfce7; color: #166534; }
            .type-reduce { background: #fef3c7; color: #92400e; }
            .type-stop { background: #fee2e2; color: #991b1b; }

            .footer {
                margin-top: auto;
                padding-top: 30px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
            }
            .signature-box { text-align: center; }
            .signature-line {
                width: 200px;
                border-bottom: 1px solid #0f172a;
                margin-bottom: 8px;
            }
            .signature-label { font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }

            .watermark {
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%) rotate(-30deg);
                font-size: 120px;
                font-weight: 900;
                color: rgba(226, 232, 240, 0.4);
                white-space: nowrap;
                z-index: -1;
                user-select: none;
            }
        </style>
    </head>
    <body>
        <div class="header-shape"></div>
        <div class="watermark">DIGITAL PLEDGE</div>
        
        <div class="content">
            <div class="header-content">
                <div class="company-logo">LOGO</div>
                <div class="cert-title-container">
                    <h1 class="cert-title">Commitment Certificate</h1>
                    <p class="cert-subtitle">Digital Culture Pledge</p>
                </div>
            </div>

            <div class="participant-card">
                <img src="${photoUrl}" class="photo" alt="Photo" />
                <div class="participant-info">
                    <h2>${participantName}</h2>
                    <p>${pledge.user_designation || 'Participant'} &bull; ${pledge.user_email || ''}</p>
                    <span class="program-badge">${pledge.program_title || 'Digital Program'}</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title"><span>★</span> Digital North Star</div>
                <div class="grid-2">
                    <div class="card">
                        <h4>Problem Statement</h4>
                        <p>${pledge.problem_statement || '-'}</p>
                    </div>
                    <div class="card">
                        <h4>Vision & Success Metric</h4>
                        <p><strong>Vision:</strong> ${pledge.north_star || '-'}</p>
                        <p style="margin-top:4px;"><strong>Metric:</strong> ${pledge.success_metric || '-'}</p>
                        <p style="margin-top:4px; font-size:11px; color:#64748b;">⏳ ${pledge.timeline || '-'}</p>
                    </div>
                </div>
            </div>

            <div class="grid-2" style="margin-bottom: 20px;">
                <!-- Practices -->
                <div>
                    <div class="section-title"><span>✓</span> Selected Practices</div>
                    <div class="card" style="height: 100%;">
                        <ul class="practices-list">
                            ${parsedPractices && parsedPractices.length > 0
            ? parsedPractices.map(p => `<li>${p.selected_action || 'Action selected'}</li>`).join('')
            : '<li>No practices selected.</li>'}
                        </ul>
                    </div>
                </div>

                <!-- Personal Habit -->
                <div>
                    <div class="section-title"><span>🏃</span> Personal Habit</div>
                    <div class="card" style="height: 100%;">
                        <h4>Habit to build (${pledge.habit_frequency || 'weekly'})</h4>
                        <p style="margin-bottom: 10px;">${pledge.personal_habit || '-'}</p>
                        <h4>Measurement / KPI</h4>
                        <p>${pledge.measure_success || '-'}</p>
                    </div>
                </div>
            </div>

            <div class="section" style="flex: 1;">
                <div class="section-title"><span>🔄</span> Behaviour Commitments</div>
                <table>
                    <thead>
                        <tr>
                            <th width="12%">Action</th>
                            <th width="45%">Behaviour</th>
                            <th width="43%">Why it matters</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${parsedBehaviours && parsedBehaviours.length > 0
            ? parsedBehaviours.map(b => `
                            <tr>
                                <td><span class="type-badge type-${b.type || 'start'}">${b.type || 'START'}</span></td>
                                <td>${b.behaviour_text || '-'}</td>
                                <td style="color:#475569; font-size:11px;">${b.why_it_matters || '-'}</td>
                            </tr>
                            `).join('')
            : '<tr><td colspan="3" style="text-align:center; color:#94a3b8;">No behaviours selected.</td></tr>'
        }
                    </tbody>
                </table>
            </div>

            <div class="footer">
                <div>
                    <div style="font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Date of Submission</div>
                    <div style="font-size:14px; font-weight:700; color:#1e293b;">${submitDate}</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <div class="signature-label">${participantName}</div>
                </div>
            </div>
        </div>
        <div class="page-border"></div>
    </body>
    </html>
    `;

    // Launch puppeteer
    const browser = await puppeteer.launch({
        headless: true, // v22.9.0 handles headless automatically
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'load' });

        // Wait a small moment just in case web fonts need mapping
        await new Promise(r => setTimeout(r, 200));

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 }
        });

        return pdfBuffer;
    } finally {
        await browser.close();
    }
};

const generateReportPDF = async (reportData) => {
    const { summary, practiceCounts, levelDistribution, participants } = reportData;

    const todayDate = new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            * { box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; color: #1e293b; }
            h1 { color: #0f172a; font-weight: 800; font-size: 28px; margin-bottom: 5px; }
            p.subtitle { color: #64748b; font-size: 14px; margin-top: 0; margin-bottom: 30px; }
            
            .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
            .metric-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
            .metric-value { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th { text-align: left; padding: 10px; background: #f1f5f9; color: #475569; font-weight: 700; border-bottom: 2px solid #cbd5e1; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; color: #334155; }
            .text-center { text-align: center; }
        </style>
    </head>
    <body>
        <h1>Digital Culture Pledge - Executive Report</h1>
        <p class="subtitle">Generated on ${todayDate}</p>

        <div class="grid-4">
            <div class="metric-card">
                <div class="metric-label">Total Participants</div>
                <p class="metric-value">${summary.totalParticipants}</p>
            </div>
            <div class="metric-card">
                <div class="metric-label">Avg Execution</div>
                <p class="metric-value">${summary.avgExecutionPct}%</p>
            </div>
            <div class="metric-card">
                <div class="metric-label">100% Adherence</div>
                <p class="metric-value">${summary.adherencePct}%</p>
            </div>
            <div class="metric-card">
                <div class="metric-label">Avg Improvement</div>
                <p class="metric-value">${summary.avgImprovementScore >= 0 ? '+' : ''}${summary.avgImprovementScore} pts</p>
            </div>
        </div>
        
        <div class="grid-4" style="margin-bottom: 40px;">
            <div class="metric-card" style="grid-column: span 2;">
                <div class="metric-label">Most Chosen Practice</div>
                <p class="metric-value" style="font-size: 16px;">${summary.mostChosenPractice}</p>
            </div>
            <div class="metric-card" style="grid-column: span 2;">
                <div class="metric-label">Least Chosen Practice</div>
                <p class="metric-value" style="font-size: 16px;">${summary.leastChosenPractice}</p>
            </div>
        </div>

        <h2 style="font-size: 18px; color: #0f172a; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Participant Summary</h2>
        <table>
            <thead>
                <tr>
                    <th>Participant</th>
                    <th>Program</th>
                    <th class="text-center">Weekly</th>
                    <th class="text-center">Monthly</th>
                    <th class="text-center">Completion</th>
                    <th class="text-center">Surveys</th>
                </tr>
            </thead>
            <tbody>
                ${participants.map(p => `
                <tr>
                    <td><strong>${p.name}</strong><br><span style="color:#64748b; font-size:10px;">${p.email}</span></td>
                    <td>${p.program_title || '-'}</td>
                    <td class="text-center">${p.weekly_count}</td>
                    <td class="text-center">${p.monthly_count}</td>
                    <td class="text-center"><strong>${p.completion_pct}%</strong></td>
                    <td class="text-center">${p.surveys_completed}/${p.surveys_total}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div style="margin-top: 50px; text-align: center; color: #94a3b8; font-size: 10px;">
            © ${new Date().getFullYear()} Digital Culture Pledge System.
        </div>
    </body>
    </html>
    `;

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'load' });
        await new Promise(r => setTimeout(r, 200));
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
        });
        return pdfBuffer;
    } finally {
        await browser.close();
    }
};

module.exports = { generateCertificatePDF, generateReportPDF };
