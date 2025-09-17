import { NextRequest, NextResponse } from 'next/server';
import { auth, clearOAuthProvidersCache } from '@/auth';
import { db } from '@/app/db';
import { oauthProviders } from '@/app/db/schema';
import { eq } from 'drizzle-orm';
import { createDynamicOAuthProvider } from '@/app/auth/providers/dynamic-oauth';

// GET /api/auth/oauth-providers - 获取当前启用的OAuth提供商列表 (用于登录页面)
export async function GET() {
  try {
    const enabledProviders = await db.query.oauthProviders.findMany({
      where: eq(oauthProviders.enabled, true),
      columns: {
        id: true,
        name: true,
        iconUrl: true,
        buttonText: true,
        buttonColor: true,
        orderIndex: true,
        // 不返回敏感信息
        clientId: false,
        clientSecret: false,
      },
      orderBy: (providers, { asc }) => [asc(providers.orderIndex), asc(providers.name)]
    });

    return NextResponse.json(enabledProviders);
  } catch (error) {
    console.error('Failed to fetch OAuth providers:', error);
    return NextResponse.json([], { status: 200 }); // 返回空数组而不是错误，确保登录页面正常显示
  }
}

// POST /api/auth/oauth-providers/register - 动态注册OAuth提供商
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      name,
      authorizationUrl,
      tokenUrl,
      userinfoUrl,
      scopes,
      profileMapping,
      clientId,
      clientSecret,
      iconUrl,
      buttonText,
      buttonColor,
      config,
      enabled = false
    } = body;

    // 验证必需字段
    if (!id || !name || !authorizationUrl || !tokenUrl || !profileMapping?.id) {
      return NextResponse.json({ 
        error: 'Missing required fields: id, name, authorizationUrl, tokenUrl, profileMapping.id' 
      }, { status: 400 });
    }

    // 检查ID是否已存在
    const existingProvider = await db.query.oauthProviders.findFirst({
      where: eq(oauthProviders.id, id)
    });

    if (existingProvider) {
      return NextResponse.json({ 
        error: 'OAuth provider with this ID already exists' 
      }, { status: 409 });
    }

    // 插入新的OAuth提供商
    await db.insert(oauthProviders).values({
      id,
      name,
      authorizationUrl,
      tokenUrl,
      userinfoUrl,
      scopes: scopes || '',
      profileMapping,
      clientId,
      clientSecret,
      iconUrl: iconUrl || `/images/oauth/${id}.svg`,
      buttonText: buttonText || `Sign in with ${name}`,
      buttonColor: buttonColor || '#666666',
      orderIndex: 0,
      config: config || {},
      enabled,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 清除OAuth providers缓存
    clearOAuthProvidersCache();

    // 测试OAuth提供商配置
    if (enabled && clientId && clientSecret) {
      try {
        const providerConfig = await db.query.oauthProviders.findFirst({
          where: eq(oauthProviders.id, id)
        });
        
        if (providerConfig) {
          const testProvider = createDynamicOAuthProvider(providerConfig);
          console.log(`Successfully registered and tested OAuth provider: ${id}`);
        }
      } catch (testError) {
        console.warn(`OAuth provider ${id} registered but failed test:`, testError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `OAuth provider ${id} registered successfully`,
      note: 'OAuth providers cache has been cleared. Changes will take effect on next authentication request.'
    });
  } catch (error) {
    console.error('Failed to register OAuth provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}