document.addEventListener('DOMContentLoaded', function() {
    const fileUpload = document.getElementById('file-upload');
    const dropZone = document.getElementById('drop-zone');
    const fileNameDisplay = document.getElementById('file-name-display');
    const generateBtn = document.getElementById('generate-btn');
    const verificationSection = document.getElementById('verification-section');
    const storiesTbody = document.getElementById('stories-tbody');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const bulkApproveBtn = document.getElementById('bulk-approve-btn');
    const selectedCountSpan = document.getElementById('selected-count');
    const finalJiraBtn = document.getElementById('final-jira-btn');
    
    let uploadedFile = null;
    let storyData = [];

    // --- 1. File Upload Interaction ---
    dropZone.onclick = () => fileUpload.click();
    fileUpload.onchange = (e) => {
        if (e.target.files.length > 0) {
            uploadedFile = e.target.files[0];
            fileNameDisplay.textContent = `Selected: ${uploadedFile.name}`;
            fileNameDisplay.classList.add('text-indigo-600', 'font-bold');
        }
    };

    // --- 2. Generation Logic ---
    generateBtn.onclick = async () => {
        if (!uploadedFile) return alert("Please upload a file first.");
        generateBtn.disabled = true;
        generateBtn.innerHTML = "Processing...";

        // Simulate 20+ stories from server
        storyData = Array.from({length: 22}, (_, i) => ({
            id: i + 1,
            summary: `User Story ${i + 1}: Feature Implementation`,
            description: `Detailed technical specifications for story ${i + 1}.`,
            status: 'pending',
            comment: '',
            isSelected: false,
            isEditing: false,
            isAddingFeedback: false
        }));

        renderTable();
        verificationSection.classList.remove('hidden');
        verificationSection.scrollIntoView({ behavior: 'smooth' });
        generateBtn.innerHTML = "Generated";
    };

    // --- 3. Table Rendering ---
    function renderTable() {
        storiesTbody.innerHTML = '';
        document.getElementById('story-count').textContent = `${storyData.length} Stories`;

        storyData.forEach((story, index) => {
            const row = document.createElement('tr');
            // Feedback is hidden if status is 'approved'
            const showFeedback = story.status === 'revision' && story.comment && !story.isAddingFeedback;
            
            row.className = `border-b border-gray-100 transition-all group ${story.status === 'approved' ? 'bg-green-50/50' : ''}`;
            
            row.innerHTML = `
                <td class="p-4 align-top w-12"><input type="checkbox" class="story-checkbox w-4 h-4 cursor-pointer" ${story.isSelected ? 'checked' : ''}></td>
                <td class="p-4 align-top font-bold text-gray-400 text-sm w-12">${index + 1}</td>
                <td class="p-4 align-top">
                    <div class="flex flex-col max-w-2xl">
                        <div class="${story.isEditing ? 'hidden' : ''}">
                            <div class="flex items-center gap-2 group/title">
                                <span class="font-semibold text-gray-800">${story.summary}</span>
                                <button class="edit-row-btn opacity-0 group-hover/title:opacity-100 text-gray-400 hover:text-indigo-600 transition-all"><i data-feather="edit-2" class="w-3 h-3"></i></button>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">${story.description}</p>
                        </div>

                        <div class="${story.isEditing ? '' : 'hidden'} bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-2">
                            <input type="text" class="edit-summary w-full p-2 border rounded text-sm mb-2" value="${story.summary}">
                            <textarea class="edit-description w-full p-2 border rounded text-xs" rows="2">${story.description}</textarea>
                            <div class="flex gap-2 mt-2">
                                <button class="save-edit-btn bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold">Save</button>
                                <button class="cancel-edit-btn bg-gray-200 text-gray-600 px-3 py-1 rounded text-xs">Cancel</button>
                            </div>
                        </div>

                        ${showFeedback ? `
                        <div class="mt-2 bg-red-50 p-2 rounded border border-red-100 flex items-start justify-between animate-fadeIn">
                            <p class="text-xs text-red-700"><span class="font-bold">Feedback:</span> ${story.comment}</p>
                            <button class="edit-feedback-btn text-red-400 hover:text-red-600 ml-2"><i data-feather="edit-2" class="w-3 h-3"></i></button>
                        </div>` : ''}

                        <div class="${story.isAddingFeedback ? '' : 'hidden'} mt-2 bg-gray-50 p-3 rounded border border-gray-200">
                            <textarea class="feedback-input w-full p-2 border rounded text-xs" placeholder="What needs revision?">${story.comment}</textarea>
                            <div class="flex gap-2 mt-2">
                                <button class="save-feedback-btn bg-red-600 text-white px-3 py-1 rounded text-xs font-bold">Save Feedback</button>
                                <button class="cancel-feedback-btn bg-gray-200 text-gray-600 px-3 py-1 rounded text-xs">Cancel</button>
                            </div>
                        </div>
                    </div>
                </td>
                <td class="p-4 align-top">
                    <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusClass(story.status)}">${story.status}</span>
                </td>
                <td class="p-4 align-top text-right">
                    <div class="flex gap-2 justify-end">
                        <button class="approve-row-btn text-green-500 hover:bg-green-100 p-1 rounded" title="Approve"><i data-feather="check-circle" class="w-5 h-5"></i></button>
                        <button class="reject-row-btn text-red-500 hover:bg-red-100 p-1 rounded" title="Needs Revision"><i data-feather="alert-circle" class="w-5 h-5"></i></button>
                    </div>
                </td>
            `;

            attachEvents(row, index);
            storiesTbody.appendChild(row);
        });
        feather.replace();
    }

    // --- 4. Event Attachment ---
    function attachEvents(row, index) {
        row.querySelector('.story-checkbox').onchange = (e) => {
            storyData[index].isSelected = e.target.checked;
            updateBulkUI();
        };

        row.querySelector('.approve-row-btn').onclick = () => {
            storyData[index].status = 'approved';
            storyData[index].isSelected = true; // Auto-check on approval
            storyData[index].isAddingFeedback = false; 
            renderTable();
            updateBulkUI();
        };

        row.querySelector('.reject-row-btn').onclick = () => {
            storyData[index].status = 'revision';
            storyData[index].isAddingFeedback = true;
            renderTable();
        };

        row.querySelector('.edit-row-btn').onclick = () => {
            storyData[index].isEditing = true;
            renderTable();
        };

        const saveEdit = row.querySelector('.save-edit-btn');
        if(saveEdit) saveEdit.onclick = () => {
            storyData[index].summary = row.querySelector('.edit-summary').value;
            storyData[index].description = row.querySelector('.edit-description').value;
            storyData[index].isEditing = false;
            renderTable();
        };

        const saveFeedback = row.querySelector('.save-feedback-btn');
        if(saveFeedback) saveFeedback.onclick = () => {
            storyData[index].comment = row.querySelector('.feedback-input').value;
            storyData[index].isAddingFeedback = false;
            renderTable();
        };

        const editFeedback = row.querySelector('.edit-feedback-btn');
        if(editFeedback) editFeedback.onclick = () => {
            storyData[index].isAddingFeedback = true;
            renderTable();
        };

        row.querySelectorAll('.cancel-edit-btn, .cancel-feedback-btn').forEach(btn => {
            btn.onclick = () => {
                storyData[index].isEditing = false;
                storyData[index].isAddingFeedback = false;
                renderTable();
            };
        });
    }

    function getStatusClass(status) {
        if(status === 'approved') return 'bg-green-100 text-green-700';
        if(status === 'revision') return 'bg-red-100 text-red-700';
        return 'bg-gray-100 text-gray-600';
    }

    // --- 5. Bulk Management ---
    selectAllCheckbox.onchange = (e) => {
        storyData.forEach(s => s.isSelected = e.target.checked);
        renderTable();
        updateBulkUI();
    };

    function updateBulkUI() {
        const count = storyData.filter(s => s.isSelected).length;
        bulkApproveBtn.classList.toggle('hidden', count === 0);
        selectedCountSpan.classList.toggle('hidden', count === 0);
        selectedCountSpan.textContent = `${count} selected`;
    }

    bulkApproveBtn.onclick = () => {
        storyData.forEach(s => { 
            if(s.isSelected) {
                s.status = 'approved';
                s.isAddingFeedback = false;
            }
        });
        renderTable();
        updateBulkUI();
    };

    finalJiraBtn.onclick = () => {
        const approved = storyData.filter(s => s.status === 'approved');
        if(approved.length === 0) return alert("Please approve stories before syncing.");
        finalJiraBtn.disabled = true;
        finalJiraBtn.innerHTML = "Syncing with Jira...";
        setTimeout(() => { alert(`Created ${approved.length} stories in Jira!`); window.location.reload(); }, 1500);
    };
});