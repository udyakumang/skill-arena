import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "./db"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(db),
    providers: [
        Credentials({
            name: "Guest / Dev",
            credentials: {
                username: { label: "Username", type: "text" },
            },
            authorize: async () => {
                // MVP: Simple Guest Login or Dev Backdoor
                // In real app, verify against DB or external provider
                const user = { id: "guest-user", name: "Guest", email: "guest@example.com" }
                return user
            },
        }),
    ],
    callbacks: {
        session: async ({ session, user }) => {
            if (session?.user) {
                session.user.id = user.id
            }
            return session
        },
    },
})
