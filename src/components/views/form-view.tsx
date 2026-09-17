'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { RotateCcwIcon, SendIcon } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

/**
 * 表单校验同时服务两件事：
 * 1. 提交前的运行时校验；
 * 2. 类型 —— FormValues 由 schema 推导，写错字段名会直接编译失败。
 */
const formSchema = z.object({
  title: z.string().min(2, '标题至少 2 个字符').max(24, '标题最多 24 个字符'),
  owner: z.string().min(1, '请填写负责人'),
  category: z.enum(['idea', 'bug', 'task']),
  priority: z.number().min(0).max(100),
  detail: z.string().min(5, '再补充几句，至少 5 个字符').max(200, '最多 200 个字符'),
  channel: z.enum(['app', 'email', 'sms']),
  notify: z.boolean(),
  urgent: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

const defaultValues: FormValues = {
  title: '',
  owner: '',
  category: 'idea',
  priority: 60,
  detail: '',
  channel: 'app',
  notify: true,
  urgent: false,
}

export function FormView() {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    // 模板里用定时器模拟请求；接真实接口时替换成 await createTicket(values)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setSubmitting(false)

    toast.success('已提交（示例）', {
      description: `${values.title} · 负责人 ${values.owner} · 优先级 ${values.priority}`,
    })
    form.reset(defaultValues)
  }

  const dirtyCount = Object.keys(form.formState.dirtyFields).length
  const errorCount = Object.keys(form.formState.errors).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="表单"
        description="react-hook-form + zod + shadcn/ui；宽屏下左侧填写、右侧常驻提交区"
      />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">基础信息</CardTitle>
                <CardDescription>输入框、下拉选择与文本域</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>标题</FormLabel>
                      <FormControl>
                        <Input placeholder="例如：优化离线缓存策略" {...field} />
                      </FormControl>
                      <FormDescription>2–24 个字符</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="owner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>负责人</FormLabel>
                      <FormControl>
                        <Input placeholder="例如：liuxin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>类型</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="请选择" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="idea">想法</SelectItem>
                          <SelectItem value="bug">缺陷</SelectItem>
                          <SelectItem value="task">任务</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="detail"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>详细描述</FormLabel>
                      <FormControl>
                        <Textarea rows={5} placeholder="描述背景、期望结果与验收标准" {...field} />
                      </FormControl>
                      <FormDescription>当前 {field.value.length}/200 字</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">优先级与通知</CardTitle>
                <CardDescription>滑块、单选组、开关与复选框</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <FormLabel>优先级</FormLabel>
                        <span className="text-sm font-medium text-primary">{field.value}</span>
                      </div>
                      <FormControl>
                        <Slider
                          value={[field.value]}
                          onValueChange={(next) => field.onChange(next[0] ?? 0)}
                          step={5}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="channel"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>通知渠道</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid grid-cols-3 gap-2"
                        >
                          {[
                            { value: 'app', label: '站内' },
                            { value: 'email', label: '邮件' },
                            { value: 'sms', label: '短信' },
                          ].map((option) => (
                            <label
                              key={option.value}
                              className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                            >
                              <RadioGroupItem value={option.value} />
                              {option.label}
                            </label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notify"
                  render={({ field }) => (
                    <FormItem className="flex items-start justify-between gap-3 rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>处理进度通知</FormLabel>
                        <FormDescription>状态变更时推送提醒</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="urgent"
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-3 rounded-lg border p-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-0.5">
                        <FormLabel>标记为紧急</FormLabel>
                        <FormDescription>会置顶展示并触发即时提醒</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* 右侧常驻提交区：宽屏下跟随滚动，页面很长时不用回到顶部找按钮 */}
          <Card className="lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle className="text-sm">提交</CardTitle>
              <CardDescription>校验通过后才会触发 submit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">已修改字段</dt>
                  <dd className="font-medium">{dirtyCount}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">校验错误</dt>
                  <dd className="font-medium">{errorCount}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">当前状态</dt>
                  <dd>
                    <Badge variant={form.formState.isValid ? 'secondary' : 'outline'}>
                      {form.formState.isValid ? '校验通过' : '待完善'}
                    </Badge>
                  </dd>
                </div>
              </dl>

              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={submitting}>
                  <SendIcon className="size-4" />
                  {submitting ? '提交中…' : '提交'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset(defaultValues)}
                  disabled={submitting}
                >
                  <RotateCcwIcon className="size-4" />
                  重置
                </Button>
              </div>

              <p className="text-[11px] leading-relaxed text-muted-foreground">
                示例提交只弹一个 toast。接入后端时替换 <code>onSubmit</code> 里的延时，
                其余代码无需改动。
              </p>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}
