"use client"

import { useEffect, useRef } from "react"

interface FacebookEmbedProps {
  url: string
}

/**
 * Checks if a URL is a Facebook post URL
 */
export function isFacebookUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return (
      urlObj.hostname.includes("facebook.com") ||
      urlObj.hostname.includes("fb.com") ||
      urlObj.hostname.includes("m.facebook.com")
    )
  } catch {
    return false
  }
}

/**
 * Facebook Post Embed Component
 * Uses Facebook's official embed script to render embedded posts
 */
export function FacebookEmbed({ url }: FacebookEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return

    // Load Facebook SDK script once
    if (!scriptLoadedRef.current) {
      const existingScript = document.querySelector('script[src*="connect.facebook.net"]')
      
      if (existingScript) {
        scriptLoadedRef.current = true
        // Script already exists, just parse
        setTimeout(() => {
          if (window.FB) {
            window.FB.XFBML.parse(containerRef.current)
          }
        }, 100)
      } else {
        const script = document.createElement("script")
        script.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0"
        script.async = true
        script.defer = true
        script.crossOrigin = "anonymous"
        document.body.appendChild(script)

        script.onload = () => {
          scriptLoadedRef.current = true
          // Parse XFBML after script loads
          if (window.FB) {
            window.FB.XFBML.parse(containerRef.current)
          }
        }
      }
    } else {
      // If script already loaded, just parse
      setTimeout(() => {
        if (window.FB && containerRef.current) {
          window.FB.XFBML.parse(containerRef.current)
        }
      }, 100)
    }
  }, [url])

  if (!isFacebookUrl(url)) {
    return null
  }

  return (
    <div ref={containerRef} className="my-6">
      <div
        className="fb-post"
        data-href={url}
        data-width="500"
        data-show-text="true"
      />
    </div>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    FB?: {
      XFBML: {
        parse: (element?: HTMLElement | null) => void
      }
    }
  }
}

