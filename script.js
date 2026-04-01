let db = JSON.parse(localStorage.getItem("EXPENSES_DATABASE")) || [];
let settings = JSON.parse(localStorage.getItem("APP_SETTINGS")) || { theme: 'light', color: '#6366f1', tgToken: '', tgID: '' };
let mainChart = null;

// وظيفة التنقل الأساسية
function openTab(evt, tabId) {
    // 1. إخفاء كل الأقسام
    const panels = document.querySelectorAll(".tab-panel");
    panels.forEach(p => p.style.display = "none");

    // 2. إلغاء تفعيل الأزرار
    const tabs = document.querySelectorAll(".tab-item");
    tabs.forEach(t => t.classList.remove("active"));

    // 3. إظهار الصفحة المختارة
    document.getElementById(tabId).style.display = "block";
    evt.currentTarget.classList.add("active");

    // 4. تحديث البيانات عند فتح صفحة العمليات أو التقارير
    if (tabId === 'list-page') renderTable();
    if (tabId === 'report-page') setTimeout(initChart, 100);

    // إغلاق لوحة المفاتيح
    document.activeElement.blur();
}

// حفظ البيانات
async function saveData() {
    const amt = document.getElementById('fAmt').value;
    const note = document.getElementById('fNote').value;
    const cat = document.getElementById('fCat').value || "غير مصنف";
    const date = document.getElementById('fDate').value;
    const fileInput = document.getElementById('fFile');

    if (!amt || !date) return alert("يرجى تعبئة المبلغ والتاريخ");

    let fileStr = null, fType = null;
    if (fileInput.files[0]) {
        fType = fileInput.files[0].type;
        fileStr = await new Promise(r => {
            const rd = new FileReader();
            rd.onload = () => r(rd.result);
            rd.readAsDataURL(fileInput.files[0]);
        });
    }

    db.push({ id: Date.now(), amt: parseFloat(amt), note, cat, date, fileStr, fType });
    localStorage.setItem("EXPENSES_DATABASE", JSON.stringify(db));
    
    alert("تم الحفظ بنجاح!");
    location.reload();
}

// عرض الجدول (العمليات المحفوظة)
function renderTable() {
    const tbody = document.getElementById('dbTable');
    tbody.innerHTML = db.slice().reverse().map(item => `
        <tr>
            <td>${item.date}</td>
            <td>${item.note}</td>
            <td><strong>${item.amt}</strong></td>
            <td>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button onclick="editItem(${item.id})" title="تعديل"><i class="fas fa-edit"></i></button>
                    ${item.fileStr ? `<button onclick="viewFile('${item.id}')" title="معاينة"><i class="fas fa-eye"></i></button>` : ''}
                    <button onclick="deleteItem(${item.id})" style="color:red" title="حذف"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>`).join('');
}

// التعديل والحذف والمعاينة
function editItem(id) {
    const item = db.find(i => i.id == id);
    const newAmt = prompt("تعديل المبلغ:", item.amt);
    if (newAmt) {
        item.amt = parseFloat(newAmt);
        localStorage.setItem("EXPENSES_DATABASE", JSON.stringify(db));
        renderTable();
    }
}

function deleteItem(id) {
    if (confirm("هل تريد الحذف؟")) {
        db = db.filter(i => i.id != id);
        localStorage.setItem("EXPENSES_DATABASE", JSON.stringify(db));
        renderTable();
    }
}

function viewFile(id) {
    const item = db.find(i => i.id == id);
    const win = window.open();
    if (!win) return alert("يرجى السماح بالنوافذ المنبثقة");
    if (item.fType.includes('pdf')) {
        win.document.write(`<iframe src="${item.fileStr}" width="100%" height="100%" style="border:none;"></iframe>`);
    } else {
        win.document.write(`<img src="${item.fileStr}" style="max-width:100%">`);
    }
}

// التقارير (Chart.js)
function initChart() {
    const ctx = document.getElementById('myChart').getContext('2d');
    const categories = [...new Set(db.map(i => i.cat))];
    const totals = categories.map(c => db.filter(i => i.cat === c).reduce((sum, i) => sum + i.amt, 0));

    if (mainChart) mainChart.destroy();
    mainChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: categories, datasets: [{ data: totals, backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// الإعدادات
function toggleTheme() {
    settings.theme = settings.theme === 'light' ? 'dark' : 'light';
    applySettings();
}

function updateThemeColor(val) {
    settings.color = val;
    applySettings();
}

function saveSettings() {
    settings.tgToken = document.getElementById('tgToken').value;
    settings.tgID = document.getElementById('tgID').value;
    localStorage.setItem("APP_SETTINGS", JSON.stringify(settings));
    alert("تم الحفظ");
}

function applySettings() {
    document.body.className = settings.theme + '-mode';
    document.documentElement.style.setProperty('--primary', settings.color);
    document.getElementById('themeColor').value = settings.color;
    document.getElementById('tgToken').value = settings.tgToken;
    document.getElementById('tgID').value = settings.tgID;
    localStorage.setItem("APP_SETTINGS", JSON.stringify(settings));
}

// تصدير وتليجرام
function exportExcel() {
    let csv = "\uFEFFالتاريخ,البيان,التصنيف,المبلغ\n";
    db.forEach(i => csv += `${i.date},${i.note},${i.cat},${i.amt}\n`);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير المصروفات.csv`;
    link.click();
}

async function sendToTelegram() {
    if (!settings.tgToken || !settings.tgID) return alert("اضبط إعدادات التليجرام أولاً");
    let msg = "📊 تقرير العمليات:\n";
    db.forEach(i => msg += `🔹 ${i.date}: ${i.amt} SAR (${i.note})\n`);
    await fetch(`https://api.telegram.org/bot${settings.tgToken}/sendMessage?chat_id=${settings.tgID}&text=${encodeURIComponent(msg)}`);
    alert("تم الإرسال!");
}

function handleFileSelect() {
    const f = document.getElementById('fFile').files[0];
    if (f) document.getElementById('file-label').innerHTML = `<i class="fas fa-check"></i> تم اختيار: ${f.name}`;
}

document.addEventListener('DOMContentLoaded', () => {
    applySettings();
    document.getElementById('fDate').valueAsDate = new Date();
});