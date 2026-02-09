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

  return canvas.toDataURL('image/png')
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

  // 裁剪比例配置 - 2:3 比例和矩形裁剪
  const aspect = 2 / 3
  const cropShape = 'rect'

  const recommendedSize = coverType === 'cover'
    ? { width: 360, height: 540, label: "背景封面 (2:3 比例)" }
    : { width: 480, height: 720, label: "装饰图片 (2:3 比例，放置在红包后方)" }

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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Crop className="size-4 sm:size-5 text-primary" />
            裁剪{coverType === 'cover' ? '封面' : '装饰'}图片
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {recommendedSize.label} - 推荐尺寸: {recommendedSize.width}×{recommendedSize.height}px
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!image ? (
            <div className="border-2 border-dashed rounded-lg p-6 sm:p-12 text-center">
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
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="size-12 sm:size-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Crop className="size-6 sm:size-8 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium">点击上传图片</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    支持 JPG、PNG、WEBP 格式，最大 2MB
                  </p>
                </div>
              </Label>
            </div>
          ) : (
            <>
              {/* 裁剪区域 */}
              <div className="relative w-full h-[250px] sm:h-[400px] bg-muted rounded-lg overflow-hidden touch-none">
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

              {/* 控制面板 */}
              <div className="space-y-2 sm:space-y-3">
                {/* 缩放控制 */}
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] sm:text-xs text-muted-foreground">缩放</Label>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
                  </div>
                  <Slider
                    value={[zoom]}
                    onValueChange={(value: number[]) => setZoom(value[0])}
                    min={1}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* 旋转控制 */}
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] sm:text-xs text-muted-foreground">旋转</Label>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">{rotation}°</span>
                  </div>
                  <Slider
                    value={[rotation]}
                    onValueChange={(value: number[]) => setRotation(value[0])}
                    min={0}
                    max={360}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* 快捷按钮 */}
                <div className="flex items-center justify-end gap-1.5 sm:gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    className="text-xs h-8"
                  >
                    <RotateCw className="size-3 sm:size-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">旋转 90°</span>
                    <span className="sm:hidden">旋转</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      resetCropState()
                    }}
                    className="text-xs h-8"
                  >
                    <X className="size-3 sm:size-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">重新选择</span>
                    <span className="sm:hidden">重选</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleClose} className="text-xs sm:text-sm h-8 sm:h-10">
            取消
          </Button>
          <Button
            onClick={handleCrop}
            disabled={!image}
            className="bg-red-500 hover:bg-red-600 text-xs sm:text-sm h-8 sm:h-10"
          >
            确认裁剪
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}