import { tmpdir } from 'os';
import { join } from 'path';
import { writeFileSync, unlinkSync } from 'fs';
import { randomUUID } from 'crypto';

export function writeTmpFile(buffer: Buffer, ext = 'mp4'): string {
  const filePath = join(tmpdir(), `vidsnap-${randomUUID()}.${ext}`);
  writeFileSync(filePath, buffer);
  return filePath;
}

export function cleanTmpFile(path: string): void {
  try {
    unlinkSync(path);
  } catch {
    // silently ignore cleanup errors
  }
}
