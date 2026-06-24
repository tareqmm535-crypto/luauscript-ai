import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { router as apiRouter } from './routes/api.js';
import { router as aiRouter } from './routes/ai.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1', apiRouter);
app.use('/api/ai', aiRouter);

// Static
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('../'));
}

// Error handling
app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.listen(PORT, () => {
  console.log(`🚀 LuauScript AI Server running on port ${PORT}`);
  console.log(`🔑 AI API configured: ${process.env.OPENROUTER_API_KEY ? 'Yes' : 'No (using client-side key)'}`);
});

export default app;