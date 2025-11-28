"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Share2 } from "lucide-react"
import { toast } from "sonner"

interface QRCodeGeneratorProps {
  data: string
  title?: string
  size?: number
  showDownload?: boolean
  showShare?: boolean
  className?: string
}

export function QRCodeGenerator({
  data,
  title = "QR Code",
  size = 256,
  showDownload = true,
  showShare = true,
  className,
}: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>("")

  useEffect(() => {
    if (canvasRef.current && data) {
      // Dynamic import for browser-only library
      import("qrcode").then((QRCode) => {
        QRCode.toCanvas(
          canvasRef.current,
          data,
          {
            width: size,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#ffffff",
            },
          },
          (error) => {
            if (error) {
              console.error("QR Code generation error:", error)
            }
          }
        )

        // Also generate data URL for download/share
        QRCode.toDataURL(data, {
          width: size,
          margin: 2,
        }).then(setQrDataUrl)
      })
    }
  }, [data, size])

  const handleDownload = () => {
    if (!qrDataUrl) return

    const link = document.createElement("a")
    link.download = `qr-code-${Date.now()}.png`
    link.href = qrDataUrl
    link.click()
    toast.success("QR Code downloaded!")
  }

  const handleShare = async () => {
    if (!qrDataUrl) return

    try {
      // Convert data URL to blob
      const response = await fetch(qrDataUrl)
      const blob = await response.blob()
      const file = new File([blob], "qr-code.png", { type: "image/png" })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title,
          text: "Here is your event QR code",
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(data)
        toast.success("QR data copied to clipboard!")
      }
    } catch (error) {
      console.error("Share error:", error)
      toast.error("Failed to share QR code")
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-lg shadow-inner">
          <canvas ref={canvasRef} />
        </div>
        
        {(showDownload || showShare) && (
          <div className="flex gap-2">
            {showDownload && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
            {showShare && (
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
