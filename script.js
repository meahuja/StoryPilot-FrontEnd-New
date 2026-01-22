document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        loginOverlay: document.getElementById('login-overlay'),
        loginForm: document.getElementById('login-form'),
        fileUpload: document.getElementById('file-upload'),
        dropZone: document.getElementById('drop-zone'),
        fileNameDisplay: document.getElementById('file-name-display'),
        generateBtn: document.getElementById('generate-btn'),
        projectSelect: document.getElementById('project-select'),
        prdDropdown: document.getElementById('prd-dropdown'),
        deletePrdBtn: document.getElementById('delete-prd-btn'),
        verificationSection: document.getElementById('verification-section'),
        storiesTbody: document.getElementById('stories-tbody'),
        detailModal: document.getElementById('detail-modal'),
        storyCountSpan: document.getElementById('story-count'),
        activePrdTitle: document.getElementById('active-prd-title'),
        finalSyncBtn: document.getElementById('final-jira-btn'),
        toastContainer: document.getElementById('toast-container'),
        selectAllCb: document.getElementById('select-all-cb'),
        bulkApproveBtn: document.getElementById('bulk-approve-btn'),
        modalFeedback: document.getElementById('modal-feedback'),
        modalSaveBtn: document.getElementById('modal-save-changes'),
        modalRevisionBtn: document.getElementById('modal-needs-revision'),
        modalPriority: document.getElementById('modal-priority'),
        modalDueDate: document.getElementById('modal-due-date')
    };

    let uploadedFile = null;
    let storyData = [];
    let currentStoryId = null;
    let currentPrdName = "";

    const getStorageKey = (proj, name) => `storypilot_${proj}_${name}`;

    let prdList = JSON.parse(localStorage.getItem('storypilot_prd_list')) || [
        "Mobile Checkout Redesign.pdf",
        "API Authentication Specs.docx"
    ];

    /**
     * Populates the PRD dropdown and adds a green checkmark 
     * if all stories for that PRD are 'uploaded'.
     */
    function populatePrdDropdown() {
        const firstOption = elements.prdDropdown.options[0];
        elements.prdDropdown.innerHTML = '';
        elements.prdDropdown.appendChild(firstOption);
        
        prdList.forEach(prd => {
            const opt = document.createElement('option');
            opt.value = prd;

            // Check completion status for the currently selected project
            const saved = localStorage.getItem(getStorageKey(elements.projectSelect.value, prd));
            let isComplete = false;
            
            if (saved) {
                const stories = JSON.parse(saved);
                // PRD is complete if it has stories and all are 'uploaded'
                isComplete = stories.length > 0 && stories.every(s => s.status === 'uploaded');
            }

            opt.textContent = isComplete ? `✅ ${prd}` : prd;
            elements.prdDropdown.appendChild(opt);
        });
    }
    
    populatePrdDropdown();

    function saveState() {
        if (!currentPrdName) return;
        localStorage.setItem(getStorageKey(elements.projectSelect.value, currentPrdName), JSON.stringify(storyData));
        localStorage.setItem('storypilot_prd_list', JSON.stringify(prdList));
    }

    function loadState(prdTitle) {
        currentPrdName = prdTitle;
        const saved = localStorage.getItem(getStorageKey(elements.projectSelect.value, prdTitle));
        if (saved) {
            storyData = JSON.parse(saved);
            return true;
        }
        return false;
    }

    elements.loginForm.onsubmit = (e) => { 
        e.preventDefault(); 
        elements.loginOverlay.classList.add('hidden'); 
    };

    // Update dropdown when project changes to reflect completion status
    elements.projectSelect.onchange = () => {
        populatePrdDropdown();
        if (elements.prdDropdown.value && loadState(elements.prdDropdown.value)) {
            renderTable();
        } else {
            elements.verificationSection.classList.add('hidden');
        }
    };

    elements.dropZone.onclick = () => elements.fileUpload.click();
    elements.fileUpload.onchange = (e) => {
        if (e.target.files.length > 0) {
            const newFile = e.target.files[0];
            if (prdList.includes(newFile.name)) {
                showToast("Duplicate file! This PRD already exists.", "error");
                elements.fileUpload.value = '';
                return;
            }
            uploadedFile = newFile;
            elements.fileNameDisplay.textContent = `Ready: ${uploadedFile.name}`;
            elements.fileNameDisplay.classList.add('text-indigo-600', 'font-bold');
        }
    };

    elements.generateBtn.onclick = () => {
        if (!uploadedFile) return alert("Please upload a PRD first.");
        currentPrdName = uploadedFile.name;
        if (!prdList.includes(currentPrdName)) prdList.push(currentPrdName);

        // Story generation now includes priority and due date
        storyData = Array.from({length: 6}, (_, i) => ({
            id: Date.now() + i,
            summary: `${elements.projectSelect.value}-${100 + i}: ${currentPrdName} Task ${i + 1}`,
            description: `Requirements for ${currentPrdName}.`,
            status: 'pending', 
            comment: '',
            isSelected: false,
            priority: i % 3 === 0 ? 'High' : 'Medium',
            dueDate: new Date(Date.now() + (i + 7) * 24 * 60 * 60 * 1000).toLocaleDateString()
        }));

        saveState();
        populatePrdDropdown();
        renderTable();
        elements.verificationSection.classList.remove('hidden');
        uploadedFile = null;
        elements.fileUpload.value = '';
        elements.fileNameDisplay.textContent = "Drag & drop or click to upload";
        
        // Focus user on the generated table
        elements.verificationSection.scrollIntoView({ behavior: 'smooth' });
    };

    elements.deletePrdBtn.onclick = () => {
        const selected = elements.prdDropdown.value;
        if (!selected) return showToast("Select a PRD to delete", "error");
        if (confirm(`Delete "${selected}" and all associated stories?`)) {
            prdList = prdList.filter(p => p !== selected);
            ["KT", "SP", "DE"].forEach(proj => localStorage.removeItem(getStorageKey(proj, selected)));
            localStorage.setItem('storypilot_prd_list', JSON.stringify(prdList));
            populatePrdDropdown();
            elements.verificationSection.classList.add('hidden');
            showToast("PRD fully deleted.", "success");
        }
    };

    elements.prdDropdown.onchange = (e) => {
        if (loadState(e.target.value)) {
            elements.activePrdTitle.innerHTML = `<span class="text-indigo-600">[${elements.projectSelect.value}]</span> ${currentPrdName}`;
            renderTable();
            elements.verificationSection.classList.remove('hidden');
            
            // Focus user on the table for the selected PRD
            elements.verificationSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    elements.selectAllCb.onchange = (e) => {
        const isChecked = e.target.checked;
        storyData.forEach(s => {
            if (s.status !== 'uploaded') {
                s.isSelected = isChecked;
            }
        });
        saveState();
        renderTable();
    };

    function renderTable() {
        elements.storiesTbody.innerHTML = '';
        elements.storyCountSpan.textContent = `${storyData.length} Items`;
        
        const selectables = storyData.filter(s => s.status !== 'uploaded');
        if (selectables.length > 0) {
            elements.selectAllCb.checked = selectables.every(s => s.isSelected);
        } else {
            elements.selectAllCb.checked = false;
        }

        storyData.forEach((story, index) => {
            const isUploaded = story.status === 'uploaded';
            const row = document.createElement('tr');
            row.className = `border-b transition-all group ${isUploaded ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}`;
            row.innerHTML = `
                <td class="p-4 align-top"><input type="checkbox" class="st-cb" ${story.isSelected ? 'checked' : ''} ${isUploaded ? 'disabled' : ''}></td>
                <td class="p-4 align-top text-gray-400 font-bold">${index + 1}</td>
                <td class="p-4 align-top">
                    <div class="max-w-xl">
                        <p class="font-semibold text-gray-800">${story.summary}</p>
                        <p class="text-xs text-gray-500 mt-1 line-clamp-2">${story.description}</p>
                        ${story.comment ? `<div class="mt-2 text-xs text-red-600 font-bold italic">Feedback: ${story.comment}</div>` : ''}
                    </div>
                </td>
                <td class="p-4 align-top">
                    <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusClass(story.status)}">${story.status}</span>
                </td>
                <td class="p-4 align-top text-right">
                    <div class="flex gap-2 justify-end">
                        <button class="approve-btn text-green-500 hover:bg-green-50 p-1 rounded disabled:opacity-20" ${isUploaded ? 'disabled' : ''}><i data-feather="check-circle" class="w-5 h-5"></i></button>
                        <button class="revision-btn text-red-500 hover:bg-red-50 p-1 rounded disabled:opacity-20" ${isUploaded ? 'disabled' : ''}><i data-feather="alert-circle" class="w-5 h-5"></i></button>
                        <button class="delete-btn text-gray-400 hover:text-red-600 p-1 rounded disabled:opacity-20" ${isUploaded ? 'disabled' : ''}><i data-feather="trash-2" class="w-5 h-5"></i></button>
                    </div>
                </td>
            `;
            attachEvents(row, story.id);
            elements.storiesTbody.appendChild(row);
        });
        updateBulkVisibility();
        feather.replace();
    }

    function attachEvents(row, id) {
        const s = storyData.find(x => x.id === id);
        row.querySelector('.st-cb').onchange = (e) => { 
            s.isSelected = e.target.checked; 
            saveState(); 
            renderTable();
        };
        row.querySelector('.approve-btn').onclick = () => { s.status = 'approved'; saveState(); renderTable(); };
        
        // Revision modal now populates all fields including Priority/Due Date
        row.querySelector('.revision-btn').onclick = () => {
            currentStoryId = id;
            document.getElementById('modal-summary-input').value = s.summary;
            document.getElementById('modal-description-input').value = s.description;
            elements.modalFeedback.value = s.comment || "";
            
            // Populate Priority with dynamic styling
            elements.modalPriority.textContent = s.priority || 'Medium';
            elements.modalPriority.className = `px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                s.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`;
            
            // Populate Due Date
            elements.modalDueDate.textContent = s.dueDate || 'TBD';
            
            elements.detailModal.classList.remove('hidden');
        };

        row.querySelector('.delete-btn').onclick = () => {
            if(confirm("Delete story?")) { storyData = storyData.filter(x => x.id !== id); saveState(); renderTable(); }
        };
    }

    elements.bulkApproveBtn.onclick = () => {
        storyData.forEach(s => { if (s.isSelected && s.status !== 'uploaded') { s.status = 'approved'; s.isSelected = false; } });
        elements.selectAllCb.checked = false;
        saveState();
        renderTable();
        showToast("Selected stories approved!", "success");
    };

    elements.finalSyncBtn.onclick = () => {
        const approved = storyData.filter(s => s.status === 'approved');
        if (approved.length === 0) return showToast("No approved stories!", "error");
        elements.finalSyncBtn.innerText = "Syncing...";
        setTimeout(() => {
            approved.forEach(s => { s.status = 'uploaded'; s.isSelected = false; });
            saveState();
            renderTable();
            
            // Refresh dropdown to show green indicator
            populatePrdDropdown();
            elements.prdDropdown.value = currentPrdName;

            elements.finalSyncBtn.innerText = "Start Jira Sync";
            showToast("Synced to Jira!", "success");
        }, 1200);
    };

    function showToast(msg, type) {
        const t = document.createElement('div');
        t.className = `${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-3 rounded-lg shadow-xl animate-fadeIn`;
        t.innerText = msg;
        elements.toastContainer.appendChild(t);
        setTimeout(() => t.remove(), 4000);
    }

    function getStatusClass(s) {
        if(s === 'approved') return 'bg-green-100 text-green-700';
        if(s === 'revision') return 'bg-red-100 text-red-700';
        if(s === 'uploaded') return 'bg-indigo-100 text-indigo-700';
        return 'bg-gray-100 text-gray-600';
    }

    function updateBulkVisibility() {
        elements.bulkApproveBtn.classList.toggle('hidden', !storyData.some(s => s.isSelected));
    }

    document.getElementById('modal-cancel').onclick = () => elements.detailModal.classList.add('hidden');
    
    elements.modalSaveBtn.onclick = () => {
        const s = storyData.find(x => x.id === currentStoryId);
        s.summary = document.getElementById('modal-summary-input').value;
        s.description = document.getElementById('modal-description-input').value;
        s.comment = elements.modalFeedback.value;
        elements.detailModal.classList.add('hidden');
        saveState();
        renderTable();
    };

    // Enables the "Needs Revision" button only if feedback is provided
    elements.modalFeedback.oninput = (e) => {
        elements.modalRevisionBtn.disabled = e.target.value.trim().length === 0;
    };

    elements.modalRevisionBtn.onclick = () => {
        const s = storyData.find(x => x.id === currentStoryId);
        s.status = 'revision';
        s.comment = elements.modalFeedback.value;
        elements.detailModal.classList.add('hidden');
        saveState();
        renderTable();
    };
});
