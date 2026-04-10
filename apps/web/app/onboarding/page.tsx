'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { applyPlanChoice, saveResortDetails } from '@/app/actions/onboarding';
import { createClient } from '@/lib/supabase/client';
import { slugifyResortName } from '@/lib/utils/slugify';
import { toast } from '@/lib/toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MAX_MAP_BYTES = 50 * 1024 * 1024;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resortName, setResortName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [phone, setPhone] = useState('');
  const [mapFile, setMapFile] = useState<File | null>(null);
  const [metaLoaded, setMetaLoaded] = useState(false);

  const previewSlug = useMemo(() => slugifyResortName(resortName), [resortName]);
  const effectiveSlug = slugTouched ? slug : previewSlug;

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const m = user.user_metadata as {
        resort_name?: string;
        resort_slug?: string;
      };
      if (m.resort_name) {
        setResortName(m.resort_name);
      }
      if (m.resort_slug) {
        setSlug(m.resort_slug);
        setSlugTouched(true);
      }
      setMetaLoaded(true);
    });
  }, []);

  async function onStep2Next() {
    setLoading(true);
    const res = await saveResortDetails({
      name: resortName,
      slug: effectiveSlug,
      phone: phone.trim() || null,
    });
    setLoading(false);
    if ('error' in res && res.error) {
      toast(res.error, 'error');
      return;
    }
    setStep(3);
  }

  async function onStep3Pick(choice: 'starter' | 'pro_trial') {
    setLoading(true);
    const res = await applyPlanChoice(choice);
    setLoading(false);
    if ('error' in res && res.error) {
      toast(res.error, 'error');
      return;
    }
    setStep(4);
  }

  async function onStep4Finish(skip: boolean) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast('Not signed in', 'error');
      return;
    }

    const { data: resort } = await supabase
      .from('resorts')
      .select('id')
      .eq('owner_id', user.id)
      .single();
    if (!resort) {
      toast('Create resort details first.', 'error');
      return;
    }

    setLoading(true);

    const { data: mapRow, error: mapErr } = await supabase
      .from('maps')
      .insert({ resort_id: resort.id, name: 'New Map' })
      .select('id')
      .single();

    if (mapErr || !mapRow) {
      setLoading(false);
      toast(mapErr?.message ?? 'Could not create map', 'error');
      return;
    }

    const mapId = mapRow.id;

    if (!skip && mapFile) {
      const path = `${user.id}/${mapId}/${mapFile.name}`;
      const { error: upErr } = await supabase.storage.from('maps').upload(path, mapFile, {
        upsert: true,
        contentType: mapFile.type,
      });
      if (upErr) {
        setLoading(false);
        toast(upErr.message, 'error');
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from('maps').getPublicUrl(path);
      await supabase.from('maps').update({ image_url: publicUrl }).eq('id', mapId);
    }

    const { error: metaErr } = await supabase.auth.updateUser({
      data: { onboarding_complete: true },
    });
    setLoading(false);
    if (metaErr) {
      toast(metaErr.message, 'error');
      return;
    }

    toast('Welcome to GeoWaypoint!', 'success');
    router.replace(`/editor/${mapId}`);
    router.refresh();
  }

  function onFileChange(f: File | null) {
    if (!f) {
      setMapFile(null);
      return;
    }
    if (f.size > MAX_MAP_BYTES) {
      toast('File must be 50 MB or less.', 'error');
      return;
    }
    setMapFile(f);
  }

  if (!metaLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper)' }}>
        Loading…
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-8" style={{ background: 'var(--paper)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 520, padding: 28 }}>
        <h1 className="font-serif-heading" style={{ marginTop: 0 }}>
          Onboarding
        </h1>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, fontSize: 12, color: 'var(--ink3)' }}>
          {[1, 2, 3, 4].map((s) => (
            <span key={s} style={{ fontWeight: step === s ? 700 : 400 }}>
              Step {s}
              {s === 1 ? ' ✓' : ''}
            </span>
          ))}
        </div>

        {step === 1 && (
          <div>
            <p style={{ color: 'var(--ink3)' }}>Account is ready. Continue to resort details.</p>
            <Button variant="primary" style={{ marginTop: 16 }} onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Resort name</label>
              <Input value={resortName} onChange={(e) => setResortName(e.target.value)} required style={{ marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Slug</label>
              <Input
                value={slugTouched ? slug : previewSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugifyResortName(e.target.value));
                }}
                style={{ marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Phone (optional)</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ marginTop: 4 }} />
            </div>
            <Button variant="primary" disabled={loading} onClick={() => void onStep2Next()}>
              {loading ? 'Saving…' : 'Next'}
            </Button>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'grid', gap: 16 }}>
            <p style={{ color: 'var(--ink3)', margin: 0 }}>
              No charge until trial ends. Cancel anytime.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                type="button"
                className="card"
                style={{ padding: 16, cursor: 'pointer', textAlign: 'left' }}
                onClick={() => void onStep3Pick('starter')}
                disabled={loading}
              >
                <div className="font-serif-heading" style={{ fontSize: '1.1rem' }}>
                  Starter
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink3)' }}>Free — up to 30 sites</div>
              </button>
              <button
                type="button"
                className="card"
                style={{ padding: 16, cursor: 'pointer', textAlign: 'left', borderColor: 'var(--canopy)' }}
                onClick={() => void onStep3Pick('pro_trial')}
                disabled={loading}
              >
                <span className="pill pill-green" style={{ marginBottom: 8 }}>
                  14-DAY FREE TRIAL
                </span>
                <div className="font-serif-heading" style={{ fontSize: '1.1rem' }}>
                  Pro trial
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink3)' }}>Full Pro access</div>
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'grid', gap: 14 }}>
            <p style={{ color: 'var(--ink3)', margin: 0 }}>
              Upload PNG, JPG, WebP, or PDF up to 50 MB. Or skip and add a map later.
            </p>
            <Input
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
            {mapFile ? (
              <p style={{ fontSize: 13, margin: 0 }}>
                {mapFile.name} — {(mapFile.size / (1024 * 1024)).toFixed(2)} MB — Ready to upload.
              </p>
            ) : null}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button variant="primary" disabled={loading} onClick={() => void onStep4Finish(false)}>
                {loading ? 'Finishing…' : 'Finish'}
              </Button>
              <Button variant="outline" disabled={loading} onClick={() => void onStep4Finish(true)}>
                Skip
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
