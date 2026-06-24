import { Router } from 'express';

export const router = Router();

const API_KEY = process.env.OPENROUTER_API_KEY || 'YOUR_OPENROUTER_API_KEY';
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';

// POST /api/ai/chat - Generate Luau script via OpenRouter
router.post('/chat', async (req, res, next) => {
  try {
    const { messages, model, maxTokens, temperature } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': SITE_URL,
        'X-Title': 'LuauScript AI'
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Luau/Roblox Lua developer. Generate clean, efficient, well-commented Luau scripts. Provide complete working code. Explain briefly in English.'
          },
          ...messages
        ],
        max_tokens: maxTokens || 2048,
        temperature: temperature ?? 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `OpenRouter API error: ${errorText}` });
    }

    const data = await response.json();
    res.json({ success: true, data });

  } catch (error) {
    next(error);
  }
});

// GET /api/ai/models - List available models
router.get('/models', (req, res) => {
  res.json({
    success: true,
    models: [
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
      { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
      { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek' }
    ]
  });
});
