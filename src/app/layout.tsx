import type { Metadata, Viewport } from 'next'
import { LanguageProvider } from '@/contexts/LanguageContext'
import './globals.css'

const basePath = process.env.NODE_ENV === 'production' ? '/RamieMemo' : '';
const baseUrl = 'https://sicutherba.github.io/RamieMemo';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: '苧麻备忘录 Ramie Memo',
    template: '%s | 苧麻备忘录 Ramie Memo',
  },
  description: '"苧麻备忘录"试图收集那些应该被我们记住的声音。这里不是一间完备的档案馆，而是一册轻便、可随身携带的备忘录。',
  keywords: [
    '中国历史',
    '历史事件',
    '备忘录',
    '人权',
    '记忆',
    'China history',
    'memorial',
    'human rights',
    'historical events',
  ],
  authors: [{ name: 'Ramie Memo Contributors' }],
  creator: 'Ramie Memo',
  publisher: 'Ramie Memo',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: `${basePath}/favicon-16x16.png`, sizes: '16x16', type: 'image/png' },
      { url: `${basePath}/favicon-32x32.png`, sizes: '32x32', type: 'image/png' },
      { url: `${basePath}/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { url: `${basePath}/icon-512.png`, sizes: '512x512', type: 'image/png' }
    ],
    apple: `${basePath}/apple-touch-icon.png`,
    shortcut: `${basePath}/favicon.ico`,
  },
  manifest: `${basePath}/site.webmanifest`,
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: baseUrl,
    title: '苧麻备忘录 Ramie Memo',
    description: '"苧麻备忘录"试图收集那些应该被我们记住的声音。这里不是一间完备的档案馆，而是一册轻便、可随身携带的备忘录。',
    siteName: '苧麻备忘录 Ramie Memo',
    images: [
      {
        url: `${baseUrl}/icon-1200.png`,
        width: 1200,
        height: 1200,
        alt: '苧麻备忘录 Ramie Memo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '苧麻备忘录 Ramie Memo',
    description: '"苧麻备忘录"试图收集那些应该被我们记住的声音。这里不是一间完备的档案馆，而是一册轻便、可随身携带的备忘录。',
    creator: '@RamieMemo',
    images: [`${baseUrl}/icon-1200.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'QnPRaN5HlkmfpoIjGX35alZmW4VhZxm3q0helnDE9Qc',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '苧麻备忘录 Ramie Memo',
    alternateName: 'Ramie Memo',
    description: '"苧麻备忘录"试图收集那些应该被我们记住的声音。这里不是一间完备的档案馆，而是一册轻便、可随身携带的备忘录。',
    url: baseUrl,
    inLanguage: 'zh-CN',
    publisher: {
      '@type': 'Organization',
      name: 'Ramie Memo',
      alternateName: '苧麻备忘录',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icon-512.png`,
        width: 512,
        height: 512,
        contentUrl: `${baseUrl}/icon-512.png`,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/explore?keyword={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <html lang="zh">
      <head>
        <link rel="icon" href={`${basePath}/favicon.ico`} sizes="any" />
        <link rel="icon" href={`${basePath}/icon.svg`} type="image/svg+xml" />
        <link rel="icon" type="image/png" sizes="16x16" href={`${basePath}/favicon-16x16.png`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`${basePath}/favicon-32x32.png`} />
        <link rel="icon" type="image/png" sizes="192x192" href={`${basePath}/icon-192.png`} />
        <link rel="apple-touch-icon" sizes="180x180" href={`${basePath}/apple-touch-icon.png`} />
        <link rel="manifest" href={`${basePath}/site.webmanifest`} />
        <meta property="og:image" content={`${baseUrl}/icon-1200.png`} />
        <meta property="og:logo" content={`${baseUrl}/icon-1200.png`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="overscroll-none">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
