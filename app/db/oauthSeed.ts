import 'dotenv/config';
import { oauthProviders } from '@/app/db/schema';
import { db } from './index';
import oauthProvidersData from './data/oauth-providers';

export async function initializeOAuthProviders() {
  console.log('Initializing OAuth providers...');
  
  // 由于现在采用纯动态配置，不预置任何OAuth提供商
  if (oauthProvidersData.length === 0) {
    console.log('No predefined OAuth providers to initialize. Using dynamic configuration.');
    return;
  }
  
  const providersWithTimestamp = oauthProvidersData.map(provider => ({
    ...provider,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await db
    .insert(oauthProviders)
    .values(providersWithTimestamp)
    .onConflictDoNothing({ target: oauthProviders.id }) // 冲突时忽略
    .execute();
    
  console.log(`Initialized ${oauthProvidersData.length} OAuth providers.`);
}

// 当直接运行此文件时执行初始化
if (require.main === module) {
  initializeOAuthProviders().then(() => {
    console.log("OAuth providers initialized successfully.");
    process.exit(0);
  }).catch((error) => {
    console.error("Error initializing OAuth providers:", error);
    process.exit(1);
  });
}