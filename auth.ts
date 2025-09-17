import NextAuth from "next-auth";
import { ZodError } from "zod";
import Credentials from "next-auth/providers/credentials";
import { signInSchema } from "@/app/lib/zod";
import { verifyPassword } from "@/app/utils/password";
import { db } from '@/app/db';
import { users } from '@/app/db/schema';
import Feishu from "@/app/auth/providers/feishu";
import Wecom from "@/app/auth/providers/wecom";
import Dingding from "@/app/auth/providers/dingding";
import { loadDynamicOAuthProviders } from "@/app/auth/providers/dynamic-oauth";
import { eq } from 'drizzle-orm';

// 全局providers缓存
let providersCache: any[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

async function getOAuthProviders() {
  const now = Date.now();
  
  // 检查缓存是否有效
  if (providersCache && (now - cacheTime) < CACHE_DURATION) {
    return providersCache;
  }
  
  let providers: any[] = [];
  
  // 传统企业OAuth提供商 (向后兼容)
  if (process.env.FEISHU_AUTH_STATUS === 'ON') {
    providers.push(Feishu({
      clientId: process.env.FEISHU_CLIENT_ID!,
      clientSecret: process.env.FEISHU_CLIENT_SECRET!,
    }));
  }
  if (process.env.WECOM_AUTH_STATUS === 'ON') {
    providers.push(Wecom({
      clientId: process.env.WECOM_CLIENT_ID!,
      clientSecret: process.env.WECOM_CLIENT_SECRET!,
    }));
  }
  if (process.env.DINGDING_AUTH_STATUS === 'ON') {
    providers.push(Dingding({
      clientId: process.env.DINGDING_CLIENT_ID!,
      clientSecret: process.env.DINGDING_CLIENT_SECRET!,
    }));
  }

  // 动态OAuth提供商 - 从数据库加载
  try {
    const dynamicProviders = await loadDynamicOAuthProviders();
    providers.push(...dynamicProviders);
    console.log(`Loaded ${dynamicProviders.length} dynamic OAuth providers`);
  } catch (error) {
    console.error('Failed to load dynamic OAuth providers:', error);
  }

  // 更新缓存
  providersCache = providers;
  cacheTime = now;
  
  return providers;
}

// 预加载providers
let providersPromise: Promise<any[]> | null = null;

function getProvidersSync() {
  if (!providersPromise) {
    providersPromise = getOAuthProviders();
  }
  return providersPromise;
}

// 立即开始异步加载
getProvidersSync();

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // 先提供基础的凭据提供商
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        try {
          const { email, password } = await signInSchema.parseAsync(credentials);
          const user = await db.query.users
            .findFirst({
              where: eq(users.email, email)
            })
          if (!user || !user.password) {
            return null;
          }
          const passwordMatch = await verifyPassword(password, user.password);
          if (passwordMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              isAdmin: user.isAdmin || false,
            };
          } else {
            return null;
          }
        } catch (error) {
          if (error instanceof ZodError) {
            return null;
          }
          throw error;
        }
      },
    }),
  ],
  pages: {
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
      }
      if (account?.provider === "credentials" && token.sub) {
        token.provider = 'credentials';
      }
      
      // 处理传统OAuth提供商
      if (account?.provider === "feishu" && token.sub) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.feishuUserId, account.providerAccountId)
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.isAdmin = dbUser.isAdmin || false;
        }
        token.provider = 'feishu';
      }
      if (account?.provider === "wecom" && token.sub) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.wecomUserId, account.providerAccountId)
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.isAdmin = dbUser.isAdmin || false;
        }
        token.provider = 'wecom';
      }
      if (account?.provider === "dingding" && token.sub) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.dingdingUnionId, account.providerAccountId)
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.isAdmin = dbUser.isAdmin || false;
        }
        token.provider = 'dingding';
      }
      
      // 处理动态OAuth提供商
      if (account && account.provider !== 'credentials' && 
          !['feishu', 'wecom', 'dingding'].includes(account.provider)) {
        const dbUser = await db.query.users.findFirst({
          where: (users, { sql }) => sql`${users.oauthAccounts}->>${account.provider} = ${account.providerAccountId}`
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.isAdmin = dbUser.isAdmin || false;
        }
        token.provider = account.provider;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: String(token.id),
          isAdmin: Boolean(token.isAdmin),
          provider: token.provider as string,
        };
      }
      return session;
    },
  },
})

// 清除OAuth providers缓存的函数，供管理API调用
export function clearOAuthProvidersCache() {
  providersCache = null;
  cacheTime = 0;
  providersPromise = null;
  console.log('OAuth providers cache cleared');
}