'use client';

import React from 'react';
import { signIn } from 'next-auth/react';
import { Button } from 'antd';
import { DynamicOAuthButtonProps } from '@/types/oauth';

export default function DynamicOAuthButton({ provider }: DynamicOAuthButtonProps) {
  const handleSignIn = () => {
    signIn(provider.id, {
      callbackUrl: '/chat'
    });
  };

  return (
    <Button
      onClick={handleSignIn}
      block
      size="large"
      className="flex items-center justify-center"
      style={{
        backgroundColor: provider.buttonColor || '#666666',
        borderColor: provider.buttonColor || '#666666',
        color: 'white',
        marginBottom: '8px'
      }}
    >
      <div className="flex items-center justify-center w-full">
        {provider.iconUrl && (
          <img
            src={provider.iconUrl}
            alt={provider.name}
            className="w-5 h-5 mr-2"
            onError={(e) => {
              // 如果图标加载失败，隐藏图标
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <span>{provider.buttonText || `Sign in with ${provider.name}`}</span>
      </div>
    </Button>
  );
}