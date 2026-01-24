import type {
  ErrorContext,
  AnalysisResult,
  DiagnosticResult,
  RoutingDecision,
} from "@sre-agent/shared";

interface ReportData {
  errorContext: ErrorContext;
  analysisResult?: AnalysisResult;
  diagnosticResults: DiagnosticResult[];
  finalDecision: RoutingDecision;
}

const severityColors: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "#FEE2E2", text: "#DC2626", border: "#DC2626" },
  high: { bg: "#FFEDD5", text: "#EA580C", border: "#EA580C" },
  medium: { bg: "#FEF9C3", text: "#CA8A04", border: "#CA8A04" },
  low: { bg: "#DBEAFE", text: "#2563EB", border: "#2563EB" },
};

const actionColors: Record<string, { bg: string; text: string }> = {
  CALL: { bg: "#DC2626", text: "#FFFFFF" },
  MONITOR: { bg: "#CA8A04", text: "#FFFFFF" },
  LOG: { bg: "#2563EB", text: "#FFFFFF" },
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTimestamp(date: Date): string {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function generateReport(data: ReportData): string {
  const { errorContext, analysisResult, diagnosticResults, finalDecision } = data;
  const severity = finalDecision.severity || errorContext.severity;
  const severityStyle = severityColors[severity] || severityColors.medium;
  const actionStyle = actionColors[finalDecision.action] || actionColors.LOG;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diagnostic Report - ${escapeHtml(errorContext.title)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background-color: #F3F4F6;
      color: #1F2937;
      line-height: 1.5;
      padding: 20px;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .header {
      padding: 24px;
      border-bottom: 1px solid #E5E7EB;
      background: linear-gradient(135deg, #F9FAFB 0%, #FFFFFF 100%);
    }

    .header-top {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .severity-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background-color: ${severityStyle.bg};
      color: ${severityStyle.text};
      border: 1px solid ${severityStyle.border};
    }

    .severity-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: ${severityStyle.text};
    }

    .error-title {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }

    .error-meta {
      display: flex;
      gap: 16px;
      color: #6B7280;
      font-size: 14px;
      flex-wrap: wrap;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .section {
      padding: 24px;
      border-bottom: 1px solid #E5E7EB;
    }

    .section:last-child {
      border-bottom: none;
    }

    .section-title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6B7280;
      margin-bottom: 16px;
    }

    .decision-box {
      background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #E5E7EB;
    }

    .decision-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .action-badge {
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 14px;
      background-color: ${actionStyle.bg};
      color: ${actionStyle.text};
    }

    .root-cause {
      background: #FFFFFF;
      border-radius: 6px;
      padding: 16px;
      border-left: 4px solid ${severityStyle.border};
      font-size: 15px;
    }

    .root-cause-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6B7280;
      margin-bottom: 8px;
    }

    .hypothesis {
      color: #374151;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .diagnostics-list {
      list-style: none;
    }

    .diagnostics-list li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 0;
      color: #4B5563;
      font-size: 14px;
    }

    .diagnostics-list li::before {
      content: "•";
      color: #9CA3AF;
      font-weight: bold;
    }

    .timeline {
      position: relative;
    }

    .timeline-item {
      position: relative;
      padding-left: 28px;
      padding-bottom: 24px;
    }

    .timeline-item:last-child {
      padding-bottom: 0;
    }

    .timeline-item::before {
      content: "";
      position: absolute;
      left: 7px;
      top: 24px;
      bottom: 0;
      width: 2px;
      background: #E5E7EB;
    }

    .timeline-item:last-child::before {
      display: none;
    }

    .timeline-dot {
      position: absolute;
      left: 0;
      top: 4px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
    }

    .timeline-dot.success {
      background: #D1FAE5;
      color: #059669;
    }

    .timeline-dot.failure {
      background: #FEE2E2;
      color: #DC2626;
    }

    .timeline-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .tool-name {
      font-weight: 600;
      color: #111827;
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
      font-size: 14px;
    }

    .tool-time {
      font-size: 12px;
      color: #9CA3AF;
    }

    .tool-status {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;
    }

    .tool-status.success {
      background: #D1FAE5;
      color: #059669;
    }

    .tool-status.failure {
      background: #FEE2E2;
      color: #DC2626;
    }

    .tool-output {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 12px;
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
      font-size: 12px;
      color: #374151;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 200px;
      overflow-y: auto;
    }

    .tool-input {
      font-size: 12px;
      color: #6B7280;
      margin-bottom: 8px;
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
    }

    .talking-points {
      list-style: none;
    }

    .talking-points li {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: #F9FAFB;
      border-radius: 6px;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .talking-points li:last-child {
      margin-bottom: 0;
    }

    .talking-point-icon {
      width: 20px;
      height: 20px;
      background: #DBEAFE;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 10px;
      color: #2563EB;
    }

    .error-details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .detail-card {
      background: #F9FAFB;
      padding: 12px;
      border-radius: 6px;
    }

    .detail-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6B7280;
      margin-bottom: 4px;
    }

    .detail-value {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }

    .stack-trace {
      background: #1F2937;
      color: #E5E7EB;
      padding: 16px;
      border-radius: 8px;
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
      font-size: 12px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 300px;
      overflow-y: auto;
    }

    .footer {
      padding: 16px 24px;
      background: #F9FAFB;
      text-align: center;
      font-size: 12px;
      color: #9CA3AF;
    }

    @media (max-width: 640px) {
      body {
        padding: 12px;
      }

      .header, .section {
        padding: 16px;
      }

      .error-title {
        font-size: 18px;
      }

      .error-meta {
        flex-direction: column;
        gap: 8px;
      }

      .error-details-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-top">
        <span class="severity-badge">
          <span class="severity-dot"></span>
          ${escapeHtml(severity.toUpperCase())}
        </span>
      </div>
      <h1 class="error-title">${escapeHtml(errorContext.title)}</h1>
      <div class="error-meta">
        <span class="meta-item">
          <strong>Service:</strong> ${escapeHtml(errorContext.service)}
        </span>
        <span class="meta-item">
          <strong>Time:</strong> ${formatTimestamp(errorContext.timestamp)}
        </span>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Decision</h2>
      <div class="decision-box">
        <div class="decision-header">
          <span class="action-badge">${escapeHtml(finalDecision.action)}</span>
        </div>
        <div class="root-cause">
          <div class="root-cause-label">Root Cause</div>
          ${escapeHtml(finalDecision.rootCause)}
        </div>
      </div>
    </div>

    ${analysisResult ? `
    <div class="section">
      <h2 class="section-title">Analysis</h2>
      <p class="hypothesis">${escapeHtml(analysisResult.hypothesis)}</p>
      ${analysisResult.suggestedDiagnostics.length > 0 ? `
      <div class="root-cause-label" style="margin-top: 16px;">Suggested Diagnostics</div>
      <ul class="diagnostics-list">
        ${analysisResult.suggestedDiagnostics.map(d => `<li>${escapeHtml(d)}</li>`).join("")}
      </ul>
      ` : ""}
    </div>
    ` : ""}

    ${diagnosticResults.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Diagnostic Timeline</h2>
      <div class="timeline">
        ${diagnosticResults.map(result => `
        <div class="timeline-item">
          <div class="timeline-dot ${result.success ? "success" : "failure"}">
            ${result.success ? "&#10003;" : "&#10007;"}
          </div>
          <div class="timeline-header">
            <span class="tool-name">${escapeHtml(result.tool)}</span>
            <span class="tool-time">${formatTime(result.timestamp)}</span>
            <span class="tool-status ${result.success ? "success" : "failure"}">
              ${result.success ? "Success" : "Failed"}
            </span>
          </div>
          ${result.input ? `<div class="tool-input">Input: ${escapeHtml(result.input)}</div>` : ""}
          <div class="tool-output">${escapeHtml(result.output)}</div>
        </div>
        `).join("")}
      </div>
    </div>
    ` : ""}

    ${finalDecision.talkingPoints.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Talking Points</h2>
      <ul class="talking-points">
        ${finalDecision.talkingPoints.map((point, i) => `
        <li>
          <span class="talking-point-icon">${i + 1}</span>
          <span>${escapeHtml(point)}</span>
        </li>
        `).join("")}
      </ul>
    </div>
    ` : ""}

    <div class="section">
      <h2 class="section-title">Error Details</h2>
      <div class="error-details-grid">
        <div class="detail-card">
          <div class="detail-label">Sentry Event</div>
          <div class="detail-value">${escapeHtml(errorContext.sentryEventId.substring(0, 8))}...</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">Users Affected</div>
          <div class="detail-value">${errorContext.userCount}</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">Occurrences</div>
          <div class="detail-value">${errorContext.occurrenceCount}</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">Last 10 min</div>
          <div class="detail-value">${errorContext.frequencyLast10Min}</div>
        </div>
      </div>

      ${errorContext.stackTrace ? `
      <div class="root-cause-label">Stack Trace</div>
      <pre class="stack-trace">${escapeHtml(errorContext.stackTrace)}</pre>
      ` : ""}
    </div>

    <div class="footer">
      Generated by SRE Agent &bull; ${formatTimestamp(new Date())}
    </div>
  </div>
</body>
</html>`;
}
