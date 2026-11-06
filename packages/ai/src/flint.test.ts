import { describe, expect, it } from 'vitest';
import { createFlintChef, extractJson } from './flint';
import { ModelUnavailableError } from './index';

describe('flint adapter', () => {
  it('pulls JSON out of fenced or chatty replies', () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('Sure! {"a":1} done')).toEqual({ a: 1 });
  });

  it('maps transport failures to ModelUnavailableError', async () => {
    const chef = createFlintChef({ baseUrl: 'http://x', apiKey: 'k', fetchImpl: async () => { throw new Error('ECONNREFUSED'); } });
    await expect(chef.detectIngredients({ imageBase64: '', mimeType: 'image/jpeg' })).rejects.toBeInstanceOf(ModelUnavailableError);
  });

  it('parses detections', async () => {
    const body = { choices: [{ message: { content: JSON.stringify({ ingredients: [{ name: 'celery', confidence: 0.9 }] }) } }] };
    const chef = createFlintChef({ baseUrl: 'http://x', apiKey: 'k', fetchImpl: async () => new Response(JSON.stringify(body), { status: 200 }) });
    expect(await chef.detectIngredients({ imageBase64: 'AA==', mimeType: 'image/jpeg' })).toEqual([{ name: 'celery', entryId: null, confidence: 0.9 }]);
  });
});
