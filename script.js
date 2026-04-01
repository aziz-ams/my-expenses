// مصفوفة البيانات الأساسية - لا تُمحى بفضل localStorage
let db = JSON.parse(localStorage.getItem("PRO_DATA")) || [];
let settings = JSON.parse(localStorage.getItem("PRO_SET")) || { theme: 'light', tgT: '', tgI: '' };
let chartObj = null;

// تشغيل عند البدء
document.addEventListener('DOMContentLoaded', () => {
    document.body.className = settings.theme + '-mode';
    document.getElementById('fDate').valueAsDate = new Date();
    document.getElementById('tgToken').value = settings.tgT;
    document.getElementById('tgID').value = settings.tgI;
});

// التنقل اللحظي بين الصفحات
function openTab(evt, tabId) {
    document.querySelectorAll(".tab-panel").forEach(p => p.style.display = "none");
    document.querySelectorAll(".tab-item").forEach(t => t.classList.remove("active"));
    
    document.getElementById(tabId).style.display = "block";
    evt.currentTarget.classList.add("active");

    if(tabId === 'list-page') renderTable();
    if(tabId === 'report-page') initChart();
    window.scrollTo(0,0);
}

// الحفظ الفوري (Lightning Fast Save)
async function saveData() {
    const amt = document.getElementById('fAmt').value;
    const note = document.getElementById('fNote').value;
    const date = document.getElementById('fDate').value;

    if(!amt || !date) return alert("المبلغ والتاريخ مطلوبان!");

    const entry = {
        id: Date.now(),
        amt: parseFloat(amt),
        note: note || "بدون بيان",
        cat: document.getElementById('fCat').value || "عام",
        date: date
    };

    // التخزين الدائم
    db.push(entry);
    localStorage.setItem("PRO_DATA", JSON.stringify(db));

    // تحديث الواجهة فوراً بدون ريفرش
    document.getElementById('fAmt').value = '';
    document.getElementById('fNote').value = '';
    
    alert("تم الحفظ بنجاح! ⚡");
}

function renderTable() {
    const tbody = document.getElementById('dbTable');
    tbody.innerHTML = db.slice().reverse().map(item => `
        <tr>
            <td>${item.date.split('-').slice(1).join('/')}</td>
            <td>${item.note}</td>
            <td style="color:var(--p);font-weight:bold">${item.amt}</td>
            <td><button onclick="deleteItem(${item.id})" style="border:none;background:none;color:red"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
}

function deleteItem(id) {
    if(confirm("حذف العملية؟")){
        db = db.filter(i => i.id !== id);
        localStorage.setItem("PRO_DATA", JSON.stringify(db));
        renderTable();
    }
}

function initChart() {
    const ctx = document.getElementById('myChart');
    const cats = [...new Set(db.map(i => i.cat))];
    const totals = cats.map(c => db.filter(i => i.cat === c).reduce((s, i) => s + i.amt, 0));

    if(chartObj) chartObj.destroy();
    chartObj = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: cats, datasets: [{ data: totals, backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'] }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function toggleTheme() {
    settings.theme = settings.theme === 'light' ? 'dark' : 'light';
    document.body.className = settings.theme + '-mode';
    localStorage.setItem("PRO_SET", JSON.stringify(settings));
}

function saveSettings() {
    settings.tgT = document.getElementById('tgToken').value;
    settings.tgI = document.getElementById('tgID').value;
    localStorage.setItem("PRO_SET", JSON.stringify(settings));
    alert("تم حفظ الإعدادات");
}

function handleFileUI() {
    const f = document.getElementById('fFile').files[0];
    if(f) document.getElementById('file-label').innerText = "✅ تم اختيار الصورة";
}