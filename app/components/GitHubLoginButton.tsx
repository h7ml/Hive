'use client';
import { Button } from 'antd';
import GitHubLogo from '@/app/images/loginProvider/github.svg'
import { signIn } from "next-auth/react";

export default function GitHubLoginButton(props: { callbackUrl?: string, text?: string }) {
  const handleLogin = async () => {
    await signIn("github", { callbackUrl: props.callbackUrl ? props.callbackUrl : "/" });
  };

  return (
    <Button
      onClick={handleLogin}
      className='w-full'
      size='large'
      icon={<GitHubLogo className="w-4 h-4" />}
    >{props.text ? props.text : '使用 GitHub 登录'}</Button>
  );
}