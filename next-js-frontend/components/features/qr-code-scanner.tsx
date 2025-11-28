"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera, CameraOff, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface QRCodeScannerProps {
  onScan: (data: string) => void
  onError?: (error: string) => void
  title?: string
  description?: string
  className?: string
}

export function QRCodeScanner({
  onScan,
  onError,
  title = "Scan QR Code",
  description = "Point your camera at a QR code to scan",
  className,
}: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerId = "qr-scanner-container"

  const startScanning = useCallback(async () => {
    try {
      // Dynamic import for browser-only library
      const { Html5Qrcode } = await import("html5-qrcode")
      
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId)
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText)
          // Don't stop automatically, let the parent decide
        },
        (errorMessage) => {
          // Ignore frequent scan errors
        }
      )

      setIsScanning(true)
      setHasPermission(true)
    } catch (error: any) {
      console.error("Scanner start error:", error)
      setHasPermission(false)
      onError?.(error.message || "Failed to start camera")
      toast.error("Camera access denied or not available")
    }
  }, [onScan, onError])

  const stopScanning = useCallback(async () => {
    try {
      if (scannerRef.current && isScanning) {
        await scannerRef.current.stop()
        setIsScanning(false)
      }
    } catch (error) {
      console.error("Scanner stop error:", error)
    }
  }, [isScanning])

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          id={containerId}
          className="w-full aspect-square max-w-sm mx-auto bg-muted rounded-lg overflow-hidden"
          style={{ minHeight: "300px" }}
        />

        <div className="flex justify-center gap-2">
          {!isScanning ? (
            <Button onClick={startScanning}>
              <Camera className="mr-2 h-4 w-4" />
              Start Scanning
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={stopScanning}>
                <CameraOff className="mr-2 h-4 w-4" />
                Stop
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await stopScanning()
                  setTimeout(startScanning, 100)
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Restart
              </Button>
            </>
          )}
        </div>

        {hasPermission === false && (
          <div className="text-center p-4 bg-destructive/10 rounded-lg">
            <p className="text-sm text-destructive">
              Camera access denied. Please enable camera permissions in your browser settings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
