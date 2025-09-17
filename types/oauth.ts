// OAuth提供商完整类型定义（管理端使用）
export interface OAuthProvider {
  id: string;
  name: string;
  authorizationUrl: string;
  tokenUrl: string;
  userinfoUrl?: string;
  scopes: string;
  profileMapping: Record<string, string>;
  clientId: string;
  clientSecret: string;
  iconUrl?: string;
  buttonText?: string;
  buttonColor?: string;
  orderIndex: number;
  config?: Record<string, any>;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// OAuth提供商简化类型定义（前端显示使用）
export interface OAuthProviderDisplay {
  id: string;
  name: string;
  iconUrl?: string;
  buttonText?: string;
  buttonColor?: string;
  orderIndex: number;
}

// OAuth按钮组件的属性类型
export interface DynamicOAuthButtonProps {
  provider: OAuthProviderDisplay;
}