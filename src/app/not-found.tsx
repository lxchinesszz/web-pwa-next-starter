import Link from 'next/link'
import { HouseIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center py-10">
      <Card className="w-full">
        <CardContent className="space-y-4 text-center">
          <p className="text-3xl font-semibold tracking-tight">404</p>
          <p className="text-sm text-muted-foreground">
            没有找到这个页面，可能是链接过期或路径拼写有误。
          </p>
          <Button asChild className="w-full">
            <Link href="/">
              <HouseIcon className="size-4" />
              返回首页
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
