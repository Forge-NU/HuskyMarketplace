export type CodeProgress = { verified: boolean; passwordSaved: boolean };

// Runs the steps after a code is entered. A code can be used only once, so a
// step that already succeeded is skipped on retry. Progress is reported as each
// step finishes, so a later failure (for example the device request) keeps it.
export async function runCodeSteps(
  progress: CodeProgress,
  steps: {
    verify: () => Promise<void>;
    savePassword?: () => Promise<void>;
    finish: () => Promise<void>;
  },
  onProgress: (progress: CodeProgress) => void,
) {
  let current = progress;
  if (!current.verified) {
    await steps.verify();
    current = { ...current, verified: true };
    onProgress(current);
  }
  if (steps.savePassword && !current.passwordSaved) {
    await steps.savePassword();
    current = { ...current, passwordSaved: true };
    onProgress(current);
  }
  await steps.finish();
}
