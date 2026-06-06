import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { timingSafeEqual } from 'crypto'
import { upsertGoogleUser, getSessionVersion, insertUserSession, getUserById } from '@/lib/data/store'
import { signDemoToken } from '@/app/api/demo/session/route'


export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        userId: { type: 'text' },
        demoToken: { type: 'text' },
      },
      async authorize(credentials) {
        const userId = credentials?.userId as string | undefined
        const demoToken = credentials?.demoToken as string | undefined
        if (!userId || !demoToken) return null

        const user = await getUserById(userId)
        if (!user?.isDemo || !user.demoExpiresAt) return null
        if (new Date(user.demoExpiresAt) < new Date()) return null

        const expected = signDemoToken(userId, user.demoExpiresAt)
        try {
          const match = timingSafeEqual(
            Buffer.from(demoToken, 'hex'),
            Buffer.from(expected, 'hex'),
          )
          if (!match) return null
        } catch {
          return null
        }

        return {
          id: user.id,
          name: 'Demo User',
          email: user.email,
          image: null,
          isDemo: true,
          demoExpiresAt: user.demoExpiresAt,
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'credentials') return true
      if (account?.provider !== 'google' || !profile?.email) return false
      const dbUser = await upsertGoogleUser({
        googleId: account.providerAccountId,
        email: profile.email,
        name: profile.name ?? user.name ?? 'User',
        avatarUrl: (profile as { picture?: string }).picture ?? user.image ?? '',
      })
      await insertUserSession(dbUser.id)
      user.id = dbUser.id
      user.image = dbUser.avatarUrl ?? ''
      return true
    },
    async jwt({ token, user, account }) {
      if (user && account) {
        if (account.provider === 'credentials') {
          token.id = user.id
          token.isDemo = true
          token.demoExpiresAt = (user as { demoExpiresAt?: string }).demoExpiresAt ?? null
          token.sessionVersion = 0
        } else {
          token.id = user.id
          token.avatarUrl = user.image
          const sv = await getSessionVersion(user.id!)
          token.sessionVersion = sv
        }
      } else if (token.id) {
        if (token.isDemo) {
          if (typeof token.demoExpiresAt === 'string' && new Date(token.demoExpiresAt) < new Date()) {
            return null as never
          }
        } else {
          const currentSv = await getSessionVersion(token.id as string)
          if (currentSv !== token.sessionVersion) {
            return null as never
          }
        }
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.name = token.name as string
        const u = session.user as {
          id?: string
          avatarUrl?: string
          sessionVersion?: number
          isDemo?: boolean
          demoExpiresAt?: string | null
        }
        u.id = token.id as string
        u.avatarUrl = token.avatarUrl as string
        u.sessionVersion = token.sessionVersion as number
        u.isDemo = (token.isDemo as boolean) ?? false
        u.demoExpiresAt = (token.demoExpiresAt as string | null) ?? null
      }
      return session
    },
  },
})
