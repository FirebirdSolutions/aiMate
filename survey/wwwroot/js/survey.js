// Survey State
let useCases = [];
const totalSections = 11;

// Initialize on page load
window.addEventListener('DOMContentLoaded', async () => {
    // Track referral source from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source') || urlParams.get('ref') || 'direct';
    document.getElementById('referralSource').value = source;

    // Load dynamic use cases
    await loadUseCases();

    // Setup event listeners
    setupEventListeners();

    // Initialize progress bar
    updateProgress();

    // Setup scroll listener for progress
    window.addEventListener('scroll', updateProgress);
});

// Load dynamic use cases from API
async function loadUseCases() {
    const container = document.getElementById('useCasesContainer');

    try {
        const response = await fetch('/api/survey/use-cases');
        if (!response.ok) throw new Error('Failed to load use cases');

        useCases = await response.json();
        renderUseCases(useCases);

    } catch (error) {
        console.error('Error loading use cases:', error);
        container.innerHTML = '<p style="color: #c53030;">Failed to load use cases. Please refresh the page.</p>';
    }
}

// Render use case categories and options
function renderUseCases(categories) {
    const container = document.getElementById('useCasesContainer');
    container.classList.remove('loading');
    container.innerHTML = '';

    categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'use-case-category';

        let html = `
            <h3>${category.name}</h3>
        `;

        if (category.description) {
            html += `<p class="category-description">${category.description}</p>`;
        }

        html += '<div class="use-case-options">';

        category.options.forEach(option => {
            html += `
                <label class="use-case-option">
                    <input type="checkbox"
                           name="useCase_${option.id}"
                           value="${option.id}"
                           data-category="${category.name}">
                    <div class="use-case-option-label">
                        <div class="use-case-option-name">${option.name}</div>
                        ${option.description ? `<div class="use-case-option-desc">${option.description}</div>` : ''}
                    </div>
                </label>
            `;
        });

        html += '</div>';
        categoryDiv.innerHTML = html;
        container.appendChild(categoryDiv);
    });
}

// Setup all event listeners
function setupEventListeners() {
    // AI usage conditional display
    const currentlyUsesAI = document.getElementById('currentlyUsesAI');
    if (currentlyUsesAI) {
        currentlyUsesAI.addEventListener('change', function() {
            const aiUserQuestions = document.getElementById('aiUserQuestions');
            const nonAiUserQuestions = document.getElementById('nonAiUserQuestions');

            if (this.checked) {
                aiUserQuestions.style.display = 'block';
                nonAiUserQuestions.style.display = 'none';
            } else {
                aiUserQuestions.style.display = 'none';
                nonAiUserQuestions.style.display = 'block';
            }
        });
    }

    // Alpha testing email field
    const interestedInTesting = document.getElementById('interestedInAlphaTesting');
    if (interestedInTesting) {
        interestedInTesting.addEventListener('change', function() {
            const alphaDetails = document.getElementById('alphaDetails');
            const emailField = document.getElementById('email');

            if (this.checked) {
                alphaDetails.style.display = 'block';
                emailField.required = true;
            } else {
                alphaDetails.style.display = 'none';
                emailField.required = false;
            }
        });
    }

    // File handling conditional questions
    const fileCheckboxes = ['worksWithDocuments', 'worksWithImages', 'worksWithCode', 'worksWithData'];
    fileCheckboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', updateFileHandlingDisplay);
        }
    });

    // Integration conditional question
    const needsIntegration = document.getElementById('needsIntegrationWithTools');
    if (needsIntegration) {
        needsIntegration.addEventListener('change', function() {
            const specificIntegrations = document.getElementById('specificIntegrationsQuestion');
            if (this.checked) {
                specificIntegrations.style.display = 'block';
            } else {
                specificIntegrations.style.display = 'none';
            }
        });
    }

    // Platform checkboxes
    const platformCheckboxes = ['usesWeb', 'usesDesktop', 'usesMobile'];
    platformCheckboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', updateProgress);
        }
    });

    // Form submission
    const form = document.getElementById('surveyForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
}

// Update file handling display based on selections
function updateFileHandlingDisplay() {
    const anyFileWork =
        document.getElementById('worksWithDocuments')?.checked ||
        document.getElementById('worksWithImages')?.checked ||
        document.getElementById('worksWithCode')?.checked ||
        document.getElementById('worksWithData')?.checked;

    const fileSizeQuestion = document.getElementById('fileSizeQuestion');
    if (fileSizeQuestion) {
        fileSizeQuestion.style.display = anyFileWork ? 'block' : 'none';
    }
}

// Update progress bar
function updateProgress() {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    if (!progressBar || !progressText) return;

    // Calculate progress based on filled fields
    const totalFields = document.querySelectorAll('input, select, textarea').length;
    let filledFields = 0;

    document.querySelectorAll('input[type="text"], input[type="email"], select, textarea').forEach(field => {
        if (field.value && field.value.trim() !== '') filledFields++;
    });

    document.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked').forEach(() => {
        filledFields++;
    });

    const percentage = Math.round((filledFields / totalFields) * 100);
    progressBar.style.width = percentage + '%';
    progressText.textContent = `${percentage}% Complete`;
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        // Collect all form data
        const formData = collectFormData();

        // Validate
        if (formData.interestedInAlphaTesting && !formData.email) {
            alert('Please provide your email address to be considered for alpha testing.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Survey';
            return;
        }

        // Submit to API
        const response = await fetch('/api/survey/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to submit survey');
        }

        // Show success message
        document.getElementById('surveyForm').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error('Error submitting survey:', error);
        alert('There was an error submitting your survey. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Survey';
    }
}

// Collect all form data including new metrics
function collectFormData() {
    return {
        // Demographics
        ageRange: getFieldValue('ageRange'),
        generalLocation: getFieldValue('generalLocation'),
        occupationCategory: getFieldValue('occupationCategory'),
        techComfortLevel: getFieldValue('techComfortLevel'),

        // AI Usage
        currentlyUsesAI: getCheckboxValue('currentlyUsesAI'),
        aiToolsUsed: getFieldValue('aiToolsUsed'),
        primaryAITool: getFieldValue('primaryAITool'),
        frequencyOfUse: getFieldValue('frequencyOfUse'),

        // Legacy use cases (kept for backward compatibility)
        useForWork: getCheckboxValue('useForWork'),
        useForPersonalProjects: getCheckboxValue('useForPersonalProjects'),
        useForLearning: getCheckboxValue('useForLearning'),
        useForCreativeWork: getCheckboxValue('useForCreativeWork'),
        useForCoding: getCheckboxValue('useForCoding'),
        useForWriting: getCheckboxValue('useForWriting'),
        useForResearch: getCheckboxValue('useForResearch'),
        useForOther: getCheckboxValue('useForOther'),
        otherUseCase: getFieldValue('otherUseCase'),

        // NEW: Dynamic use cases
        selectedUseCaseIds: getSelectedUseCaseIds(),

        // Barriers
        barrierCost: getCheckboxValue('barrierCost'),
        barrierComplexity: getCheckboxValue('barrierComplexity'),
        barrierPrivacyConcerns: getCheckboxValue('barrierPrivacyConcerns'),
        barrierDontKnowHowToStart: getCheckboxValue('barrierDontKnowHowToStart'),
        barrierDontSeeBenefit: getCheckboxValue('barrierDontSeeBenefit'),
        barrierOther: getCheckboxValue('barrierOther'),
        otherBarrier: getFieldValue('otherBarrier'),

        // Feedback
        whatsMissing: getFieldValue('whatsMissing'),
        idealAIFeatures: getFieldValue('idealAIFeatures'),
        biggestFrustration: getFieldValue('biggestFrustration'),

        // NEW METRICS: Context & Conversation
        typicalConversationLength: getFieldValue('typicalConversationLength'),
        needsLongTermMemory: getCheckboxValue('needsLongTermMemory'),
        needsContextAcrossSessions: getCheckboxValue('needsContextAcrossSessions'),

        // File & Document Handling
        worksWithDocuments: getCheckboxValue('worksWithDocuments'),
        worksWithImages: getCheckboxValue('worksWithImages'),
        worksWithCode: getCheckboxValue('worksWithCode'),
        worksWithData: getCheckboxValue('worksWithData'),
        typicalFileSize: getFieldValue('typicalFileSize'),

        // Response Preferences
        preferredResponseStyle: getFieldValue('preferredResponseStyle'),
        qualityVsSpeed: getFieldValue('qualityVsSpeed'),

        // Advanced Features
        needsCodeExecution: getCheckboxValue('needsCodeExecution'),
        needsImageGeneration: getCheckboxValue('needsImageGeneration'),
        needsWebSearch: getCheckboxValue('needsWebSearch'),
        needsDataVisualization: getCheckboxValue('needsDataVisualization'),

        // Collaboration & Sharing
        needsTeamCollaboration: getCheckboxValue('needsTeamCollaboration'),
        needsWorkspaceOrganization: getCheckboxValue('needsWorkspaceOrganization'),
        wouldShareConversations: getCheckboxValue('wouldShareConversations'),

        // Integration Needs
        needsAPIAccess: getCheckboxValue('needsAPIAccess'),
        needsIntegrationWithTools: getCheckboxValue('needsIntegrationWithTools'),
        specificIntegrations: getFieldValue('specificIntegrations'),

        // Privacy & Data Preferences
        dataPrivacyConcern: getFieldValue('dataPrivacyConcern'),
        preferredDataLocation: getRadioValue('preferredDataLocation'),
        willingToShareDataForImprovement: getCheckboxValue('willingToShareDataForImprovement'),

        // Pricing & Cost
        willingToPayMonthly: getFieldValue('willingToPayMonthly'),
        preferredPricingModel: getFieldValue('preferredPricingModel'),
        mostImportantValue: getRadioValue('mostImportantValue'),

        // Platform Preferences
        usesWeb: getCheckboxValue('usesWeb'),
        usesDesktop: getCheckboxValue('usesDesktop'),
        usesMobile: getCheckboxValue('usesMobile'),
        primaryPlatform: getRadioValue('primaryPlatform'),

        // LLM Familiarity
        familiarWithGPT4: getCheckboxValue('familiarWithGPT4'),
        familiarWithClaude: getCheckboxValue('familiarWithClaude'),
        familiarWithGemini: getCheckboxValue('familiarWithGemini'),
        familiarWithOpenSource: getCheckboxValue('familiarWithOpenSource'),
        preferredLLMFeatures: getFieldValue('preferredLLMFeatures'),

        // Multimodal Needs
        needsVoiceInput: getCheckboxValue('needsVoiceInput'),
        needsVoiceOutput: getCheckboxValue('needsVoiceOutput'),
        needsVideoAnalysis: getCheckboxValue('needsVideoAnalysis'),

        // Language Preferences
        primaryLanguage: getFieldValue('primaryLanguage'),
        needsMultilingualSupport: getCheckboxValue('needsMultilingualSupport'),

        // Alpha Testing
        interestedInAlphaTesting: getCheckboxValue('interestedInAlphaTesting'),
        email: getFieldValue('email'),
        additionalComments: getFieldValue('additionalComments'),
        referralSource: getFieldValue('referralSource')
    };
}

// Helper functions to get form values
function getFieldValue(id) {
    const element = document.getElementById(id);
    return element ? (element.value || null) : null;
}

function getCheckboxValue(id) {
    const element = document.getElementById(id);
    return element ? element.checked : false;
}

function getRadioValue(name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : null;
}

function getSelectedUseCaseIds() {
    const checkboxes = document.querySelectorAll('#useCasesContainer input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => parseInt(cb.value));
}

// Add input listeners to update progress in real-time
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('change', updateProgress);
        field.addEventListener('input', updateProgress);
    });
});
