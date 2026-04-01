let database = JSON.parse(localStorage.getItem("MY_EXPENSES_DB")) || [];

// ضبط تاريخ اليوم تلقائياً
document.getElementById('fDate').valueAsDate = new Date();

async function processSave() {
    const amt = document.getElementById('fAmt').value;
    const note = document.getElementById('fNote').value;
    const date = document.getElementById('fDate').value;
    const cat = document.getElementById('fCat').value;
    const fileInput = document.getElementById('fFile');
    const file = fileInput.files[0];

    if (!amt || !date) return alert("يرجى إدخال المبلغ والتاريخ");

    let fileData = null;
    let fileType = null;

    if (file) {
        fileType = file.type;
        fileData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }

    database.push({ date, note, amt: parseFloat(amt), cat, file: fileData, fileType });
    saveAndRefresh();
    
    // إعادة ضبط الحقول
    document.getElementById('fAmt').value = '';
    document.getElementById('fNote').value = '';
    fileInput.value = '';
}

function viewAttachment(data, type) {
    const win = window.open();
    if (type.includes('pdf')) {
        win.document.write(`<html><body style="margin:0;"><iframe src="${data}" width="100%" height="100%" style="border:none;"></iframe></body></html>`);
    } else {
        win.document.write(`<html><body style="margin:0;display:flex;justify-content:center;align-items:center;"><img src="${data}" style="max-width:100%;height:auto;"></body></html>`);
    }
}

function renderTable() {
    const tbody = document.getElementById('dbTable');
    tbody.innerHTML = database.slice().reverse().map((r, i) => {
        // حساب الاندكس الحقيقي للحذف بسبب استخدام reverse
        const realIndex = database.length - 1 - i;
        return `
        <tr>
            <td>${r.date}</td>
            <td>${r.note}</td>
            <td>${r.amt}</td>
            <td>
                ${r.file ? `<button onclick="viewAttachment('${r.file}', '${r.fileType}')" class="btn-view">👁️</button>` : '➖'}
            </td>
            <td><button onclick="delRecord(${realIndex})" class="btn-del">🗑️</button></td>
        </tr>`;
    }).join('');
}

function delRecord(index) {
    if(confirm("هل أنت متأكد من الحذف؟")) {
        database.splice(index, 1);
        saveAndRefresh();
    }
}

function saveAndRefresh() {
    localStorage.setItem("MY_EXPENSES_DB", JSON.stringify(database));
    renderTable();
}

function downloadBackupExcel() {
    if (database.length === 0) return alert("لا توجد بيانات");
    let csv = "\uFEFFالتاريخ,البيان,المبلغ,التصنيف\n";
    database.forEach(r => {
        csv += `${r.date},${r.note},${r.amt},${r.cat}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "مصاريفي.csv";
    link.click();
}

renderTable();