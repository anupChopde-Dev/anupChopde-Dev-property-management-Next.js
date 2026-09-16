'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '../../../../../../components/Sidebar';
import MobileNav from '../../../../../../components/MobileNav';
import Card, { CardContent, CardHeader, CardTitle } from '../../../../../../components/Card';
import Button from '../../../../../../components/Button';
import { tenantPhotoUrl, getTenant, getTenantDocuments } from '../../../../../../lib/api';
import { ArrowLeft, ImageIcon, FileText, User } from 'lucide-react';

export default function TenantDocumentsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id;
  const tenantId = params?.tenantId;

  const [tenant, setTenant] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [photoToken, setPhotoToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setPhotoToken(token);
    if (!tenantId) return;

    (async () => {
      try {
        const [tenantData, docsData] = await Promise.all([
          getTenant(tenantId),
          getTenantDocuments(tenantId).catch(() => []),
        ]);
        setTenant(tenantData);
        setDocuments(Array.isArray(docsData) ? docsData : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [tenantId, router]);

  const photoSrc = `${tenantPhotoUrl(tenantId)}${photoToken ? `?token=${encodeURIComponent(photoToken)}` : ''}`;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-4 text-sm font-medium text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Loading document…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="pb-24 md:ml-64 md:pb-10">
        <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-emerald-600 dark:text-slate-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <header className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25">
              <User className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {tenant?.fullName || 'Tenant'} — Documents
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {tenant?.mobile || '—'}
                {tenant?.room ? ` · Room ${tenant.room?.roomNumber ?? ''}` : ''}
              </p>
            </div>
          </header>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Photo stored in tenant collection (Buffer) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-emerald-500" />
                Uploaded Photo (stored with tenant)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoSrc}
                alt={`Photo of ${tenant?.fullName || 'tenant'}`}
                className="max-h-[32rem] w-auto rounded-xl border border-slate-200 object-contain dark:border-white/10"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                }}
              />
              <p style={{ display: 'none' }} className="py-6 text-center text-sm text-slate-500">
                Photo could not be loaded or does not exist.
              </p>
            </CardContent>
          </Card>

          {/* Documents stored via document service (if any) */}
          {documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-violet-500" />
                  Uploaded Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {documents.map((doc) => (
                  <div key={doc._id || doc.id} className="rounded-xl border border-slate-200/80 p-3 dark:border-white/10">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{doc.originalFileName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Slot {doc.imageSlot} · {(doc.size / 1024).toFixed(0)} KB
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${API_BASE}${doc.url}`}
                      alt={doc.originalFileName}
                      className="mt-2 max-h-72 w-full rounded-lg border border-slate-100 object-contain dark:border-white/10"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
