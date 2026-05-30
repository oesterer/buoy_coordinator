const telemetryFields = ['latitude', 'longitude', 'heading', 'batteryLevel', 'status', 'timestamp'] as const;

type TelemetryField = (typeof telemetryFields)[number];

export function wantsCsv(req: { query: Record<string, unknown>; accepts: (types: string[]) => string | false }) {
  return req.query.format === 'csv' || req.accepts(['text/csv', 'application/json']) === 'text/csv';
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      quoted = !quoted;
      continue;
    }

    if (character === ',' && !quoted) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += character;
  }

  values.push(current.trim());
  return values;
}

export function parseTelemetryCsv(input: string) {
  const lines = input
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return {};
  }

  const firstLine = parseCsvLine(lines[0]);
  const hasHeader = firstLine.some((value) => telemetryFields.includes(value as TelemetryField));
  const headers = hasHeader ? firstLine : [...telemetryFields];
  const values = parseCsvLine(hasHeader ? lines[1] ?? '' : lines[0]);

  return headers.reduce<Record<string, unknown>>((payload, header, index) => {
    if (!telemetryFields.includes(header as TelemetryField)) return payload;
    const value = values[index];
    if (value === undefined || value === '') return payload;

    if (header === 'status' || header === 'timestamp') {
      payload[header] = value;
    } else {
      payload[header] = Number(value);
    }
    return payload;
  }, {});
}

function escapeCsvValue(value: unknown) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (!/[",\n\r]/.test(stringValue)) return stringValue;
  return `"${stringValue.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], row: unknown[]) {
  return `${headers.join(',')}\n${row.map(escapeCsvValue).join(',')}\n`;
}

export function toCsvRow(row: unknown[]) {
  return `${row.map(escapeCsvValue).join(',')}\n`;
}
