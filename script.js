let db = JSON.parse(localStorage.getItem("PRO_WALLET_DB")) || [];
let settings = JSON.parse(localStorage.getItem("PRO_SETTINGS")) || { theme: 'light', tgToken: '', tgID: '' };
let chart;

// التنقل بين الصفحات
function openTab(evt, tabId) {
    const panels = document.getElementsByClassName("tab-panel");
    for (let i = 0; i < panels.length; i++) panels[i].style.display = "none";
    
    const tabs = document.getElementsByClassName("tab-item");
    for (let i = 0; i < tabs.length; i++) tabs[i].classList.remove("active");

    document.getElementById(tabId).style.display = "block";
    evt.currentTarget.classList.add("active");

    if(tabId === 'list-page') renderTable();
    if(tabId === 'report-page') setTimeout(initChart, 100);
}

// حفظ البيانات
async function saveData() {
    const amt = document.getElementById('fAmt').value;
    const note = document.getElementById('fNote').value;
    const cat = document.getElementById('fCat').value || "عام";
    const date = document.getElementById('fDate').value;
    const fileInput = document.getElementById('fFile');
    
    if(!amt || !date) return alert("يرجى إدخال المبلغ والتاريخ");

    let fileStr = null, fType = null;
    if(fileInput.files[0]) {
        fType = fileInput.files[0].type;
        fileStr = await new Promise(r => {
            const rd = new FileReader();
            rd.onload = () => r(rd.result);
            rd.readAsDataURL(fileInput.files[0]);
        });
    }

    db.push({ id: Date.now(), amt, note, cat, date, fileStr, fType });
    localStorage.setItem("PRO_WALLET_DB", JSON.stringify(db));
    alert("تم الحفظ بنجاح!");
    location.reload();
}

// عرض الجدول
function renderTable() {
    const tbody = document.getElementById('dbTable');
    tbody.innerHTML = db.slice().reverse().map(item => `
        <tr>
            <td>${item.date}</td>
            <td>${item.note}</td>
            <td><strong>${item.amt}</strong></td>
            <td class="actions-td">
                <button onclick="editItem(${item.id})"><i class="fas fa-edit"></i></button>
                ${item.fileStr ? `<button onclick="viewFile('${item.id}')"><i class="fas fa-eye"></i></button>` : ''}
                <button onclick="deleteItem(${item.id})" style="color:#ff4d4d"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');
}

// تعديل المبلغ
function editItem(id) {
    const item = db.find(i => i.id == id);
    const val = prompt("تعديل المبلغ:", item.amt);
    if(val) {
        item.amt = val;
        localStorage.setItem("PRO_WALLET_DB", JSON.stringify(db));
        renderTable();
    }
}

// معاينة الفواتير (متوافق مع Safari)
function viewFile(id) {
    const item = db.find(i => i.id == id);
    const win = window.open();
    if(!win) return alert("يرجى السماح بالنوافذ المنبثقة");
    if (item.fType.includes('pdf')) {
        win.document.write(`<iframe src="${item.fileStr}" width="100%" height="100%" style="border:none;"></iframe>`);
    } else {
        win.document.write(`<img src="${item.fileStr}" style="max-width:100%">`);
    }
}

function deleteItem(id) {
    if(confirm("حذف العملية؟")) {
        db = db.filter(i => i.id != id);
        localStorage.setItem("PRO_WALLET_DB", JSON.stringify(db));
        renderTable();
    }
}

// الرسم البياني
function initChart() {
    const ctx = document.getElementById('myChart').getContext('2d');
    const cats = [...new Set(db.map(i => i.cat))];
    const totals = cats.map(c => db.filter(i => i.cat === c).reduce((sum, i) => sum + parseFloat(i.amt), 0));

    if(chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: cats, datasets: [{ data: totals, backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'] }] },
        options: { responsive: true }
    });
}

// إعدادات التليجرام والوضع الليلي
function toggleTheme() {
    settings.theme = settings.theme === 'light' ? 'dark' : 'light';
    applySettings();
}

function saveSettings() {
    settings.tgToken = document.getElementById('tgToken').value;
    settings.tgID = document.getElementById('tgID').value;
    localStorage.setItem("PRO_SETTINGS", JSON.stringify(settings));
    alert("تم الحفظ");
}

function applySettings() {
    document.body.className = settings.theme + '-mode';
    localStorage.setItem("PRO_SETTINGS", JSON.stringify(settings));
}

function handleFileSelect() {
    const f = document.getElementById('fFile').files[0];
    if(f) document.getElementById('file-label').innerText = "تم اختيار: " + f.name;
}

// تصدير Excel
function exportExcel() {
    let csv = "\uFEFFالتاريخ,البيان,التصنيف,المبلغ\n";
    db.forEach(i => csv += `${i.date},${i.note},${i.cat},${i.amt}\n`);
    const b = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `المصاريف_${new Date().toLocaleDateString()}.csv`;
    a.click();
}

document.addEventListener('DOMContentLoaded', () => {
    applySettings();
    document.getElementById('fDate').valueAsDate = new Date();
    document.getElementById('tgToken').value = settings.tgToken;
    document.getElementById('tgID').value = settings.tgID;
});