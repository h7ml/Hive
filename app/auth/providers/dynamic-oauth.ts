import { OAuthConfig } from "next-auth/providers";
import { db } from '@/app/db';
import { eq } from 'drizzle-orm';
import { users, groups, oauthProviders } from '@/app/db/schema';

export interface DynamicOAuthProfile {
  [key: string]: any;
}

// 动态创建OAuth提供商
export function createDynamicOAuthProvider(
  providerConfig: typeof oauthProviders.$inferSelect
): OAuthConfig<DynamicOAuthProfile> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  return {
    id: providerConfig.id,
    name: providerConfig.name,
    type: "oauth",
    checks: providerConfig.config?.checks || ["state"],
    authorization: {
      url: providerConfig.authorizationUrl,
      params: {
        scope: providerConfig.scopes || '',
        response_type: providerConfig.config?.responseType || 'code',
        redirect_uri: `${baseUrl}/api/auth/callback/${providerConfig.id}`,
        ...(providerConfig.config?.additionalParams || {}),
      }
    },
    token: {
      url: providerConfig.tokenUrl,
    },
    userinfo: providerConfig.userinfoUrl ? {
      url: providerConfig.userinfoUrl,
      async request({ tokens, provider }: any) {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${tokens.access_token}`,
          ...(providerConfig.config?.headers || {}),
        };

        const response = await fetch(provider.userinfo?.url as URL, { headers });

        if (!response.ok) {
          throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
        }

        const rawProfile = await response.json();
        
        // 使用动态字段映射
        const mapping = providerConfig.profileMapping;
        const profileId = getNestedValue(rawProfile, mapping.id);
        
        if (!profileId) {
          throw new Error('Failed to get user ID from OAuth provider');
        }

        // 检查用户是否已存在
        const existingUser = await db.query.users.findFirst({
          where: (users, { sql }) => sql`${users.oauthAccounts}->>${providerConfig.id} = ${profileId}`
        });

        const userInfo = {
          id: profileId,
          name: mapping.name ? getNestedValue(rawProfile, mapping.name) : undefined,
          email: mapping.email ? getNestedValue(rawProfile, mapping.email) : undefined,
          image: mapping.image ? getNestedValue(rawProfile, mapping.image) : undefined,
          // 保存原始数据
          _raw: rawProfile,
        };

        if (existingUser) {
          // 更新现有用户信息
          const updateData: any = {};
          if (userInfo.name) updateData.name = userInfo.name;
          if (userInfo.email) updateData.email = userInfo.email;
          if (userInfo.image) updateData.image = userInfo.image;
          
          if (Object.keys(updateData).length > 0) {
            await db.update(users).set(updateData).where(eq(users.id, existingUser.id));
          }
        } else {
          // 创建新用户
          const defaultGroup = await db.query.groups.findFirst({
            where: eq(groups.isDefault, true)
          });
          
          const oauthAccounts: Record<string, string> = {};
          oauthAccounts[providerConfig.id] = profileId;
          
          await db.insert(users).values({
            name: userInfo.name || `${providerConfig.name} User`,
            email: userInfo.email || `${profileId}@${providerConfig.id}.oauth`,
            image: userInfo.image,
            oauthAccounts: oauthAccounts,
            groupId: defaultGroup?.id || null,
          });
        }

        return userInfo;
      },
    } : undefined,
    profile(profile: DynamicOAuthProfile) {
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        image: profile.image,
      };
    },
    clientId: providerConfig.clientId || '',
    clientSecret: providerConfig.clientSecret || '',
  };
}

// 获取嵌套对象值的通用函数
function getNestedValue(obj: any, path: string): any {
  if (!path) return undefined;
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// 从数据库动态加载所有启用的OAuth提供商
export async function loadDynamicOAuthProviders() {
  try {
    const enabledProviders = await db.query.oauthProviders.findMany({
      where: eq(oauthProviders.enabled, true)
    });
    
    const providers: any[] = [];
    
    for (const providerConfig of enabledProviders) {
      // 检查是否有必要的配置
      if (!providerConfig.clientId || !providerConfig.clientSecret) {
        console.warn(`OAuth provider ${providerConfig.id} is enabled but missing credentials`);
        continue;
      }
      
      if (!providerConfig.authorizationUrl || !providerConfig.tokenUrl) {
        console.warn(`OAuth provider ${providerConfig.id} is missing required URLs`);
        continue;
      }
      
      try {
        const oauthProvider = createDynamicOAuthProvider(providerConfig);
        providers.push(oauthProvider);
        console.log(`Loaded OAuth provider: ${providerConfig.id}`);
      } catch (error) {
        console.error(`Failed to create OAuth provider ${providerConfig.id}:`, error);
      }
    }
    
    return providers;
  } catch (error) {
    console.error('Failed to load OAuth providers from database:', error);
    return [];
  }
}