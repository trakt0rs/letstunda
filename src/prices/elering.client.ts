import { Injectable } from '@nestjs/common';

const ELERING_URL = 'https://dashboard.elering.ee/api/nps/price';
const REQUEST_TIMEOUT_MS = 10_000;

type EleringResponse = {
  success: boolean;
  data: { lv: { timestamp: number; price: number }[] };
};

@Injectable()
export class EleringClient {
  async fetchPrices(start: Date, end: Date): Promise<{ time: Date; price: number }[]> {
    const res = await fetch(`${ELERING_URL}?start=${start.toISOString()}&end=${end.toISOString()}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Elering responded with ${res.status}`);
    const body = (await res.json()) as EleringResponse;
    if (!body.success || !Array.isArray(body.data?.lv)) throw new Error('Unexpected Elering response');
    return body.data.lv.map((p) => ({ time: new Date(p.timestamp * 1000), price: p.price }));
  }
}
