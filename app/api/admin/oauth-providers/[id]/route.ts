import { NextRequest, NextResponse } from 'next/server';
import { auth, clearOAuthProvidersCache } from '@/auth';
import { db } from '@/app/db';
import { oauthProviders } from '@/app/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/admin/oauth-providers/[id] - 获取单个OAuth提供商详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const provider = await db.query.oauthProviders.findFirst({
      where: eq(oauthProviders.id, params.id)
    });

    if (!provider) {
      return NextResponse.json({ error: 'OAuth provider not found' }, { status: 404 });
    }

    // 为安全起见，返回完整配置但隐藏完整的clientSecret
    const safeProvider = {
      ...provider,
      clientSecret: provider.clientSecret ? '***' + provider.clientSecret.slice(-4) : ''
    };

    return NextResponse.json(safeProvider);
  } catch (error) {
    console.error('Failed to fetch OAuth provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/oauth-providers/[id] - 更新OAuth提供商
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
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
      enabled,
      orderIndex
    } = body;

    // 检查OAuth提供商是否存在
    const existingProvider = await db.query.oauthProviders.findFirst({
      where: eq(oauthProviders.id, params.id)
    });

    if (!existingProvider) {
      return NextResponse.json({ error: 'OAuth provider not found' }, { status: 404 });
    }

    // 准备更新数据
    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (authorizationUrl !== undefined) updateData.authorizationUrl = authorizationUrl;
    if (tokenUrl !== undefined) updateData.tokenUrl = tokenUrl;
    if (userinfoUrl !== undefined) updateData.userinfoUrl = userinfoUrl;
    if (scopes !== undefined) updateData.scopes = scopes;
    if (profileMapping !== undefined) updateData.profileMapping = profileMapping;
    if (clientId !== undefined) updateData.clientId = clientId;
    if (clientSecret !== undefined && clientSecret !== '***' + existingProvider.clientSecret.slice(-4)) {
      updateData.clientSecret = clientSecret;
    }
    if (iconUrl !== undefined) updateData.iconUrl = iconUrl;
    if (buttonText !== undefined) updateData.buttonText = buttonText;
    if (buttonColor !== undefined) updateData.buttonColor = buttonColor;
    if (config !== undefined) updateData.config = config;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex;

    // 更新OAuth提供商
    const updatedProvider = await db
      .update(oauthProviders)
      .set(updateData)
      .where(eq(oauthProviders.id, params.id))
      .returning();

    // 清除OAuth providers缓存
    clearOAuthProvidersCache();

    return NextResponse.json({
      success: true,
      provider: {
        ...updatedProvider[0],
        clientSecret: updatedProvider[0].clientSecret ? '***' + updatedProvider[0].clientSecret.slice(-4) : ''
      }
    });
  } catch (error) {
    console.error('Failed to update OAuth provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/oauth-providers/[id] - 删除OAuth提供商
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查OAuth提供商是否存在
    const existingProvider = await db.query.oauthProviders.findFirst({
      where: eq(oauthProviders.id, params.id)
    });

    if (!existingProvider) {
      return NextResponse.json({ error: 'OAuth provider not found' }, { status: 404 });
    }

    // 删除OAuth提供商
    await db.delete(oauthProviders).where(eq(oauthProviders.id, params.id));

    // 清除OAuth providers缓存
    clearOAuthProvidersCache();

    return NextResponse.json({
      success: true,
      message: `OAuth provider ${params.id} deleted successfully`
    });
  } catch (error) {
    console.error('Failed to delete OAuth provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}