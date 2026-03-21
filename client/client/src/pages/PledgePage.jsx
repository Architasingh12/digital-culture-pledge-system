import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Target, Star, Calendar, Clock, BookOpen, Repeat, TrendingUp, CheckCircle, Edit3, Type, ArrowRight, Save, Trash2, Plus, PenLine, CalendarCheck, User, Briefcase } from 'lucide-react';

import jsPDF from "jspdf";



const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
};

// ─── Main Component ─────────────────────────────────────────────────────────────
const PledgePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loadingInitial, setLoadingInitial] = useState(true);
    const [programs, setPrograms] = useState([]);
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [practices, setPractices] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Section A – Digital North Star
    const [sectionA, setSectionA] = useState({
        problem_statement: '',
        success_metric: '',   // "Key Success Metric (baseline to target)"
        timeline_quarter: '', // Quarter e.g. Q3
        timeline_year: '',    // Year e.g. 2026
    });

    // Section B – Digital Culture Practices
    const [practiceSelections, setPracticeSelections] = useState({});

    // Section C – My Own Digital Habit
    const [sectionC, setSectionC] = useState({
        personal_habit: '',
        habit_frequency: 'weekly',
        measure_success: '',
    });

    // Section D – Key Digital Behaviours (max 5 rows)
    const [behaviours, setBehaviours] = useState([
        { behaviour_text: '', type: 'start', why_it_matters: '', first_action_date: '' }
    ]);

    // Participant Photo
    const [userPhoto, setUserPhoto] = useState(null);

    // Section E – Review and Sign-off
    const today = new Date().toISOString().slice(0, 10);
    const [sectionE, setSectionE] = useState({
        review_date_1: '',
        review_date_2: '',
        review_date_3: '',
        signature_name: user?.name || '',
        signoff_designation: user?.designation || '',
        digital_signature: '',
        submission_date: today,
    });

    // Load programs
    useEffect(() => {
        axiosInstance.get('/programs')
            .then(res => {
                const progs = res.data.programs || [];
                setPrograms(progs);
                if (progs.length > 0) setSelectedProgramId(String(progs[0].id));
            })
            .catch(() => toast.error('Failed to load programs'))
            .finally(() => setLoadingInitial(false));
    }, []);

    // Populate name from user when loaded
    useEffect(() => {
        if (user) {
            setSectionE(prev => ({
                ...prev,
                signature_name: prev.signature_name || user.name || '',
                signoff_designation: prev.signoff_designation || user.designation || '',
            }));
        }
    }, [user]);

    // Load practices when program changes
    useEffect(() => {
        if (!selectedProgramId) return;
        axiosInstance.get(`/practices/program/${selectedProgramId}`)
            .then(res => {
                setPractices(res.data.practices || []);
                setPracticeSelections({});
            })
            .catch(() => toast.error('Failed to load practices'));
    }, [selectedProgramId]);

    const weeklyPractices = practices.filter(p => p.type === 'weekly');
    const monthlyPractices = practices.filter(p => p.type === 'monthly');
    const quarterlyPractices = practices.filter(p => p.type === 'quarterly');

    const togglePractice = (id) => {
        setPracticeSelections(prev => {
            const updated = { ...prev };
            if (id in updated) delete updated[id];
            else updated[id] = '';
            return updated;
        });
    };

    const selectAction = (id, action) => {
        setPracticeSelections(prev => ({ ...prev, [id]: action }));
    };

    const addBehaviour = () => {
        if (behaviours.length >= 5) return toast.error('Maximum 5 behaviours allowed');
        setBehaviours(prev => [...prev, { behaviour_text: '', type: 'start', why_it_matters: '', first_action_date: '' }]);
    };

    const removeBehaviour = (idx) => {
        setBehaviours(prev => prev.filter((_, i) => i !== idx));
    };

    const updateBehaviour = (idx, field, value) => {
        setBehaviours(prev => prev.map((b, i) => i === idx ? { ...b, [field]: value } : b));
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            return toast.error('Only JPG and PNG images are allowed.');
        }
        if (file.size > 2 * 1024 * 1024) {
            return toast.error('Image size must be less than 2MB.');
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setUserPhoto(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const removePhoto = () => {
        setUserPhoto(null);
    };



    const generateCertificatePDF = async (data) => {
        // ── Load logos from public folder as base64 ──────────────────────────
        const toBase64 = (url) =>
            fetch(url)
                .then(r => r.blob())
                .then(blob => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                }))
                .catch(() => null);  // gracefully skip if missing

        const [orgLogoData, catLogoData] = await Promise.all([
            toBase64('/org.jpeg'),
            toBase64('/catlogo.png'),
        ]);
        const doc = new jsPDF("portrait", "mm", "a4");
        const W = doc.internal.pageSize.getWidth();   // 297
        const H = doc.internal.pageSize.getHeight();  // 210

        // ── Colour palette ──────────────────────────────────────────────────────
        const blue = [37, 99, 235];
        const indigoDark = [37, 99, 235];
        const indigoMid = [37, 99, 235];
        const slate700 = [51, 65, 85];
        const slate500 = [100, 116, 139];
        const slate200 = [226, 232, 240];
        const white = [255, 255, 255];
        const cardBg = [248, 250, 252];   // near-white card fill

        // ── Helpers ─────────────────────────────────────────────────────────────
        const setFill = (c) => doc.setFillColor(c[0], c[1], c[2]);
        const setStrok = (c) => doc.setDrawColor(c[0], c[1], c[2]);
        const setTxt = (c) => doc.setTextColor(c[0], c[1], c[2]);

        /** Draw a rounded-rectangle card */
        const card = (x, y, w, h, fill = white, stroke = slate200, r = 3) => {
            setFill(fill);
            setStrok(stroke);
            doc.setLineWidth(0.3);
            doc.roundedRect(x, y, w, h, r, r, 'FD');
        };

        /** Clamp-wrap text inside a box, return final y */
        const wrappedText = (text, x, y, maxW, lineH = 4.5) => {
            const lines = doc.splitTextToSize(String(text || '–'), maxW);
            doc.text(lines, x, y);
            return y + lines.length * lineH;
        };

        /** Section title pill */
        const sectionPill = (label, x, y) => {
            setFill(blue);
            doc.roundedRect(x, y - 4, doc.getTextWidth(label) + 6, 6, 1.5, 1.5, 'F');
            setTxt(white);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.text(label, x + 3, y);
        };

        // ════════════════════════════════════════════════════════════════════════
        // PAGE BACKGROUND
        // ════════════════════════════════════════════════════════════════════════
        setFill([245, 247, 255]);
        doc.rect(0, 0, W, H, 'F');

        // ════════════════════════════════════════════════════════════════════════
        // HEADER BAR  (gradient simulation: two overlapping rects)
        // ════════════════════════════════════════════════════════════════════════
        const hdrH = 22;
        setFill(blue);
        doc.rect(0, 0, W * 0.55, hdrH, 'F');
        setFill(indigoDark);
        doc.rect(W * 0.45, 0, W * 0.55, hdrH, 'F');
        // blend seam
        setFill(indigoMid);
        doc.rect(W * 0.44, 0, W * 0.12, hdrH, 'F');

        // Left logo (org.jpeg)
        if (orgLogoData) {
            doc.addImage(orgLogoData, 'JPEG', 5, 3, 28, 16);
        } else {
            setFill(white);
            doc.roundedRect(5, 3, 26, 16, 2, 2, 'F');
            setTxt(blue);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('DigiQ', 8, 13.5);
        }

        // Centre: DIGITAL PLEDGE CERTIFICATE
        setTxt(white);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('DIGITAL PLEDGE CERTIFICATE', W / 2, 13, { align: 'center' });

        // Right logo (catlogo.png)
        if (catLogoData) {
            doc.addImage(catLogoData, 'PNG', W - 35, 3, 30, 16);
        } else {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text('Catalyst', W - 12, 13, { align: 'right' });
        }

        // ════════════════════════════════════════════════════════════════════════
        // PROFILE SECTION
        // ════════════════════════════════════════════════════════════════════════
        const profY = hdrH + 4;
        const profH = 24;
        card(5, profY, W - 10, profH, cardBg, slate200, 3);

        // Avatar box – show participant photo if available, else initials
        const avatarSize = 18;
        const avatarX = 10, avatarY = profY + 3;
        const participantName = (data.signature_name || data.user_name || 'Participant').trim();

        if (data.user_photo) {
            // Detect format from the data URL prefix
            const fmt = data.user_photo.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            // White rounded background behind photo
            setFill(white);
            doc.roundedRect(avatarX, avatarY, avatarSize, avatarSize, 2, 2, 'F');
            doc.addImage(data.user_photo, fmt, avatarX, avatarY, avatarSize, avatarSize);
        } else {
            // Fallback: blue box with initials
            setFill(blue);
            doc.roundedRect(avatarX, avatarY, avatarSize, avatarSize, 2, 2, 'F');
            const initials = participantName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            setTxt(white);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(initials, avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 1.5, { align: 'center' });
        }

        // Name + subtitle + date
        const textX = avatarX + avatarSize + 5;
        setTxt(slate700);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(participantName, textX, profY + 10);

        setTxt(slate500);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text('INTEGRITY & TRANSPARENCY INITIATIVE', textX, profY + 16.5);

        const submDate = data.submission_date
            ? new Date(data.submission_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
            : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        doc.text(`Submission Date: ${submDate}`, textX, profY + 21.5);

        // ════════════════════════════════════════════════════════════════════════
        // ROW 1 – MY DIGITAL NORTH STAR  (3 cards)
        // ════════════════════════════════════════════════════════════════════════
        const r1Y = profY + profH + 5;
        sectionPill('MY DIGITAL NORTH STAR', 5, r1Y);

        const cardW3 = (W - 10 - 6) / 3;    // 3 equal cards with 3mm gaps
        const r1CardY = r1Y + 3;
        const r1CardH = 28;

        const northStarCards = [
            { label: 'Problem Statement', value: data.problem_statement },
            { label: 'Key Success Metric', value: data.success_metric },
            { label: 'Timeline to Impact', value: data.timeline },
        ];

        northStarCards.forEach((c, i) => {
            const cx = 5 + i * (cardW3 + 3);
            card(cx, r1CardY, cardW3, r1CardH, white, slate200, 3);

            // Label strip
            setFill([239, 246, 255]);
            doc.roundedRect(cx, r1CardY, cardW3, 7, 3, 3, 'F');
            setTxt(blue);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.text(c.label, cx + cardW3 / 2, r1CardY + 4.8, { align: 'center' });

            setTxt(slate700);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            wrappedText(c.value, cx + 3, r1CardY + 12, cardW3 - 6, 4.5);
        });

        // ════════════════════════════════════════════════════════════════════════
        // ROW 2 – PRACTICES  +  HABIT  (side-by-side)
        // ════════════════════════════════════════════════════════════════════════
        const r2Y = r1CardY + r1CardH + 5;
        const halfW = (W - 10 - 4) / 2;
        const r2H = 35;

        // ── Practices box (left) ──
        sectionPill('MY DIGITAL PRACTICES', 5, r2Y);
        const practicesCardY = r2Y + 3;
        card(5, practicesCardY, halfW, r2H, white, slate200, 3);

        const practicesList = Array.isArray(data.pledge_practices) && data.pledge_practices.length > 0
            ? data.pledge_practices
            : null;

        if (practicesList) {
            let py = practicesCardY + 6;
            practicesList.slice(0, 6).forEach((p) => {
                const title = p.practice_title || p.title || 'Practice';
                const action = p.selected_action || '';
                setFill([239, 246, 255]);
                doc.roundedRect(8, py - 2.5, halfW - 6, 7, 1.5, 1.5, 'F');
                setTxt(blue);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(6.5);
                doc.text(title, 11, py + 1.5);
                if (action) {
                    setTxt(slate500);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(6);
                    doc.text(`→ ${action}`, 11, py + 5);
                    py += 9;
                } else {
                    py += 8;
                }
            });
        } else {
            setTxt(slate500);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7.5);
            doc.text('No practices selected.', 5 + halfW / 2, practicesCardY + r2H / 2, { align: 'center' });
        }

        // ── Habit box (right) ──
        const habitX = 5 + halfW + 4;
        sectionPill('MY OWN DIGITAL HABIT', habitX, r2Y);
        const habitCardY = r2Y + 3;
        card(habitX, habitCardY, halfW, r2H, white, slate200, 3);

        const halfCardW = (halfW - 6) / 2;

        // sub-card: Habit to Build
        card(habitX + 2, habitCardY + 2, halfCardW, r2H - 4, cardBg, slate200, 2);
        setTxt(indigoMid);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.text('Habit to Build (Quarterly)', habitX + 2 + halfCardW / 2, habitCardY + 7, { align: 'center' });
        setTxt(slate700);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        wrappedText(data.personal_habit, habitX + 4, habitCardY + 12, halfCardW - 4, 4.5);

        // sub-card: Measure Success
        const msX = habitX + 2 + halfCardW + 2;
        card(msX, habitCardY + 2, halfCardW, r2H - 4, cardBg, slate200, 2);
        setTxt(indigoMid);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.text('How I Will Measure Success', msX + halfCardW / 2, habitCardY + 7, { align: 'center' });
        setTxt(slate700);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        wrappedText(data.measure_success, msX + 2, habitCardY + 12, halfCardW - 4, 4.5);

        // ════════════════════════════════════════════════════════════════════════
        // ROW 3 – KEY DIGITAL BEHAVIOURS
        // ════════════════════════════════════════════════════════════════════════
        const r3Y = practicesCardY + r2H + 5;
        sectionPill('KEY DIGITAL BEHAVIOURS', 5, r3Y);

        const behaviours = Array.isArray(data.behaviours) ? data.behaviours : [];
        const bCardY = r3Y + 3;
        const bCardH = H - bCardY - 23;   // clears the 20mm footer + 3mm gap

        if (behaviours.length === 0) {
            card(5, bCardY, W - 10, bCardH, white, slate200, 3);
            setTxt(slate500);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.text('No behaviours recorded.', W / 2, bCardY + bCardH / 2, { align: 'center' });
        } else {
            const maxBeh = Math.min(behaviours.length, 5);
            const bW = (W - 10 - (maxBeh - 1) * 3) / maxBeh;

            const tagColors = {
                start: { bg: [220, 252, 231], text: [21, 128, 61] },
                reduce: { bg: [254, 249, 195], text: [161, 98, 7] },
                stop: { bg: [254, 226, 226], text: [185, 28, 28] },
            };

            behaviours.slice(0, maxBeh).forEach((b, i) => {
                const bx = 5 + i * (bW + 3);
                card(bx, bCardY, bW, bCardH, white, slate200, 3);

                // Type tag
                const tc = tagColors[b.type] || tagColors.start;
                setFill(tc.bg);
                doc.roundedRect(bx + 2, bCardY + 2, bW - 4, 7, 2, 2, 'F');
                setTxt(tc.text);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7);
                doc.text((b.type || 'START').toUpperCase(), bx + bW / 2, bCardY + 7, { align: 'center' });

                // Behaviour text
                setTxt(slate700);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7);
                wrappedText(b.behaviour_text, bx + 3, bCardY + 15, bW - 6, 4);

                // Why it matters
                if (b.why_it_matters) {
                    setTxt(slate500);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(6.5);
                    const wmY = bCardY + 15 + Math.ceil(String(b.behaviour_text || '').length / 18) * 4 + 3;
                    doc.text('Why it matters:', bx + 3, wmY);
                    wrappedText(b.why_it_matters, bx + 3, wmY + 4, bW - 6, 4);
                }
            });
        }

        // ════════════════════════════════════════════════════════════════════════
        // FOOTER BAR  (20mm tall)
        // ════════════════════════════════════════════════════════════════════════
        const footH = 20;
        const footY = H - footH;
        setFill([30, 41, 59]);
        doc.rect(0, footY, W, footH, 'F');

        const certId = `CERT-${Date.now().toString(36).toUpperCase()}`;

        // ── Left column: Pledge ID / Submission Date / Self-review dates ──────
        setTxt([148, 163, 184]);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.text(`Pledge ID: ${certId}`, 6, footY + 6);
        doc.text(`Submission Date: ${submDate}`, 6, footY + 11);

        if (data.review_dates) {
            const rd = data.review_dates.split(',').filter(Boolean).join('  |  ');
            doc.text(`Self-review dates: ${rd}`, 6, footY + 16);
        }

        // ── Right column: Signature block ─────────────────────────────────────
        const sigX = W - 75;

        // Italic signature name (above line)
        if (data.digital_signature) {
            setTxt(white);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.text(data.digital_signature, sigX, footY + 7);
        }

        // Underline
        setTxt([148, 163, 184]);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('________________________', sigX, footY + 12);

        // Label below the line
        doc.setFontSize(6.5);
        doc.text('Participant Digital Signature', sigX, footY + 17);

        // ── Save ─────────────────────────────────────────────────────────────
        const filename = `digital-pledge-${participantName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
        doc.save(filename);
    };


    //    const handleSubmit = async (e) => {
    //     e.preventDefault();

    //     // Section A validation
    //     if (!sectionA.problem_statement.trim()) return toast.error('Please fill in your Problem Statement (Section A)');
    //     if (!sectionA.success_metric.trim()) return toast.error('Please fill in your Key Success Metric (Section A)');
    //     if (!sectionA.timeline_quarter.trim() || !sectionA.timeline_year.trim()) return toast.error('Please fill in your Timeline Quarter and Year (Section A)');

    //     // Section C validation
    //     if (!sectionC.personal_habit.trim()) return toast.error('Please fill in your Personal Habit (Section C)');

    //     // Section D validation
    //     const filledBehaviours = behaviours.filter(b => b.behaviour_text.trim());
    //     if (filledBehaviours.length === 0) return toast.error('Please add at least one Behaviour (Section D)');

    //     // Section E validation
    //     if (!sectionE.signature_name.trim()) return toast.error('Please enter your Name (Section E)');
    //     if (!sectionE.digital_signature.trim()) return toast.error('Please enter your Digital Signature (Section E)');

    //     const timeline = `${sectionA.timeline_quarter} ${sectionA.timeline_year}`.trim();

    //     const reviewDates = [
    //         sectionE.review_date_1,
    //         sectionE.review_date_2,
    //         sectionE.review_date_3
    //     ].filter(Boolean).join(',');

    //     const pledge_practices = Object.entries(practiceSelections)
    //         .filter(([, action]) => action && action.trim())
    //         .map(([id, action]) => {
    //             const practice = practices.find(p => String(p.id) === String(id));
    //             return {
    //                 practice_id: parseInt(id),
    //                 selected_action: action,
    //                 practice_title: practice?.title || '',
    //             };
    //         });

    //     setSubmitting(true);

    //     try {

    //         const payload = {
    //             program_id: parseInt(selectedProgramId),
    //             problem_statement: sectionA.problem_statement,
    //             north_star: sectionA.success_metric,
    //             success_metric: sectionA.success_metric,
    //             timeline,
    //             personal_habit: sectionC.personal_habit,
    //             habit_frequency: sectionC.habit_frequency,
    //             measure_success: sectionC.measure_success,
    //             pledge_practices,
    //             behaviours: filledBehaviours,

    //             review_dates: reviewDates || null,
    //             signature_name: sectionE.signature_name,
    //             signoff_designation: sectionE.signoff_designation,
    //             digital_signature: sectionE.digital_signature,
    //             submission_date: sectionE.submission_date || today,

    //             user_photo: userPhoto,
    //         };

    //         // Submit pledge
    //         await axiosInstance.post('/pledges', payload);

    //         toast.success('Pledge submitted! Generating certificate...');

    //         // ✅ Generate dummy PDF from frontend
    //         const doc = new jsPDF();

    //         doc.setFontSize(22);
    //         doc.text("Digital Culture Pledge Certificate", 20, 30);

    //         doc.setFontSize(14);
    //         doc.text(`Name: ${sectionE.signature_name}`, 20, 50);
    //         doc.text(`Designation: ${sectionE.signoff_designation || '-'}`, 20, 60);

    //         doc.text("Problem Statement:", 20, 80);
    //         doc.text(sectionA.problem_statement || "-", 20, 90, { maxWidth: 170 });

    //         doc.text(`Success Metric: ${sectionA.success_metric}`, 20, 110);
    //         doc.text(`Timeline: ${timeline}`, 20, 120);

    //         doc.text("Personal Habit:", 20, 140);
    //         doc.text(sectionC.personal_habit || "-", 20, 150, { maxWidth: 170 });

    //         doc.text(`Digital Signature: ${sectionE.digital_signature}`, 20, 180);
    //         doc.text(`Date: ${sectionE.submission_date}`, 20, 190);

    //         const filename = `pledge-certificate-${sectionE.signature_name.replace(/\s+/g,'-')}.pdf`;

    //         doc.save(filename);

    //         navigate('/pledge-success');

    //     } catch (err) {

    //         console.error("SUBMIT ERROR:", err);

    //         toast.error(
    //             err.response?.data?.message ||
    //             err.message ||
    //             'Failed to submit pledge. Please try again.'
    //         );

    //     } finally {

    //         setSubmitting(false);

    //     }
    // };

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!sectionA.problem_statement.trim())
            return toast.error('Please fill in your Problem Statement (Section A)');

        if (!sectionA.success_metric.trim())
            return toast.error('Please fill in your Key Success Metric (Section A)');

        if (!sectionC.personal_habit.trim())
            return toast.error('Please fill in your Personal Habit (Section C)');

        const filledBehaviours = behaviours.filter(b => b.behaviour_text.trim());

        if (filledBehaviours.length === 0)
            return toast.error('Please add at least one Behaviour (Section D)');

        if (!sectionE.signature_name.trim())
            return toast.error('Please enter your Name (Section E)');

        if (!sectionE.digital_signature.trim())
            return toast.error('Please enter your Digital Signature (Section E)');

        const timeline = `${sectionA.timeline_quarter} ${sectionA.timeline_year}`.trim();

        const reviewDates = [
            sectionE.review_date_1,
            sectionE.review_date_2,
            sectionE.review_date_3
        ].filter(Boolean).join(',');

        const pledge_practices = Object.entries(practiceSelections)
            .filter(([, action]) => action && action.trim())
            .map(([id, action]) => {

                const practice = practices.find(p => String(p.id) === String(id));

                return {
                    practice_id: parseInt(id),
                    selected_action: action,
                    practice_title: practice?.title || '',
                };

            });

        setSubmitting(true);

        try {

            const payload = {

                program_id: parseInt(selectedProgramId),

                problem_statement: sectionA.problem_statement,
                north_star: sectionA.success_metric,
                success_metric: sectionA.success_metric,
                timeline,

                personal_habit: sectionC.personal_habit,
                habit_frequency: sectionC.habit_frequency,
                measure_success: sectionC.measure_success,

                pledge_practices,
                behaviours: filledBehaviours,

                review_dates: reviewDates || null,

                signature_name: sectionE.signature_name,
                signoff_designation: sectionE.signoff_designation,
                digital_signature: sectionE.digital_signature,
                submission_date: sectionE.submission_date || today,

                user_photo: userPhoto,

            };

            // 1️⃣ Save pledge
            const res = await axiosInstance.post('/pledges', payload);

            const pledgeId = res.data?.pledge?.id || res.data?.pledge_id;

            if (!pledgeId) throw new Error("Pledge ID not returned");

            toast.success("Pledge submitted! Generating certificate...");

            // 2️⃣ Get certificate data
            const certRes = await axiosInstance.get(`/pledges/${pledgeId}/certificate-data`);

            const certificateData = certRes.data?.certificate_data;

            if (!certificateData) throw new Error("Certificate data not returned");

            // 3️⃣ Generate PDF
            await generateCertificatePDF(certificateData);

            navigate('/pledge-success');

        } catch (err) {

            console.error("SUBMIT ERROR:", err);

            toast.error(
                err.response?.data?.message ||
                err.message ||
                'Failed to submit pledge'
            );

        } finally {

            setSubmitting(false);

        }

    };


    if (loadingInitial) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (programs.length === 0) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto mt-16 p-12 rounded-[2rem] border text-center shadow-lg" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <Target className="w-16 h-16 mx-auto mb-6 text-blue-500" />
                <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>No Programs Available</h2>
                <p style={{ color: 'var(--text-secondary)' }}>An admin must create a Program before you can sign a pledge.</p>
            </motion.div>
        );
    }

    const sectionHeader = (label, icon, colorClass) => (
        <div className={`flex items-center gap-3 mb-6 pb-4 border-b-2`} style={{ borderBottomColor: `var(--color-${colorClass}-500, #3b82f6)` }}>
            <div className={`p-2 rounded-xl bg-${colorClass}-100 dark:bg-${colorClass}-900/30 text-${colorClass}-600 dark:text-${colorClass}-400`}>
                {icon}
            </div>
            <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{label}</h2>
        </div>
    );

    const inputCls = "w-full border rounded-xl p-3.5 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-transparent placeholder-slate-400 dark:placeholder-slate-500";
    const labelCls = "block text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5";

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-4 lg:p-8 max-w-4xl mx-auto pb-24 space-y-8">
            {/* Page Header */}
            <motion.div variants={itemVariants} className="mb-2">
                <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-black tracking-widest mb-3 rounded-full uppercase border border-blue-200 dark:border-blue-800">
                    Commitment Form
                </span>
                <h1 className="text-3xl lg:text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Sign Your Digital Pledge</h1>
                <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Take structured steps towards digital culture excellence within your organization.</p>
            </motion.div>

            {/* Program Selector */}
            <motion.div variants={itemVariants} className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-6">
                <label className="block text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Select Program *
                </label>
                <select
                    value={selectedProgramId}
                    onChange={e => setSelectedProgramId(e.target.value)}
                    className="w-full border border-blue-200 dark:border-blue-800/50 rounded-xl p-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 shadow-sm"
                >
                    {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* ── SECTION A: Digital North Star ─────────────────────────── */}
                <motion.div variants={itemVariants} className="rounded-3xl border shadow-sm p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    {sectionHeader('A. Digital North Star', <Star className="w-6 h-6" />, 'blue')}
                    <div className="space-y-6">
                        {/* Problem Statement */}
                        <div>
                            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><Type className="w-3.5 h-3.5" /> Problem Statement *</label>
                            <textarea
                                required
                                rows={3}
                                placeholder="What digital culture challenge are you solving?"
                                value={sectionA.problem_statement}
                                onChange={e => setSectionA(p => ({ ...p, problem_statement: e.target.value }))}
                                className={inputCls}
                                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            />
                        </div>

                        {/* Key Success Metric */}
                        <div>
                            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><TrendingUp className="w-3.5 h-3.5" /> Key Success Metric (Baseline → Target) *</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Digital adoption score from 45% to 80%"
                                value={sectionA.success_metric}
                                onChange={e => setSectionA(p => ({ ...p, success_metric: e.target.value }))}
                                className={inputCls}
                                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            />
                        </div>

                        {/* Timeline to Impact */}
                        <div>
                            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><Clock className="w-3.5 h-3.5" /> Timeline to Impact *</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <select
                                        value={sectionA.timeline_quarter}
                                        onChange={e => setSectionA(p => ({ ...p, timeline_quarter: e.target.value }))}
                                        className={`${inputCls} bg-white dark:bg-[#0f172a]`}
                                        style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                    >
                                        <option value="">Quarter…</option>
                                        <option value="Q1">Q1</option>
                                        <option value="Q2">Q2</option>
                                        <option value="Q3">Q3</option>
                                        <option value="Q4">Q4</option>
                                    </select>
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        min="2024"
                                        max="2030"
                                        placeholder="Year e.g. 2026"
                                        value={sectionA.timeline_year}
                                        onChange={e => setSectionA(p => ({ ...p, timeline_year: e.target.value }))}
                                        className={inputCls}
                                        style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── SECTION B: Digital Culture Practices ─────────────────── */}
                <motion.div variants={itemVariants} className="rounded-3xl border shadow-sm p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    {sectionHeader('B. Digital Culture Practices', <Calendar className="w-6 h-6" />, 'emerald')}
                    <p className="text-sm mb-6 font-medium" style={{ color: 'var(--text-tertiary)' }}>
                        Select practices you commit to for each frequency. For each selected practice, choose one action commitment.
                    </p>

                    {practices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed" style={{ borderColor: 'var(--border-color)' }}>
                            <Calendar className="w-10 h-10 mb-3 opacity-30" style={{ color: 'var(--text-tertiary)' }} />
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-tertiary)' }}>No practices configured for this program yet.</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>An admin can add practices from the Admin panel.</p>
                        </div>
                    ) : (<>

                        {/* Weekly */}
                        {weeklyPractices.length > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-200 dark:border-emerald-800">
                                        <Calendar className="w-3 h-3" /> Weekly Practices
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {weeklyPractices.map(pr => (
                                        <PracticeCard
                                            key={pr.id}
                                            practice={pr}
                                            checked={pr.id in practiceSelections}
                                            selectedAction={practiceSelections[pr.id] || ''}
                                            onToggle={() => togglePractice(pr.id)}
                                            onSelectAction={action => selectAction(pr.id, action)}
                                            colorTheme="emerald"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Monthly */}
                        {monthlyPractices.length > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-200 dark:border-indigo-800">
                                        <Calendar className="w-3 h-3" /> Monthly Practices
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${monthlyPractices.filter(p => p.id in practiceSelections).length >= 2 ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'}`}>
                                        {monthlyPractices.filter(p => p.id in practiceSelections).length} / {monthlyPractices.length} (min 2)
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {monthlyPractices.map(pr => (
                                        <PracticeCard
                                            key={pr.id}
                                            practice={pr}
                                            checked={pr.id in practiceSelections}
                                            selectedAction={practiceSelections[pr.id] || ''}
                                            onToggle={() => togglePractice(pr.id)}
                                            onSelectAction={action => selectAction(pr.id, action)}
                                            colorTheme="indigo"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quarterly */}
                        {quarterlyPractices.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-orange-200 dark:border-orange-800">
                                        <Calendar className="w-3 h-3" /> Quarterly Practices
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${quarterlyPractices.filter(p => p.id in practiceSelections).length >= 2 ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'}`}>
                                        {quarterlyPractices.filter(p => p.id in practiceSelections).length} / {quarterlyPractices.length} (min 2)
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {quarterlyPractices.map(pr => (
                                        <PracticeCard
                                            key={pr.id}
                                            practice={pr}
                                            checked={pr.id in practiceSelections}
                                            selectedAction={practiceSelections[pr.id] || ''}
                                            onToggle={() => togglePractice(pr.id)}
                                            onSelectAction={action => selectAction(pr.id, action)}
                                            colorTheme="orange"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>)}
                </motion.div>

                {/* ── SECTION C: My Own Digital Habit ──────────────────────── */}
                <motion.div variants={itemVariants} className="rounded-3xl border shadow-sm p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    {sectionHeader('C. My Own Digital Habit', <Target className="w-6 h-6" />, 'violet')}
                    <div className="space-y-6">
                        <div>
                            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><Edit3 className="w-3.5 h-3.5" /> Habit Description *</label>
                            <textarea
                                required
                                rows={3}
                                placeholder="Describe the specific digital habit you will develop…"
                                value={sectionC.personal_habit}
                                onChange={e => setSectionC(p => ({ ...p, personal_habit: e.target.value }))}
                                className={inputCls}
                                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><Repeat className="w-3.5 h-3.5" /> Frequency</label>
                                <select
                                    value={sectionC.habit_frequency}
                                    onChange={e => setSectionC(p => ({ ...p, habit_frequency: e.target.value }))}
                                    className={`${inputCls} bg-white dark:bg-[#0f172a]`}
                                    style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                >
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><TrendingUp className="w-3.5 h-3.5" /> How I Will Measure Success</label>
                                <input
                                    type="text"
                                    placeholder="KPI / observable outcome…"
                                    value={sectionC.measure_success}
                                    onChange={e => setSectionC(p => ({ ...p, measure_success: e.target.value }))}
                                    className={inputCls}
                                    style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── SECTION D: Key Digital Behaviours ────────────────────── */}
                <motion.div variants={itemVariants} className="rounded-3xl border shadow-sm p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    {sectionHeader('D. Key Digital Behaviours', <Repeat className="w-6 h-6" />, 'rose')}
                    <p className="text-sm font-medium mb-6" style={{ color: 'var(--text-tertiary)' }}>Add behaviours you will start, reduce, or stop. Maximum 5 rows.</p>

                    <div className="hidden md:grid grid-cols-[2fr_1fr_2fr_1fr_auto] gap-4 mb-3 px-3">
                        {['Behaviour', 'Start / Reduce / Stop', 'Why it matters', 'First Action by Date', ''].map(h => (
                            <span key={h} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>{h}</span>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {behaviours.map((b, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={`border rounded-2xl p-4 transition-all ${b.type === 'start' ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-900/10' : b.type === 'reduce' ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-900/10' : 'border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-900/10'}`}>
                                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_2fr_1fr_auto] gap-4 items-start">
                                    <div>
                                        <label className="md:hidden block text-[10px] font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>Behaviour</label>
                                        <input
                                            type="text"
                                            placeholder="Describe the behaviour…"
                                            value={b.behaviour_text}
                                            onChange={e => updateBehaviour(idx, 'behaviour_text', e.target.value)}
                                            className={`${inputCls} bg-white dark:bg-[#0f172a] shadow-sm`}
                                            style={{ color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="md:hidden block text-[10px] font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>Type</label>
                                        <select
                                            value={b.type}
                                            onChange={e => updateBehaviour(idx, 'type', e.target.value)}
                                            className={`${inputCls} bg-white dark:bg-[#0f172a] font-semibold shadow-sm`}
                                            style={{ color: 'var(--text-primary)' }}
                                        >
                                            <option value="start">🟢 Start</option>
                                            <option value="reduce">🟡 Reduce</option>
                                            <option value="stop">🔴 Stop</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="md:hidden block text-[10px] font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>Why it matters</label>
                                        <input
                                            type="text"
                                            placeholder="Impact on goals…"
                                            value={b.why_it_matters}
                                            onChange={e => updateBehaviour(idx, 'why_it_matters', e.target.value)}
                                            className={`${inputCls} bg-white dark:bg-[#0f172a] shadow-sm`}
                                            style={{ color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="md:hidden block text-[10px] font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>First action by date</label>
                                        <input
                                            type="date"
                                            value={b.first_action_date}
                                            onChange={e => updateBehaviour(idx, 'first_action_date', e.target.value)}
                                            className={`${inputCls} bg-white dark:bg-[#0f172a] shadow-sm`}
                                            style={{ color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeBehaviour(idx)}
                                        disabled={behaviours.length === 1}
                                        className="self-center p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {behaviours.length < 5 && (
                        <button
                            type="button"
                            onClick={addBehaviour}
                            className="mt-6 flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors py-2 px-4 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                            <Plus className="w-4 h-4" /> Add another behaviour
                        </button>
                    )}
                </motion.div>

                {/* ── SECTION E: Review and Sign-off ───────────────────────── */}
                <motion.div variants={itemVariants} className="rounded-3xl border shadow-sm p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    {sectionHeader('E. Review and Sign-off', <PenLine className="w-6 h-6" />, 'amber')}
                    <div className="space-y-6">

                        {/* Self-review check-in dates */}
                        <div>
                            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><CalendarCheck className="w-3.5 h-3.5" /> Self-Review Check-in Dates (up to 3)</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {['review_date_1', 'review_date_2', 'review_date_3'].map((key, i) => (
                                    <div key={key}>
                                        <span className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Check-in {i + 1}</span>
                                        <input
                                            type="date"
                                            value={sectionE[key]}
                                            onChange={e => setSectionE(p => ({ ...p, [key]: e.target.value }))}
                                            className={`${inputCls} bg-white dark:bg-[#0f172a]`}
                                            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Name + Designation */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><User className="w-3.5 h-3.5" /> Name *</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Your full name"
                                    value={sectionE.signature_name}
                                    onChange={e => setSectionE(p => ({ ...p, signature_name: e.target.value }))}
                                    className={inputCls}
                                    style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                />
                            </div>
                            <div>
                                <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><Briefcase className="w-3.5 h-3.5" /> Designation</label>
                                <input
                                    type="text"
                                    placeholder="Your job title / role"
                                    value={sectionE.signoff_designation}
                                    onChange={e => setSectionE(p => ({ ...p, signoff_designation: e.target.value }))}
                                    className={inputCls}
                                    style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                />
                            </div>
                        </div>

                        {/* Digital Signature */}
                        <div>
                            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><PenLine className="w-3.5 h-3.5" /> Digital Signature *</label>
                            <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-tertiary)' }}>Type your full name below as your digital signature affirming your commitment to this pledge.</p>
                            <input
                                required
                                type="text"
                                placeholder="Type your full name to sign…"
                                value={sectionE.digital_signature}
                                onChange={e => setSectionE(p => ({ ...p, digital_signature: e.target.value }))}
                                className={`${inputCls} font-semibold italic`}
                                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            />
                        </div>

                        {/* Submission Date */}
                        <div className="md:w-1/2">
                            <label className={labelCls} style={{ color: 'var(--text-secondary)' }}><Calendar className="w-3.5 h-3.5" /> Submission Date</label>
                            <input
                                type="date"
                                value={sectionE.submission_date}
                                onChange={e => setSectionE(p => ({ ...p, submission_date: e.target.value }))}
                                className={`${inputCls} bg-white dark:bg-[#0f172a]`}
                                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* ── SECTION F: Participant Photo ─────────────────────────── */}
                <motion.div variants={itemVariants} className="rounded-3xl border shadow-sm p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                    {sectionHeader('F. Participant Photo', <User className="w-6 h-6" />, 'indigo')}

                    <div className="flex flex-col md:flex-row items-start gap-8">
                        {/* Preview Area */}
                        <div className="shrink-0 flex flex-col items-center gap-4">
                            <div className="w-40 h-40 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden relative" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                                {userPhoto ? (
                                    <img src={userPhoto} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center p-4">
                                        <User className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">No Photo</span>
                                    </div>
                                )}
                            </div>

                            {userPhoto && (
                                <button
                                    type="button"
                                    onClick={removePhoto}
                                    className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Remove
                                </button>
                            )}
                        </div>

                        {/* Upload Controls */}
                        <div className="flex-1 w-full space-y-4">
                            <div>
                                <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Upload your photo for the certificate</h3>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                    This photo will be displayed prominently on your generated Digital Culture Pledge Certificate.
                                </p>
                            </div>

                            <ul className="text-sm space-y-2 mb-6" style={{ color: 'var(--text-tertiary)' }}>
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-indigo-500" /> Professional headshot recommended</li>
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-indigo-500" /> Max file size: 2MB</li>
                                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-indigo-500" /> Allowed formats: JPG, PNG</li>
                            </ul>

                            <div className="relative inline-block">
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg"
                                    onChange={handlePhotoUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="px-6 py-2.5 rounded-xl font-bold text-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {userPhoto ? 'Replace Photo' : 'Select Photo'}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── Submit Bar ───────────────────────────────────────────── */}
                <motion.div variants={itemVariants} className="sticky bottom-6 z-20">
                    <div className="backdrop-blur-xl border rounded-[2rem] shadow-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', opacity: 0.95 }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                <Save className="w-5 h-5" />
                            </div>
                            <div className="text-sm font-medium hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                                A stunning PDF certificate will be generated upon submission.
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-blue-900/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {submitting ? (
                                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                            ) : (
                                <>Submit Pledge <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </div>
                </motion.div>

            </form>
        </motion.div>
    );
};

// ─── Practice Card Sub-component ─────────────────────────────────────────────
const PracticeCard = ({ practice, checked, selectedAction, onToggle, onSelectAction, colorTheme }) => {
    const tMap = {
        emerald: { border: 'border-emerald-200 dark:border-emerald-800', bg: 'bg-emerald-50 dark:bg-emerald-900/10', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-100 dark:bg-emerald-900/40', radio: 'accent-emerald-600' },
        indigo: { border: 'border-indigo-200 dark:border-indigo-800', bg: 'bg-indigo-50 dark:bg-indigo-900/10', text: 'text-indigo-700 dark:text-indigo-400', badge: 'bg-indigo-100 dark:bg-indigo-900/40', radio: 'accent-indigo-600' },
        orange: { border: 'border-orange-200 dark:border-orange-800', bg: 'bg-orange-50 dark:bg-orange-900/10', text: 'text-orange-700 dark:text-orange-400', badge: 'bg-orange-100 dark:bg-orange-900/40', radio: 'accent-orange-600' },
    };

    const c = tMap[colorTheme] || tMap.emerald;
    const actions = Array.isArray(practice.actions) ? practice.actions : [];

    return (
        <div className={`border rounded-2xl transition-all ${checked ? `${c.border} ${c.bg}` : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-[#0f172a]'}`}>
            <label className="flex items-center gap-4 p-5 cursor-pointer group">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onToggle}
                    className={`w-5 h-5 rounded border-slate-300 dark:border-slate-700 ${c.radio} cursor-pointer transition-transform group-active:scale-90`}
                />
                <div className="flex-1">
                    <span className="font-bold text-sm tracking-wide" style={{ color: 'var(--text-primary)' }}>{practice.title}</span>
                    <span className={`ml-3 text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${c.badge} ${c.text}`}>{practice.type}</span>
                </div>
            </label>

            <motion.div animate={{ height: checked ? 'auto' : 0, opacity: checked ? 1 : 0 }} className="overflow-hidden">
                {checked && actions.length > 0 && (
                    <div className="px-5 pb-5 pl-14">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                            <CheckCircle className="w-3.5 h-3.5" /> Select your committed action:
                        </p>
                        <div className="space-y-3">
                            {actions.map((action, idx) => (
                                <label
                                    key={idx}
                                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedAction === action ? `border-transparent shadow-md bg-white dark:bg-slate-800 ring-2 ring-${colorTheme}-500/50` : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                >
                                    <input
                                        type="radio"
                                        name={`practice_${practice.id}`}
                                        checked={selectedAction === action}
                                        onChange={() => onSelectAction(action)}
                                        className={`mt-0.5 w-4 h-4 cursor-pointer transition-all ${c.radio}`}
                                    />
                                    <span className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>{action}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default PledgePage;
