import { NextRequest, NextResponse } from 'next/server';
import { auth, clearOAuthProvidersCache } from '@/auth';
import { db } from '@/app/db';
import { oauthProviders } from '@/app/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/admin/oauth-providers - 获取所有OAuth提供商（管理员视图）
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providers = await db.query.oauthProviders.findMany({
      orderBy: [desc(oauthProviders.createdAt)]
    });

    // 为安全起见，不返回完整的clientSecret，只返回部分信息
    const safeProviders = providers.map(provider => ({
      ...provider,
      clientSecret: provider.clientSecret ? '***' + provider.clientSecret.slice(-4) : ''
    }));

    return NextResponse.json(safeProviders);
  } catch (error) {
    console.error('Failed to fetch OAuth providers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/oauth-providers - 创建新的OAuth提供商
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
      enabled = false,
      orderIndex = 0
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

    // 检查clientId唯一性（如果提供）
    if (clientId) {
      const existingClientId = await db.query.oauthProviders.findFirst({
        where: eq(oauthProviders.clientId, clientId)
      });

      if (existingClientId) {
        return NextResponse.json({ 
          error: 'OAuth provider with this Client ID already exists' 
        }, { status: 409 });
      }
    }

    // 插入新的OAuth提供商
    const newProvider = await db.insert(oauthProviders).values({
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
      orderIndex,
      config: config || {},
      enabled,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // 清除OAuth providers缓存
    clearOAuthProvidersCache();

    return NextResponse.json({
      success: true,
      provider: {
        ...newProvider[0],
        clientSecret: newProvider[0].clientSecret ? '***' + newProvider[0].clientSecret.slice(-4) : ''
      }
    });
  } catch (error) {
    console.error('Failed to create OAuth provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}