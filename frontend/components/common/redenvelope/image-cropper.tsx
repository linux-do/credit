"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Crop, RotateCw, X } from "lucide-react"
import type { Area, Point } from "react-easy-crop"

interface ImageCropperProps {
  /** 是否打开对话框 */
  isOpen: boolean
  /** 关闭对话框回调 */
  onOpenChange: (open: boolean) => void
  /** 裁剪完成回调 */
  onCropComplete: (croppedImage: string, coverType: 'cover' | 'heterotypic') => void
  /** 封面类型 */
  coverType: 'cover' | 'heterotypic'
}

/**
 * 创建裁剪后的图片
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('无法创建 canvas context')
  }

  const maxSize = Math.max(image.width, image.height)
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

  canvas.width = safeArea
  canvas.height = safeArea

  ctx.translate(safeArea / 2, safeArea / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.translate(-safeArea / 2, -safeArea / 2)

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  )

  const data = ctx.getImageData(0, 0, safeArea, safeArea)

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  )

  return canvas.toDataURL('image/webp')
}

/**
 * 创建图片对象
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}

/**
 * 图片裁剪组件
 * 使用 react-easy-crop 实现专业的图片裁剪功能
 */
export function ImageCropper({ isOpen, onOpenChange, onCropComplete, coverType }: ImageCropperProps) {
  const [image, setImage] = useState<string | null>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const resetCropState = () => {
    setImage(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedAreaPixels(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 裁剪比例配置 - 2:3
  const aspect = 2 / 3
  const cropShape = 'rect'

  const coverLabel = coverType === 'cover' ? '背景封面' : '装饰图片'

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    // 验证文件大小 (最大 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      resetCropState()
      setImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // 裁剪完成回调
  const onCropCompleteHandler = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  // 执行裁剪
  const handleCrop = async () => {
    if (!image || !croppedAreaPixels) return

    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation)
      onCropComplete(croppedImage, coverType)
      handleClose()
    } catch (error) {
      console.error('裁剪失败:', error)
      toast.error('裁剪失败，请重试')
    }
  }

  // 关闭对话框
  const handleClose = () => {
    resetCropState()
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full ${ image ? 'sm:max-w-2xl' : 'sm:max-w-md' }`}>
        <DialogHeader>
          <DialogTitle className="text-sm">
            {image ? `裁剪${ coverLabel }` : `上传${ coverLabel }`}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {image ? '拖拽调整位置，滚轮缩放' : '推荐 2:3 比例，支持 JPG / PNG / WEBP，最大 2MB'}
          </DialogDescription>
        </DialogHeader>

        {!image ? (
          /* 上传区域 */
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="image-upload"
            />
            <Label
              htmlFor="image-upload"
              className="cursor-pointer block rounded-lg border border-dashed border-border hover:border-foreground/25 hover:bg-muted/50 transition-colors p-10 sm:p-14 text-center"
            >
              <Crop className="size-6 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-xs font-medium text-foreground">点击选择图片</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                或拖拽图片到此处
              </p>
            </Label>
          </div>
        ) : (
          /* 裁剪区域 */
          <div className="space-y-3">
            <div className="relative w-full h-[300px] sm:h-[420px] bg-muted/50 rounded-lg overflow-hidden touch-none">
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspect}
                cropShape={cropShape}
                showGrid={true}
                onCropChange={setCrop}
                onCropComplete={onCropCompleteHandler}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
              />
            </div>

            <div className="flex items-center gap-4 px-1">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Label className="text-[10px] text-muted-foreground shrink-0">缩放</Label>
                <Slider
                  value={[zoom]}
                  onValueChange={(value: number[]) => setZoom(value[0])}
                  min={1}
                  max={3}
                  step={0.1}
                  className="flex-1"
                />
                <span className="text-[10px] text-muted-foreground tabular-nums w-7 text-right shrink-0">{Math.round(zoom * 100)}%</span>
              </div>

              <div className="w-px h-4 bg-border shrink-0" />

              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Label className="text-[10px] text-muted-foreground shrink-0">旋转</Label>
                <Slider
                  value={[rotation]}
                  onValueChange={(value: number[]) => setRotation(value[0])}
                  min={0}
                  max={360}
                  step={1}
                  className="flex-1"
                />
                <span className="text-[10px] text-muted-foreground tabular-nums w-6 text-right shrink-0">{rotation}°</span>
              </div>

              <div className="w-px h-4 bg-border shrink-0" />

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="size-7 text-muted-foreground"
                  title="旋转 90°"
                >
                  <RotateCw className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={resetCropState}
                  className="size-7 text-muted-foreground"
                  title="重新选择"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} className="text-xs h-8">
            取消
          </Button>
          <Button
            onClick={handleCrop}
            disabled={!image}
            className="bg-red-500 hover:bg-red-600 text-xs h-8"
          >
            确认裁剪
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}