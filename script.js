let database = JSON.parse(localStorage.getItem("MY_PERMANENT_RECORDS")) || [];

window.onload = () => {
    setCurrentDate(); // يضع تاريخ اليوم تلقائياً
    renderTable();
    updateStats();
    if(localStorage.getItem('theme') === 'light') toggleTheme();
};

// وظيفة تضع تاريخ اليوم في الخانة عند الفتح
function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fDate').value = today;
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.getElementById('themeToggle').innerText = isDark ? '🌙' : '☀️';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function changeTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    el.classList.add('active');
    if(tabId === 'galleryTab') renderGallery();
}

async function processSave() {
    const amt = document.getElementById('fAmt').value;
    const note = document.getElementById('fNote').value;
    const date = document.getElementById('fDate').value; // يأخذ أي تاريخ تختاره
    const cat = document.getElementById('fCat').value || "عام";
    const file = document.getElementById('fFile').files[0];

    if (!amt || !date) return alert("يرجى إدخال المبلغ والتاريخ");

    let imgData = file ? await convertImageToBase64(file) : null;
    database.push({ num: database.length + 1, date, note, amt: parseFloat(amt), cat, img: imgData });
    
    saveAndRefresh();
    alert("تم الحفظ بنجاح");
}

function saveAndRefresh() {
    localStorage.setItem("MY_PERMANENT_RECORDS", JSON.stringify(database));
    renderTable();
    updateStats();
    // تصفير الخانات مع بقاء التاريخ الحالي
    document.getElementById('fAmt').value = "";
    document.getElementById('fNote').value = "";
    document.getElementById('fCat').value = "";
}

function renderTable() {
    const tbody = document.getElementById('dbTable');
    tbody.innerHTML = database.map((r, i) => `
        <tr>
            <td>${r.num}</td>
            <td>${r.date}</td>
            <td><small>${r.cat}</small><br>${r.note}</td>
            <td><b>${r.amt}</b></td>
            <td>${r.img ? `<img src="${r.img}" style="width:35px; border-radius:5px;" onclick="window.open('${r.img}')">` : '➖'}</td>
            <td><button onclick="del(${i})" style="color:red; background:none; border:none; cursor:pointer;">🗑️</button></td>
        </tr>`).join('');
}

function updateStats() {
    const total = database.reduce((sum, r) => sum + r.amt, 0);
    document.getElementById('statTotal').innerText = total.toLocaleString() + " SAR";
    document.getElementById('statCount').innerText = database.length;
}

function renderGallery() {
    const gallery = document.getElementById('imageGallery');
    gallery.innerHTML = database.filter(r => r.img).map(r => `
        <div class="gallery-item"><img src="${r.img}" onclick="window.open('${r.img}')"><p style="text-align:center; padding:5px;">#${r.num}</p></div>
    `).join('') || "<p style='grid-column:1/-1; text-align:center;'>لا توجد صور</p>";
}

function del(i) { if(confirm("حذف السجل؟")) { database.splice(i, 1); saveAndRefresh(); } }

async function convertImageToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}