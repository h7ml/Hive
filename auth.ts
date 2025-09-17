import NextAuth from "next-auth";
import { ZodError } from "zod";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { signInSchema } from "@/app/lib/zod";
import { verifyPassword } from "@/app/utils/password";
import { db } from '@/app/db';
import { users } from '@/app/db/schema';
import Feishu from "@/app/auth/providers/feishu";
import Wecom from "@/app/auth/providers/wecom";
import Dingding from "@/app/auth/providers/dingding";
import { loadDynamicOAuthProviders } from "@/app/auth/providers/dynamic-oauth";
import { eq } from 'drizzle-orm';

// 静态providers - 立即可用
const staticProviders = [];

// 添加传统OAuth提供商
if (process.env.FEISHU_AUTH_STATUS === 'ON') {
  staticProviders.push(Feishu({
    clientId: process.env.FEISHU_CLIENT_ID!,
    clientSecret: process.env.FEISHU_CLIENT_SECRET!,
  }));
}
if (process.env.WECOM_AUTH_STATUS === 'ON') {
  staticProviders.push(Wecom({
    clientId: process.env.WECOM_CLIENT_ID!,
    clientSecret: process.env.WECOM_CLIENT_SECRET!,
  }));
}
if (process.env.DINGDING_AUTH_STATUS === 'ON') {
  staticProviders.push(Dingding({
    clientId: process.env.DINGDING_CLIENT_ID!,
    clientSecret: process.env.DINGDING_CLIENT_SECRET!,
  }));
}

// 添加GitHub OAuth - 使用NextAuth自带的
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  staticProviders.push(GitHub({
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  }));
}

// 添加凭据提供商
staticProviders.push(Credentials({
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
}));

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: staticProviders,
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
      
      // 处理GitHub OAuth
      if (account?.provider === "github" && token.sub) {
        const dbUser = await db.query.users.findFirst({
          where: (users, { sql }) => sql`${users.oauthAccounts}->>'github' = ${account.providerAccountId}`
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.isAdmin = dbUser.isAdmin || false;
        } else {
          // 创建新用户
          const defaultGroup = await db.query.groups?.findFirst?.({
            where: (groups, { eq }) => eq(groups.isDefault, true)
          }) || null;
          
          const newUser = await db.insert(users).values({
            name: user.name || 'GitHub User',
            email: user.email || `${account.providerAccountId}@github.com`,
            image: user.image,
            oauthAccounts: {
              github: account.providerAccountId
            },
            groupId: defaultGroup?.id || null,
          }).returning();
          
          if (newUser[0]) {
            token.id = newUser[0].id;
            token.isAdmin = newUser[0].isAdmin || false;
          }
        }
        token.provider = 'github';
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
          !['feishu', 'wecom', 'dingding', 'github'].includes(account.provider)) {
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
  console.log('OAuth providers cache cleared');
}