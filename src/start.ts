import { spawn } from 'child_process';
import { logger } from './utils/logger';

logger.info('Starting FinFlow API Server and BullMQ Worker concurrently...');

const worker = spawn('node', ['dist/workers/pdfWorker.js'], { 
  stdio: 'inherit',
  env: process.env 
});
const api = spawn('node', ['dist/app.js'], { 
  stdio: 'inherit',
  env: process.env 
});

worker.on('close', (code) => {
  logger.error(`PDF Worker exited with code ${code}. Terminating API server...`);
  api.kill();
  process.exit(code || 1);
});

api.on('close', (code) => {
  logger.error(`API Server exited with code ${code}. Terminating PDF worker...`);
  worker.kill();
  process.exit(code || 1);
});
