import { z } from 'zod'

const configSchema = z.object({
  openRouterApiKey: z.string().min(1, 'OPEN_ROUTER_API_KEY is required'),
})

export const config = configSchema.parse({
  openRouterApiKey: process.env.OPEN_ROUTER_API_KEY || '',
})