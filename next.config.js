/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/RamieMemo' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/RamieMemo/' : '',
}

module.exports = nextConfig
