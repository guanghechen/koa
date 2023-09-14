import type { Context, Middleware, Next } from 'koa'
import { type ISendableAsset, SendableAssetType } from './types'

type IQueryParams = Record<string, string | string[] | undefined>

interface IOptions {
  resolveAsset(urlPath: string, queryParams: IQueryParams): Promise<ISendableAsset | undefined>
}

export function sendAsset(options: IOptions): Middleware {
  const { resolveAsset } = options
  return async (ctx: Context, next: Next): Promise<void> => {
    const urlPath: string = ctx.path
    const queryParams: IQueryParams = ctx.request.query
    const asset = await resolveAsset(urlPath, queryParams)

    if (asset === undefined) {
      await next()
      return
    }

    switch (asset.type) {
      case SendableAssetType.TEXT:
        ctx.set('Content-Type', asset.mimeType)
        // eslint-disable-next-line no-param-reassign
        ctx.body = asset.content
        break
      case SendableAssetType.JSON:
        ctx.set('Content-Type', asset.mimeType)
        // eslint-disable-next-line no-param-reassign
        ctx.body = JSON.stringify(asset.content)
        break
      case SendableAssetType.BINARY:
        ctx.set('Content-Type', asset.mimeType)
        // eslint-disable-next-line no-param-reassign
        ctx.body = asset.content
        break
    }
  }
}
