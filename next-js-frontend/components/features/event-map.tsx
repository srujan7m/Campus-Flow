"use client"

import { useEffect, useRef } from "react"

interface EventMapProps {
  lat: number
  lng: number
  address?: string
  eventName?: string
  className?: string
  height?: string
  zoom?: number
  interactive?: boolean
}

export function EventMap({
  lat,
  lng,
  address,
  eventName,
  className,
  height = "300px",
  zoom = 15,
  interactive = true,
}: EventMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  // Ensure coordinates are numbers
  const latitude = Number(lat)
  const longitude = Number(lng)
  const isValidLocation = !isNaN(latitude) && !isNaN(longitude) && (latitude !== 0 || longitude !== 0)

  useEffect(() => {
    if (!mapContainerRef.current || !isValidLocation) return

    const initMap = async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default

        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        if (!token) {
          console.error("Mapbox token is missing")
          return
        }
        mapboxgl.accessToken = token

        if (mapRef.current) {
          mapRef.current.remove()
        }

        const map = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [longitude, latitude],
          zoom: zoom,
          interactive: interactive,
        })

        if (interactive) {
          map.addControl(new mapboxgl.NavigationControl(), "top-right")
        }

        // Add marker with popup
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div class="p-2">
            <strong>${eventName || "Event Location"}</strong>
            ${address ? `<br/><span class="text-sm text-gray-600">${address}</span>` : ""}
          </div>`
        )

        new mapboxgl.Marker({ color: "#2563eb" })
          .setLngLat([longitude, latitude])
          .setPopup(popup)
          .addTo(map)

        mapRef.current = map
      } catch (error) {
        console.error("Error initializing map:", error)
      }
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [latitude, longitude, address, eventName, zoom, interactive, isValidLocation])

  if (!isValidLocation) {
    return (
      <div
        className={`flex items-center justify-center bg-muted rounded-lg ${className}`}
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">No location set</p>
      </div>
    )
  }

  return (
    <div
      ref={mapContainerRef}
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ height }}
    />
  )
}
