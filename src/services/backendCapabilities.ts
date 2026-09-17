import { BACKEND_API_URL } from '@/lib/backendUrl';

export type ProviderName = 'gemini' | 'openrouter' | 'groq';

export interface ProviderCapability {
  configured: boolean;
  model: string;
  label: string;
}

export interface BackendCapabilities {
  providers: Record<ProviderName, ProviderCapability>;
  fallbackOrder: ProviderName[];
  checkedAt: number;
}

let cached: BackendCapabilities | null = null;
let inflight: Promise<BackendCapabilities> | null = null;
const CACHE_MS = 60_000;

export async function getBackendCapabilities(force = false): Promise<BackendCapabilities> {
  if (!force && cached && Date.now() - cached.checkedAt < CACHE_MS) return cached;
  if (!force && inflight) return inflight;

  inflight = (async () => {
    const response = await fetch(`${BACKEND_API_URL}/providers`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`État des API indisponible (${response.status}).`);
    const data = await response.json() as Partial<BackendCapabilities>;
    const names: ProviderName[] = ['gemini', 'openrouter', 'groq'];
    const providers = Object.fromEntries(names.map((name) => {
      const value = data.providers?.[name];
      return [name, {
        configured: value?.configured === true,
        model: value?.model || 'non configuré',
        label: value?.label || name,
      }];
    })) as Record<ProviderName, ProviderCapability>;
    cached = {
      providers,
      fallbackOrder: Array.isArray(data.fallbackOrder) ? data.fallbackOrder.filter((name): name is ProviderName => names.includes(name as ProviderName)) : names,
      checkedAt: Date.now(),
    };
    return cached;
  })().finally(() => { inflight = null; });

  return inflight;
}
