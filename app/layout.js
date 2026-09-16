import './globals.css';

export const metadata = {
  title: 'Property Manager',
  description: 'Rental Property Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased dark:bg-[#070c11] dark:text-slate-200">
        <div aria-hidden="true" className="app-aura pointer-events-none fixed inset-0 -z-10" />
        {children}
      </body>
    </html>
  );
}
