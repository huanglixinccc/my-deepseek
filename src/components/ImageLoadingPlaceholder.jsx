import { memo } from 'react';
import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const Placeholder = styled.div`
  margin: 12px 0 4px;
  width: min(100%, 320px);
  aspect-ratio: 1;
  border-radius: 12px;
  background: linear-gradient(90deg, #eef1f5 25%, #f8f9fb 50%, #eef1f5 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #8b95a5;
  font-size: 13px;
`;

const Spinner = styled.div`
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

function ImageLoadingPlaceholder({ label = '图片生成中…' }) {
  return (
    <Placeholder aria-label={label}>
      <Spinner />
      <span>{label}</span>
    </Placeholder>
  );
}

export default memo(ImageLoadingPlaceholder);
