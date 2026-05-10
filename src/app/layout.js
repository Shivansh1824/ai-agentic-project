import './globals.css';

export const metadata = {
  title: 'CareerPilot AI | Build a Resume That Gets You Hired',
  description: 'AI-powered resume analysis and interview readiness platform.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
