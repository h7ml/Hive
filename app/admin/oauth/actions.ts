'use server';

import { auth, clearOAuthProvidersCache } from '@/auth';
import { db } from '@/app/db';
import { oauthProviders } from '@/app/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// 辅助函数：清理缓存和重新验证路径
function refreshOAuthCache() {
  clearOAuthProvidersCache();
  revalidatePath('/admin/oauth');
}

export async function getOAuthProviders() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    throw new Error('Unauthorized');
  }

  const providers = await db.query.oauthProviders.findMany({
    orderBy: [desc(oauthProviders.orderIndex), desc(oauthProviders.createdAt)]
  });

  // 为安全起见，隐藏完整的clientSecret
  return providers.map(provider => ({
    ...provider,
    clientSecret: provider.clientSecret ? '***' + provider.clientSecret.slice(-4) : ''
  }));
}

export async function createOAuthProvider(formData: FormData) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    throw new Error('Unauthorized');
  }

  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const authorizationUrl = formData.get('authorizationUrl') as string;
  const tokenUrl = formData.get('tokenUrl') as string;
  const userinfoUrl = formData.get('userinfoUrl') as string;
  const scopes = formData.get('scopes') as string;
  const profileMapping = JSON.parse(formData.get('profileMapping') as string);
  const clientId = formData.get('clientId') as string;
  const clientSecret = formData.get('clientSecret') as string;
  const iconUrl = formData.get('iconUrl') as string;
  const buttonText = formData.get('buttonText') as string;
  const buttonColor = formData.get('buttonColor') as string;
  const enabled = formData.get('enabled') === 'true';
  const orderIndex = parseInt(formData.get('orderIndex') as string) || 0;

  // 验证必需字段
  if (!id || !name || !authorizationUrl || !tokenUrl || !profileMapping?.id) {
    throw new Error('Missing required fields');
  }

  // 检查ID是否已存在
  const existingProvider = await db.query.oauthProviders.findFirst({
    where: eq(oauthProviders.id, id)
  });

  if (existingProvider) {
    throw new Error('OAuth provider with this ID already exists');
  }

  // 检查clientId唯一性（如果提供）
  if (clientId) {
    const existingClientId = await db.query.oauthProviders.findFirst({
      where: eq(oauthProviders.clientId, clientId)
    });

    if (existingClientId) {
      throw new Error('OAuth provider with this Client ID already exists');
    }
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
    orderIndex,
    config: {},
    enabled,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  refreshOAuthCache();
  redirect('/admin/oauth');
}

export async function updateOAuthProvider(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    throw new Error('Unauthorized');
  }

  const name = formData.get('name') as string;
  const authorizationUrl = formData.get('authorizationUrl') as string;
  const tokenUrl = formData.get('tokenUrl') as string;
  const userinfoUrl = formData.get('userinfoUrl') as string;
  const scopes = formData.get('scopes') as string;
  const profileMapping = JSON.parse(formData.get('profileMapping') as string);
  const clientId = formData.get('clientId') as string;
  const clientSecret = formData.get('clientSecret') as string;
  const iconUrl = formData.get('iconUrl') as string;
  const buttonText = formData.get('buttonText') as string;
  const buttonColor = formData.get('buttonColor') as string;
  const enabled = formData.get('enabled') === 'true';
  const orderIndex = parseInt(formData.get('orderIndex') as string) || 0;

  // 检查OAuth提供商是否存在
  const existingProvider = await db.query.oauthProviders.findFirst({
    where: eq(oauthProviders.id, id)
  });

  if (!existingProvider) {
    throw new Error('OAuth provider not found');
  }

  // 检查clientId唯一性（如果提供且与现有不同）
  if (clientId && clientId !== existingProvider.clientId) {
    const existingClientId = await db.query.oauthProviders.findFirst({
      where: eq(oauthProviders.clientId, clientId)
    });

    if (existingClientId) {
      throw new Error('OAuth provider with this Client ID already exists');
    }
  }

  // 准备更新数据
  const updateData: any = {
    name,
    authorizationUrl,
    tokenUrl,
    userinfoUrl,
    scopes: scopes || '',
    profileMapping,
    clientId,
    iconUrl: iconUrl || `/images/oauth/${id}.svg`,
    buttonText: buttonText || `Sign in with ${name}`,
    buttonColor: buttonColor || '#666666',
    orderIndex,
    enabled,
    updatedAt: new Date()
  };

  // 只有当clientSecret不是隐藏格式时才更新
  if (clientSecret && !clientSecret.startsWith('***')) {
    updateData.clientSecret = clientSecret;
  }

  // 更新OAuth提供商
  await db.update(oauthProviders).set(updateData).where(eq(oauthProviders.id, id));

  refreshOAuthCache();
}

export async function deleteOAuthProvider(id: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    throw new Error('Unauthorized');
  }

  // 删除OAuth提供商
  await db.delete(oauthProviders).where(eq(oauthProviders.id, id));

  refreshOAuthCache();
}

export async function toggleOAuthProvider(id: string, enabled: boolean) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    throw new Error('Unauthorized');
  }

  await db.update(oauthProviders)
    .set({ enabled, updatedAt: new Date() })
    .where(eq(oauthProviders.id, id));

  refreshOAuthCache();
}