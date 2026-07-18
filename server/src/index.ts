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
app.options(/.*/, cors(getCorsOptions()));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/dashboard', dashboardRoutes);

async function start(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not set');
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }

  await connectDB(mongoUri);

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
