import process from 'node:process';

process.env.CI = process.env.CI || '1';
process.env.NEXT_TELEMETRY_DISABLED = '1';

const timeoutMs = Number(process.env.SAFE_BUILD_TIMEOUT_MS || 90_000);
const timeout = setTimeout(() => {
  console.error(`\nNext.js build exceeded ${Math.round(timeoutMs / 1000)}s and was stopped to avoid hanging the machine.`);
  process.exit(124);
}, timeoutMs);

try {
  const { nextBuild } = await import('next/dist/cli/next-build.js');
  await nextBuild(
    {
      debug: false,
      debugPrerender: false,
      experimentalDebugMemoryUsage: false,
      profile: false,
      lint: false,
      mangling: true,
      experimentalAppOnly: false,
      experimentalBuildMode: 'default',
      turbo: false,
      turbopack: false,
    },
    process.cwd(),
  );
  clearTimeout(timeout);
  process.exit(0);
} catch (error) {
  clearTimeout(timeout);
  console.error(error);
  process.exit(1);
}
