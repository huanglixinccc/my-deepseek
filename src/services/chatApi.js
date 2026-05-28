/**
 * wan2.6-image 图文混排 API
 */

import { mergeInterleaveChunk } from '../utils/contentParser';

const API_KEY = import.meta.env.VITE_CHAT_API_KEY || import.meta.env.VITE_DEEPSEEK_API_KEY;
const API_URL =
  import.meta.env.VITE_CHAT_API_URL ||
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
const MODEL = import.meta.env.VITE_CHAT_MODEL || 'wan2.6-image';

function ensureApiKey() {
  if (!API_KEY) {
    throw new Error('MISSING_API_KEY');
  }
}

function extractContentParts(payload) {
  const content = payload?.output?.choices?.[0]?.message?.content;
  if (!Array.isArray(content)) {
    return [];
  }
  return content;
}

function parseSseBuffer(buffer, onParts, flush = false) {
  const events = buffer.split('\n\n');
  let remaining = flush ? '' : (events.pop() ?? '');

  for (const event of events) {
    const dataLine = event.split('\n').find((line) => line.startsWith('data:'));

    if (!dataLine) {
      continue;
    }

    const jsonStr = dataLine.slice(5).trim();
    if (!jsonStr) {
      continue;
    }

    try {
      const payload = JSON.parse(jsonStr);
      const parts = extractContentParts(payload);
      if (parts.length > 0) {
        onParts(parts);
      }
    } catch {
      // 忽略不完整的 JSON
    }
  }

  if (flush && remaining.trim()) {
    const dataLine = remaining.split('\n').find((line) => line.startsWith('data:'));
    if (dataLine) {
      const jsonStr = dataLine.slice(5).trim();
      try {
        const payload = JSON.parse(jsonStr);
        const parts = extractContentParts(payload);
        if (parts.length > 0) {
          onParts(parts);
        }
      } catch {
        // 忽略
      }
    }
    remaining = '';
  }

  return remaining;
}

/**
 * 调用 wan2.6-image 图文混排模式，流式返回 text/image 块。
 */
export async function generateImageWithExplanation(userPrompt, onBlocksUpdate) {
  ensureApiKey();

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      'X-DashScope-Sse': 'enable',
    },
    body: JSON.stringify({
      model: MODEL,
      input: {
        messages: [
          {
            role: 'user',
            content: [{ text: userPrompt }],
          },
        ],
      },
      parameters: {
        max_images: 1,
        size: '1024*1024',
        stream: true,
        enable_interleave: true,
        watermark: false,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody?.message || errorBody?.error?.message || errorBody?.code || 'API 请求失败';
    const error = new Error(message);
    error.response = { data: errorBody };
    throw error;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('STREAM_NOT_SUPPORTED');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let blocks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    buffer = parseSseBuffer(buffer, (parts) => {
      for (const part of parts) {
        blocks = mergeInterleaveChunk(blocks, part);
      }
      onBlocksUpdate([...blocks]);
    });
  }

  if (buffer.trim()) {
    buffer = parseSseBuffer(buffer, (parts) => {
      for (const part of parts) {
        blocks = mergeInterleaveChunk(blocks, part);
      }
    }, true);
  }

  onBlocksUpdate([...blocks]);

  if (blocks.length === 0) {
    throw new Error('API 未返回内容');
  }

  return blocks;
}

export function getApiConfig() {
  return {
    hasApiKey: Boolean(API_KEY),
    model: MODEL,
    url: API_URL,
  };
}
