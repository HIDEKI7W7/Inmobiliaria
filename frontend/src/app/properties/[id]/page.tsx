import { cookies } from 'next/headers';
import { PropertyDetailClient } from './PropertyDetailClient';
import { resolveApiUrl } from '@/utils/resolveApiUrl';

export const dynamic = 'force-dynamic';

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const token = cookieStore.get('propio_token')?.value || null;

  let initialIsFavorited = false;

  if (token) {
    try {
      const apiBaseUrl = resolveApiUrl();
      const res = await fetch(`${apiBaseUrl}/favoritos/check/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.isFavorited !== 'undefined') {
          initialIsFavorited = data.isFavorited;
        }
      }
    } catch (e) {
      console.error('Error al verificar favorito en servidor (SSR):', e);
    }
  }

  return (
    <PropertyDetailClient
      propertyId={params.id}
      initialIsFavorited={initialIsFavorited}
      initialToken={token}
    />
  );
}
