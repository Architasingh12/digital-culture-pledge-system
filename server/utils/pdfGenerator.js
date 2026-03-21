// const puppeteer = require('puppeteer');
// const catlogo = './catlogo.png';
// const orglogo = './org.jpeg'

// const generateCertificatePDF = async (pledge) => {
//     // Generate avatar URL if no photo
//     const participantName = pledge.user_name || 'Participant';
//     const photoUrl = pledge.user_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(participantName)}&background=1e3a8a&color=fff&size=128`;
//     // Format Date
//     const submitDate = new Date(pledge.submitted_at || Date.now()).toLocaleDateString('en-IN', {
//         day: 'numeric', month: 'long', year: 'numeric'
//     });

//     // Formatting helpers
//     const practices = pledge.practices || [];
//     const behaviours = pledge.behaviours || [];

//     // Ensure we parse correctly if practices/behaviours come as JSON strings or arrays
//     const parsedPractices = typeof practices === 'string' ? JSON.parse(practices) : practices;
//     const parsedBehaviours = typeof behaviours === 'string' ? JSON.parse(behaviours) : behaviours;

//     // Group practices
//     const weeklyPractices = parsedPractices ? parsedPractices.filter(p => p.type === 'weekly') : [];
//     const monthlyPractices = parsedPractices ? parsedPractices.filter(p => p.type === 'monthly') : [];
//     const quarterlyPractices = parsedPractices ? parsedPractices.filter(p => p.type === 'quarterly') : [];

//     const html = `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//         <meta charset="UTF-8">
//         <style>
//             @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            
//             * { box-sizing: border-box; }
//             body {
//                 font-family: 'Inter', sans-serif;
//                 margin: 0;
//                 padding: 0;
//                 background-color: #ffffff;
//                 color: #0f172a;
//                 width: 210mm;
//                 height: 297mm;
//                 position: relative;
//             }
//             .page-border {
//                 position: absolute;
//                 top: 10mm; left: 10mm; right: 10mm; bottom: 10mm;
//                 border: 2px solid #e2e8f0;
//                 border-radius: 12px;
//                 z-index: -1;
//             }
//             .header-shape {
//                 position: absolute;
//                 top: 0; left: 0; right: 0; height: 180px;
//                 background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
//                 z-index: 0;
//                 clip-path: polygon(0 0, 100% 0, 100% 100%, 0 85%);
//             }
//             .content {
//                 position: relative;
//                 z-index: 1;
//                 padding: 40px 50px;
//                 display: flex;
//                 flex-direction: column;
//                 height: 100%;
//             }
//             .header-content {
//                 display: flex;
//                 justify-content: space-between;
//                 align-items: center;
//                 margin-bottom: 30px;
//             }
//             .logo-placeholder {
//                 width: 140px;
//                 height: 50px;
//                 background-color: rgba(255,255,255,0.1);
//                 border: 1px dashed rgba(255,255,255,0.4);
//                 border-radius: 6px;
//                 display: flex;
//                 align-items: center;
//                 justify-content: center;
//                 color: #ffffff;
//                 font-weight: 700;
//                 font-size: 13px;
//                 letter-spacing: 1px;
//                 text-align: center;
//                 box-shadow: 0 4px 6px rgba(0,0,0,0.1);
//             }
//             .logo-placeholder img{
//             max-height:60px;
//             width:auto;
//             display:block;
//             margin:auto;
//             }
//             .cert-title-container {
//                 text-align: center;
//                 color: white;
//                 flex: 1;
//             }
//             .cert-title {
//                 font-size: 28px;
//                 font-weight: 800;
//                 margin: 0 0 5px 0;
//                 letter-spacing: 2px;
//                 text-transform: uppercase;
//             }
//             .cert-subtitle {
//                 font-size: 14px;
//                 font-weight: 500;
//                 opacity: 0.9;
//                 margin: 0;
//                 letter-spacing: 1px;
//             }
//             .cert-subtitle {
//                 font-size: 14px;
//                 font-weight: 500;
//                 opacity: 0.9;
//                 margin: 0;
//                 letter-spacing: 1px;
//             }
            
//             .top-content-area {
//                 display: flex;
//                 gap: 30px;
//                 align-items: center;
//                 margin-top: 20px;
//                 margin-bottom: 30px;
//                 padding: 0 10px;
//             }
//             .left-section {
//                 flex: 0 0 140px;
//             }
//             .photo {
//                 width: 140px;
//                 height: 140px;
//                 border-radius: 12px;
//                 object-fit: cover;
//                 border: 3px solid #e2e8f0;
//                 box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
//             }
//             .right-section {
//                 flex: 1;
//             }
//             .participant-name {
//                 font-size: 32px;
//                 font-weight: 900;
//                 color: #0f172a;
//                 margin: 0 0 8px 0;
//                 letter-spacing: -0.5px;
//             }
//             .program-name {
//                 font-size: 16px;
//                 font-weight: 600;
//                 color: #3b82f6;
//                 margin: 0 0 4px 0;
//                 text-transform: uppercase;
//                 letter-spacing: 1px;
//             }
//             .submission-date {
//                 font-size: 14px;
//                 font-weight: 500;
//                 color: #64748b;
//                 margin: 0;
//             }

//             .section { margin-bottom: 20px; }
//             .section-title {
//                 font-size: 14px;
//                 font-weight: 800;
//                 color: #1e293b;
//                 text-transform: uppercase;
//                 letter-spacing: 1px;
//                 border-bottom: 2px solid #e2e8f0;
//                 padding-bottom: 6px;
//                 margin-bottom: 12px;
//                 display: flex;
//                 align-items: center;
//                 gap: 8px;
//             }
//             .section-title span { color: #3b82f6; }

//             .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
//             .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            
//             .card {
//                 background: #f8fafc;
//                 border: 1px solid #e2e8f0;
//                 border-radius: 8px;
//                 padding: 14px 16px;
//                 box-shadow: 0 2px 4px rgba(0,0,0,0.02);
//             }
//             .card h4 { margin: 0 0 6px 0; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
//             .card p { margin: 0; font-size: 13px; color: #0f172a; font-weight: 500; line-height: 1.5; }

//             .practices-group { margin-bottom: 10px; }
//             .practices-group:last-child { margin-bottom: 0; }
//             .practices-group-title { font-size: 11px; font-weight: 700; color: #3b82f6; text-transform: uppercase; margin-bottom: 6px; }
//             .practices-list { margin: 0; padding: 0 0 0 16px; font-size: 12px; color: #334155; line-height: 1.6; }
//             .practices-list li::marker { color: #94a3b8; }
            
//             .behaviour-card {
//                 background: #ffffff;
//                 border: 1px solid #e2e8f0;
//                 border-left-width: 4px;
//                 border-radius: 8px;
//                 padding: 12px 14px;
//                 box-shadow: 0 2px 4px rgba(0,0,0,0.02);
//                 display: flex;
//                 flex-direction: column;
//                 gap: 6px;
//             }
//             .bc-start { border-left-color: #10b981; }
//             .bc-reduce { border-left-color: #f59e0b; }
//             .bc-stop { border-left-color: #ef4444; }
            
//             .type-badge {
//                 align-self: flex-start;
//                 padding: 3px 8px;
//                 border-radius: 4px;
//                 font-size: 9px;
//                 font-weight: 800;
//                 text-transform: uppercase;
//                 letter-spacing: 0.5px;
//             }
//             .type-start { background: #dcfce7; color: #166534; }
//             .type-reduce { background: #fef3c7; color: #92400e; }
//             .type-stop { background: #fee2e2; color: #991b1b; }
            
//             .b-text { font-size: 13px; font-weight: 600; color: #1e293b; line-height: 1.4; margin: 0; }
//             .b-why { font-size: 11px; font-weight: 500; color: #64748b; line-height: 1.4; margin: 0; }

//             .footer {
//                 margin-top: auto;
//                 padding-top: 20px;
//                 display: flex;
//                 justify-content: space-between;
//                 align-items: flex-end;
//             }
//             .signature-box { text-align: center; }
//             .signature-text {
//                 font-family: 'Inter', sans-serif;
//                 font-size: 24px;
//                 font-style: italic;
//                 font-weight: 600;
//                 color: #1e3a8a;
//                 margin-bottom: 4px;
//             }
//             .signature-line {
//                 width: 220px;
//                 border-bottom: 2px solid #cbd5e1;
//                 margin-bottom: 8px;
//             }
//             .signature-label { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
            
//             .footer-meta { font-size: 10px; font-weight: 600; color: #94a3b8; line-height: 1.5; }
//             .footer-meta span { color: #64748b; font-weight: 700; }

//             .watermark {
//                 position: absolute;
//                 top: 50%; left: 50%;
//                 transform: translate(-50%, -50%) rotate(-30deg);
//                 font-size: 120px;
//                 font-weight: 900;
//                 color: rgba(226, 232, 240, 0.3);
//                 white-space: nowrap;
//                 z-index: -1;
//                 user-select: none;
//             }
//         </style>
//     </head>
//     <body>
//         <div class="header-shape"></div>
//         <div class="watermark">DIGITAL PLEDGE</div>
        
//         <div class="content">
//             <div class="header-content">

//              <img src=${orglogo}
//                     alt="Program Logo"
//                     style="height:60px; object-fit:contain;">
//             </div>

//             <div class="cert-title-container">
//                     <h1 class="cert-title">DIGITAL PLEDGE CERTIFICATE</h1>
//                 </div>
//                 <img src={catlogo}
//                     alt="Program Logo"
//                     style="height:60px; object-fit:contain;">
//             </div>

//             <div class="top-content-area">
//                 <div class="left-section">
//                     <img src="{photoUrl}" class="photo" alt="Participant Photo" />
//                 </div>
//                 <div class="right-section">
//                     <h2 class="participant-name">${pledge.signature_name || participantName}</h2>
//                     <p class="program-name">${pledge.program_title || 'Digital Program'}</p>
//                     <p class="submission-date">Submission Date: ${pledge.submission_date ? new Date(pledge.submission_date).toLocaleDateString('en-IN', {day: 'numeric', month: 'long', year: 'numeric'}) : submitDate}</p>
//                 </div>
//             </div>

//             <div class="section">
//                 <div class="section-title"><span>★</span> My Digital North Star</div>
//                 <div class="grid-3">
//                     <div class="card">
//                         <h4>Problem Statement</h4>
//                         <p>${pledge.problem_statement || '-'}</p>
//                     </div>
//                     <div class="card">
//                         <h4>Key Success Metric</h4>
//                         <p>${pledge.success_metric || pledge.north_star || '-'}</p>
//                     </div>
//                     <div class="card">
//                         <h4>Timeline to Impact</h4>
//                         <p>${pledge.timeline || '-'}</p>
//                     </div>
//                 </div>
//             </div>

//             <div class="grid-2" style="margin-bottom: 20px;">
//                 <!-- Practices -->
//                 <div>
//                     <div class="section-title"><span>✓</span> My Digital Practices</div>
//                     <div class="card" style="height: 100%;">
//                         ${weeklyPractices.length > 0 ? `
//                         <div class="practices-group">
//                             <div class="practices-group-title">Weekly</div>
//                             <ul class="practices-list">
//                                 ${weeklyPractices.map(p => `<li><strong>${p.title}:</strong> ${p.selected_action}</li>`).join('')}
//                             </ul>
//                         </div>` : ''}
                        
//                         ${monthlyPractices.length > 0 ? `
//                         <div class="practices-group">
//                             <div class="practices-group-title">Monthly</div>
//                             <ul class="practices-list">
//                                 ${monthlyPractices.map(p => `<li><strong>${p.title}:</strong> ${p.selected_action}</li>`).join('')}
//                             </ul>
//                         </div>` : ''}
                        
//                         ${quarterlyPractices.length > 0 ? `
//                         <div class="practices-group">
//                             <div class="practices-group-title">Quarterly</div>
//                             <ul class="practices-list">
//                                 ${quarterlyPractices.map(p => `<li><strong>${p.title}:</strong> ${p.selected_action}</li>`).join('')}
//                             </ul>
//                         </div>` : ''}

//                         ${(!weeklyPractices.length && !monthlyPractices.length && !quarterlyPractices.length) ? '<p style="color:#94a3b8; font-size:12px;">No practices selected.</p>' : ''}
//                     </div>
//                 </div>

//                 <!-- Personal Habit -->
//                 <div>
//                     <div class="section-title"><span>🎯</span> My Own Digital Habit</div>
//                     <div class="card" style="height: 100%;">
//                         <h4>Habit to build (${pledge.habit_frequency || 'weekly'})</h4>
//                         <p style="margin-bottom: 12px;">${pledge.personal_habit || '-'}</p>
//                         <h4>How I Will Measure Success</h4>
//                         <p>${pledge.measure_success || '-'}</p>
//                     </div>
//                 </div>
//             </div>

//             <div class="section" style="flex: 1;">
//                 <div class="section-title"><span>🔄</span> Key Digital Behaviours</div>
//                 <div class="grid-3">
//                     ${parsedBehaviours && parsedBehaviours.length > 0
//             ? parsedBehaviours.map(b => `
//                         <div class="behaviour-card bc-${b.type || 'start'}">
//                             <span class="type-badge type-${b.type || 'start'}">${b.type || 'START'}</span>
//                             <p class="b-text">${b.behaviour_text || '-'}</p>
//                             <p class="b-why">${b.why_it_matters ? '<strong>Why it matters:</strong> ' + b.why_it_matters : ''}</p>
//                         </div>
//                     `).join('')
//             : '<p style="color:#94a3b8; font-size:12px; grid-column: span 2;">No behaviours selected.</p>'
//         }
//                 </div>
//             </div>

//             <div class="footer">
//                 <div class="footer-meta">
//                     <div>Pledge ID: <span>#${pledge.id || 'Draft'}</span></div>
//                     <div>Submission Date: <span>${pledge.submission_date ? new Date(pledge.submission_date).toLocaleDateString('en-IN', {day: 'numeric', month: 'long', year: 'numeric'}) : submitDate}</span></div>
//                     ${pledge.review_dates ? `<div>Self-Review Dates: <span>${pledge.review_dates.split(',').join(' &bull; ')}</span></div>` : ''}
//                 </div>
//                 <div class="signature-box">
//                     <div class="signature-text">${pledge.digital_signature || pledge.signature_name || participantName}</div>
//                     <div class="signature-line"></div>
//                     <div class="signature-label">Digital Signature</div>
//                 </div>
//             </div>
//         </div>
//         <div class="page-border"></div>
//     </body>
//     </html>
//     `;

//     // Launch puppeteer
//     const browser = await puppeteer.launch({
//         headless: true, // v22.9.0 handles headless automatically
//         args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
//     });

//     try {
//         const page = await browser.newPage();
//         await page.setContent(html, { waitUntil: 'load' });

//         // Wait a small moment just in case web fonts need mapping
//         await new Promise(r => setTimeout(r, 200));

//         const pdfBuffer = await page.pdf({
//             format: 'A4',
//             printBackground: true,
//             margin: { top: 0, right: 0, bottom: 0, left: 0 }
//         });

//         return pdfBuffer;
//     } finally {
//         await browser.close();
//     }
// };

// const generateReportPDF = async (reportData) => {
//     const { summary, practiceCounts, levelDistribution, participants } = reportData;

//     const todayDate = new Date().toLocaleDateString('en-IN', {
//         day: 'numeric', month: 'long', year: 'numeric'
//     });

//     const html = `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//         <meta charset="UTF-8">
//         <style>
//             @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
//             * { box-sizing: border-box; }
//             body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; color: #1e293b; }
//             h1 { color: #0f172a; font-weight: 800; font-size: 28px; margin-bottom: 5px; }
//             p.subtitle { color: #64748b; font-size: 14px; margin-top: 0; margin-bottom: 30px; }
            
//             .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
//             .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
//             .metric-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
//             .metric-value { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
            
//             table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
//             th { text-align: left; padding: 10px; background: #f1f5f9; color: #475569; font-weight: 700; border-bottom: 2px solid #cbd5e1; }
//             td { padding: 10px; border-bottom: 1px solid #e2e8f0; color: #334155; }
//             .text-center { text-align: center; }
//         </style>
//     </head>
//     <body>
//         <h1>Digital Culture Pledge - Executive Report</h1>
//         <p class="subtitle">Generated on ${todayDate}</p>

//         <div class="grid-4">
//             <div class="metric-card">
//                 <div class="metric-label">Total Participants</div>
//                 <p class="metric-value">${summary.totalParticipants}</p>
//             </div>
//             <div class="metric-card">
//                 <div class="metric-label">Avg Execution</div>
//                 <p class="metric-value">${summary.avgExecutionPct}%</p>
//             </div>
//             <div class="metric-card">
//                 <div class="metric-label">100% Adherence</div>
//                 <p class="metric-value">${summary.adherencePct}%</p>
//             </div>
//             <div class="metric-card">
//                 <div class="metric-label">Avg Improvement</div>
//                 <p class="metric-value">${summary.avgImprovementScore >= 0 ? '+' : ''}${summary.avgImprovementScore} pts</p>
//             </div>
//         </div>
        
//         <div class="grid-4" style="margin-bottom: 40px;">
//             <div class="metric-card" style="grid-column: span 2;">
//                 <div class="metric-label">Most Chosen Practice</div>
//                 <p class="metric-value" style="font-size: 16px;">${summary.mostChosenPractice}</p>
//             </div>
//             <div class="metric-card" style="grid-column: span 2;">
//                 <div class="metric-label">Least Chosen Practice</div>
//                 <p class="metric-value" style="font-size: 16px;">${summary.leastChosenPractice}</p>
//             </div>
//         </div>

//         <h2 style="font-size: 18px; color: #0f172a; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Participant Summary</h2>
//         <table>
//             <thead>
//                 <tr>
//                     <th>Participant</th>
//                     <th>Program</th>
//                     <th class="text-center">Weekly</th>
//                     <th class="text-center">Monthly</th>
//                     <th class="text-center">Completion</th>
//                     <th class="text-center">Surveys</th>
//                 </tr>
//             </thead>
//             <tbody>
//                 ${participants.map(p => `
//                 <tr>
//                     <td><strong>${p.name}</strong><br><span style="color:#64748b; font-size:10px;">${p.email}</span></td>
//                     <td>${p.program_title || '-'}</td>
//                     <td class="text-center">${p.weekly_count}</td>
//                     <td class="text-center">${p.monthly_count}</td>
//                     <td class="text-center"><strong>${p.completion_pct}%</strong></td>
//                     <td class="text-center">${p.surveys_completed}/${p.surveys_total}</td>
//                 </tr>
//                 `).join('')}
//             </tbody>
//         </table>
        
//         <div style="margin-top: 50px; text-align: center; color: #94a3b8; font-size: 10px;">
//             © ${new Date().getFullYear()} Digital Culture Pledge System.
//         </div>
//     </body>
//     </html>
//     `;

//     const browser = await puppeteer.launch({
//         headless: true,
//         args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
//     });

//     try {
//         const page = await browser.newPage();
//         await page.setContent(html, { waitUntil: 'load' });
//         await new Promise(r => setTimeout(r, 200));
//         const pdfBuffer = await page.pdf({
//             format: 'A4',
//             printBackground: true,
//             margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
//         });
//         return pdfBuffer;
//     } finally {
//         await browser.close();
//     }
// };

// module.exports = { generateCertificatePDF, generateReportPDF };


const puppeteer = require('puppeteer');
const fs = require('fs'); // Added to read image files

const catlogo = './catlogo.png';
const orglogo = './org.jpeg';

// Helper to convert image to base64 data URL
function getBase64Image(filePath) {
    const ext = filePath.split('.').pop().toLowerCase();
    let mime = 'image/png';
    if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
    else if (ext === 'png') mime = 'image/png';
    else if (ext === 'gif') mime = 'image/gif';
    // Add more if needed
    const data = fs.readFileSync(filePath);
    return `data:${mime};base64,${data.toString('base64')}`;
}

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

    // Group practices
    const weeklyPractices = parsedPractices ? parsedPractices.filter(p => p.type === 'weekly') : [];
    const monthlyPractices = parsedPractices ? parsedPractices.filter(p => p.type === 'monthly') : [];
    const quarterlyPractices = parsedPractices ? parsedPractices.filter(p => p.type === 'quarterly') : [];

    // Convert logos to base64 for proper embedding
    let catlogoDataURL = '', orglogoDataURL = '';
    try {
        catlogoDataURL = getBase64Image(catlogo);
        orglogoDataURL = getBase64Image(orglogo);
    } catch (err) {
        console.error('Error reading logo files:', err);
        // Fallback empty strings – no logo shown, but PDF still works
    }

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
                top: 0; left: 0; right: 0; height: 180px;
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
                align-items: center;
                margin-bottom: 30px;
            }
            .cert-title-container {
                text-align: center;
                color: white;
                flex: 1;
                margin: 0 20px;
            }
            .cert-title {
                font-size: 28px;
                font-weight: 800;
                margin: 0 0 5px 0;
                letter-spacing: 2px;
                text-transform: uppercase;
            }
            .cert-subtitle {
                font-size: 14px;
                font-weight: 500;
                opacity: 0.9;
                margin: 0;
                letter-spacing: 1px;
            }
            
            .top-content-area {
                display: flex;
                gap: 30px;
                align-items: center;
                margin-top: 20px;
                margin-bottom: 30px;
                padding: 0 10px;
            }
            .left-section {
                flex: 0 0 140px;
            }
            .photo {
                width: 140px;
                height: 140px;
                border-radius: 12px;
                object-fit: cover;
                border: 3px solid #e2e8f0;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .right-section {
                flex: 1;
            }
            .participant-name {
                font-size: 32px;
                font-weight: 900;
                color: #0f172a;
                margin: 0 0 8px 0;
                letter-spacing: -0.5px;
            }
            .program-name {
                font-size: 16px;
                font-weight: 600;
                color: #3b82f6;
                margin: 0 0 4px 0;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .submission-date {
                font-size: 14px;
                font-weight: 500;
                color: #64748b;
                margin: 0;
            }

            .section { margin-bottom: 20px; }
            .section-title {
                font-size: 14px;
                font-weight: 800;
                color: #1e293b;
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

            .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            
            .card {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 14px 16px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            }
            .card h4 { margin: 0 0 6px 0; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
            .card p { margin: 0; font-size: 13px; color: #0f172a; font-weight: 500; line-height: 1.5; }

            .practices-group { margin-bottom: 10px; }
            .practices-group:last-child { margin-bottom: 0; }
            .practices-group-title { font-size: 11px; font-weight: 700; color: #3b82f6; text-transform: uppercase; margin-bottom: 6px; }
            .practices-list { margin: 0; padding: 0 0 0 16px; font-size: 12px; color: #334155; line-height: 1.6; }
            .practices-list li::marker { color: #94a3b8; }
            
            .behaviour-card {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-left-width: 4px;
                border-radius: 8px;
                padding: 12px 14px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .bc-start { border-left-color: #10b981; }
            .bc-reduce { border-left-color: #f59e0b; }
            .bc-stop { border-left-color: #ef4444; }
            
            .type-badge {
                align-self: flex-start;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 9px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .type-start { background: #dcfce7; color: #166534; }
            .type-reduce { background: #fef3c7; color: #92400e; }
            .type-stop { background: #fee2e2; color: #991b1b; }
            
            .b-text { font-size: 13px; font-weight: 600; color: #1e293b; line-height: 1.4; margin: 0; }
            .b-why { font-size: 11px; font-weight: 500; color: #64748b; line-height: 1.4; margin: 0; }

            .footer {
                margin-top: auto;
                padding-top: 20px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
            }
            .signature-box { text-align: center; }
            .signature-text {
                font-family: 'Inter', sans-serif;
                font-size: 24px;
                font-style: italic;
                font-weight: 600;
                color: #1e3a8a;
                margin-bottom: 4px;
            }
            .signature-line {
                width: 220px;
                border-bottom: 2px solid #cbd5e1;
                margin-bottom: 8px;
            }
            .signature-label { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
            
            .footer-meta { font-size: 10px; font-weight: 600; color: #94a3b8; line-height: 1.5; }
            .footer-meta span { color: #64748b; font-weight: 700; }

            .watermark {
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%) rotate(-30deg);
                font-size: 120px;
                font-weight: 900;
                color: rgba(226, 232, 240, 0.3);
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
            <!-- Header with two logos and centered title -->
            <div class="header-content">
                <img src="${orglogoDataURL}" alt="Organization Logo" style="height:60px; width:auto; object-fit:contain;">
                <div class="cert-title-container">
                    <h1 class="cert-title">DIGITAL PLEDGE CERTIFICATE</h1>
                </div>
                <img src="${catlogoDataURL}" alt="Program Logo" style="height:60px; width:auto; object-fit:contain;">
            </div>

            <div class="top-content-area">
                <div class="left-section">
                    <img src="${photoUrl}" class="photo" alt="Participant Photo" />
                </div>
                <div class="right-section">
                    <h2 class="participant-name">${pledge.signature_name || participantName}</h2>
                    <p class="program-name">${pledge.program_title || 'Digital Program'}</p>
                    <p class="submission-date">Submission Date: ${pledge.submission_date ? new Date(pledge.submission_date).toLocaleDateString('en-IN', {day: 'numeric', month: 'long', year: 'numeric'}) : submitDate}</p>
                </div>
            </div>

            <div class="section">
                <div class="section-title"><span>★</span> My Digital North Star</div>
                <div class="grid-3">
                    <div class="card">
                        <h4>Problem Statement</h4>
                        <p>${pledge.problem_statement || '-'}</p>
                    </div>
                    <div class="card">
                        <h4>Key Success Metric</h4>
                        <p>${pledge.success_metric || pledge.north_star || '-'}</p>
                    </div>
                    <div class="card">
                        <h4>Timeline to Impact</h4>
                        <p>${pledge.timeline || '-'}</p>
                    </div>
                </div>
            </div>

            <div class="grid-2" style="margin-bottom: 20px;">
                <!-- Practices -->
                <div>
                    <div class="section-title"><span>✓</span> My Digital Practices</div>
                    <div class="card" style="height: 100%;">
                        ${weeklyPractices.length > 0 ? `
                        <div class="practices-group">
                            <div class="practices-group-title">Weekly</div>
                            <ul class="practices-list">
                                ${weeklyPractices.map(p => `<li><strong>${p.title}:</strong> ${p.selected_action}</li>`).join('')}
                            </ul>
                        </div>` : ''}
                        
                        ${monthlyPractices.length > 0 ? `
                        <div class="practices-group">
                            <div class="practices-group-title">Monthly</div>
                            <ul class="practices-list">
                                ${monthlyPractices.map(p => `<li><strong>${p.title}:</strong> ${p.selected_action}</li>`).join('')}
                            </ul>
                        </div>` : ''}
                        
                        ${quarterlyPractices.length > 0 ? `
                        <div class="practices-group">
                            <div class="practices-group-title">Quarterly</div>
                            <ul class="practices-list">
                                ${quarterlyPractices.map(p => `<li><strong>${p.title}:</strong> ${p.selected_action}</li>`).join('')}
                            </ul>
                        </div>` : ''}

                        ${(!weeklyPractices.length && !monthlyPractices.length && !quarterlyPractices.length) ? '<p style="color:#94a3b8; font-size:12px;">No practices selected.</p>' : ''}
                    </div>
                </div>

                <!-- Personal Habit -->
                <div>
                    <div class="section-title"><span>🎯</span> My Own Digital Habit</div>
                    <div class="card" style="height: 100%;">
                        <h4>Habit to build (${pledge.habit_frequency || 'weekly'})</h4>
                        <p style="margin-bottom: 12px;">${pledge.personal_habit || '-'}</p>
                        <h4>How I Will Measure Success</h4>
                        <p>${pledge.measure_success || '-'}</p>
                    </div>
                </div>
            </div>

            <div class="section" style="flex: 1;">
                <div class="section-title"><span>🔄</span> Key Digital Behaviours</div>
                <div class="grid-3">
                    ${parsedBehaviours && parsedBehaviours.length > 0
            ? parsedBehaviours.map(b => `
                        <div class="behaviour-card bc-${b.type || 'start'}">
                            <span class="type-badge type-${b.type || 'start'}">${b.type || 'START'}</span>
                            <p class="b-text">${b.behaviour_text || '-'}</p>
                            <p class="b-why">${b.why_it_matters ? '<strong>Why it matters:</strong> ' + b.why_it_matters : ''}</p>
                        </div>
                    `).join('')
            : '<p style="color:#94a3b8; font-size:12px; grid-column: span 2;">No behaviours selected.</p>'
        }
                </div>
            </div>

            <div class="footer">
                <div class="footer-meta">
                    <div>Pledge ID: <span>#${pledge.id || 'Draft'}</span></div>
                    <div>Submission Date: <span>${pledge.submission_date ? new Date(pledge.submission_date).toLocaleDateString('en-IN', {day: 'numeric', month: 'long', year: 'numeric'}) : submitDate}</span></div>
                    ${pledge.review_dates ? `<div>Self-Review Dates: <span>${pledge.review_dates.split(',').join(' &bull; ')}</span></div>` : ''}
                </div>
                <div class="signature-box">
                    <div class="signature-text">${pledge.digital_signature || pledge.signature_name || participantName}</div>
                    <div class="signature-line"></div>
                    <div class="signature-label">Digital Signature</div>
                </div>
            </div>
        </div>
        <div class="page-border"></div>
    </body>
    </html>
    `;

    // Launch puppeteer
    const browser = await puppeteer.launch({
        headless: true,
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