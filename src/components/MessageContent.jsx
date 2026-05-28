import { memo } from 'react';
import styled from 'styled-components';
import ImageBlock from './ImageBlock';
import ImageLoadingPlaceholder from './ImageLoadingPlaceholder';

const TextWrapper = styled.div`
  white-space: pre-wrap;
  word-break: break-word;
  text-align: left;
  direction: ltr;
`;

const TextBlock = memo(function TextBlock({ content }) {
  if (!content) {
    return null;
  }

  return <TextWrapper>{content}</TextWrapper>;
});

function MessageContent({ blocks, showImageLoading }) {
  if (!blocks?.length && !showImageLoading) {
    return null;
  }

  const hasImage = blocks?.some((block) => block.type === 'image');

  return (
    <>
      {blocks?.map((block) => {
        if (block.type === 'image') {
          return <ImageBlock key={block.id} url={block.url} alt={block.alt} />;
        }

        return <TextBlock key={block.id} content={block.content} />;
      })}
      {showImageLoading && !hasImage && <ImageLoadingPlaceholder />}
    </>
  );
}

export default memo(MessageContent);
