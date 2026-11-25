// JSON Schema validation of imported cases (data/schemas/use-case.schema.json) with Ajv.
import Ajv2020 from 'ajv/dist/2020';
import schema from '../../data/schemas/use-case.schema.json';

const ajv = new Ajv2020({ allErrors: true, strict: false });
const check = ajv.compile(schema);

export function validateCaseJson(value: unknown): { ok: boolean; errors: string[] } {
  const ok = check(value) as boolean;
  const errors = ok ? [] : (check.errors ?? []).slice(0, 8).map(e => `${e.instancePath || '(root)'} ${e.message ?? 'is invalid'}`);
  return { ok, errors };
}
