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
        
        return {
          ...userData,
          email: email || `${userData.login}@github.com`
        };
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