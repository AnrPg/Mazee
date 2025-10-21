"use client"

import Link from "next/link"
import { Users, UserCog } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/providers/auth-provider"
import { hasPermission } from "@/lib/utils/role-utils"
import { UserMenu } from "@/components/auth/user-menu"
import Image from "next/image"

export function Header() {
  const { user } = useAuth()

  const canManageUsers = user ? hasPermission(user.roles, "moderator") : false

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <Image src="/logo.png" alt="Mazee logo" width={65} height={65} className="h-14 w-14 sm:h-10 sm:w-10 md:h-12 md:w-12" priority />
            </div>
            <span className="font-serif font-bold text-xl">Mazee</span>
          </Link>

          {user ? (
            <nav className="flex items-center gap-4">
              {canManageUsers && (
                <>
                  <Link href="/">
                    <Button variant="ghost" size="sm">
                      <Users className="mr-2 h-4 w-4" />
                      Users
                    </Button>
                  </Link>
                  <Link href="/profiles">
                    <Button variant="ghost" size="sm">
                      <UserCog className="mr-2 h-4 w-4" />
                      Profiles
                    </Button>
                  </Link>
                </>
              )}
              <UserMenu /> {/* keeps your logged-in dropdown */}
            </nav>
          ) : (
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost">
                <Link href="/auth">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>

        {/* <div className="flex items-center gap-4">
          {user ? (
            <UserMenu />
          ) : (
            <Link href="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </div> */}
      </div>
    </header>
  )
}
