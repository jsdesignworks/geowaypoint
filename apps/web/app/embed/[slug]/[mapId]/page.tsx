import {
  PublicGuestMapView,
  type PublicGuestEmbedData,
} from '@/components/embed/PublicGuestMapView';
import { resolvePublishedMapForEmbed } from '@/lib/embed/resolvePublishedMap';

export const dynamic = 'force-dynamic';

export default async function PublicEmbedMapPage({ params }: { params: { slug: string; mapId: string } }) {
  const result = await resolvePublishedMapForEmbed(params.slug, params.mapId);

  if (result.status === 200) {
    return <PublicGuestMapView data={result.body as PublicGuestEmbedData} />;
  }

  const msg =
    result.status === 403
      ? 'This map is not published yet.'
      : result.status === 402
        ? 'A subscription is required to view this map.'
        : 'This map could not be found.';

  return (
    <main
      style={{
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'system-ui, sans-serif',
        background: '#f6faf7',
        color: '#1a2e22',
      }}
    >
      <div style={{ maxWidth: 400, textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', margin: '0 0 8px' }}>Map unavailable</h1>
        <p style={{ margin: 0, fontSize: 14, color: '#5a6b5f' }}>{msg}</p>
      </div>
    </main>
  );
}
