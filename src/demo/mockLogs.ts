import { LogEntry } from '../LogsViewer';

const SAMPLE_MESSAGES = [
  'Starting request handler for GET /api/v1/deployments',
  'Connected to database pool (5 idle connections)',
  '[32mHealth check passed[0m for service payments-api',
  'Received webhook payload (size=2483 bytes)',
  'Retrying upstream call to inventory-service (attempt 2/5)',
  '[33mWarning:[0m response time exceeded 800ms threshold',
  'Cache miss for key user:profile:8271, fetching from origin',
  'Rolling deployment to 3/6 pods complete',
  '[31mError:[0m failed to acquire lock on resource lock:migration',
  'Scaling replica set from 4 to 6 instances',
  'Garbage collection pause: 42ms',
  'Certificate rotation completed for ingress controller',
];

let counter = 0;

export function generateMockLogs(count: number, startTimestamp = Date.now()): LogEntry[] {
  const logs: LogEntry[] = [];
  for (let i = 0; i < count; i += 1) {
    counter += 1;
    logs.push({
      timestamp: startTimestamp + i * 1000,
      nanos: 0,
      appName: 'demo-app',
      message: `[${counter}] ${SAMPLE_MESSAGES[counter % SAMPLE_MESSAGES.length]}`,
    });
  }
  return logs;
}
