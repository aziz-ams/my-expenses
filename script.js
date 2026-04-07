const app = {
    db: { projects: [], expenses: [], categories: [], vendors: [], settings: {} },
    charts: { proj: null, cat: null },

    init: function() {
        try {
            this.db.projects = JSON.parse(localStorage.getItem('sys_projects')) || [];
            this.db.expenses = JSON.parse(localStorage.getItem('sys_expenses')) || [];
            this.db.vendors = JSON.parse(localStorage.getItem('sys_vendors')) || [];
            this.db.categories = JSON.parse(localStorage.getItem('sys_categories')) || ['مواد بناء', 'أجور عمالة', 'نقل ومعدات', 'أخرى'];
            this.db.settings = JSON.parse(localStorage.getItem('sys_settings')) || {
                theme: 'dark-theme', companyName: 'مؤسسة قبس الأمجاد', vision: 'نحو التطوير والبناء.', logo: ''
            };
            
            this.settings.apply();
            this.exportData.populateMonths(); 
        } catch(e) {
            console.error(e);
        }
    },
    
    saveDB: function() {
        localStorage.setItem('sys_projects', JSON.stringify(this.db.projects));
        localStorage.setItem('sys_expenses', JSON.stringify(this.db.expenses));
        localStorage.setItem('sys_categories', JSON.stringify(this.db.categories));
        localStorage.setItem('sys_vendors', JSON.stringify(this.db.vendors));
        localStorage.setItem('sys_settings', JSON.stringify(this.db.settings));
    },

    toggleMenu: function() {
        document.getElementById('sidebar').classList.toggle('open');
        document.getElementById('menuOverlay').classList.toggle('active');
    },

    switchPage: function(pageId) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const targetPage = document.getElementById(pageId);
        if(targetPage) targetPage.classList.add('active');
        
        document.querySelectorAll('.nav-item').forEach(n => {
            n.classList.remove('active');
            if (n.getAttribute('onclick').includes(pageId)) n.classList.add('active');
        });

        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('menuOverlay').classList.remove('active');

        setTimeout(() => {
            if(pageId === 'p1') app.projects.render();
            if(pageId === 'p8') app.vendors.render();
            if(pageId === 'p2') app.expenses.initForm();
            if(pageId === 'p7') app.taxRefund.render(); 
            if(pageId === 'p3') app.renderCharts();
            if(pageId === 'p4') app.expenses.search();
            if(pageId === 'p6') app.settings.loadForm();
        }, 50);
    },

    settings: {
        apply: function() {
            document.body.className = app.db.settings.theme;
            document.getElementById('welcomeTitle').innerText = app.db.settings.companyName;
            document.getElementById('topbarTitle').innerText = `🏗️ ${app.db.settings.companyName}`;
            document.getElementById('welcomeVision').innerText = app.db.settings.vision;
            if(app.db.settings.logo) {
                document.getElementById('welcomeLogo').src = app.db.settings.logo;
                document.getElementById('welcomeLogo').style.display = 'block';
            }
        },
        loadForm: function() {
            document.getElementById('themeSelect').value = app.db.settings.theme;
            document.getElementById('setCompanyName').value = app.db.settings.companyName;
            document.getElementById('setVision').value = app.db.settings.vision;
        },
        changeThemePreview: function() { document.body.className = document.getElementById('themeSelect').value; },
        uploadLogo: function(input) {
            if(input.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => { app.db.settings.logo = e.target.result; };
                reader.readAsDataURL(input.files[0]);
            }
        },
        generateAI: function() {
            const name = document.getElementById('setCompanyName').value || 'المؤسسة';
            document.getElementById('setVision').value = `نسعى في "${name}" لتقديم حلول مبتكرة في قطاع المقاولات، لنبني مستقبلاً مستداماً يواكب التطور بأعلى معايير الجودة والشفافية.`;
        },
        saveAll: function() {
            app.db.settings.theme = document.getElementById('themeSelect').value;
            app.db.settings.companyName = document.getElementById('setCompanyName').value;
            app.db.settings.vision = document.getElementById('setVision').value;
            app.saveDB(); app.settings.apply(); alert("تم الحفظ بنجاح!");
        }
    },

    projects: {
        add: function() {
            const name = document.getElementById('projName').value.trim();
            const contractor = document.getElementById('projContractor').value.trim();
            if(!name) return alert("اسم المشروع مطلوب");
            app.db.projects.push({ id: Date.now(), name, contractor, date: new Date().toLocaleDateString('en-CA') });
            app.saveDB(); document.getElementById('projName').value = ''; document.getElementById('projContractor').value = ''; this.render();
        },
        render: function() {
            const tbody = document.getElementById('projectsBody');
            if(app.db.projects.length === 0) return tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">لا توجد مشاريع</td></tr>';
            tbody.innerHTML = app.db.projects.map(p => `<tr><td>${p.name}</td><td>${p.contractor}</td><td>${p.date}</td><td><button class="btn btn-danger" style="padding:5px 10px;" onclick="app.projects.delete(${p.id})">حذف</button></td></tr>`).join('');
        },
        delete: function(id) { if(confirm("حذف المشروع؟")) { app.db.projects = app.db.projects.filter(p => p.id !== id); app.saveDB(); this.render(); } }
    },

    vendors: {
        add: function() {
            const name = document.getElementById('venName').value.trim();
            const taxNum = document.getElementById('venTaxNum').value.trim();
            if(!name || !taxNum) return alert("الاسم والرقم الضريبي مطلوبان!");
            // التحقق من عدم التكرار
            if(app.db.vendors.find(v => v.name === name)) return alert("المورد موجود مسبقاً!");
            
            app.db.vendors.push({ id: Date.now(), name, taxNum });
            app.saveDB();
            document.getElementById('venName').value = ''; document.getElementById('venTaxNum').value = '';
            this.render();
        },
        render: function() {
            const tbody = document.getElementById('vendorsBody');
            if(app.db.vendors.length === 0) return tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">لا يوجد موردين مسجلين</td></tr>';
            tbody.innerHTML = app.db.vendors.map(v => `<tr><td>${v.name}</td><td>${v.taxNum}</td><td><button class="btn btn-danger" style="padding:5px 10px;" onclick="app.vendors.delete(${v.id})">حذف</button></td></tr>`).join('');
        },
        delete: function(id) { if(confirm("حذف المورد؟")) { app.db.vendors = app.db.vendors.filter(v => v.id !== id); app.saveDB(); this.render(); } }
    },

    expenses: {
        setMode: function(mode) {
            document.getElementById('btnManual').classList.remove('active');
            document.getElementById('btnAuto').classList.remove('active');
            if(mode === 'manual') {
                document.getElementById('btnManual').classList.add('active');
                document.getElementById('btnManual').style.background = 'var(--primary-color)';
                document.getElementById('btnManual').style.color = '#000';
                document.getElementById('btnAuto').style.background = '#475569';
                document.getElementById('btnAuto').style.color = '#fff';
                document.getElementById('autoUploadArea').classList.add('hidden');
            } else {
                document.getElementById('btnAuto').classList.add('active');
                document.getElementById('btnAuto').style.background = 'var(--primary-color)';
                document.getElementById('btnAuto').style.color = '#000';
                document.getElementById('btnManual').style.background = '#475569';
                document.getElementById('btnManual').style.color = '#fff';
                document.getElementById('autoUploadArea').classList.remove('hidden');
            }
        },
        processAI: function(input) {
            const file = input.files[0];
            if(!file) return;
            const status = document.getElementById('aiStatus');
            status.innerText = "جاري قراءة وتحليل الفاتورة بواسطة AI... ⏳";
            status.style.color = "var(--text-muted)";

            Tesseract.recognize(file, 'ara+eng').then(({ data: { text } }) => {
                // استخراج الرقم الضريبي (يبدأ بـ 3 ويتكون من 15 رقم)
                const taxMatch = text.match(/\b3\d{14}\b/);
                if(taxMatch) document.getElementById('expTaxNum').value = taxMatch[0];

                // استخراج التاريخ
                const dateMatch = text.match(/\b(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})\b/);
                if(dateMatch) {
                    let d = dateMatch[0].replace(/\//g, '-');
                    if(d.indexOf('-') === 2) d = d.split('-').reverse().join('-');
                    document.getElementById('expDate').value = d;
                }

                // استخراج أكبر رقم يمثل المبلغ
                const amounts = text.match(/\b\d{1,6}(\.\d{2})?\b/g);
                if(amounts) {
                    const maxAmount = Math.max(...amounts.map(Number));
                    if(maxAmount > 0) {
                        document.getElementById('expAmount').value = maxAmount;
                        app.expenses.calculateVAT();
                    }
                }

                status.innerText = "✅ اكتمل الاستخراج بنجاح! يرجى مراجعة الحقول وإكمال الباقي.";
                status.style.color = "var(--success-color)";
            }).catch(err => {
                status.innerText = "❌ فشل الذكاء الاصطناعي في قراءة الصورة بوضوح.";
                status.style.color = "var(--danger-color)";
            });
        },
        autoFillVendor: function() {
            const selectedName = document.getElementById('expVendor').value;
            const vendor = app.db.vendors.find(v => v.name === selectedName);
            if(vendor) {
                document.getElementById('expTaxNum').value = vendor.taxNum;
            }
        },
        initForm: function() {
            const projSelect = document.getElementById('expProject');
            projSelect.innerHTML = app.db.projects.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
            if(app.db.projects.length === 1) projSelect.selectedIndex = 0; 
            
            document.getElementById('expCat').innerHTML = app.db.categories.map(c => `<option value="${c}">${c}</option>`).join('');
            document.getElementById('expCustomCat').classList.add('hidden'); 
            
            // تعبئة الموردين في الـ Datalist
            const datalist = document.getElementById('vendorsList');
            datalist.innerHTML = app.db.vendors.map(v => `<option value="${v.name}">`).join('');

            document.getElementById('expSerial').value = "INV-" + new Date().getFullYear() + "-" + String(app.db.expenses.length + 1).padStart(4, '0');
            document.getElementById('expDate').valueAsDate = new Date(); 
            document.getElementById('aiStatus').innerText = "";
        },
        handleCategoryChange: function() {
            const cat = document.getElementById('expCat').value;
            const customInput = document.getElementById('expCustomCat');
            if(cat === 'أخرى') customInput.classList.remove('hidden');
            else customInput.classList.add('hidden');
        },
        calculateVAT: function() {
            const amount = parseFloat(document.getElementById('expAmount').value) || 0;
            const vat = amount - (amount / 1.15); // المعادلة الضريبية الصحيحة
            document.getElementById('expVat').value = vat.toFixed(2);
        },
        save: function() {
            let finalCategory = document.getElementById('expCat').value;
            if(finalCategory === 'أخرى') {
                const customCat = document.getElementById('expCustomCat').value.trim();
                if(customCat) {
                    finalCategory = customCat;
                    if(!app.db.categories.includes(finalCategory)) app.db.categories.push(finalCategory);
                }
            }

            const vendorName = document.getElementById('expVendor').value.trim();
            const taxNum = document.getElementById('expTaxNum').value.trim();

            // حفظ المورد تلقائياً إذا كان جديداً
            if(vendorName && taxNum && !app.db.vendors.find(v => v.name === vendorName)) {
                app.db.vendors.push({ id: Date.now(), name: vendorName, taxNum: taxNum });
            }

            const exp = {
                id: Date.now(), 
                serial: document.getElementById('expSerial').value,
                project: document.getElementById('expProject').value,
                vendor: vendorName,
                taxNum: taxNum || "-",
                invoiceNum: document.getElementById('expInvNum').value.trim() || "بدون",
                date: document.getElementById('expDate').value,
                amount: parseFloat(document.getElementById('expAmount').value),
                vat: parseFloat(document.getElementById('expVat').value) || 0,
                payment: document.getElementById('expPayment').value,
                desc: document.getElementById('expDesc').value.trim(),
                category: finalCategory
            };
            
            if(!exp.vendor || isNaN(exp.amount)) return alert("المورد والمبلغ حقول إلزامية!");
            app.db.expenses.push(exp);
            this.resequence(false);
            alert("تم الترحيل بنجاح");
            
            ['expVendor','expTaxNum','expAmount','expVat','expInvNum','expDesc','expCustomCat'].forEach(id => document.getElementById(id).value = '');
            this.initForm(); 
        },
        resequence: function(showAlert = true) {
            app.db.expenses.sort((a, b) => new Date(a.date) - new Date(b.date));
            app.db.expenses.forEach((e, i) => e.serial = "INV-" + new Date(e.date).getFullYear() + "-" + String(i + 1).padStart(4, '0'));
            app.saveDB(); this.search();
            if(showAlert) alert("تم ترتيب التسلسل الزمني بنجاح!");
        },
        search: function() {
            const term = (document.getElementById('searchInput')||{value:''}).value.toLowerCase();
            const filtered = app.db.expenses.filter(e => e.vendor.toLowerCase().includes(term) || e.serial.toLowerCase().includes(term));
            const tbody = document.getElementById('searchBody');
            if(filtered.length === 0) return tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">لا توجد نتائج</td></tr>';
            
            tbody.innerHTML = filtered.map(e => `
                <tr>
                    <td><span class="serial-badge">${e.serial}</span></td>
                    <td>${e.vendor}</td>
                    <td>${e.date}</td>
                    <td style="color:var(--primary-color); font-weight:bold;">${e.amount.toLocaleString()}</td>
                    <td>${e.payment}</td>
                    <td><button class="btn btn-primary" style="padding: 5px; font-size:12px;" onclick="app.expenses.edit(${e.id})">تعديل</button></td>
                </tr>`).join('');
        },
        edit: function(id) {
            const exp = app.db.expenses.find(e => e.id === id);
            document.getElementById('editId').value = exp.id; 
            document.getElementById('editSerial').value = exp.serial;
            document.getElementById('editVendor').value = exp.vendor; 
            document.getElementById('editAmount').value = exp.amount;
            document.getElementById('editDate').value = exp.date; 
            document.getElementById('editModal').classList.add('active');
        },
        update: function() {
            const id = parseInt(document.getElementById('editId').value);
            const index = app.db.expenses.findIndex(e => e.id === id);
            
            const newAmount = parseFloat(document.getElementById('editAmount').value);
            app.db.expenses[index].serial = document.getElementById('editSerial').value;
            app.db.expenses[index].vendor = document.getElementById('editVendor').value;
            app.db.expenses[index].amount = newAmount;
            app.db.expenses[index].vat = newAmount - (newAmount / 1.15); // تحديث الضريبة
            app.db.expenses[index].date = document.getElementById('editDate').value;
            
            app.saveDB(); document.getElementById('editModal').classList.remove('active');
            this.resequence(false); alert("تم التعديل بنجاح");
        }
    },

    taxRefund: {
        render: function() {
            const tbody = document.getElementById('taxBody');
            if(app.db.expenses.length === 0) return tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">لا توجد بيانات ضريبية</td></tr>';
            
            tbody.innerHTML = app.db.expenses.map(e => `
                <tr>
                    <td>${e.invoiceNum}</td>
                    <td>${e.vendor}</td>
                    <td style="font-family: monospace;">${e.taxNum || '-'}</td>
                    <td>${e.date}</td>
                    <td style="font-weight:bold;">${e.amount.toLocaleString()}</td>
                    <td style="color:var(--danger-color); font-weight:bold;">${e.vat ? e.vat.toFixed(2) : '0.00'}</td>
                    <td>${e.desc || '-'}</td>
                    <td>${e.project}</td>
                </tr>
            `).join('');
        },
        exportExcel: function() {
            if(app.db.expenses.length === 0) return alert("لا توجد فواتير لتصديرها");
            
            // المطابقة الدقيقة لقالب الزكاة والدخل المطلوب
            const excelData = app.db.expenses.map(e => ({
                "الرقم المميز للمورد": e.taxNum,
                "اسم المورد": e.vendor,
                "تاريخ الفاتورة\nDD-MM-YYYY": e.date,
                "رقم الفاتورة": e.invoiceNum,
                "مبلغ الفاتورة": e.amount,
                "ضريبة القيمة المضافة": e.vat ? parseFloat(e.vat.toFixed(2)) : 0,
                "وصف المنتجات والخدمات": e.desc || e.category,
                "اسم المشروع": e.project
            }));

            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
            XLSX.writeFile(wb, `Purchase_Template_Arabic.xlsx`);
        }
    },

    renderCharts: function() {
        if(this.charts.proj) this.charts.proj.destroy();
        if(this.charts.cat) this.charts.cat.destroy();
        const pData = {}; const cData = {};
        this.db.expenses.forEach(e => { pData[e.project] = (pData[e.project] || 0) + e.amount; cData[e.category] = (cData[e.category] || 0) + e.amount; });
        const opt = { color: '#94a3b8', plugins: { legend: { labels: { color: '#94a3b8' } } } };
        this.charts.proj = new Chart(document.getElementById('chartProjects'), { type: 'bar', data: { labels: Object.keys(pData), datasets: [{ label: 'ريال', data: Object.values(pData), backgroundColor: '#00d2ff' }] }, options: opt });
        this.charts.cat = new Chart(document.getElementById('chartCategories'), { type: 'doughnut', data: { labels: Object.keys(cData), datasets: [{ data: Object.values(cData), backgroundColor: ['#00d2ff', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6'], borderWidth: 0 }] }, options: opt });
    },

    exportData: {
        populateMonths: function() {
            const mNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
            const sm = document.getElementById('startMonth');
            const em = document.getElementById('endMonth');
            let opts = '';
            mNames.forEach((m, i) => opts += `<option value="${i}">${i+1} - ${m}</option>`);
            if(sm && em) { sm.innerHTML = opts; em.innerHTML = opts; em.value = "11"; }
        },
        toggleCustomMonths: function() {
            const period = document.getElementById('reportPeriod').value;
            if(period === 'custom') document.getElementById('customMonthsArea').classList.remove('hidden');
            else document.getElementById('customMonthsArea').classList.add('hidden');
        },
        filterData: function() {
            const period = document.getElementById('reportPeriod').value;
            const now = new Date();
            return app.db.expenses.filter(e => {
                const edate = new Date(e.date);
                const emonth = edate.getMonth();
                if(period === 'year') return true;
                if(period === 'half') return emonth >= 6; 
                if(period === 'quarter') return emonth >= 9; 
                if(period === 'custom') {
                    const start = parseInt(document.getElementById('startMonth').value);
                    const end = parseInt(document.getElementById('endMonth').value);
                    return emonth >= start && emonth <= end;
                }
                return true; 
            });
        },
        excel: function() {
            const data = this.filterData();
            if(!data.length) return alert("لا توجد بيانات للفترة المحددة");
            const excelData = data.map(e => ({ "التسلسل": e.serial, "المشروع": e.project, "المورد": e.vendor, "الفاتورة": e.invoiceNum, "التاريخ": e.date, "التصنيف": e.category, "المبلغ": e.amount }));
            const ws = XLSX.utils.json_to_sheet(excelData); const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "التقرير"); XLSX.writeFile(wb, `تقرير_سجلات.xlsx`);
        },
        pdf: function() {
            const data = this.filterData();
            if(!data.length) return alert("لا توجد بيانات");
            const total = data.reduce((sum, exp) => sum + exp.amount, 0);
            const companyName = app.db.settings.companyName;
            
            let htmlTemplate = `
                <div style="direction:rtl; font-family:sans-serif; padding:30px; background:#fff; color:#000;">
                    <div style="border-bottom:3px solid #00d2ff; padding-bottom:15px; margin-bottom:25px;">
                        <h1 style="margin:0; color:#0f172a;">${companyName}</h1>
                        <p style="margin:5px 0 0 0; color:#64748b;">تقرير مالي ضريبي - تاريخ: ${new Date().toLocaleDateString('ar-SA')}</p>
                    </div>
                    <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:right;">
                        <thead>
                            <tr style="background:#0f172a; color:#fff;">
                                <th style="padding:8px; border:1px solid #ddd;">المورد</th>
                                <th style="padding:8px; border:1px solid #ddd;">التاريخ</th>
                                <th style="padding:8px; border:1px solid #ddd;">الدفع</th>
                                <th style="padding:8px; border:1px solid #ddd;">الإجمالي</th>
                                <th style="padding:8px; border:1px solid #ddd; color:#ffcccc;">الضريبة</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map((e, i) => `
                            <tr style="background:${i%2===0?'#fff':'#f8fafc'};">
                                <td style="padding:6px; border:1px solid #ddd;">${e.vendor}</td>
                                <td style="padding:6px; border:1px solid #ddd;">${e.date}</td>
                                <td style="padding:6px; border:1px solid #ddd;">${e.payment}</td>
                                <td style="padding:6px; border:1px solid #ddd; font-weight:bold;">${e.amount.toLocaleString()}</td>
                                <td style="padding:6px; border:1px solid #ddd; color:red;">${e.vat ? e.vat.toFixed(2) : '0'}</td>
                            </tr>`).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="background:#e2e8f0;">
                                <td colspan="3" style="padding:10px; font-weight:bold;">الإجمالي الكلي:</td>
                                <td style="padding:10px; font-weight:bold;">${total.toLocaleString()} ر.س</td>
                                <td style="padding:10px; font-weight:bold; color:red;">${data.reduce((s,e)=>s+e.vat,0).toFixed(2)} ر.س</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>`;
            
            let element = document.createElement('div'); element.innerHTML = htmlTemplate;
            html2pdf().set({ margin: 10, filename: `تقرير.pdf`, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(element).save();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());