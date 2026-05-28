import { memo } from 'react';
import styled from 'styled-components';

const ImageWrapper = styled.div`
  margin: 12px 0 4px;
  max-width: 320px;
`;

const StyledImg = styled.img`
  width: 100%;
  border-radius: 12px;
  display: block;
  background: #f1f5f9;
`;

function ImageBlock({ url, alt }) {
  if (!url) {
    return null;
  }

  return (
    <ImageWrapper>
      <StyledImg src={url} alt={alt || '生成的图片'} decoding="async" referrerPolicy="no-referrer" />
    </ImageWrapper>
  );
}

export default memo(ImageBlock, (prev, next) => prev.url === next.url && prev.alt === next.alt);
