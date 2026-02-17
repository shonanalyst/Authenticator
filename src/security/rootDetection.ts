import { isRooted } from '../../modules/root-check';

let cachedRootStatus: boolean | null = null;

/**
 * Check if device is rooted/jailbroken.
 * Result is cached for the app session — detection runs once per launch.
 *
 * Fail-open: if detection throws, we assume NOT rooted
 * to prevent false positives from locking out legitimate users.
 */
export async function checkRootStatus(): Promise<boolean> {
  if (cachedRootStatus !== null) return cachedRootStatus;

  try {
    cachedRootStatus = await isRooted();
  } catch {
    cachedRootStatus = false;
  }

  return cachedRootStatus;
}
