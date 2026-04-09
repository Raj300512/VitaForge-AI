document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('jobSearchForm');
    const jobsLoading = document.getElementById('jobsLoading');
    const jobsError = document.getElementById('jobsError');
    const jobsResults = document.getElementById('jobsResults');
    const jobsEmpty = document.getElementById('jobsEmpty');
    const useResumeSkillsBtn = document.getElementById('useResumeSkillsBtn');
    const skillsContext = document.getElementById('skillsContext');
    const skillsList = document.getElementById('skillsList');
    const resultsInfo = document.getElementById('resultsInfo');
    const resultsCount = document.getElementById('resultsCount');
    const resultsQuery = document.getElementById('resultsQuery');

    let usingSkills = false;
    let savedSkills = [];

    // Try to load skills from recent analysis
    try {
        const lastAnalysis = sessionStorage.getItem('analysisResults');
        if (lastAnalysis) {
            const data = JSON.parse(lastAnalysis);
            if (data.found_skills && data.found_skills.length > 0) {
                savedSkills = data.found_skills.slice(0, 8);
            }
        }
    } catch (e) {
        console.error("Could not load skills", e);
    }

    if (savedSkills.length > 0) {
        useResumeSkillsBtn.style.display = 'flex';
    } else {
        useResumeSkillsBtn.style.display = 'none';
        skillsContext.style.display = 'none';
    }

    useResumeSkillsBtn.addEventListener('click', () => {
        usingSkills = !usingSkills;
        if (usingSkills) {
            useResumeSkillsBtn.classList.add('active');
            useResumeSkillsBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Using Skills
            `;
            skillsContext.style.display = 'block';
            skillsList.textContent = savedSkills.join(', ');
        } else {
            useResumeSkillsBtn.classList.remove('active');
            useResumeSkillsBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                Use My Skills
            `;
            skillsContext.style.display = 'none';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const query = document.getElementById('jobQuery').value.trim();
        const type = document.getElementById('jobType').value;
        const location = document.getElementById('jobLocation').value.trim();
        const datePosted = document.getElementById('datePosted').value;
        const remoteOnly = document.getElementById('remoteOnly').checked;

        if (!query) return;

        jobsLoading.style.display = 'flex';
        jobsResults.innerHTML = '';
        jobsError.style.display = 'none';
        jobsEmpty.style.display = 'none';
        resultsInfo.style.display = 'none';

        try {
            const params = new URLSearchParams({ q: query });
            
            if (type) params.append('type', type);
            if (location) params.append('location', location);
            if (datePosted) params.append('date_posted', datePosted);
            if (remoteOnly) params.append('remote_only', 'true');
            if (usingSkills && savedSkills.length > 0) {
                params.append('skills', savedSkills.join(', '));
            }

            const response = await fetch(`/api/jobs?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch jobs');
            }

            if (!data.jobs || data.jobs.length === 0) {
                jobsEmpty.style.display = 'block';
            } else {
                renderJobs(data.jobs);
                // Show results info
                resultsCount.textContent = data.jobs.length;
                resultsQuery.textContent = ` for "${query}"` + (type ? ` • ${type}` : '') + (location ? ` • ${location}` : '');
                resultsInfo.style.display = 'flex';
            }

        } catch (error) {
            jobsError.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <span>${error.message}</span>
            `;
            jobsError.style.display = 'flex';
        } finally {
            jobsLoading.style.display = 'none';
        }
    });

    function renderJobs(jobs) {
        jobs.forEach((job, index) => {
            const card = document.createElement('div');
            card.className = 'job-card fade-in';
            card.style.animationDelay = `${index * 0.06}s`;

            // AI badge
            const aiBadge = job.ai_recommended ? 
                `<div class="job-ai-badge">✨ AI Skill Match</div>` : '';

            // Employment type badge
            let typeBadgeClass = 'badge-default';
            if (job.employment_type === 'Internship') typeBadgeClass = 'badge-intern';
            else if (job.employment_type === 'Contract') typeBadgeClass = 'badge-contract';
            else if (job.employment_type === 'Full-time') typeBadgeClass = 'badge-fulltime';
            else if (job.employment_type === 'Part-time') typeBadgeClass = 'badge-parttime';

            const typeBadge = job.employment_type ? 
                `<span class="job-type-badge ${typeBadgeClass}">${escapeHTML(job.employment_type)}</span>` : '';

            // Company logo
            const logoHtml = job.company_logo ? 
                `<img src="${job.company_logo}" alt="" class="job-company-logo" onerror="this.style.display='none'">` :
                `<div class="job-company-logo-placeholder">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                </div>`;

            // Salary
            const salaryHtml = job.salary ? 
                `<div class="job-salary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    ${escapeHTML(job.salary)}
                </div>` : '';

            // Posted
            const postedHtml = job.posted ? 
                `<span class="job-posted">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    ${escapeHTML(job.posted)}
                </span>` : '';

            // Remote badge
            const remoteBadge = job.is_remote ? 
                `<span class="job-remote-badge">🌐 Remote</span>` : '';

            // Highlights section
            let highlightsHtml = '';
            if ((job.qualifications && job.qualifications.length > 0) || 
                (job.responsibilities && job.responsibilities.length > 0) || 
                (job.benefits && job.benefits.length > 0)) {
                
                const qualHtml = job.qualifications && job.qualifications.length > 0 ? `
                    <div class="highlight-section">
                        <h4>📋 Requirements</h4>
                        <ul>${job.qualifications.slice(0, 3).map(q => `<li>${escapeHTML(q)}</li>`).join('')}</ul>
                    </div>
                ` : '';

                const respHtml = job.responsibilities && job.responsibilities.length > 0 ? `
                    <div class="highlight-section">
                        <h4>🎯 Responsibilities</h4>
                        <ul>${job.responsibilities.slice(0, 3).map(r => `<li>${escapeHTML(r)}</li>`).join('')}</ul>
                    </div>
                ` : '';

                const benHtml = job.benefits && job.benefits.length > 0 ? `
                    <div class="highlight-section">
                        <h4>🎁 Benefits</h4>
                        <ul>${job.benefits.slice(0, 3).map(b => `<li>${escapeHTML(b)}</li>`).join('')}</ul>
                    </div>
                ` : '';

                highlightsHtml = `
                    <div class="job-highlights">
                        <button class="highlights-toggle" onclick="this.parentElement.classList.toggle('open')">
                            <span>View Details</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                        <div class="highlights-content">
                            ${qualHtml}${respHtml}${benHtml}
                        </div>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="job-card-top">
                    ${aiBadge}
                    <div class="job-badges">
                        ${typeBadge}
                        ${remoteBadge}
                        ${postedHtml}
                    </div>
                </div>
                <div class="job-header">
                    ${logoHtml}
                    <div class="job-header-info">
                        <h3 class="job-title">${escapeHTML(job.title)}</h3>
                        <div class="job-company">${escapeHTML(job.company || 'Company Unlisted')}</div>
                    </div>
                </div>
                <div class="job-location">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    ${escapeHTML(job.location || 'Not specified')}
                </div>
                ${salaryHtml}
                <p class="job-snippet">${escapeHTML(job.snippet)}</p>
                ${highlightsHtml}
                <div class="job-footer">
                    <span class="job-source">${escapeHTML(job.source || 'JSearch')}</span>
                    <a href="${job.url}" target="_blank" rel="noopener noreferrer" class="btn-apply">
                        Apply Now
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="7" y1="17" x2="17" y2="7"></line>
                            <polyline points="7 7 17 7 17 17"></polyline>
                        </svg>
                    </a>
                </div>
            `;
            jobsResults.appendChild(card);
        });
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
