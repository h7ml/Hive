// OAuth提供商完整类型定义（管理端使用）
export interface OAuthProvider {
  id: string;
  name: string;
  authorizationUrl: string;
  tokenUrl: string;
  userinfoUrl: string | null;
  scopes: string | null;
  profileMapping: Record<string, string>;
  clientId: string | null;
  clientSecret: string | null;
  iconUrl: string | null;
  buttonText: string | null;
  buttonColor: string | null;
  orderIndex: number;
  config: Record<string, any> | null;
  enabled: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// OAuth提供商简化类型定义（前端显示使用）
export interface OAuthProviderDisplay {
  id: string;
  name: string;
  iconUrl: string | null;
  buttonText: string | null;
  buttonColor: string | null;
  orderIndex: number;
}

// OAuth按钮组件的属性类型
export interface DynamicOAuthButtonProps {
  provider: OAuthProviderDisplay;
}