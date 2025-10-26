'use client';

interface AnimatedTitleProps {
  text: string;
  className?: string;
}

export function AnimatedTitle({ text, className = '' }: AnimatedTitleProps) {
  const words = text.split(' ');
  
  return (
    <h1 className={className}>
      {words.map((word, index) => (
        <span
          key={index}
          className="animate-word"
          style={{
            animationDelay: `${index * 0.15}s`,
            marginRight: index < words.length - 1 ? '0.25em' : '0'
          }}
        >
          {word}
        </span>
      ))}
    </h1>
  );
}