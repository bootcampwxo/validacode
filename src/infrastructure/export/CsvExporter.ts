export class CsvExporter {
  public static toCsv(rows: Record<string, any>[], columns: { key: string; label: string }[]): string {
    if (rows.length === 0) {
      return columns.map((c) => `"${c.label}"`).join(';');
    }

    const header = columns.map((c) => `"${c.label}"`).join(';');
    const lines = rows.map((row) => {
      return columns
        .map((col) => {
          const val = row[col.key];
          if (val === null || val === undefined) return '""';
          if (val instanceof Date) {
            return `"${val.toISOString().split('T')[0]}"`;
          }
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(';');
    });

    return [header, ...lines].join('\r\n');
  }
}
