let db = JSON.parse(localStorage.getItem("PRO_WALLET_DB")) || [];
let settings = JSON.parse(localStorage.getItem("PRO_SETTINGS")) || { theme: 'light', tgToken: '', tgID: '' };
let chart;

// وظيفة التنقل بين الصفحات - تم إصلاحها لتعمل 100%
function openTab(evt, tabId) {
    // إخفاء كل الصفحات
    const panels = document.getElementsByClassName("tab-panel");
    for (let i = 0; i < panels.length; i++) {
        panels[i].style.display = "none";
        panels[i].classList.remove("active");
    }

    // إزالة اللون النشط من الأزرار
    const tabs = document.getElementsByClassName("tab-item");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("active");
    }

    // إظهار الصفحة المطلوبة
    const activePanel = document.getElementById(tabId);
    activePanel.style.display = "block";
    activePanel.classList.add("active");
    evt.currentTarget.classList.add("active");

    // تحديث البيانات إذا دخلنا صفحة معينة
    if(tabId === 'list-page') renderTable();
    if(tabId === 'report-page') initChart();
}

// حفظ البيانات
async function saveData() {
    const amt = document.getElementById('fAmt').value;
    const note = document.getElementById('fNote').value;
    const cat = document.getElementById('fCat').value || "عام";
    const date = document.getElementById('fDate').value;
    const fileInput = document.getElementById('fFile');
    
    if(!amt || !date) return alert("يرجى إكمال البيانات الأساسية");

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
    alert("تم الحفظ بنجاح");
    location.reload();
}

function renderTable() {
    const tbody = document.getElementById('dbTable');
    tbody.innerHTML = db.slice().reverse().map(item => `
        <tr>
            <td>${item.date}</td>
            <td>${item.note}</td>
            <td>${item.amt}</td>
            <td class="actions-td">
                <button onclick="viewFile(${item.id})"><i class="fas fa-eye"></i></button>
                <button onclick="deleteItem(${item.id})" style="color:red"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');
}

function viewFile(id) {
    const item = db.find(i => i.id == id);
    if(!item.fileStr) return alert("لا يوجد مرفق");
    const win = window.open();
    if (item.fType.includes('pdf')) {
        win.document.write(`<iframe src="${item.fileStr}" width="100%" height="100%"></iframe>`);
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

function toggleTheme() {
    settings.theme = settings.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem("PRO_SETTINGS", JSON.stringify(settings));
    document.body.className = settings.theme + '-mode';
}

function initChart() {
    const ctx = document.getElementById('myChart').getContext('2d');
    const cats = [...new Set(db.map(i => i.cat))];
    const totals = cats.map(c => db.filter(i => i.cat === c).reduce((sum, i) => sum + parseFloat(i.amt), 0));

    if(chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: cats, datasets: [{ data: totals, backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#ef4444'] }] }
    });
}

// تهيئة أولية
document.addEventListener('DOMContentLoaded', () => {
    document.body.className = settings.theme + '-mode';
    document.getElementById('fDate').valueAsDate = new Date();
    // إظهار صفحة الإضافة افتراضياً
    document.getElementById('add-page').style.display = "block";
});