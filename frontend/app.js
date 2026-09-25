const photoInput = document.getElementById('photo-input');
const previewContainer = document.getElementById('preview-container');
const photoPreview = document.getElementById('photo-preview');
const replaceBtn = document.getElementById('replace-btn');
const consentCheckbox = document.getElementById('consent-checkbox');
const submitBtn = document.getElementById('submit-btn');
const errorMessage = document.getElementById('error-message');
const loadingState = document.getElementById('loading-state');
const uploadSection = document.getElementById('upload-section');
const resultSection = document.getElementById('result-section');
const routeMessage = document.getElementById('route-message');
const revisionInfo = document.getElementById('revision-info');
const startOverBtn = document.getElementById('start-over-btn');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

let selectedFile = null;

photoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > MAX_FILE_SIZE) {
    showError('File exceeds the 10MB limit. Please choose a smaller photo.');
    photoInput.value = '';
    return;
  }

  selectedFile = file;
  hideError();
  
  // Local preview (T2.5)
  const objectUrl = URL.createObjectURL(file);
  photoPreview.src = objectUrl;
  
  document.querySelector('.file-input-wrapper').classList.add('hidden');
  previewContainer.classList.remove('hidden');
  updateSubmitState();
});

replaceBtn.addEventListener('click', () => {
  selectedFile = null;
  photoInput.value = '';
  photoPreview.src = '';
  document.querySelector('.file-input-wrapper').classList.remove('hidden');
  previewContainer.classList.add('hidden');
  updateSubmitState();
});

consentCheckbox.addEventListener('change', updateSubmitState);

function updateSubmitState() {
  submitBtn.disabled = !(selectedFile && consentCheckbox.checked);
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.classList.remove('hidden');
}

function hideError() {
  errorMessage.classList.add('hidden');
}

submitBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  // Do not transmit photo to AI before consent (T2.7)
  if (!consentCheckbox.checked) {
    showError('Consent is required.');
    return;
  }

  submitBtn.disabled = true;
  loadingState.classList.remove('hidden');
  hideError();

  const formData = new FormData();
  formData.append('photo', selectedFile);
  formData.append('consent', 'true');

  try {
    const res = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (data.route === 'REUPLOAD' || data.route === 'CONSENT_REQUIRED') {
      showError(data.message || 'Please reupload your photo.');
    } else if (data.route === 'READY_FOR_ANALYSIS') {
      uploadSection.classList.add('hidden');
      resultSection.classList.remove('hidden');
      routeMessage.textContent = 'Status: ' + data.route;
      revisionInfo.textContent = 'Revision ID: ' + data.revisionId;
      
      currentRevisionId = data.revisionId;
      
      // Auto-trigger analysis
      routeMessage.textContent = 'Status: ANALYZING...';
      const analyzeRes = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionId: data.revisionId })
      });
      
      const analyzeData = await analyzeRes.json();
      
      if (analyzeData.route === 'SUCCESS' && analyzeData.analysis) {
        routeMessage.textContent = 'Status: SUCCESS';
        document.getElementById('analysis-output').classList.remove('hidden');
        document.getElementById('visual-suitability-text').textContent = analyzeData.analysis.visualSuitability.isValid ? 'Valid Photo' : 'Invalid Photo: ' + analyzeData.analysis.visualSuitability.reason;
        
        const attrs = analyzeData.analysis.attributes;
        const attrsList = document.getElementById('attributes-list');
        attrsList.innerHTML = '';
        if (attrs) {
          for (const [key, val] of Object.entries(attrs)) {
            const li = document.createElement('li');
            li.textContent = `${key}: ${val}`;
            attrsList.appendChild(li);
          }
        }
        
        document.getElementById('preferences-section').classList.remove('hidden');
      } else {
        routeMessage.textContent = 'Status: ' + analyzeData.route;
        showError(analyzeData.message || 'Analysis failed.');
      }
    } else {
      showError(data.message || 'An error occurred.');
    }
  } catch (err) {
    showError('Network error. Please try again.');
  } finally {
    submitBtn.disabled = false;
    loadingState.classList.add('hidden');
  }
});

startOverBtn.addEventListener('click', () => {
  replaceBtn.click();
  consentCheckbox.checked = false;
  uploadSection.classList.remove('hidden');
  resultSection.classList.add('hidden');
  document.getElementById('preferences-section').classList.add('hidden');
  document.getElementById('recommendations-container').classList.add('hidden');
  document.getElementById('preview-section').classList.add('hidden');
  hideError();
});

let currentRevisionId = null;
let currentSelectedStyleId = null;

const getRecsBtn = document.getElementById('get-recommendations-btn');
const recsContainer = document.getElementById('recommendations-container');
const recsList = document.getElementById('recommendations-list');
const selectBtn = document.getElementById('select-hairstyle-btn');
const loadingRecs = document.getElementById('loading-recs');

getRecsBtn.addEventListener('click', async () => {
  if (!currentRevisionId) return;
  
  getRecsBtn.disabled = true;
  loadingRecs.classList.remove('hidden');
  recsContainer.classList.add('hidden');
  hideError();

  const preferences = {
    vibe: document.getElementById('vibe-input').value,
    desiredLength: document.getElementById('length-select').value,
    stylingEffort: document.getElementById('effort-select').value,
    note: document.getElementById('note-input').value
  };

  try {
    const res = await fetch('http://localhost:3000/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revisionId: currentRevisionId, preferences })
    });
    const data = await res.json();
    
    if (data.route === 'SUCCESS' && data.recommendations) {
      recsList.innerHTML = '';
      currentSelectedStyleId = null;
      selectBtn.disabled = true;
      
      data.recommendations.recommendations.forEach(rec => {
        const div = document.createElement('div');
        div.className = 'recommendation-card';
        div.dataset.id = rec.id;
        
        let html = `<h4>${rec.name}</h4>`;
        if (rec.isBestMatch) {
          html += `<span class="best-match-badge">BEST MATCH</span>`;
        }
        html += `<p>${rec.description}</p>`;
        html += `<p><strong>Reason:</strong> ${rec.reason}</p>`;
        html += `<p><strong>Effort:</strong> ${rec.stylingEffort}</p>`;
        html += `<p><strong>Constraints:</strong> ${rec.constraints.join(', ')}</p>`;
        
        div.innerHTML = html;
        
        div.addEventListener('click', () => {
          document.querySelectorAll('.recommendation-card').forEach(c => c.classList.remove('selected'));
          div.classList.add('selected');
          currentSelectedStyleId = rec.id;
          selectBtn.disabled = false;
        });
        
        recsList.appendChild(div);
      });
      
      recsContainer.classList.remove('hidden');
    } else {
      showError(data.message || 'Failed to get recommendations.');
    }
  } catch (err) {
    showError('Network error while getting recommendations.');
  } finally {
    getRecsBtn.disabled = false;
    loadingRecs.classList.add('hidden');
  }
});

selectBtn.addEventListener('click', async () => {
  if (!currentRevisionId || !currentSelectedStyleId) return;
  
  selectBtn.disabled = true;
  
  try {
    const res = await fetch('http://localhost:3000/api/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revisionId: currentRevisionId, hairstyleId: currentSelectedStyleId })
    });
    const data = await res.json();
    
    if (data.route === 'READY_FOR_PREVIEW') {
      const routeMessage = document.getElementById('route-message');
      routeMessage.textContent = 'Status: READY_FOR_PREVIEW (Selected: ' + currentSelectedStyleId + ')';
      
      // Setup preview section
      document.getElementById('preview-section').classList.remove('hidden');
      document.getElementById('preview-original-img').src = document.getElementById('photo-preview').src;
      
      const selectedRecName = document.querySelector(`.recommendation-card[data-id="${currentSelectedStyleId}"] h4`).textContent;
      document.getElementById('preview-style-name').textContent = selectedRecName;
      
      // Reset preview state
      document.getElementById('preview-result-img').style.display = 'none';
      document.getElementById('preview-error').classList.add('hidden');
      document.getElementById('retry-preview-btn').classList.add('hidden');
      document.getElementById('generate-preview-btn').classList.remove('hidden');
      
    } else {
      showError(data.message || 'Failed to select style.');
    }
  } catch (err) {
    showError('Network error while selecting style.');
  } finally {
    selectBtn.disabled = false;
  }
});

const generatePreviewBtn = document.getElementById('generate-preview-btn');
const retryPreviewBtn = document.getElementById('retry-preview-btn');
const continueBtn = document.getElementById('continue-without-preview-btn');
const previewLoading = document.getElementById('preview-loading');
const previewResultImg = document.getElementById('preview-result-img');
const previewError = document.getElementById('preview-error');

async function triggerPreview() {
  if (!currentRevisionId || !currentSelectedStyleId) return;
  
  generatePreviewBtn.disabled = true;
  retryPreviewBtn.disabled = true;
  generatePreviewBtn.classList.add('hidden');
  retryPreviewBtn.classList.add('hidden');
  
  previewError.classList.add('hidden');
  previewResultImg.style.display = 'none';
  previewLoading.classList.remove('hidden');
  
  try {
    const res = await fetch('http://localhost:3000/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revisionId: currentRevisionId, hairstyleId: currentSelectedStyleId })
    });
    
    const data = await res.json();
    
    if (data.route === 'SUCCESS' && data.previewImageUrl) {
      previewResultImg.src = data.previewImageUrl;
      previewResultImg.style.display = 'block';
    } else {
      previewError.textContent = data.message || 'Preview generation failed.';
      previewError.classList.remove('hidden');
      retryPreviewBtn.classList.remove('hidden');
      retryPreviewBtn.disabled = false;
    }
  } catch (err) {
    previewError.textContent = 'Network error while generating preview.';
    previewError.classList.remove('hidden');
    retryPreviewBtn.classList.remove('hidden');
    retryPreviewBtn.disabled = false;
  } finally {
    previewLoading.classList.add('hidden');
  }
}

generatePreviewBtn.addEventListener('click', triggerPreview);
retryPreviewBtn.addEventListener('click', triggerPreview);

continueBtn.addEventListener('click', () => {
  alert('Continuing without preview (T6 stub)...');
});
