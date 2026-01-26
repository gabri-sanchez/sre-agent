/**
 * In-memory store for HTML diagnostic reports
 */

const reports = new Map<string, string>();

export function saveReport(id: string, html: string): void {
  reports.set(id, html);
}

export function getReport(id: string): string | null {
  return reports.get(id) ?? null;
}

export function deleteReport(id: string): boolean {
  return reports.delete(id);
}

export function getReportCount(): number {
  return reports.size;
}

export function listReportIds(): string[] {
  return Array.from(reports.keys());
}
