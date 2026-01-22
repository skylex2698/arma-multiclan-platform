import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth.routes';
import { discordRoutes } from './routes/discord.routes';
import { clanRoutes } from './routes/clan.routes';
import { userRoutes } from './routes/user.routes';
import eventRoutes from './routes/event.routes';
import { slotRoutes, squadRouter } from './routes/slot.routes';
import communicationTreeRoutes from './routes/communicationTree.routes';

dotenv.config();

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Arma Events Platform API is running',
    timestamp: new Date().toISOString()
  });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/discord', discordRoutes);
app.use('/api/clans', clanRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/squads', squadRouter);
app.use('/api/events', communicationTreeRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
  console.log('Health check: http://localhost:' + PORT + '/health');
  console.log('Auth routes: http://localhost:' + PORT + '/api/auth');
  console.log('Clan routes: http://localhost:' + PORT + '/api/clans');
  console.log('User routes: http://localhost:' + PORT + '/api/users');
  console.log('Event routes: http://localhost:' + PORT + '/api/events');
  console.log('Slot routes: http://localhost:' + PORT + '/api/slots');
  console.log('Squad routes: http://localhost:' + PORT + '/api/squads');
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});