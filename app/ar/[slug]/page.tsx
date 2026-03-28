"use client";

import { useEffect, useState } from "react";

type Project = {
  id: string;
  title: string;
  slug: string;
  target_image_url: string;
  target_mind_url: string;
  video_url: string;
  is_published: boolean;
  created_at: string;
};

export default function ARPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [videoReady, setVideoReady] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    async function init() {
      const resolvedParams = await params;

      try {
        const { supabase } = await import("../../../lib/supabase");

        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("slug", resolvedParams.slug)
          .single();

        if (error || !data) {
          setError("Project topilmadi");
          setLoading(false);
          return;
        }

        setProject(data);
        setLoading(false);
      } catch (err) {
        setError("Projectni yuklashda xatolik");
        setLoading(false);
      }
    }

    init();
  }, [params]);

  useEffect(() => {
    if (!project) return;

    let mounted = true;

    async function loadMindAR() {
      try {
        if (!(window as any).AFRAME) {
          const aframeScript = document.createElement("script");
          aframeScript.src = "https://aframe.io/releases/1.4.2/aframe.min.js";
          aframeScript.async = true;
          document.body.appendChild(aframeScript);

          await new Promise((resolve, reject) => {
            aframeScript.onload = () => resolve(true);
            aframeScript.onerror = () => reject(new Error("A-Frame yuklanmadi"));
          });
        }

        const mindArAlreadyLoaded = document.querySelector(
          'script[src*="mindar-image-aframe"]'
        );

        if (!mindArAlreadyLoaded) {
          const mindarScript = document.createElement("script");
          mindarScript.src =
            "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js";
          mindarScript.async = true;
          document.body.appendChild(mindarScript);

          await new Promise((resolve, reject) => {
            mindarScript.onload = () => resolve(true);
            mindarScript.onerror = () => reject(new Error("MindAR yuklanmadi"));
          });
        }

        if (!mounted) return;

        const container = document.getElementById("ar-container");
        if (!container) return;

        container.innerHTML = `
          <a-scene
            mindar-image="imageTargetSrc: ${project.target_mind_url}; autoStart: true; uiScanning: true; uiLoading: true;"
            color-space="sRGB"
            renderer="colorManagement: true; physicallyCorrectLights: true; alpha: true"
            embedded
            vr-mode-ui="enabled: false"
            device-orientation-permission-ui="enabled: false"
          >
            <a-assets>
              <video
                id="ar-video"
                src="${project.video_url}"
                preload="auto"
                loop
                muted
                playsinline
                webkit-playsinline
                crossorigin="anonymous"
              ></video>
            </a-assets>

            <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

            <a-entity mindar-image-target="targetIndex: 0">
              <a-video
                src="#ar-video"
                position="0 0 0"
                width="1"
                height="1.5"
              ></a-video>
            </a-entity>
          </a-scene>
        `;

        setTimeout(() => {
          const video = document.getElementById("ar-video") as HTMLVideoElement | null;
          if (!video) return;

          setVideoReady(true);

          document.body.addEventListener("click", () => {
            video.play().catch(() => {});
          });
        }, 1000);
      } catch (err) {
        setError("MindAR yuklanmadi");
      }
    }

    loadMindAR();

    return () => {
      mounted = false;
    };
  }, [project]);

  const playVideo = () => {
    const video = document.getElementById("ar-video") as HTMLVideoElement | null;
    if (!video) return;
    video.play().catch(() => {});
  };

  const pauseVideo = () => {
    const video = document.getElementById("ar-video") as HTMLVideoElement | null;
    if (!video) return;
    video.pause();
  };

  const toggleSound = () => {
    const video = document.getElementById("ar-video") as HTMLVideoElement | null;
    if (!video) return;

    video.muted = !video.muted;
    setSoundOn(!video.muted);

    if (!video.paused) return;
    video.play().catch(() => {});
  };

  if (loading) {
    return (
      <main style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h1>Yuklanmoqda...</h1>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h1>{error || "Project topilmadi"}</h1>
      </main>
    );
  }

  return (
    <>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          width: 100%;
          height: 100%;
          background: #000;
          font-family: Arial, sans-serif;
        }

        body {
          position: relative;
        }

        #ar-container {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #000;
        }

        a-scene {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
        }

        video, canvas {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          object-fit: cover !important;
        }
      `}</style>

      <main
        style={{
          width: "100%",
          minHeight: "100vh",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            background: "rgba(0,0,0,0.72)",
            color: "#fff",
            padding: "12px 16px",
            borderRadius: "14px",
            textAlign: "center",
            maxWidth: "90vw",
          }}
        >
          <div>
            <b>{project.title}</b>
          </div>
          <div style={{ fontSize: "14px", marginTop: "4px" }}>
            Kamerani target rasmga qaratib turing
          </div>
        </div>

        <div id="ar-container" />

        <div
          style={{
            position: "fixed",
            bottom: 18,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            justifyContent: "center",
            width: "90vw",
            maxWidth: "700px",
          }}
        >
          <button
            onClick={playVideo}
            disabled={!videoReady}
            style={buttonStyle}
          >
            ▶ Play
          </button>

          <button
            onClick={pauseVideo}
            disabled={!videoReady}
            style={buttonStyle}
          >
            ⏸ Pause
          </button>

          <button
            onClick={toggleSound}
            disabled={!videoReady}
            style={buttonStyle}
          >
            {soundOn ? "🔇 Ovoz o‘chirish" : "🔊 Ovoz yoqish"}
          </button>

          <a
            href={project.video_url}
            download
            style={linkButtonStyle}
          >
            ⬇ Yuklab olish
          </a>
        </div>
      </main>
    </>
  );
}

const buttonStyle: React.CSSProperties = {
  border: "none",
  background: "rgba(37,99,235,0.95)",
  color: "white",
  padding: "12px 16px",
  borderRadius: "12px",
  fontSize: "15px",
  cursor: "pointer",
};

const linkButtonStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.78)",
  color: "white",
  padding: "12px 16px",
  borderRadius: "12px",
  fontSize: "15px",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
};