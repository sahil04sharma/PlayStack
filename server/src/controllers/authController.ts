import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Employee from '../models/Employee';
import { LoginResponse } from '../types';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password required' });
    return;
  }

  const user = await Employee.findOne({ email }).select('+passwordHash');
  if (!user) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '1d' }
  );

  const response: LoginResponse = {
    token,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };

  res.json(response);
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.json({ message: 'Logged out' });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  res.json({
    id: String(req.user._id),
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
};
