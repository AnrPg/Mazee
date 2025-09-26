"use client"

import Link from "next/link"
import { Users, UserCog } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/providers/auth-provider"
import { hasPermission } from "@/lib/utils/role-utils"
import { UserMenu } from "@/components/auth/user-menu"

export function Header() {
  const { user } = useAuth()

  const canManageUsers = user ? hasPermission(user.roles, "moderator") : false

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">OS</span>
            </div>
            <span className="font-serif font-bold text-xl">Orthodox Social</span>
          </Link>

          {user && (
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
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <UserMenu />
          ) : (
            <Link href="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
