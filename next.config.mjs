/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/home', destination: '/client', permanent: true },
      { source: '/cabinet', destination: '/client', permanent: true },
      { source: '/activity-tracker', destination: '/client/steps', permanent: true },
      { source: '/activity-stats', destination: '/client/statistics', permanent: true },
      { source: '/admin-activity-stats', destination: '/admin-worker/statistics', permanent: true },
      { source: '/department-head/messages', destination: '/chat-bot', permanent: true },
      { source: '/admin-worker/account', destination: '/admin-worker/profile', permanent: true },
      {
        source: '/client/todo-list',
        destination: '/client/tasks?tab=inbox&view=list',
        permanent: true,
      },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

export default nextConfig
