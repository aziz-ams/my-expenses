let db = JSON.parse(localStorage.getItem("PRO_DB_V2")) || [];
let cfg = JSON.parse(localStorage.getItem("PRO_CFG_V2")) || { dark: false, token: '', chat: '' };
let chart = null;
let currentFileData = null;

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    document.getElementById('fDate').valueAsDate = new Date();
    document.getElementById('tgToken').value = cfg.token;
    document.getElementById('tgID').value = cfg.chat;
});

function showView(id, btn) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
    if(id === 'list-page') renderList();
    if(id === 'report-page') renderChart();
}

// معالجة الملفات (PDF أو صور)
async function handleFileUI() {
    const file = document.getElementById('fFile').files[0];
    if(file) {
        const isPdf = file.type === "application/pdf";
        document.getElementById('file-label').innerHTML = `✅ ${isPdf ? 'PDF' : 'صورة'}: ${file.name.substring(0,10)}...`;
        
        currentFileData = await new Promise(r => {
            const reader = new FileReader();
            reader.onload = () => r({
                name: file.name,
                type: file.type,
                data: reader.result
            });
            reader.readAsDataURL(file);
        });
    }
}

function saveData() {
    const amt = document.getElementById('fAmt').value;
    if(!amt) return alert("أدخل المبلغ");

    const item = {
        id: Date.now(),
        amt: parseFloat(amt),
        note: document.getElementById('fNote').value || "بدون بيان",
        cat: document.getElementById('fCat').value || "عام",
        date: document.getElementById('fDate').value,
        fileInfo: currentFileData // حفظ بيانات الملف كاملة
    };

    db.push(item);
    localStorage.setItem("PRO_DB_V2", JSON.stringify(db));

    // إعادة ضبط الحقول
    document.getElementById('fAmt').value = '';
    document.getElementById('fNote').value = '';
    currentFileData = null;
    document.getElementById('file-label').innerHTML = `<i class="fas fa-file-invoice"></i> <span>إرفاق فاتورة (Image/PDF)</span>`;
    
    alert("تم الحفظ بنجاح ⚡");
}

function renderList() {
    const container = document.getElementById('list-container');
    container.innerHTML = db.slice().reverse().map(i => `
        <div class="history-card">
            <div class="h-info">
                <h4>${i.note}</h4>
                <p>${i.date} • ${i.cat}</p>
            </div>
            <div style="display:flex; align-items:center; gap:15px">
                ${i.fileInfo ? `<button onclick="viewDoc('${i.id}')" style="background:none; border:none; color:var(--p); font-size:18px;"><i class="fas fa-paperclip"></i></button>` : ''}
                <div class="h-amt">${i.amt}</div>
            </div>
        </div>
    `).join('');
}

// وظيفة معاينة الملف (يفتح في نافذة جديدة)
function viewDoc(id) {
    const item = db.find(x => x.id == id);
    if(item && item.fileInfo) {
        const newWin = window.open();
        if(item.fileInfo.type === "application/pdf") {
            newWin.document.write(`<iframe src="${item.fileInfo.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        } else {
            newWin.document.write(`<img src="${item.fileInfo.data}" style="max-width:100%">`);
        }
    }
}

// بقية الوظائف (Excel, Telegram, Chart) تبقى كما هي في الكود السابق...
function exportExcel() {
    let csv = "\uFEFFالتاريخ,البيان,التصنيف,المبلغ\n";
    db.forEach(i => csv += `${i.date},${i.note},${i.cat},${i.amt}\n`);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير_${new Date().toLocaleDateString()}.csv`;
    link.click();
}

async function sendToTelegram() {
    if(!cfg.token || !cfg.chat) return alert("اضبط التليجرام أولاً");
    let msg = "📊 تقرير مصروفات:\n";
    db.slice(-3).forEach(i => msg += `🔹 ${i.note}: ${i.amt} SAR\n`);
    fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage?chat_id=${cfg.chat}&text=${encodeURIComponent(msg)}`);
    alert("تم الإرسال");
}

function saveSettings() {
    cfg.token = document.getElementById('tgToken').value;
    cfg.chat = document.getElementById('tgID').value;
    localStorage.setItem("PRO_CFG_V2", JSON.stringify(cfg));
    alert("تم الحفظ");
}

function renderChart() {
    const ctx = document.getElementById('myChart');
    const cats = [...new Set(db.map(i => i.cat))];
    const data = cats.map(c => db.filter(i => i.cat === c).reduce((s, x) => s + x.amt, 0));
    if(chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: cats, datasets: [{ data: data, backgroundColor: ['#5856d6', '#ff2d55', '#34c759', '#ff9500'] }] },
        options: { cutout: '75%', plugins: { legend: { position: 'bottom' } } }
    });
}

function toggleTheme() {
    cfg.dark = !cfg.dark;
    applyTheme();
    localStorage.setItem("PRO_CFG_V2", JSON.stringify(cfg));
}

function applyTheme() {
    document.body.className = cfg.dark ? 'dark-mode' : 'light-mode';
    document.getElementById('theme-indicator').innerText = cfg.dark ? '🌞' : '🌑';
}