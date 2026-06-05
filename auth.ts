import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { upsertGoogleUser, getSessionVersion, insertUserSession } from '@/lib/data/store'

function parseDeviceInfo(ua: string): string {
  let browser = 'Browser'
  if (ua.includes('Edg/') || ua.includes('Edge/')) browser = 'Edge'
  else if (ua.includes('Chrome/')) browser = 'Chrome'
  else if (ua.includes('Firefox/')) browser = 'Firefox'
  else if (ua.includes('Safari/')) browser = 'Safari'

  let os = 'Device'
  if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Macintosh') || ua.includes('Mac OS X')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'

  return `${browser} on ${os}`
}

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
    async signIn({ user, account, profile, request }) {
      if (account?.provider !== 'google' || !profile?.email) return false
      const dbUser = await upsertGoogleUser({
        googleId: account.providerAccountId,
        email: profile.email,
        name: profile.name ?? user.name ?? 'User',
        avatarUrl: (profile as { picture?: string }).picture ?? user.image ?? '',
      })
      const ua = (request as Request | undefined)?.headers?.get('user-agent') ?? undefined
      const ip = (request as Request | undefined)?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined
      await insertUserSession(dbUser.id, ua ? parseDeviceInfo(ua) : undefined, ip)
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
