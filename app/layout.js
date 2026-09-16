import './globals.css';

export const metadata = {
  title: 'Property Manager',
  description: 'Rental Property Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
