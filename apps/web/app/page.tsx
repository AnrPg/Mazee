import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      {/* <Header /> */}
      <main className="container mx-auto px-6 py-16 grid gap-10 md:grid-cols-2 items-center">
        <section className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Mazee — meet, gather, grow.
          </h1>
          <p className="text-muted-foreground text-lg">
            A hub for real-world connection: live chat, events, crafts, Orthodox tools, and more.
          </p>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/auth">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        </section>
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border">
          <Image
            src="marketing/pexels-max-s-397720042-14823212.jpg"              
            alt="Mazee preview"
            fill
            className="object-cover"
            priority
          />
        </div>
      </main>
    </div>
  )
}
