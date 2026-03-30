/**
 * Simulatore Decumulo Patrimoniale
 * Professional Financial Tool
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    const state = {
        withdrawalFreq: 'mensile', // 'mensile' | 'annuale'
        contributionFreq: 'mensile', // 'mensile' | 'annuale'
        viewMode: 'nom', // 'nom' | 'real'
        dati: null,
        scenarios: {
            p: { rend: 3, infl: 2.0, cost: 1.0 },
            b: { rend: 5, infl: 2.5, cost: 1.5 },
            s: { rend: 2, infl: 4.0, cost: 2.0 }
        }
    };

    // --- ELEMENTS ---
    const elements = {
        inputs: {
            cap: document.getElementById('v-cap'),
            capSld: document.getElementById('s-cap'),
            anni: document.getElementById('v-anni'),
            anniSld: document.getElementById('s-anni'),
            rend: document.getElementById('v-rend'),
            rendSld: document.getElementById('s-rend'),
            infl: document.getElementById('v-infl'),
            inflSld: document.getElementById('s-infl'),
            cost: document.getElementById('v-costi'),
            costSld: document.getElementById('s-costi'),
            prel: document.getElementById('v-prel'),
            prelSld: document.getElementById('s-prel'),
            conf: document.getElementById('v-conf'),
            confSld: document.getElementById('s-conf'),
            tipoPrel: document.getElementById('tipo-prel')
        },
        controls: {
            btnRun: document.getElementById('btn-run'),
            btnReset: document.getElementById('btn-reset'),
            btnVista: document.getElementById('btn-vista'),
            btnCSV: document.getElementById('btn-csv'),
            scP: document.getElementById('scn-p'),
            scB: document.getElementById('scn-b'),
            scS: document.getElementById('scn-s'),
            pmM: document.getElementById('pm-m'),
            pmA: document.getElementById('pm-a'),
            cmM: document.getElementById('cm-m'),
            cmA: document.getElementById('cm-a')
        },
        results: {
            cap0: document.getElementById('r-cap0'),
            tasso: document.getElementById('r-tasso'),
            durata: document.getElementById('r-durata'),
            finNom: document.getElementById('r-fin-nom'),
            finReal: document.getElementById('r-fin-real'),
            totPrel: document.getElementById('r-tot-prel'),
            totCosti: document.getElementById('r-costi'),
            erosione: document.getElementById('r-erosione')
        },
        ui: {
            semaforo: document.getElementById('semaforo'),
            semText: document.getElementById('sem-text'),
            prelUnit: document.getElementById('prel-unit'),
            prelNote: document.getElementById('prel-note'),
            legHead: document.getElementById('leghead'),
            legBody: document.getElementById('legbody'),
            legArr: document.getElementById('legarr')
        },
        charts: {
            cv1: document.getElementById('cv1'),
            cv2: document.getElementById('cv2')
        }
    };

    // --- INITIALIZATION ---
    function init() {
        attachEventListeners();
        setScenario('b');
        calculate();
    }

    function attachEventListeners() {
        // Sync Inputs (Value and Range)
        setupSync('cap', 'capSld');
        setupSync('anni', 'anniSld');
        setupSync('rend', 'rendSld');
        setupSync('infl', 'inflSld');
        setupSync('cost', 'costSld');
        setupSync('prel', 'prelSld');
        setupSync('conf', 'confSld');

        // Button Clicks
        elements.controls.btnRun.addEventListener('click', calculate);
        elements.controls.btnReset.addEventListener('click', resetSimulator);
        elements.controls.btnVista.addEventListener('click', toggleViewMode);
        elements.controls.btnCSV.addEventListener('click', exportCSV);

        // Scenarios
        elements.controls.scP.addEventListener('click', () => setScenario('p'));
        elements.controls.scB.addEventListener('click', () => setScenario('b'));
        elements.controls.scS.addEventListener('click', () => setScenario('s'));

        // Withdrawal Toggle
        elements.controls.pmM.addEventListener('click', () => setWithdrawalFreq('mensile'));
        elements.controls.pmA.addEventListener('click', () => setWithdrawalFreq('annuale'));

        // Contribution Toggle
        elements.controls.cmM.addEventListener('click', () => setContributionFreq('mensile'));
        elements.controls.cmA.addEventListener('click', () => setContributionFreq('annuale'));

        // Strategy Select
        elements.inputs.tipoPrel.addEventListener('change', updateWithdrawalUI);

        // UI Helpers
        elements.ui.legHead.addEventListener('click', toggleGuide);
    }

    // --- CORE LOGIC ---

    function setupSync(valId, sldId) {
        const valEl = elements.inputs[valId];
        const sldEl = elements.inputs[sldId];
        
        valEl.addEventListener('input', () => {
            let val = parseFloat(valEl.value);
            if (!isNaN(val)) {
                sldEl.value = Math.min(Math.max(val, sldEl.min), sldEl.max);
            }
        });

        sldEl.addEventListener('input', () => {
            valEl.value = sldEl.value;
        });
    }

    function setScenario(k) {
        const sc = state.scenarios[k];
        elements.inputs.rend.value = sc.rend;
        elements.inputs.rendSld.value = sc.rend;
        elements.inputs.infl.value = sc.infl;
        elements.inputs.inflSld.value = sc.infl;
        elements.inputs.cost.value = sc.cost;
        elements.inputs.costSld.value = sc.cost;

        [elements.controls.scP, elements.controls.scB, elements.controls.scS].forEach(b => b.classList.remove('on'));
        elements.controls[`sc${k.toUpperCase()}`].classList.add('on');
    }

    function setWithdrawalFreq(f) {
        state.withdrawalFreq = f;
        elements.controls.pmM.className = `tt${f === 'mensile' ? ' on' : ''}`;
        elements.controls.pmA.className = `tt${f === 'annuale' ? ' on' : ''}`;
        calculate();
    }

    function setContributionFreq(f) {
        state.contributionFreq = f;
        elements.controls.cmM.className = `tt${f === 'mensile' ? ' on' : ''}`;
        elements.controls.cmA.className = `tt${f === 'annuale' ? ' on' : ''}`;
        calculate();
    }

    function updateWithdrawalUI() {
        const type = elements.inputs.tipoPrel.value;
        const unit = elements.ui.prelUnit;
        const inp = elements.inputs.prel;
        const sld = elements.inputs.prelSld;
        const note = elements.ui.prelNote;

        if (type === 'percentuale') {
            unit.textContent = '%';
            inp.max = 20; inp.step = 0.1; inp.min = 0;
            if (parseFloat(inp.value) > 20) inp.value = 4;
            sld.max = 15; sld.step = 0.1;
            sld.value = inp.value;
            note.style.display = 'block';
        } else {
            unit.textContent = '€';
            inp.max = 500000; inp.step = 100; inp.min = 0;
            if (parseFloat(inp.value) <= 20) inp.value = 2000;
            sld.max = 30000; sld.step = 100;
            sld.value = Math.min(parseFloat(inp.value) || 0, 30000);
            note.style.display = 'none';
        }
    }

    function formatCurrency(x) {
        const absVal = Math.abs(x);
        if (absVal >= 1000000) return `€ ${(x / 1000000).toFixed(2).replace('.', ',')} M`;
        if (absVal >= 1000) return `€ ${Math.round(x / 1000)}k`;
        return `€ ${Math.round(x)}`;
    }

    function calculate() {
        const cap0 = parseFloat(elements.inputs.cap.value) || 0;
        const years = parseInt(elements.inputs.anni.value) || 1;
        const rend = (parseFloat(elements.inputs.rend.value) || 0) / 100;
        const infl = (parseFloat(elements.inputs.infl.value) || 0) / 100;
        const cost = (parseFloat(elements.inputs.cost.value) || 0) / 100;
        const withdrawalInput = parseFloat(elements.inputs.prel.value) || 0;
        const contributionInput = parseFloat(elements.inputs.conf.value) || 0;
        const strategy = elements.inputs.tipoPrel.value;

        const withdrawalM = state.withdrawalFreq === 'mensile' ? withdrawalInput : withdrawalInput / 12;
        const contributionM = state.contributionFreq === 'mensile' ? contributionInput : contributionInput / 12;

        const rm = Math.pow(1 + rend, 1 / 12) - 1;
        const im = Math.pow(1 + infl, 1 / 12) - 1;
        const cm = Math.pow(1 + cost, 1 / 12) - 1;

        let cap = cap0;
        let capNoCost = cap0;
        let runningWithdrawal = withdrawalM;
        let totalMonths = years * 12;
        let totalWithdrawn = 0;
        let totalContribution = 0;
        let totalCosts = 0;
        let depletionMonth = -1;
        let inflCum = 1;

        const seriesNom = [cap0];
        const seriesReal = [cap0];
        const seriesYears = [0];

        for (let m = 1; m <= totalMonths; m++) {
            // -- REAL PORTFOLIO WITH COSTS --
            if (cap > 0) {
                cap += contributionM;
                totalContribution += contributionM;
                cap += cap * rm;
                
                const currentCost = cap * cm;
                cap -= currentCost;
                totalCosts += currentCost;

                // Adjust withdrawal based on strategy
                if (strategy === 'percentuale') {
                    runningWithdrawal = cap * (withdrawalInput / 100 / 12);
                } else if (strategy === 'indicizzato' && m % 12 === 0) {
                    runningWithdrawal *= (1 + infl);
                }

                const amountToWithdraw = Math.min(cap, runningWithdrawal);
                cap -= amountToWithdraw;
                totalWithdrawn += amountToWithdraw;

                if (cap <= 0) {
                    cap = 0;
                    if (depletionMonth < 0) depletionMonth = m;
                }
            }

            // -- REFERENCE PORTFOLIO (NO COSTS) --
            if (capNoCost > 0) {
                capNoCost += contributionM;
                capNoCost += capNoCost * rm;
                let refWith;
                if (strategy === 'percentuale') refWith = capNoCost * (withdrawalInput / 100 / 12);
                else refWith = runningWithdrawal; // Approximation for simplicity
                capNoCost -= Math.min(capNoCost, refWith);
                if (capNoCost < 0) capNoCost = 0;
            }

            inflCum *= (1 + im);

            if (m % 12 === 0) {
                seriesNom.push(cap);
                seriesReal.push(cap / inflCum);
                seriesYears.push(m / 12);
            }
        }

        const capFinalNom = cap;
        const capFinalReal = cap / inflCum;
        const costImpact = Math.max(0, capNoCost - capFinalNom);
        const inflationErosion = Math.max(0, capFinalNom - capFinalReal);
        const withdrawalRate = strategy === 'percentuale' ? withdrawalInput : (withdrawalM * 12 / cap0 * 100);
        const actualDuration = depletionMonth > 0 ? (depletionMonth / 12) : years;

        state.dati = {
            cap0, years, capFinalNom, capFinalReal, totalWithdrawn, 
            totalContribution, costImpact, inflationErosion, 
            withdrawalRate, actualDuration, depletionMonth,
            seriesNom, seriesReal, seriesYears
        };

        updateUI();
        drawAllCharts();
    }

    function updateUI() {
        const d = state.dati;
        elements.results.cap0.textContent = formatCurrency(d.cap0);
        elements.results.tasso.textContent = d.withdrawalRate.toFixed(1) + '%';
        elements.results.durata.innerHTML = d.depletionMonth > 0 ? 
            `${d.actualDuration.toFixed(1)} anni 🔴` : 
            `${d.years} anni+ ✅`;
        
        elements.results.finNom.textContent = formatCurrency(d.capFinalNom);
        elements.results.finReal.textContent = formatCurrency(d.capFinalReal);
        elements.results.totPrel.textContent = formatCurrency(d.totalWithdrawn);
        elements.results.totCosti.textContent = formatCurrency(d.costImpact);
        elements.results.erosione.textContent = formatCurrency(d.inflationErosion);

        // Status "Semaforo" logic (FIX#7: consider fragility)
        const sem = elements.ui.semaforo;
        const txt = elements.ui.semText;
        const margin = d.capFinalNom / d.cap0;
        const t6 = d.withdrawalRate <= 6;
        sem.className = 'semaforo';

        if (d.depletionMonth > 0) {
            sem.classList.add('sem-r');
            txt.innerHTML = `<strong>Piano non sostenibile.</strong> Il patrimonio si esaurisce dopo circa ${d.actualDuration.toFixed(1)} anni. Riduci i prelievi o aumenta i versamenti.`;
        } else if (margin < 0.15 || !t6) {
            sem.classList.add('sem-g');
            txt.innerHTML = `<strong>Piano fragile.</strong> Il patrimonio regge ma con margini ridotti o un tasso di prelievo elevato (${d.withdrawalRate.toFixed(1)}%). Considera una riserva di sicurezza.`;
        } else {
            sem.classList.add('sem-v');
            txt.innerHTML = `<strong>Piano sostenibile.</strong> Il patrimonio è solido e supporta l'intero orizzonte con un residuo reale di ${formatCurrency(d.capFinalReal)}. Tasso prelievo: ${d.withdrawalRate.toFixed(1)}%.`;
        }
    }

    // --- CHARTS (Custom High DPI Canvas) ---

    function drawAllCharts() {
        if (!state.dati) return;
        drawLineChart();
        drawBarChart();
    }

    function drawLineChart() {
        const d = state.dati;
        const cv = elements.charts.cv1;
        const ctx = cv.getContext('2d');
        const dpr = window.devicePixelRatio || 2;
        
        const rect = cv.parentElement.getBoundingClientRect();
        const W = rect.width - 48; // Padding
        const H = 320;

        cv.width = W * dpr;
        cv.height = H * dpr;
        cv.style.width = W + 'px';
        cv.style.height = H + 'px';
        ctx.scale(dpr, dpr);

        const pad = { t: 40, r: 20, b: 50, l: 70 };
        const cW = W - pad.l - pad.r;
        const cH = H - pad.t - pad.b;

        const maxVal = Math.max(...d.seriesNom) * 1.1 || 1000;
        
        const xPos = (i) => pad.l + (i / d.years) * cW;
        const yPos = (v) => pad.t + cH - (Math.max(0, v) / maxVal) * cH;

        ctx.clearRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = '#1e2d50';
        ctx.lineWidth = 1;
        ctx.textAlign = 'right';
        ctx.fillStyle = '#4a5a80';
        ctx.font = '10px Inter';

        for (let i = 0; i <= 4; i++) {
            const val = (maxVal * i) / 4;
            const y = yPos(val);
            ctx.beginPath();
            ctx.moveTo(pad.l, y);
            ctx.lineTo(pad.l + cW, y);
            ctx.stroke();
            ctx.fillText(formatCurrency(val), pad.l - 10, y + 4);
        }

        // X Axis labels
        ctx.textAlign = 'center';
        const yearStep = Math.max(1, Math.ceil(d.years / 5));
        for (let i = 0; i <= d.years; i += yearStep) {
            ctx.fillText(i + 'a', xPos(i), pad.t + cH + 20);
        }

        const currentSeries = state.viewMode === 'nom' ? d.seriesNom : d.seriesReal;
        const bgSeries = state.viewMode === 'nom' ? d.seriesReal : d.seriesNom;

        // Background (other) series - dashed
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(245, 255, 133, 0.2)';
        ctx.moveTo(xPos(0), yPos(bgSeries[0]));
        for (let i = 1; i < bgSeries.length; i++) ctx.lineTo(xPos(i), yPos(bgSeries[i]));
        ctx.stroke();
        ctx.setLineDash([]);

        // Main Series Fill
        ctx.beginPath();
        ctx.moveTo(xPos(0), pad.t + cH);
        for (let i = 0; i < currentSeries.length; i++) ctx.lineTo(xPos(i), yPos(currentSeries[i]));
        ctx.lineTo(xPos(currentSeries.length - 1), pad.t + cH);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + cH);
        grad.addColorStop(0, 'rgba(245, 255, 133, 0.1)');
        grad.addColorStop(1, 'rgba(245, 255, 133, 0)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Main Series Line
        ctx.beginPath();
        ctx.strokeStyle = '#f5ff85';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.moveTo(xPos(0), yPos(currentSeries[0]));
        for (let i = 1; i < currentSeries.length; i++) ctx.lineTo(xPos(i), yPos(currentSeries[i]));
        ctx.stroke();

        // Depletion Line (FIX#4)
        if (d.depletionMonth > 0 && d.actualDuration <= d.years) {
            const dx = xPos(d.actualDuration);
            ctx.beginPath();
            ctx.strokeStyle = '#e05a5a';
            ctx.setLineDash([4, 4]);
            ctx.moveTo(dx, pad.t);
            ctx.lineTo(dx, pad.t + cH);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#e05a5a';
            ctx.font = 'bold 10px Inter';
            ctx.fillText(`Esaurito a ${d.actualDuration.toFixed(1)}a`, dx, pad.t - 15);
        }
    }

    function drawBarChart() {
        const d = state.dati;
        const cv = elements.charts.cv2;
        const ctx = cv.getContext('2d');
        const dpr = window.devicePixelRatio || 2;
        
        const rect = cv.parentElement.getBoundingClientRect();
        const W = rect.width - 48;
        const H = 240;

        cv.width = W * dpr;
        cv.height = H * dpr;
        cv.style.width = W + 'px';
        cv.style.height = H + 'px';
        ctx.scale(dpr, dpr);

        const pad = { t: 30, r: 20, b: 40, l: 70 };
        const cW = W - pad.l - pad.r;
        const cH = H - pad.t - pad.b;

        const items = [
            { label: 'Tot. Prelevato', val: d.totalWithdrawn, color: '#4ade80' },
            { label: 'Costi Totali', val: d.costImpact, color: '#e05a5a' },
            { label: 'Erosione Infl.', val: d.inflationErosion, color: '#f59e0b' },
            { label: 'Residuo Nom.', val: d.capFinalNom, color: '#f5ff85' }
        ];

        const maxVal = Math.max(...items.map(it => it.val)) * 1.2 || 1000;
        const barW = (cW / items.length) * 0.6;
        const gap = cW / items.length;

        ctx.clearRect(0, 0, W, H);

        items.forEach((it, i) => {
            const x = pad.l + gap * i + gap / 2;
            const bh = Math.max(0, (it.val / maxVal) * cH); // FIX#6: handle zeroes
            const y = pad.t + cH - bh;

            // Bar Shadow/Glow
            if (bh > 0) {
                ctx.fillStyle = it.color + '22';
                ctx.fillRect(x - barW / 2, y, barW, bh);
                
                // Bar Cap
                ctx.fillStyle = it.color;
                ctx.fillRect(x - barW / 2, y, barW, 4);
            }

            // Label Val
            ctx.fillStyle = it.color;
            ctx.font = 'bold 11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(formatCurrency(it.val), x, Math.max(pad.t + 12, y - 8));

            // Label X
            ctx.fillStyle = '#4a5a80';
            ctx.font = '10px Inter';
            ctx.fillText(it.label, x, pad.t + cH + 20);
        });
    }

    // --- SECONDARY ACTIONS ---

    function resetSimulator() {
        elements.inputs.cap.value = 500000;
        elements.inputs.capSld.value = 500000;
        elements.inputs.anni.value = 25;
        elements.inputs.anniSld.value = 25;
        elements.inputs.prel.value = 2000;
        elements.inputs.prelSld.value = 2000;
        elements.inputs.conf.value = 0;
        elements.inputs.confSld.value = 0;
        elements.inputs.tipoPrel.value = 'fisso';
        
        setWithdrawalFreq('mensile');
        setContributionFreq('mensile');
        setScenario('b');
        updateWithdrawalUI();
        calculate();
    }

    function toggleViewMode() {
        state.viewMode = state.viewMode === 'nom' ? 'real' : 'nom';
        elements.controls.btnVista.textContent = `Vista: ${state.viewMode === 'nom' ? 'Nominale' : 'Reale'}`;
        elements.controls.btnVista.classList.toggle('active-vista', state.viewMode === 'real');
        drawLineChart();
    }

    function exportCSV() {
        const d = state.dati;
        if (!d) return;

        let csv = 'Anno;Valore Nominale;Valore Reale\n';
        for (let i = 0; i < d.seriesNom.length; i++) {
            csv += `${d.seriesYears[i]};${Math.round(d.seriesNom[i])};${Math.round(d.seriesReal[i])}\n`;
        }

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'decumulo_rdo.csv');
        link.click();
    }

    function toggleGuide() {
        const isShown = elements.ui.legBody.style.display === 'block';
        elements.ui.legBody.style.display = isShown ? 'none' : 'block';
        elements.ui.legArr.textContent = isShown ? '▼' : '▲';
    }

    function toggleGuide() {
        const isShown = elements.ui.legBody.style.display === 'block';
        elements.ui.legBody.style.display = isShown ? 'none' : 'block';
        elements.ui.legArr.textContent = isShown ? '▼' : '▲';
    }

    // Responsive charts
    window.addEventListener('resize', () => {
        if (state.dati) drawAllCharts();
    });

    // Start!
    init();
});
