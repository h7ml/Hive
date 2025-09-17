import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// OAuth提供商配置模板
const OAUTH_PROVIDER_TEMPLATES = {
  github: {
    name: 'GitHub',
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userinfoUrl: 'https://api.github.com/user',
    scopes: 'user:email',
    profileMapping: {
      id: 'id',
      name: 'name',
      email: 'email',
      image: 'avatar_url'
    },
    iconUrl: '/images/oauth/github.svg',
    buttonText: 'Sign in with GitHub',
    buttonColor: '#24292e',
    config: {
      checks: ['state'],
      additionalParams: {}
    }
  },
  google: {
    name: 'Google',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userinfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scopes: 'openid email profile',
    profileMapping: {
      id: 'id',
      name: 'name',
      email: 'email',
      image: 'picture'
    },
    iconUrl: '/images/oauth/google.svg',
    buttonText: 'Sign in with Google',
    buttonColor: '#db4437',
    config: {
      checks: ['state'],
      additionalParams: {}
    }
  },
  microsoft: {
    name: 'Microsoft',
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userinfoUrl: 'https://graph.microsoft.com/v1.0/me',
    scopes: 'openid email profile',
    profileMapping: {
      id: 'id',
      name: 'displayName',
      email: 'mail',
      image: 'photo'
    },
    iconUrl: '/images/oauth/microsoft.svg',
    buttonText: 'Sign in with Microsoft',
    buttonColor: '#0078d4',
    config: {
      checks: ['state'],
      additionalParams: {}
    }
  },
  discord: {
    name: 'Discord',
    authorizationUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    userinfoUrl: 'https://discord.com/api/users/@me',
    scopes: 'identify email',
    profileMapping: {
      id: 'id',
      name: 'username',
      email: 'email',
      image: 'avatar'
    },
    iconUrl: '/images/oauth/discord.svg',
    buttonText: 'Sign in with Discord',
    buttonColor: '#5865f2',
    config: {
      checks: ['state'],
      additionalParams: {}
    }
  },
  gitlab: {
    name: 'GitLab',
    authorizationUrl: 'https://gitlab.com/oauth/authorize',
    tokenUrl: 'https://gitlab.com/oauth/token',
    userinfoUrl: 'https://gitlab.com/api/v4/user',
    scopes: 'read_user',
    profileMapping: {
      id: 'id',
      name: 'name',
      email: 'email',
      image: 'avatar_url'
    },
    iconUrl: '/images/oauth/gitlab.svg',
    buttonText: 'Sign in with GitLab',
    buttonColor: '#fc6d26',
    config: {
      checks: ['state'],
      additionalParams: {}
    }
  },
  custom: {
    name: 'Custom OAuth Provider',
    authorizationUrl: 'https://example.com/oauth/authorize',
    tokenUrl: 'https://example.com/oauth/token',
    userinfoUrl: 'https://example.com/api/user',
    scopes: 'read:user',
    profileMapping: {
      id: 'id',
      name: 'name',
      email: 'email',
      image: 'avatar'
    },
    iconUrl: '/images/oauth/custom.svg',
    buttonText: 'Sign in with Custom',
    buttonColor: '#666666',
    config: {
      checks: ['state'],
      additionalParams: {}
    }
  }
};

// GET /api/auth/oauth-providers/templates - 获取OAuth提供商模板
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(OAUTH_PROVIDER_TEMPLATES);
  } catch (error) {
    console.error('Failed to fetch OAuth provider templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}