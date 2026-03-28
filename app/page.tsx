"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [targetImageUrl, setTargetImageUrl] = useState("");
  const [targetMindUrl, setTargetMindUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  async function loadProjects() {
    setLoading(true);

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Xatolik: " + error.message);
      setProjects([]);
    } else {
      setMessage("");
      setProjects(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function uploadFile(file: File, bucket: string) {
    try {
      setUploading(true);

      const fileName = `${Date.now()}-${file.name}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) {
        setMessage("Upload xato: " + error.message);
        return null;
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      setMessage("Upload error");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!title || !slug || !targetImageUrl || !targetMindUrl || !videoUrl) {
      setMessage("Iltimos, hamma maydonlarni to‘ldiring.");
      return;
    }

    const { error } = await supabase.from("projects").insert([
      {
        title,
        slug,
        target_image_url: targetImageUrl,
        target_mind_url: targetMindUrl,
        video_url: videoUrl,
        is_published: isPublished,
      },
    ]);

    if (error) {
      setMessage("Saqlashda xatolik: " + error.message);
      return;
    }

    setMessage("Project muvaffaqiyatli qo‘shildi.");
    setTitle("");
    setSlug("");
    setTargetImageUrl("");
    setTargetMindUrl("");
    setVideoUrl("");
    setIsPublished(true);

    loadProjects();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fb",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "32px",
          borderRadius: "18px",
          boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
          width: "100%",
          maxWidth: "900px",
        }}
      >
        <h1
          style={{
            marginBottom: "12px",
            fontSize: "38px",
            textAlign: "center",
          }}
        >
          Mini AR Admin
        </h1>

        <p
          style={{
            color: "#555",
            fontSize: "18px",
            lineHeight: "1.6",
            textAlign: "center",
          }}
        >
          Supabase bilan bog‘landi.
        </p>

        <h2 style={{ marginTop: "30px" }}>Yangi project qo‘shish</h2>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gap: "12px",
            marginTop: "16px",
            marginBottom: "30px",
          }}
        >
          <input
            type="text"
            placeholder="Title (masalan: Test AR 2)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Slug (masalan: test-ar-2)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            style={inputStyle}
          />

          <div>
            <label style={labelStyle}>Target image fayl</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const url = await uploadFile(file, "targets");
                if (url) setTargetImageUrl(url);
              }}
            />
            {targetImageUrl && (
              <p style={smallText}>Yuklandi: {targetImageUrl}</p>
            )}
          </div>

          <div>
            <label style={labelStyle}>Target .mind fayl</label>
            <input
              type="file"
              accept=".mind"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const url = await uploadFile(file, "minds");
                if (url) setTargetMindUrl(url);
              }}
            />
            {targetMindUrl && (
              <p style={smallText}>Yuklandi: {targetMindUrl}</p>
            )}
          </div>

          <div>
            <label style={labelStyle}>Video fayl</label>
            <input
              type="file"
              accept="video/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const url = await uploadFile(file, "videos");
                if (url) setVideoUrl(url);
              }}
            />
            {videoUrl && <p style={smallText}>Yuklandi: {videoUrl}</p>}
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            Published
          </label>

          <button
            type="submit"
            disabled={uploading}
            style={{
              background: uploading ? "#94a3b8" : "#2563eb",
              color: "white",
              border: "none",
              padding: "12px 18px",
              borderRadius: "10px",
              cursor: uploading ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            {uploading ? "Yuklanmoqda..." : "Save Project"}
          </button>
        </form>

        {message && (
          <p
            style={{
              color:
                message.includes("xatolik") ||
                message.includes("Xatolik") ||
                message.includes("error") ||
                message.includes("Upload xato")
                  ? "red"
                  : "green",
              marginBottom: "20px",
            }}
          >
            {message}
          </p>
        )}

        <h2>Projects</h2>

        {loading && <p>Yuklanmoqda...</p>}

        {!loading && projects.length === 0 && <p>Hozircha project yo‘q.</p>}

        {!loading &&
          projects.map((project) => (
            <div
              key={project.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "16px",
                marginTop: "14px",
              }}
            >
              <h3 style={{ margin: "0 0 10px 0" }}>{project.title}</h3>
              <p>
                <b>Slug:</b> {project.slug}
              </p>
              <p>
                <b>Target image:</b> {project.target_image_url}
              </p>
              <p>
                <b>Target mind:</b> {project.target_mind_url || "yo‘q"}
              </p>
              <p>
                <b>Video:</b> {project.video_url}
              </p>
              <p>
                <b>Published:</b> {project.is_published ? "Ha" : "Yo‘q"}
              </p>
            </div>
          ))}
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #ccc",
  fontSize: "15px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontWeight: "bold",
};

const smallText: React.CSSProperties = {
  marginTop: "6px",
  fontSize: "13px",
  color: "#555",
  wordBreak: "break-all",
};