import { Request, Response, NextFunction } from 'express';
import { authorize, restrictSelfEdit } from '../middleware/rbac';
import { Role } from '../types';

function mockRes() {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

function mockNext() {
  const next = jest.fn() as unknown as NextFunction & jest.Mock;
  return next;
}

describe('authorize middleware', () => {
  it('calls next when role is allowed', () => {
    const req = {
      user: { role: 'super_admin' as Role },
    } as Request;
    const res = mockRes();
    const next = mockNext();

    authorize('super_admin', 'hr_manager')(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it('returns 403 when role is not allowed', () => {
    const req = {
      user: { role: 'employee' as Role },
    } as Request;
    const res = mockRes();
    const next = mockNext();

    authorize('super_admin')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ message: 'Forbidden: insufficient role' });
  });

  it('returns 403 when user is missing', () => {
    const req = {} as Request;
    const res = mockRes();
    const next = mockNext();

    authorize('hr_manager')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });
});

describe('restrictSelfEdit middleware', () => {
  it('passes through for non-employee roles', () => {
    const req = {
      user: { role: 'hr_manager' as Role, _id: '1' },
      params: { id: '2' },
      body: { name: 'X', phone: '123' },
    } as unknown as Request;
    const res = mockRes();
    const next = mockNext();

    restrictSelfEdit(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ name: 'X', phone: '123' });
  });

  it('blocks employee editing another profile', () => {
    const req = {
      user: { role: 'employee' as Role, _id: 'emp1' },
      params: { id: 'emp2' },
      body: { phone: '9999999999' },
    } as unknown as Request;
    const res = mockRes();
    const next = mockNext();

    restrictSelfEdit(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  it('strips disallowed fields for employee self-edit', () => {
    const req = {
      user: { role: 'employee' as Role, _id: 'emp1' },
      params: { id: 'emp1' },
      body: {
        phone: '9000011111',
        profileImage: 'https://img',
        salary: 999999,
        role: 'super_admin',
      },
    } as unknown as Request;
    const res = mockRes();
    const next = mockNext();

    restrictSelfEdit(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({
      phone: '9000011111',
      profileImage: 'https://img',
    });
  });
});
