/**
 * loadStartedCases.js - Lädt angefangene Fälle gruppiert nach Patient
 * Mit aufklappbarer Ansicht
 */

$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const identifier = urlParams.get('identifier');

    if (!identifier) {
        console.log("Kein identifier - kann angefangene Fälle nicht laden");
        $('#start_input').html('<p style="color: #999; padding: 20px;">Bitte melden Sie sich an, um Ihre angefangenen Fälle zu sehen.</p>');
        return;
    }

    loadStartedCases(identifier);
});

function loadStartedCases(identifier) {
    const postData = JSON.stringify({ identifier: identifier });

    $.ajax({
        type: "POST",
        url: 'php/getStartedCases.php',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: postData,
        success: function(result) {
            console.log("Angefangene Fälle:", result);

            if (result.error) {
                $('#start_input').html('<p style="color: #c00; padding: 20px;">Fehler: ' + result.error + '</p>');
                return;
            }

            if (result.length === 0) {
                $('#start_input').html('<p style="color: #999; padding: 20px;">Sie haben noch keine Fälle begonnen.</p>');
                return;
            }

            renderGroupedCases(result, identifier);
        },
        error: function(xhr, ajaxOptions, thrownError) {
            console.error("Fehler beim Laden:", xhr.status, thrownError);
            $('#start_input').html('<p style="color: #c00; padding: 20px;">Fehler beim Laden der Fälle.</p>');
        }
    });
}

function renderGroupedCases(cases, identifier) {
    // CSS für die gruppierte Ansicht
    const styles = `
        <style id="started_cases_styles">
            .cases_accordion {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .case_group {
                background: white;
                border-radius: 8px;
                border: 1px solid #e0e0e0;
                overflow: hidden;
                transition: all 0.2s ease;
            }
            
            .case_group:hover {
                border-color: #2c5f8d;
            }
            
            .case_group_header {
                display: flex;
                align-items: center;
                padding: 15px 20px;
                cursor: pointer;
                user-select: none;
                transition: background 0.2s ease;
            }
            
            .case_group_header:hover {
                background: #f9f9f9;
            }
            
            .case_group.open .case_group_header {
                background: #f5f5f5;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .toggle_icon {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;
                font-size: 12px;
                color: #666;
                transition: transform 0.2s ease;
            }
            
            .case_group.open .toggle_icon {
                transform: rotate(90deg);
            }
            
            .patient_info {
                flex: 1;
            }
            
            .patient_name {
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }
            
            .patient_age {
                font-size: 13px;
                color: #777;
                margin-left: 10px;
            }
            
            .attempt_count {
                background: #e3f2fd;
                color: #1976d2;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
            }
            
            .case_group_content {
                display: none;
                padding: 0;
            }
            
            .case_group.open .case_group_content {
                display: block;
            }
            
            .attempt_item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 20px 12px 56px;
                border-bottom: 1px solid #f0f0f0;
                transition: background 0.2s ease;
            }
            
            .attempt_item:last-child {
                border-bottom: none;
            }
            
            .attempt_item:hover {
                background: #fafafa;
            }
            
            .attempt_info {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .attempt_date {
                font-size: 14px;
                color: #555;
            }
            
            .attempt_answers {
                font-size: 13px;
                color: #888;
            }
            
            .attempt_actions {
                display: flex;
                gap: 8px;
            }
            
            .attempt_btn {
                padding: 8px 14px;
                border-radius: 5px;
                text-decoration: none;
                font-size: 13px;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            
            .continue_btn {
                background: #2c5f8d;
                color: white;
            }
            
            .continue_btn:hover {
                background: #1e4a6f;
            }
            
            .review_btn {
                background: #f0f0f0;
                color: #555;
            }
            
            .review_btn:hover {
                background: #e0e0e0;
                color: #333;
            }
            
            /* Neuester Versuch hervorheben */
            .attempt_item.latest {
                background: #f8fffe;
            }
            
            .attempt_item.latest .attempt_date::before {
                content: "●";
                color: #4caf50;
                margin-right: 8px;
                font-size: 10px;
            }
        </style>
    `;

    if ($('#started_cases_styles').length === 0) {
        $('head').append(styles);
    }

    let html = '<div class="cases_accordion">';

    cases.forEach(function(caseGroup, index) {
        const isOpen = index === 0 ? 'open' : ''; // Erster Fall aufgeklappt
        const attemptCount = caseGroup.attempts.length;
        const attemptText = attemptCount === 1 ? '1 Versuch' : attemptCount + ' x gestartet';

        html += `
            <div class="case_group ${isOpen}" data-fall-id="${caseGroup.fall_id}">
                <div class="case_group_header">
                    <div class="toggle_icon">▶</div>
                    <div class="patient_info">
                        <span class="patient_name">${escapeHtml(caseGroup.patient_name)}</span>
                        ${caseGroup.patient_age ? '<span class="patient_age">' + escapeHtml(caseGroup.patient_age) + '</span>' : ''}
                    </div>
                    <div class="attempt_count">${attemptText}</div>
                </div>
                <div class="case_group_content">
        `;

        caseGroup.attempts.forEach(function(attempt, attemptIndex) {
            const isLatest = attemptIndex === 0;
            const latestClass = isLatest ? 'latest' : '';
            const lastEdited = formatDate(attempt.last_edited);
            const hashValue = caseGroup.fall_id + '-' + attempt.result_id;

            html += `
                <div class="attempt_item ${latestClass}">
                    <div class="attempt_info">
                        <span class="attempt_date">${lastEdited}</span>
                        <span class="attempt_answers">${attempt.answer_count} Antworten</span>
                    </div>
                    <div class="attempt_actions">
                        ${isLatest ? `
                            <a href="step0_0.html?identifier=${encodeURIComponent(identifier)}#${hashValue}" 
                               class="attempt_btn continue_btn">
                                Fortsetzen →
                            </a>
                        ` : ''}
                        <a href="step0_0.html?mode=review&identifier=${encodeURIComponent(identifier)}#${hashValue}" 
                           class="attempt_btn review_btn">
                            📋 Review
                        </a>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    html += '</div>';

    $('#start_input').html(html);

    // Toggle-Funktionalität
    $('.case_group_header').click(function() {
        $(this).parent('.case_group').toggleClass('open');
    });
}

function formatDate(dateString) {
    if (!dateString) return 'Unbekannt';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min.`;
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    if (diffDays < 7) return `vor ${diffDays} Tagen`;

    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}