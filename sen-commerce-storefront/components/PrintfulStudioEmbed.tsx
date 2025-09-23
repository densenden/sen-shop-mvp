"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";

interface PrintfulStudioEmbedProps {
  artistId: string;
  templateId?: string;
  onComplete?: (designData: any) => void;
  onCancel?: () => void;
  className?: string;
}

export const PrintfulStudioEmbed: React.FC<PrintfulStudioEmbedProps> = ({
  artistId,
  templateId,
  onComplete,
  onCancel,
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize studio session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/studio/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            artistId,
            templateId,
            returnUrl: window.location.href,
            cancelUrl: window.location.href,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to initialize studio session");
        }

        const data = await response.json();
        
        if (!data.success || !data.session) {
          throw new Error(data.message || "Failed to create session");
        }

        setEmbedUrl(data.session.embedUrl);
        setSessionToken(data.session.sessionToken);
      } catch (err: any) {
        console.error("Studio initialization error:", err);
        setError(err.message || "Failed to initialize Printful Studio");
      } finally {
        setIsLoading(false);
      }
    };

    if (artistId) {
      initializeSession();
    }
  }, [artistId, templateId]);

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Verify origin
      if (!event.origin.includes("printful.com")) {
        return;
      }

      const { type, data } = event.data;

      switch (type) {
        case "STUDIO_READY":
          console.log("Studio is ready");
          setIsLoading(false);
          break;

        case "DESIGN_COMPLETE":
          console.log("Design completed:", data);
          
          // Send completion data to backend
          if (sessionToken) {
            try {
              const response = await fetch("/api/studio/complete", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  sessionToken,
                  ...data,
                  autoCreateProduct: true,
                }),
              });

              const result = await response.json();
              
              if (result.success && onComplete) {
                onComplete(result);
              }
            } catch (err) {
              console.error("Failed to save design:", err);
            }
          }
          break;

        case "STUDIO_CANCEL":
          console.log("Studio cancelled");
          if (onCancel) {
            onCancel();
          }
          break;

        case "STUDIO_ERROR":
          console.error("Studio error:", data);
          setError(data.message || "Studio encountered an error");
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [sessionToken, onComplete, onCancel]);

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    console.log("Studio iframe loaded");
    // Send initial configuration to iframe if needed
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        {
          type: "INIT_STUDIO",
          config: {
            locale: "en_US",
            currency: "USD",
          },
        },
        "*"
      );
    }
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Studio Error
        </h3>
        <p className="text-red-700 text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`printful-studio-container ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Loading Printful Studio...</p>
          </div>
        </div>
      )}

      {embedUrl && (
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className="w-full h-full border-0"
          title="Printful Studio"
          allow="camera; microphone"
          onLoad={handleIframeLoad}
        />
      )}
    </div>
  );
};

interface StudioModalProps {
  isOpen: boolean;
  artistId: string;
  templateId?: string;
  onClose: () => void;
  onComplete?: (designData: any) => void;
}

export const StudioModal: React.FC<StudioModalProps> = ({
  isOpen,
  artistId,
  templateId,
  onClose,
  onComplete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[90vw] h-[90vh] max-w-7xl relative">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            aria-label="Close studio"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <PrintfulStudioEmbed
          artistId={artistId}
          templateId={templateId}
          onComplete={(data) => {
            if (onComplete) {
              onComplete(data);
            }
            onClose();
          }}
          onCancel={onClose}
          className="w-full h-full rounded-lg"
        />
      </div>
    </div>
  );
};