import { RiskLevel } from '../types/mplads';

export function getRiskLevel(score: number): RiskLevel {
  if (score > 0.30) return 'high';
  if (score >= 0.15) return 'medium';
  return 'low';
}

export function formatRupees(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatRupeesFull(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function getRiskBadgeClasses(score: number): {
  bg: string;
  text: string;
  border: string;
  dot: string;
  label: string;
} {
  const level = getRiskLevel(score);
  switch (level) {
    case 'high':
      return {
        bg: 'bg-red-50 text-red-700 border-red-200',
        text: 'text-red-700',
        border: 'border-red-300',
        dot: 'bg-red-500',
        label: 'HIGH RISK'
      };
    case 'medium':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        text: 'text-amber-700',
        border: 'border-amber-300',
        dot: 'bg-amber-500',
        label: 'MEDIUM RISK'
      };
    case 'low':
    default:
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        text: 'text-emerald-700',
        border: 'border-emerald-300',
        dot: 'bg-emerald-500',
        label: 'LOW RISK'
      };
  }
}

export function exportToCSV(rows: any[], filename: string) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map(row => {
        return keys
          .map(k => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
