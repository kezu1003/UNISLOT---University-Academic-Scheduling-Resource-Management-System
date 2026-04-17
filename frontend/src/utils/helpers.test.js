import { generateBatchCode, parseBatchCode } from './helpers';

describe('Batch helpers', () => {
  test('generateBatchCode returns the expected format', () => {
    const code = generateBatchCode('1', '2', 'WD', 'IT', '1', '5');
    expect(code).toBe('Y1.S2.WD.IT.01.05');
  });

  test('parseBatchCode returns parsed values for a valid code', () => {
    const result = parseBatchCode('Y3.S1.WD.CS.12.08');
    expect(result).toEqual({
      year: 3,
      semester: 1,
      type: 'WD',
      specialization: 'CS',
      mainGroup: '12',
      subGroup: '08'
    });
  });

  test('parseBatchCode returns null for an invalid code', () => {
    expect(parseBatchCode('invalid-code')).toBeNull();
  });
});
