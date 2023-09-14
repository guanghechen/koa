// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { chalk } from '@guanghechen/chalk/node'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import type { Context, Middleware, Next } from 'koa'
import { Transform } from 'node:stream'
import { bytes } from './bytes'

dayjs.extend(duration)

// const Counter = require('passthrough-counter')

type IColorCode = 0 | 1 | 2 | 3 | 4 | 5 | 7
type IColor = 'yellow' | 'red' | 'green' | 'cyan' | 'yellow' | 'red' | 'magenta'

const colorCodes: Record<IColorCode, IColor> = {
  7: 'magenta',
  5: 'red',
  4: 'yellow',
  3: 'cyan',
  2: 'green',
  1: 'green',
  0: 'yellow',
}

class Counter extends Transform {
  protected _length: number

  constructor() {
    super()
    this._length = 0
  }

  public get length(): number {
    return this._length
  }

  public override _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    this._length += chunk.length
    this.push(chunk)
    callback()
  }
}

interface IOptions {
  skipLog: (path: string) => boolean
}

export function loggerMiddleware(options: IOptions): Middleware {
  const { skipLog } = options
  return async function logger(ctx: Context, next: Next): Promise<void> {
    if (skipLog(ctx.path)) {
      await next()
      return
    }

    // request
    const startTime = ctx[Symbol.for('request-received.startTime')]
      ? ctx[Symbol.for('request-received.startTime')].getTime()
      : Date.now()

    console.log(
      '  ' + chalk.dim('<--') + ' ' + chalk.bold('%s') + ' ' + chalk.dim('%s'),
      ctx.method,
      ctx.originalUrl,
    )

    try {
      await next()
    } catch (error: unknown) {
      // log uncaught downstream errors
      log(ctx, startTime, null, error, null)
      throw error
    }

    // calculate the length of a streaming response
    // by intercepting the stream with a counter.
    // only necessary if a content-length header is currently not set.
    const length: number = ctx.response.length
    const body = ctx.body as any
    let counter: Counter | null = null
    if (length == null && body && body.readable) {
      counter = new Counter()
      // eslint-disable-next-line no-param-reassign
      ctx.body = body.pipe(counter).on('error', ctx.onerror)
    }

    // log when the response is finished or closed,
    // whichever happens first.
    const res = ctx.res

    const onfinish = done.bind(null, 'finish')
    const onclose = done.bind(null, 'close')

    res.once('finish', onfinish)
    res.once('close', onclose)

    function done(event: string): void {
      res.removeListener('finish', onfinish)
      res.removeListener('close', onclose)
      log(ctx, startTime, counter ? counter.length : length, null, event)
    }
  }
}

function log(
  ctx: Context,
  startTime: number,
  length_: number | null,
  err: unknown,
  event: string | null,
): void {
  // get the status code of the response
  const status = err
    ? (err as any).isBoom
      ? (err as any).output?.statusCode
      : (err as any).status || 500
    : ctx.status || 404

  // set the color of the status code;
  const s: IColorCode = Math.max(0, Math.floor(status / 100)) as IColorCode
  const color: IColor = colorCodes[s] || colorCodes[0]

  // get the human readable response length
  const length: string = [204, 205, 304].includes(status)
    ? ''
    : length_ == null
    ? '-'
    : String(bytes(length_)).toLowerCase()

  const upstream = err
    ? chalk.red('xxx')
    : event === 'close'
    ? chalk.yellow('-x-')
    : chalk.dim('-->')

  console.log(
    '  ' +
      upstream +
      ' ' +
      chalk.bold('%s') +
      ' ' +
      chalk.dim('%s') +
      ' ' +
      chalk[color]('%s') +
      ' ' +
      chalk.dim('%s') +
      ' ' +
      chalk.dim('%s'),
    ctx.method,
    ctx.originalUrl,
    status,
    formatDuration(startTime),
    length,
  )
}

function formatDuration(startTime: number): string {
  const delta: number = Date.now() - startTime
  return dayjs(startTime).format('HH:mm:ss') + ' ' + delta + 'ms'
}
