import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { getCorsOptions } from './config/cors';
import authRoutes from './routes/authRoutes';
import employeeRoutes from './routes/employeeRoutes';
import organizationRoutes from './routes/organizationRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors(getCorsOptions()));
app.use(express.json({ limit: '2mb' }));

app.get(['/api/health', '/health'], (_req, res) => {
  res.json({ status: 'ok' });
});

// Mount under /api (preferred) and at root (so Railway URL without /api still works)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/employees', employeeRoutes);
app.use('/employees', employeeRoutes);

app.use('/api/organization', organizationRoutes);
app.use('/organization', organizationRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/dashboard', dashboardRoutes);

async function start(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not set');
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }

  await connectDB(mongoUri);

  // Railway (and most PaaS) need 0.0.0.0 — binding only to localhost causes 502
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on 0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
