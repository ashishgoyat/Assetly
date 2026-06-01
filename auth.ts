import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { upsertGoogleUser, getSessionVersion, insertUserSession } from '@/lib/data/store'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account, profile }) {
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
        // First sign-in — embed DB id and current sessionVersion
        token.id = user.id
        token.avatarUrl = user.image
        const sv = await getSessionVersion(user.id!)
        token.sessionVersion = sv
      } else if (token.id) {
        // Subsequent reads — validate sessionVersion
        const currentSv = await getSessionVersion(token.id as string)
        if (currentSv !== token.sessionVersion) {
          // Session revoked — return null to invalidate
          return null as never
        }
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.name = token.name as string
        ;(session.user as { id?: string; avatarUrl?: string; sessionVersion?: number }).id = token.id as string
        ;(session.user as { id?: string; avatarUrl?: string; sessionVersion?: number }).avatarUrl = token.avatarUrl as string
        ;(session.user as { id?: string; avatarUrl?: string; sessionVersion?: number }).sessionVersion = token.sessionVersion as number
      }
      return session
    },
  },
})
