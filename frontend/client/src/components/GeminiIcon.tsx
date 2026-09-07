import React from "react";

interface GeminiIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const GeminiIcon: React.FC<GeminiIconProps> = ({
  className = "",
  size = 18,
  color,
}) => {
  const gradientId = "gemini-grad-" + Math.random().toString(36).substr(2, 6);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      <path
        d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
        fill={color ? color : `url(#${gradientId})`}
      />
      {!color && (
        <defs>
          <linearGradient
            id={gradientId}
            x1="0"
            y1="0"
            x2="24"
            y2="24"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#1a73e8" />
            <stop offset="0.45" stopColor="#8ab4f8" />
            <stop offset="0.8" stopColor="#9333ea" />
            <stop offset="1" stopColor="#0d9488" />
          </linearGradient>
        </defs>
      )}
    </svg>
  );
};
