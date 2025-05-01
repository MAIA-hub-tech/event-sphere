/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    instrumentationHook: true,
    missingSuspenseWithCSRBailout: false // Important for dynamic apps
  },
  // Generate static files for all pages
  generateBuildId: () => 'build-' + Date.now()
};

module.exports = nextConfig;