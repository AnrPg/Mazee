"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/providers/auth-provider"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { toast } from "@/lib/hooks/use-toast"

export default function Page() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("login")
  const queryClient = useQueryClient()

  // Redirect if already authenticated (avoid redirect during render)
  useEffect(() => {
    if (user) {
      router.replace("/dashboard")
    }
  }, [user, router])

  // Fire a small confetti burst (best-effort; no hard dep)
  const fireConfetti = async () => {
    try {
      const confetti = (await import("canvas-confetti")).default
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } })
    } catch {
      // silently ignore if the lib isn't installed
    }
  }

  // Async parent handler: toast + confetti + prefetch, then navigate
  const handleAuthSuccess = async () => {
    toast({
      title: "Welcome to Mazee!",
      description: "We’re setting things up for you…",
    })
    await fireConfetti()

    // Prefetch common data to make the dashboard feel instant
    await queryClient.prefetchQuery({
      queryKey: ["me"],
      queryFn: async () => {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("auth_token") || "" : ""
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
        if (!res.ok) throw new Error("prefetch /me failed")
        return res.json()
      },
    })
    // Optionally prefetch your first dashboard query here
    // await queryClient.prefetchQuery({ queryKey: ["dashboard","feed"], queryFn: fetchFeed })

    router.replace("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <LoginForm onSuccess={handleAuthSuccess} />
          </TabsContent>

          <TabsContent value="register">
            <RegisterForm onSuccess={handleAuthSuccess} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
