import './globals.css';

export const metadata = {
  title: 'AI Repo Intelligence — Analyze GitHub Repositories',
  description: 'Intelligently analyze GitHub repositories with AI-powered code complexity, architecture mapping, contributor insights, and health scoring.',
  keywords: 'GitHub, repository, analysis, AI, code quality, architecture',
  icons: {
    icon: '/images/repodoc.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
