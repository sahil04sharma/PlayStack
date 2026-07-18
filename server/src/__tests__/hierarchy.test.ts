import { Types } from 'mongoose';
import { wouldCreateCycle } from '../utils/hierarchy';
import Employee from '../models/Employee';

jest.mock('../models/Employee', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

const mockedFindById = Employee.findById as unknown as jest.Mock;

function chainSelect(result: { reportingManager: Types.ObjectId | null } | null) {
  return {
    select: jest.fn().mockResolvedValue(result),
  };
}

describe('wouldCreateCycle', () => {
  const empA = new Types.ObjectId().toString();
  const empB = new Types.ObjectId().toString();
  const empC = new Types.ObjectId().toString();

  beforeEach(() => {
    mockedFindById.mockReset();
  });

  it('returns false when managerId is empty', async () => {
    await expect(wouldCreateCycle(empA, '')).resolves.toBe(false);
  });

  it('returns true when employee would report to themselves', async () => {
    await expect(wouldCreateCycle(empA, empA)).resolves.toBe(true);
  });

  it('returns true when new manager is a descendant (cycle)', async () => {
    // Chain: A <- B <- C  (C reports to B, B reports to A)
    // Trying to set A's manager to C would cycle
    mockedFindById
      .mockImplementationOnce(() =>
        chainSelect({ reportingManager: new Types.ObjectId(empB) })
      ) // load C → manager B
      .mockImplementationOnce(() =>
        chainSelect({ reportingManager: new Types.ObjectId(empA) })
      ) // load B → manager A
      .mockImplementationOnce(() => chainSelect({ reportingManager: null })); // load A → null

    await expect(wouldCreateCycle(empA, empC)).resolves.toBe(true);
  });

  it('returns false for a valid manager assignment', async () => {
    // Set B's manager to A; A's manager is null
    mockedFindById.mockImplementationOnce(() =>
      chainSelect({ reportingManager: null })
    );

    await expect(wouldCreateCycle(empB, empA)).resolves.toBe(false);
  });
});
