"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/providers/auth-provider"
import { RegisterForm } from "@/components/auth/register-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function Page() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user && !isLoading) {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Don't render if user is authenticated (will redirect)
  if (user) {
    return null
  }

  const handleBackToLogin = () => {
    router.push("/")
  }

  const handleSignUpSuccess = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back to Login */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CardDescription>Already have an account?</CardDescription>
              <Button variant="outline" className="w-full bg-transparent" onClick={handleBackToLogin}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <RegisterForm onSuccess={handleSignUpSuccess} />
      </div>
    </div>
  )
}
