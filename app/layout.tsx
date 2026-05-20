import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FSL — Federación de Simracing Latinoamericana',
  description: 'El organismo rector del simracing de monoplazas y endurance en América Latina.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Barlow:wght@300;400;500;600&family=Barlow+Condensed:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-fsl-black text-gold-light font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
