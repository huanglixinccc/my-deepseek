const IMAGE_MARKDOWN_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;
const INCOMPLETE_IMAGE_REGEX = /!\[[^\]]*(?:\][^(]*)?(?:\([^)]*)?$/;

let blockIdCounter = 0;

export function createMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function nextBlockId() {
  blockIdCounter += 1;
  return `block-${blockIdCounter}`;
}

export { nextBlockId };

export function resetBlockIdCounter() {
  blockIdCounter = 0;
}

/** 解析结构，不分配 id */
function parseContentStructure(rawContent) {
  if (!rawContent) {
    return [];
  }

  const blocks = [];
  let lastIndex = 0;
  const regex = new RegExp(IMAGE_MARKDOWN_REGEX.source, 'g');
  let match;

  while ((match = regex.exec(rawContent)) !== null) {
    const textBefore = rawContent.slice(lastIndex, match.index);
    if (textBefore) {
      blocks.push({ type: 'text', content: textBefore });
    }
    blocks.push({ type: 'image', url: match[2], alt: match[1] });
    lastIndex = match.index + match[0].length;
  }

  const remaining = rawContent.slice(lastIndex);
  if (!remaining) {
    return blocks;
  }

  const incompleteMatch = remaining.match(INCOMPLETE_IMAGE_REGEX);
  if (incompleteMatch && incompleteMatch.index > 0) {
    blocks.push({ type: 'text', content: remaining.slice(0, incompleteMatch.index) });
    blocks.push({ type: 'text', content: remaining.slice(incompleteMatch.index) });
  } else {
    blocks.push({ type: 'text', content: remaining });
  }

  return blocks;
}

function assignBlockIds(blocks) {
  return blocks.map((block) => ({ ...block, id: nextBlockId() }));
}

/**
 * 将原始文本解析为 text/image 块（一次性解析，用于用户消息等）。
 */
export function parseContentToBlocks(rawContent) {
  resetBlockIdCounter();
  return assignBlockIds(parseContentStructure(rawContent));
}

/**
 * 流式更新时合并块：已完成块保持 id 不变，只更新最后一个 text 块内容。
 */
export function mergeStreamingBlocks(prevBlocks, rawContent) {
  const parsed = parseContentStructure(rawContent);

  return parsed.map((block, index) => {
    const prev = prevBlocks[index];

    if (block.type === 'image') {
      if (prev?.type === 'image' && prev.url === block.url) {
        return prev;
      }
      return { ...block, id: prev?.id ?? nextBlockId() };
    }

    if (prev?.type === 'text') {
      if (prev.content === block.content) {
        return prev;
      }
      return { ...prev, content: block.content };
    }

    return { ...block, id: nextBlockId() };
  });
}

/**
 * 合并 wan2.6-image 图文混排流式 chunk。
 * 文字追加到最后一个 text 块，图片作为独立块且 URL 去重。
 */
export function mergeInterleaveChunk(prevBlocks, part) {
  if (!part || typeof part !== 'object') {
    return prevBlocks;
  }

  const type = part.type || (part.text ? 'text' : part.image ? 'image' : null);

  if (type === 'text' && part.text) {
    const last = prevBlocks[prevBlocks.length - 1];
    if (last?.type === 'text') {
      return [
        ...prevBlocks.slice(0, -1),
        { ...last, content: last.content + part.text },
      ];
    }
    return [...prevBlocks, { type: 'text', id: nextBlockId(), content: part.text }];
  }

  if (type === 'image' && part.image) {
    const exists = prevBlocks.some(
      (block) => block.type === 'image' && block.url === part.image,
    );
    if (exists) {
      return prevBlocks;
    }
    return [
      ...prevBlocks,
      { type: 'image', id: nextBlockId(), url: part.image, alt: '生成的图片' },
    ];
  }

  return prevBlocks;
}

/**
 * 解析 API 同步响应中的 content 为 blocks。
 */
export function parseImageApiResponse(data) {
  resetBlockIdCounter();
  const blocks = [];
  const content = data?.output?.choices?.[0]?.message?.content;

  if (!Array.isArray(content)) {
    return blocks;
  }

  for (const part of content) {
    if (!part || typeof part !== 'object') {
      continue;
    }

    if (part.text) {
      blocks.push({ type: 'text', id: nextBlockId(), content: part.text });
    } else if (part.image) {
      blocks.push({ type: 'image', id: nextBlockId(), url: part.image, alt: '生成的图片' });
    }
  }

  return blocks;
}

/**
 * 解析 API 返回的多模态 content（字符串或 content parts 数组）。
 */
export function normalizeApiContent(content) {
  if (!content) {
    return '';
  }

  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return String(content);
  }

  resetBlockIdCounter();
  const blocks = [];

  for (const part of content) {
    if (!part || typeof part !== 'object') {
      continue;
    }

    if (part.type === 'text' && part.text) {
      blocks.push({ type: 'text', id: nextBlockId(), content: part.text });
    } else if (part.type === 'image_url') {
      const url = part.image_url?.url || part.image_url;
      if (url) {
        blocks.push({ type: 'image', id: nextBlockId(), url, alt: part.alt || '' });
      }
    } else if (part.image) {
      blocks.push({ type: 'image', id: nextBlockId(), url: part.image, alt: part.alt || '生成的图片' });
    } else if (part.type === 'image' && part.url) {
      blocks.push({ type: 'image', id: nextBlockId(), url: part.url, alt: part.alt || '' });
    }
  }

  if (blocks.length > 0) {
    return blocks;
  }

  return content
    .map((part) => (part?.text ? part.text : ''))
    .join('');
}
