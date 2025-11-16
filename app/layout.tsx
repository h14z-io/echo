import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Echō - Voice Notes with AI Transcription',
  description: 'Capture and transcribe your voice notes with AI-powered automatic transcription',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
