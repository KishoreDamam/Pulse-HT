import './globals.css';

export const metadata = {
  title: 'Circular Habit Tracker - Discipline Equals Freedom',
  description: 'A beautiful, premium, interactive circular habit tracker to design your perfect month. Standalone, installable, and synchronized offline-first.',
  manifest: '/manifest.json',
  themeColor: '#0b0f19',
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Habits'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
