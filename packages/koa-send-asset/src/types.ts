export enum SendableAssetType {
  TEXT = 'text',
  JSON = 'json',
  BINARY = 'binary',
}

export interface ISendableTextAsset {
  type: SendableAssetType.TEXT
  mimeType: string
  content: string
}

export interface ISendableJsonAsset {
  type: SendableAssetType.JSON
  mimeType: string
  content: unknown
}

export interface ISendableBinaryAsset {
  type: SendableAssetType.BINARY
  mimeType: string
  content: Buffer
}

export type ISendableAsset = ISendableTextAsset | ISendableJsonAsset | ISendableBinaryAsset
