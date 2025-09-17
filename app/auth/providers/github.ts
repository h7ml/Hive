import { db } from '@/app/db';
import { eq } from 'drizzle-orm';
import { users, groups } from '@/app/db/schema';
import { OAuthConfig } from "next-auth/providers";

export interface GitHubProfile {
  id: number;
  login: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  html_url?: string;
  bio?: string;
  location?: string;
  public_repos?: number;
  followers?: number;
  following?: number;
}

export default function GitHub(options: {
  clientId: string;
  clientSecret: string;
}): OAuthConfig<GitHubProfile> {
  return {
    id: "github",
    name: "GitHub",
    type: "oauth",
    checks: ["state"],
    authorization: {
      url: "https://github.com/login/oauth/authorize",
      params: {
        scope: "user:email",
      },
    },
    token: {
      url: "https://github.com/login/oauth/access_token",
    },
    userinfo: {
      url: "https://api.github.com/user",
      async request({ tokens, provider }: any) {
        // 获取用户基本信息
        const userResponse = await fetch(provider.userinfo?.url as URL, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            "User-Agent": "HiveChat",
          },
        });
        
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user info from GitHub');
        }
        
        const userData = await userResponse.json();
        
        // 获取用户邮箱信息（如果公开邮箱为空）
        let email = userData.email;
        if (!email) {
          const emailResponse = await fetch("https://api.github.com/user/emails", {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              "User-Agent": "HiveChat",
            },
          });
          
          if (emailResponse.ok) {
            const emails = await emailResponse.json();
            const primaryEmail = emails.find((e: any) => e.primary);
            email = primaryEmail?.email || emails[0]?.email;
          }
        }
        
        // 检查是否已存在该用户
        const existingUser = await db
          .query
          .users
          .findFirst({
            where: eq(users.githubUserId, userData.id.toString())
          });
          
        if (existingUser) {
          // 更新现有用户信息
          await db.update(users).set({
            name: userData.name || userData.login,
            email: email || `${userData.login}@github.com`,
            image: userData.avatar_url,
          }).where(eq(users.githubUserId, userData.id.toString()));
        } else {
          // 创建新用户
          const defaultGroup = await db.query.groups.findFirst({
            where: eq(groups.isDefault, true)
          });
          const groupId = defaultGroup?.id || null;
          
          await db.insert(users).values({
            githubUserId: userData.id.toString(),
            name: userData.name || userData.login,
            email: email || `${userData.login}@github.com`,
            image: userData.avatar_url,
            groupId: groupId,
          });
        }
        
        return userData;
      },
    },
    profile(profile: GitHubProfile) {
      return {
        id: profile.id.toString(),
        login: profile.login,
        name: profile.name || profile.login,
        email: profile.email,
        image: profile.avatar_url,
      };
    },
    clientId: options.clientId,
    clientSecret: options.clientSecret,
  };
}