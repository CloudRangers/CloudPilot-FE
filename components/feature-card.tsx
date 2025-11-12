import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { ArrowRight } from "lucide-react"

interface FeatureCardProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
}

export function FeatureCard({ title, description, icon: Icon, href }: FeatureCardProps) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
        <CardHeader className="space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
          <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary">
            <span>시작하기</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
