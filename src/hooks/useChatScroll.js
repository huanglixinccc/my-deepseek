import { useEffect, useRef } from 'react';

/**
 * 智能滚动：仅在用户位于底部附近时自动滚动，流式期间使用 instant 避免抖动。
 */
export function useChatScroll(deps, isStreaming) {
  const containerRef = useRef(null);
  const endRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      shouldAutoScrollRef.current = distanceFromBottom < 80;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) {
      return;
    }

    endRef.current?.scrollIntoView({
      behavior: isStreaming ? 'auto' : 'smooth',
      block: 'end',
    });
  }, deps);

  return { containerRef, endRef };
}
