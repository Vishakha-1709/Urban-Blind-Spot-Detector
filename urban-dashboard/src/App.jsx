import { useState, useRef, useCallback } from "react";

// Mock data for Image A (worse)
const mockDataA = {
  label: "Image A",
  safetyScore: 62,
  riskLevel: "Moderate",
  riskColor: "#f59e0b",
  visibilityIndex: 74,
  blindSpotSeverity: "High",
  severityColor: "#ef4444",
  aiVerdict:
    "This urban intersection presents notable safety challenges. The combination of physical obstructions, inadequate lighting, and high pedestrian-vehicle conflict zones creates a compounded risk environment. Immediate attention is warranted for the eastern corner blind spot.",
  issues: [
    { id: 1, icon: "🏗️", label: "Structural Obstruction", detail: "Utility pole cluster blocks sightlines at 40° arc on the northeast corner", severity: "high" },
    { id: 2, icon: "🌳", label: "Vegetation Overhang", detail: "Overgrown canopy reduces vertical visibility during wet conditions", severity: "medium" },
    { id: 3, icon: "🚗", label: "Parked Vehicle Conflict", detail: "Delivery zone overlaps with pedestrian crossing — 3.2m gap compromised", severity: "high" },
    { id: 4, icon: "💡", label: "Lighting Gap", detail: "18m unlit stretch between lamp posts on the south sidewalk", severity: "medium" },
    { id: 5, icon: "🪧", label: "Signage Occlusion", detail: "Stop sign partially obscured by advertising banner at driver eye level", severity: "low" },
  ],
  recommendations: [
    { id: 1, action: "Relocate utility infrastructure", detail: "Move pole cluster 2m east to restore clear sightlines at intersection apex." },
    { id: 2, action: "Schedule vegetation audit", detail: "Trim canopy to maintain minimum 2.5m vertical clearance across all pedestrian paths." },
    { id: 3, action: "Enforce delivery zone boundaries", detail: "Add physical bollards to prevent vehicle encroachment on the crossing buffer." },
    { id: 4, action: "Install adaptive street lighting", detail: "Motion-triggered LED fill lights for the unlit 18m corridor on the south sidewalk." },
    { id: 5, action: "Remove obstructing signage", detail: "Clear unauthorized banner from the stop sign proximity zone per traffic code §4.12." },
  ],
  nightSafety: {
    score: 41, label: "Poor", color: "#ef4444",
    factors: [
      { label: "Street Light Coverage", value: 45, color: "#f59e0b" },
      { label: "Reflective Markings", value: 30, color: "#ef4444" },
      { label: "Signage Visibility", value: 58, color: "#f59e0b" },
      { label: "Pedestrian Visibility", value: 35, color: "#ef4444" },
    ],
    advisory: "Nighttime conditions significantly amplify all daytime risks. Pedestrians should avoid this corridor after dusk until lighting improvements are implemented.",
  },
};

// Mock data for Image B (better)
const mockDataB = {
  label: "Image B",
  safetyScore: 84,
  riskLevel: "Low",
  riskColor: "#22c55e",
  visibilityIndex: 91,
  blindSpotSeverity: "Low",
  severityColor: "#22c55e",
  aiVerdict:
    "This street segment demonstrates well-maintained safety infrastructure with clear sightlines, adequate lighting, and minimal obstruction. Minor improvements to signage placement could further elevate safety standards, but overall the environment is suitable for high pedestrian traffic.",
  issues: [
    { id: 1, icon: "🪧", label: "Minor Signage Placement", detail: "Speed limit sign positioned 0.5m lower than optimal driver eye level", severity: "low" },
    { id: 2, icon: "🌿", label: "Low-level Shrub Growth", detail: "Hedge trimming needed near corner to maintain full pedestrian sightlines", severity: "low" },
  ],
  recommendations: [
    { id: 1, action: "Raise signage height", detail: "Reposition speed limit sign to standard 2.1m mounting height for optimal visibility." },
    { id: 2, action: "Routine hedge maintenance", detail: "Quarterly trimming schedule to keep corner sightlines clear below 0.8m." },
  ],
  nightSafety: {
    score: 78, label: "Good", color: "#22c55e",
    factors: [
      { label: "Street Light Coverage", value: 85, color: "#22c55e" },
      { label: "Reflective Markings", value: 72, color: "#22c55e" },
      { label: "Signage Visibility", value: 80, color: "#22c55e" },
      { label: "Pedestrian Visibility", value: 74, color: "#f59e0b" },
    ],
    advisory: "Nighttime safety is generally adequate. The well-placed LED streetlights provide consistent coverage across all pedestrian zones.",
  },
};

const SEV_COLORS = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #050810;
    --surface: rgba(255,255,255,0.04);
    --surface-hover: rgba(255,255,255,0.07);
    --border: rgba(255,255,255,0.08);
    --border-bright: rgba(255,255,255,0.14);
    --blue: #3b82f6; --purple: #8b5cf6; --indigo: #6366f1; --cyan: #06b6d4;
    --text: #f1f5f9; --text-muted: #94a3b8; --text-dim: #64748b;
    --grad: linear-gradient(135deg, #3b82f6, #8b5cf6);
    --radius: 16px; --radius-sm: 10px;
  }
  body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; min-height: 100vh; }
  .app {
    min-height: 100vh;
    background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 60%),
                radial-gradient(ellipse 60% 40% at 90% 100%, rgba(139,92,246,0.12) 0%, transparent 60%),
                var(--bg);
  }

  /* HEADER */
  .header {
    padding: 28px 32px 24px; border-bottom: 1px solid var(--border);
    background: rgba(5,8,16,0.8); backdrop-filter: blur(20px);
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; gap: 16px;
  }
  .header-icon { width: 44px; height: 44px; background: var(--grad); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
  .header-title { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 700; background: var(--grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: -0.3px; }
  .header-sub { font-size: 12px; color: var(--text-dim); font-weight: 400; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 2px; }
  .header-badge { margin-left: auto; padding: 6px 14px; border-radius: 999px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); font-size: 11px; font-weight: 600; color: #a5b4fc; letter-spacing: 0.5px; text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
  .pulse { width: 6px; height: 6px; border-radius: 50%; background: #6366f1; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }

  /* MAIN */
  .main { padding: 32px; max-width: 1300px; margin: 0 auto; }
  .top-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  @media(max-width: 900px) { .top-grid { grid-template-columns: 1fr; } }

  /* GLASS */
  .glass { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); backdrop-filter: blur(16px); transition: border-color 0.2s, background 0.2s; }
  .glass:hover { border-color: var(--border-bright); background: var(--surface-hover); }

  /* UPLOAD */
  .upload-card { padding: 24px; }
  .upload-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .upload-single { display: flex; flex-direction: column; gap: 10px; }
  .card-label { font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .card-label-dot { width: 6px; height: 6px; border-radius: 50%; background: #6366f1; }
  .img-tag { font-size: 10px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; padding: 3px 10px; border-radius: 999px; display: inline-flex; align-items: center; gap: 5px; }

  .drop-zone { border: 2px dashed var(--border-bright); border-radius: var(--radius-sm); padding: 28px 16px; text-align: center; cursor: pointer; transition: all 0.2s; background: rgba(255,255,255,0.015); position: relative; overflow: hidden; }
  .drop-zone.drag-over { border-color: #6366f1; background: rgba(99,102,241,0.08); }
  .drop-zone:hover { border-color: rgba(99,102,241,0.5); background: rgba(99,102,241,0.04); }
  .drop-icon { font-size: 28px; margin-bottom: 8px; }
  .drop-title { font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
  .drop-sub { font-size: 11px; color: var(--text-dim); line-height: 1.5; }
  .drop-btn { margin-top: 12px; padding: 7px 16px; background: var(--grad); border: none; border-radius: 8px; font-size: 12px; font-weight: 600; color: #fff; cursor: pointer; font-family: 'Inter', sans-serif; }
  .hidden-input { display: none; }

  .preview-wrap { border-radius: var(--radius-sm); overflow: hidden; position: relative; }
  .preview-img { width: 100%; height: 160px; object-fit: cover; display: block; }
  .preview-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 8px 10px; background: linear-gradient(to top, rgba(5,8,16,0.9), transparent); display: flex; align-items: center; justify-content: space-between; }
  .preview-name { font-size: 10px; font-weight: 500; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80px; }
  .preview-tag { padding: 2px 8px; border-radius: 999px; background: rgba(99,102,241,0.25); border: 1px solid rgba(99,102,241,0.4); font-size: 10px; font-weight: 600; color: #a5b4fc; }
  .clear-btn { position: absolute; top: 6px; right: 6px; width: 22px; height: 22px; border-radius: 50%; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; }

  .analyze-btn { margin-top: 14px; width: 100%; padding: 13px; background: var(--grad); border: none; border-radius: var(--radius-sm); font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 700; color: #fff; cursor: pointer; letter-spacing: 0.3px; transition: opacity 0.2s, transform 0.1s; }
  .analyze-btn:hover { opacity: 0.9; }
  .analyze-btn:active { transform: scale(0.98); }
  .analyze-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .second-slot-hint { margin-top: 14px; padding: 11px 14px; border-radius: var(--radius-sm); background: rgba(99,102,241,0.07); border: 1px dashed rgba(99,102,241,0.3); font-size: 12px; color: #a5b4fc; display: flex; align-items: center; gap: 8px; }

  /* METRICS */
  .metrics-col { display: flex; flex-direction: column; gap: 14px; }
  .metric-card { padding: 20px 22px; }
  .metric-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
  .metric-name { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.7px; color: var(--text-dim); }
  .metric-icon { font-size: 18px; }
  .metric-value { font-family: 'Space Grotesk', sans-serif; font-size: 36px; font-weight: 700; line-height: 1; margin-bottom: 6px; }
  .metric-sub { font-size: 12px; color: var(--text-muted); }
  .progress-bar { height: 4px; border-radius: 999px; background: rgba(255,255,255,0.07); overflow: hidden; margin-top: 14px; }
  .progress-fill { height: 100%; border-radius: 999px; transition: width 0.8s ease; }
  .risk-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }

  /* BOTTOM PANELS */
  .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  @media(max-width: 900px) { .bottom-grid { grid-template-columns: 1fr; } }
  .panel { padding: 24px; }
  .panel-header { margin-bottom: 20px; }
  .panel-title { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
  .panel-title-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; }
  .panel-desc { font-size: 12px; color: var(--text-dim); padding-left: 40px; }
  .verdict-text { font-size: 14px; line-height: 1.75; color: var(--text-muted); border-left: 3px solid #6366f1; padding-left: 16px; }
  .verdict-meta { margin-top: 16px; display: flex; gap: 20px; flex-wrap: wrap; }
  .verdict-stat { display: flex; flex-direction: column; gap: 3px; }
  .verdict-stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.7px; color: var(--text-dim); }
  .verdict-stat-val { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 700; }
  .issue-list { display: flex; flex-direction: column; gap: 10px; }
  .issue-item { padding: 12px 14px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); display: flex; gap: 12px; align-items: flex-start; transition: background 0.15s; }
  .issue-item:hover { background: rgba(255,255,255,0.055); }
  .issue-emoji { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
  .issue-body { flex: 1; }
  .issue-label { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 3px; }
  .issue-detail { font-size: 11px; color: var(--text-dim); line-height: 1.5; }
  .sev-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }
  .rec-list { display: flex; flex-direction: column; gap: 12px; }
  .rec-item { display: flex; gap: 14px; align-items: flex-start; }
  .rec-num { width: 26px; height: 26px; border-radius: 8px; background: rgba(99,102,241,0.18); border: 1px solid rgba(99,102,241,0.3); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #a5b4fc; flex-shrink: 0; }
  .rec-action { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 3px; }
  .rec-detail { font-size: 11px; color: var(--text-dim); line-height: 1.5; }
  .night-score-row { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
  .night-score-big { font-family: 'Space Grotesk', sans-serif; font-size: 52px; font-weight: 700; line-height: 1; }
  .night-score-meta { display: flex; flex-direction: column; gap: 4px; }
  .night-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.7px; color: var(--text-dim); }
  .night-status { font-size: 18px; font-weight: 700; }
  .factor-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
  .factor-row { display: flex; flex-direction: column; gap: 5px; }
  .factor-meta { display: flex; justify-content: space-between; align-items: center; }
  .factor-name { font-size: 12px; color: var(--text-muted); }
  .factor-val { font-size: 12px; font-weight: 600; font-family: 'Space Grotesk', sans-serif; }
  .night-advisory { font-size: 12px; color: var(--text-dim); line-height: 1.6; padding: 12px 14px; border-radius: 8px; background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.18); }
  .full-span { grid-column: 1 / -1; }

  /* loading */
  .loading-overlay { position: absolute; inset: 0; background: rgba(5,8,16,0.88); border-radius: var(--radius-sm); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; z-index: 10; }
  .spinner { width: 36px; height: 36px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-size: 13px; font-weight: 500; color: var(--text-muted); }

  /* ===== COMPARISON PANEL ===== */
  .compare-panel { padding: 28px; margin-bottom: 28px; }
  .compare-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
  .compare-title { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 700; color: var(--text); }
  .compare-badge { padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .winner-banner {
    border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;
    display: flex; align-items: center; gap: 20px;
    background: linear-gradient(135deg, rgba(34,197,94,0.1), rgba(6,182,212,0.07));
    border: 1px solid rgba(34,197,94,0.25);
  }
  .winner-trophy { font-size: 40px; flex-shrink: 0; }
  .winner-body {}
  .winner-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.7px; color: #4ade80; margin-bottom: 4px; }
  .winner-name { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 6px; }
  .winner-reason { font-size: 13px; color: var(--text-muted); line-height: 1.6; }

  .compare-grid { display: grid; grid-template-columns: 1fr auto 1fr; gap: 0; align-items: stretch; }
  .compare-col { display: flex; flex-direction: column; gap: 0; }
  .compare-col-header { padding: 14px 18px; border-radius: 10px 10px 0 0; display: flex; align-items: center; justify-content: space-between; }
  .compare-col-label { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 700; }
  .compare-col-score { font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; }

  .compare-divider { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0; padding: 0 18px; }
  .vs-circle { width: 36px; height: 36px; border-radius: 50%; background: rgba(99,102,241,0.2); border: 1px solid rgba(99,102,241,0.4); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #a5b4fc; flex-shrink: 0; }
  .vs-line { width: 1px; flex: 1; background: var(--border); }

  .compare-metric-row { display: grid; grid-template-columns: 1fr auto 1fr; }
  .compare-metric-a { padding: 12px 18px; border-bottom: 1px solid var(--border); border-right: none; }
  .compare-metric-b { padding: 12px 18px; border-bottom: 1px solid var(--border); }
  .compare-metric-mid { padding: 12px 0; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: center; width: 72px; background: rgba(99,102,241,0.04); }
  .compare-metric-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--text-dim); font-weight: 600; margin-bottom: 3px; }
  .compare-metric-val { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 700; }
  .compare-metric-mid-label { font-size: 10px; font-weight: 600; color: var(--text-dim); text-align: center; }
  .compare-bar-row { display: flex; align-items: center; gap: 6px; margin-top: 5px; }
  .compare-bar { flex: 1; height: 3px; border-radius: 999px; background: rgba(255,255,255,0.07); overflow: hidden; }
  .compare-bar-fill { height: 100%; border-radius: 999px; }
  .winner-col { outline: 2px solid rgba(34,197,94,0.4); outline-offset: -1px; border-radius: 10px; }

  .key-diff { margin-top: 20px; }
  .key-diff-title { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: var(--text-dim); margin-bottom: 12px; }
  .diff-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  @media(max-width: 700px) { .diff-list { grid-template-columns: 1fr; } }
  .diff-item { padding: 12px 14px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); }
  .diff-item-label { font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 3px; }
  .diff-item-val { font-size: 12px; color: var(--text-dim); line-height: 1.5; }

  footer { text-align: center; padding: 28px 32px; font-size: 12px; color: var(--text-dim); border-top: 1px solid var(--border); margin-top: 40px; }
`;

function GaugeArc({ score, color }) {
  const r = 44, total = Math.PI * r;
  const fill = (score / 100) * total;
  return (
    <svg width="108" height="64" viewBox="0 0 108 64" style={{ overflow: "visible" }}>
      <path d="M 10 54 A 44 44 0 0 1 98 54" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" strokeLinecap="round" />
      <path d="M 10 54 A 44 44 0 0 1 98 54" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={`${fill} ${total}`} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
    </svg>
  );
}

function gradientForScore(s) { return s >= 75 ? "#22c55e" : s >= 50 ? "#f59e0b" : "#ef4444"; }

// ---- Mini uploader component ----
function MiniUploader({ label, color, preview, file, analyzed, loading, dragging, onDragOver, onDragLeave, onDrop, onFileChange, onClear, onAnalyze, onReset, fileInputRef, isSecond }) {
  return (
    <div className="upload-single">
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <span className="img-tag" style={{ background: `${color}18`, border: `1px solid ${color}44`, color }}>
          {isSecond ? "⚡" : "📍"} {label}
        </span>
        {isSecond && <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>optional · compare</span>}
      </div>

      {!preview ? (
        <div
          className={`drop-zone${dragging ? " drag-over" : ""}`}
          style={{ padding: "20px 12px" }}
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <div className="drop-icon" style={{ fontSize: "22px", marginBottom: "6px" }}>📸</div>
          <div className="drop-title" style={{ fontSize: "12px" }}>Drop image here</div>
          <div className="drop-sub" style={{ fontSize: "10px" }}>or click to choose</div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden-input" onChange={onFileChange} />
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          {loading && (
            <div className="loading-overlay" style={{ borderRadius: "var(--radius-sm)" }}>
              <div className="spinner" />
              <div className="loading-text" style={{ fontSize: "11px" }}>Scanning…</div>
            </div>
          )}
          <div className="preview-wrap">
            <img src={preview} alt={label} className="preview-img" />
            <div className="preview-overlay">
              <span className="preview-name">{file?.name}</span>
              {analyzed && <span className="preview-tag">✓ Done</span>}
            </div>
            <button className="clear-btn" onClick={(e) => { e.stopPropagation(); onClear(); }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Analysis panels for one image ----
function AnalysisPanels({ d }) {
  return (
    <div className="bottom-grid">
      {/* ... (AI Verdict panel remains the same) ... */}

      <div className="glass panel">
        <div className="panel-header">
          <div className="panel-title"><div className="panel-title-icon" style={{ background: "rgba(239,68,68,0.15)" }}>⚠️</div>Detected Issues</div>
          <div className="panel-desc">{d.issues.length} hazards identified</div>
        </div>
        <div className="issue-list">
          {d.issues.map((iss) => (
            <div className="issue-item" key={iss.id}>
              <span className="issue-emoji">{iss.icon}</span>
              <div className="issue-body">
                {/* FIX: Target iss.label instead of iss */}
                <div className="issue-label">{iss.label}</div> 
                {/* FIX: Target iss.detail instead of iss */}
                <div className="issue-detail">{iss.detail}</div>
              </div>
              <div className="sev-dot" style={{ background: SEV_COLORS[iss.severity], boxShadow: `0 0 6px ${SEV_COLORS[iss.severity]}` }} />
            </div>
          ))}
        </div>
      </div>

      <div className="glass panel">
        <div className="panel-header">
          <div className="panel-title"><div className="panel-title-icon" style={{ background: "rgba(34,197,94,0.15)" }}>✅</div>Recommendations</div>
          <div className="panel-desc">Prioritized actions to improve safety</div>
        </div>
        <div className="rec-list">
          {d.recommendations.map((r) => (
            <div className="rec-item" key={r.id}>
              <div className="rec-num">{r.id}</div>
              <div>
                {/* FIX: Target r.action instead of r */}
                <div className="rec-action">{r.action}</div>
                {/* FIX: Target r.detail instead of r */}
                <div className="rec-detail">{r.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass panel">
        <div className="panel-header">
          <div className="panel-title"><div className="panel-title-icon" style={{ background: "rgba(34,197,94,0.15)" }}>✅</div>Recommendations</div>
          <div className="panel-desc">Prioritized actions to improve safety</div>
        </div>
        <div className="rec-list">
          {d.recommendations.map((r) => (
            <div className="rec-item" key={r.id}>
              <div className="rec-num">{r.id}</div>
              <div><div className="rec-action">{r.action}</div><div className="rec-detail">{r.detail}</div></div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass panel full-span">
        <div className="panel-header">
          <div className="panel-title"><div className="panel-title-icon" style={{ background: "rgba(139,92,246,0.2)" }}>🌙</div>Night Safety Analysis</div>
          <div className="panel-desc">Visibility and risk factors under low-light conditions</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "32px", alignItems: "start" }}>
          <div className="night-score-row" style={{ margin: 0 }}>
            <div><div className="night-label">Night Score</div><div className="night-score-big" style={{ color: d.nightSafety.color }}>{d.nightSafety.score}</div></div>
            <div className="night-score-meta"><span className="night-label">Status</span><span className="night-status" style={{ color: d.nightSafety.color }}>{d.nightSafety.label}</span></div>
          </div>
          <div>
            <div className="factor-list">
              {d.nightSafety.factors.map((f) => (
                <div className="factor-row" key={f.label}>
                  <div className="factor-meta"><span className="factor-name">{f.label}</span><span className="factor-val" style={{ color: f.color }}>{f.value}%</span></div>
                  <div className="progress-bar" style={{ marginTop: 0 }}><div className="progress-fill" style={{ width: `${f.value}%`, background: f.color }} /></div>
                </div>
              ))}
            </div>
            <div className="night-advisory">{d.nightSafety.advisory}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Comparison panel ----
function ComparePanel({ dA, dB }) {
  const aWins = dA.safetyScore >= dB.safetyScore;
  const winner = aWins ? dA : dB;
  const loser = aWins ? dB : dA;
  const diff = Math.abs(dA.safetyScore - dB.safetyScore);

  const metrics = [
    { label: "Safety Score", aVal: dA.safetyScore, bVal: dB.safetyScore, suffix: "", max: 100 },
    { label: "Visibility Index", aVal: dA.visibilityIndex, bVal: dB.visibilityIndex, suffix: "%", max: 100 },
    { label: "Night Safety", aVal: dA.nightSafety.score, bVal: dB.nightSafety.score, suffix: "", max: 100 },
    { label: "Issues Found", aVal: dA.issues.length, bVal: dB.issues.length, suffix: "", max: 10, lowerIsBetter: true },
    { label: "Risk Level", aVal: dA.riskLevel, bVal: dB.riskLevel, suffix: "", isText: true },
    { label: "Blind Spot", aVal: dA.blindSpotSeverity, bVal: dB.blindSpotSeverity, suffix: "", isText: true },
  ];

  const keyDiffs = [
    { label: "Score Advantage", val: `${winner.label} scores ${diff} points higher overall` },
    { label: "Issues Ratio", val: `${winner.label} has ${Math.abs(dA.issues.length - dB.issues.length)} fewer detected hazard${Math.abs(dA.issues.length - dB.issues.length) !== 1 ? "s" : ""}` },
    { label: "Night Visibility", val: `${dA.nightSafety.score > dB.nightSafety.score ? dA.label : dB.label} is safer after dark by ${Math.abs(dA.nightSafety.score - dB.nightSafety.score)} points` },
    { label: "Pedestrian Risk", val: `${winner.label} shows ${winner.riskLevel.toLowerCase()} risk vs ${loser.riskLevel.toLowerCase()} risk` },
  ];

  return (
    <div className="glass compare-panel" style={{ marginBottom: "28px" }}>
      <div className="compare-header">
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#a855f7)", display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>⚖️</div>
        <div className="compare-title">Head-to-Head Comparison</div>
        <span className="compare-badge" style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc" }}>2 Images · AI Analysis</span>
      </div>

      {/* Winner banner */}
      <div className="winner-banner">
        <div className="winner-trophy">🏆</div>
        <div className="winner-body">
          <div className="winner-label">Safer Location</div>
          <div className="winner-name">{winner.label} is the Safer Street</div>
          <div className="winner-reason">
            With a safety score of <strong style={{ color: "#4ade80" }}>{winner.safetyScore}/100</strong> vs {loser.safetyScore}/100,{" "}
            {winner.label} demonstrates {winner.riskLevel.toLowerCase()} risk levels, {winner.issues.length} detected issue{winner.issues.length !== 1 ? "s" : ""},
            and a night safety score of {winner.nightSafety.score} — making it the significantly safer option for pedestrians and drivers alike.
          </div>
        </div>
      </div>

      {/* Metric comparison table */}
      <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
        {/* Column headers */}
        <div className="compare-metric-row">
          <div className="compare-metric-a compare-col-header" style={{ background: `rgba(99,102,241,0.1)`, borderRadius: 0, padding: "14px 18px" }}>
            <span className="compare-col-label" style={{ color: "#a5b4fc" }}>📍 {dA.label}</span>
            <span className="compare-col-score" style={{ color: gradientForScore(dA.safetyScore) }}>{dA.safetyScore}</span>
          </div>
          <div className="compare-metric-mid" style={{ background: "rgba(99,102,241,0.06)", borderBottom: "1px solid var(--border)", width: 72 }}>
            <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Metric</span>
          </div>
          <div className="compare-metric-b compare-col-header" style={{ background: `rgba(139,92,246,0.1)`, borderRadius: 0, padding: "14px 18px", flexDirection:"row-reverse" }}>
            <span className="compare-col-score" style={{ color: gradientForScore(dB.safetyScore) }}>{dB.safetyScore}</span>
            <span className="compare-col-label" style={{ color: "#c4b5fd" }}>⚡ {dB.label}</span>
          </div>
        </div>

        {metrics.map((m, i) => {
          const aBetter = m.lowerIsBetter ? m.aVal <= m.bVal : (!m.isText && m.aVal >= m.bVal);
          const aColor = m.isText ? (m.aVal === winner.riskLevel || m.aVal === winner.blindSpotSeverity ? "#22c55e" : "#f59e0b") : gradientForScore(m.lowerIsBetter ? 100 - (m.aVal / m.max) * 100 : (m.aVal / m.max) * 100);
          const bColor = m.isText ? (m.bVal === winner.riskLevel || m.bVal === winner.blindSpotSeverity ? "#22c55e" : "#f59e0b") : gradientForScore(m.lowerIsBetter ? 100 - (m.bVal / m.max) * 100 : (m.bVal / m.max) * 100);
          return (
            <div className="compare-metric-row" key={m.label}>
              <div className="compare-metric-a" style={{ background: !m.isText && aBetter ? "rgba(34,197,94,0.04)" : "transparent" }}>
                <div className="compare-metric-label">{m.label}</div>
                <div className="compare-metric-val" style={{ color: aColor }}>{m.aVal}{m.suffix}</div>
                {!m.isText && (
                  <div className="compare-bar-row">
                    <div className="compare-bar"><div className="compare-bar-fill" style={{ width: `${(m.aVal / m.max) * 100}%`, background: aColor }} /></div>
                    {!m.isText && aBetter && <span style={{ fontSize: "9px", color: "#4ade80", fontWeight: 700 }}>✓</span>}
                  </div>
                )}
              </div>
              <div className="compare-metric-mid"><span className="compare-metric-mid-label">{m.label.split(" ")[0]}</span></div>
              <div className="compare-metric-b" style={{ background: !m.isText && !aBetter ? "rgba(34,197,94,0.04)" : "transparent", textAlign: "right" }}>
                <div className="compare-metric-label">{m.label}</div>
                <div className="compare-metric-val" style={{ color: bColor }}>{m.bVal}{m.suffix}</div>
                {!m.isText && (
                  <div className="compare-bar-row" style={{ flexDirection: "row-reverse" }}>
                    <div className="compare-bar"><div className="compare-bar-fill" style={{ width: `${(m.bVal / m.max) * 100}%`, background: bColor, marginLeft: "auto" }} /></div>
                    {!m.isText && !aBetter && <span style={{ fontSize: "9px", color: "#4ade80", fontWeight: 700 }}>✓</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Key differences */}
      <div className="key-diff">
        <div className="key-diff-title">Key Differences</div>
        <div className="diff-list">
          {keyDiffs.map((kd) => (
            <div className="diff-item" key={kd.label}>
              <div className="diff-item-label">{kd.label}</div>
              <div className="diff-item-val">{kd.val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== MAIN APP ==========
export default function App() {
  // Image A state
  const [fileA, setFileA] = useState(null);
  const [previewA, setPreviewA] = useState(null);
  const [loadingA, setLoadingA] = useState(false);
  const [analyzedA, setAnalyzedA] = useState(false);
  const [dragA, setDragA] = useState(false);
  const refA = useRef();
  const [dataA, setDataA] = useState(null); // will hold the actual API response
  const [dataB, setDataB] = useState(null); 
  
  // Image B state
  const [fileB, setFileB] = useState(null);
  const [previewB, setPreviewB] = useState(null);
  const [loadingB, setLoadingB] = useState(false);
  const [analyzedB, setAnalyzedB] = useState(false);
  const [dragB, setDragB] = useState(false);
  const refB = useRef();

  const handleFileA = (f) => { if (!f) return; setFileA(f); setPreviewA(URL.createObjectURL(f)); setAnalyzedA(false); };
  const handleFileB = (f) => { if (!f) return; setFileB(f); setPreviewB(URL.createObjectURL(f)); setAnalyzedB(false); };

  const clearA = () => { setFileA(null); setPreviewA(null); setAnalyzedA(false); setFileB(null); setPreviewB(null); setAnalyzedB(false); };
  const clearB = () => { setFileB(null); setPreviewB(null); setAnalyzedB(false); };

  // Maps raw backend response to the UI data shape
  const mapBackendToUI = (apiData, label) => {
    const score = apiData.score ?? 0;
    const nightScore = apiData.night_score ?? 0;
    const nightStatus = apiData.night_status ?? "🔴 Avoid if Possible";
    const brightness = apiData.brightness ?? 0;
    const persons = apiData.persons ?? 0;
    const cars = apiData.cars ?? 0;
    const trafficLights = apiData.traffic_lights ?? 0;
    const issues = apiData.issues ?? [];
    const recommendations = apiData.recommendations ?? [];

    let riskLevel = "High";
    let riskColor = "#ef4444";
    if (score >= 80) { riskLevel = "Low"; riskColor = "#22c55e"; }
    else if (score >= 60) { riskLevel = "Moderate"; riskColor = "#f59e0b"; }

    // Visibility: brightness-based (0-255 → 0-100)
    const visibilityIndex = Math.min(100, Math.round((brightness / 255) * 100));

    // Blind spot severity based on persons and traffic lights
    let blindSpotSeverity = "High";
    let severityColor = "#ef4444";
    if (persons >= 5 && trafficLights >= 2) { blindSpotSeverity = "Low"; severityColor = "#22c55e"; }
    else if (persons >= 2 || trafficLights >= 1) { blindSpotSeverity = "Medium"; severityColor = "#f59e0b"; }

    const nightStatusLabel = nightStatus.includes("Safe") ? "Good" : nightStatus.includes("Caution") ? "Fair" : "Poor";
    const nightColor = nightStatus.includes("Safe") ? "#22c55e" : nightStatus.includes("Caution") ? "#f59e0b" : "#ef4444";

    return {
      label,
      safetyScore: score,
      riskLevel,
      riskColor,
      visibilityIndex,
      blindSpotSeverity,
      severityColor,
      aiVerdict: `Safety analysis complete. Detected ${persons} person(s), ${cars} car(s), and ${trafficLights} traffic light(s). Brightness level: ${Math.round(brightness)}/255. ${issues[0] ?? "No major safety concerns detected."}`,
      issues: issues.map((iss, idx) => ({
        id: idx + 1,
        icon: iss.includes("lighting") ? "💡" : iss.includes("pedestrian") ? "👥" : iss.includes("traffic") ? "🚦" : "⚠️",
        label: iss,
        detail: "",
        severity: score < 60 ? "high" : score < 80 ? "medium" : "low",
      })),
      recommendations: recommendations.map((rec, idx) => ({
        id: idx + 1,
        action: rec,
        detail: "",
      })),
      nightSafety: {
        score: nightScore,
        label: nightStatusLabel,
        color: nightColor,
        factors: [
          { label: "Street Light Coverage", value: visibilityIndex, color: nightColor },
          { label: "Pedestrian Activity", value: Math.min(100, persons * 10), color: nightColor },
          { label: "Traffic Infrastructure", value: Math.min(100, trafficLights * 25), color: nightColor },
          { label: "Overall Safety", value: score, color: nightColor },
        ],
        advisory: nightStatus,
      },
    };
  };

  const analyze = async () => {
    if (!previewA) return;
    setLoadingA(true);
    if (previewB) setLoadingB(true);

    try {
      // --- Analyze Image A ---
      const formA = new FormData();
      formA.append("file", fileA);
      const resA = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formA,
      });
      if (!resA.ok) throw new Error("Backend error for Image A");
      const apiDataA = await resA.json();
      setDataA(mapBackendToUI(apiDataA, "Image A"));
      setAnalyzedA(true);

      // --- Analyze Image B (if present) ---
      if (fileB) {
        const formB = new FormData();
        formB.append("file", fileB);
        const resB = await fetch("http://localhost:8000/analyze", {
          method: "POST",
          body: formB,
        });
        if (!resB.ok) throw new Error("Backend error for Image B");
        const apiDataB = await resB.json();
        setDataB(mapBackendToUI(apiDataB, "Image B"));
        setAnalyzedB(true);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      alert("Could not connect to backend at http://localhost:8000/analyze\n\nMake sure your FastAPI server is running.");
    } finally {
      setLoadingA(false);
      setLoadingB(false);
    }
  };

  const bothAnalyzed = analyzedA && analyzedB;
  // Use real API data when available, fall back to mock only as placeholder shape
  const d = dataA ?? mockDataA;

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <header className="header">
          <div className="header-icon">🛑</div>
          <div>
            <div className="header-title">Urban Blind Spot Detector</div>
            <div className="header-sub">AI Powered Street Safety Intelligence</div>
          </div>
          <div className="header-badge"><span className="pulse" />Live Analysis</div>
        </header>

        <main className="main">
          <div className="top-grid">
            {/* LEFT: Upload area */}
            <div className="glass upload-card">
              <div className="card-label"><span className="card-label-dot" />Image Upload</div>

              {/* Always show A; show B slot only after A is uploaded */}
              <div className={previewA ? "upload-pair" : ""}>
                <MiniUploader
                  label="Image A" color="#6366f1" isSecond={false}
                  preview={previewA} file={fileA} analyzed={analyzedA} loading={loadingA} dragging={dragA}
                  onDragOver={(e) => { e.preventDefault(); setDragA(true); }}
                  onDragLeave={() => setDragA(false)}
                  onDrop={(e) => { e.preventDefault(); setDragA(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith("image/")) handleFileA(f); }}
                  onFileChange={(e) => handleFileA(e.target.files[0])}
                  onClear={clearA}
                  fileInputRef={refA}
                />

                {/* Second slot — only visible after image A is uploaded */}
                {previewA && (
                  <MiniUploader
                    label="Image B" color="#a855f7" isSecond={true}
                    preview={previewB} file={fileB} analyzed={analyzedB} loading={loadingB} dragging={dragB}
                    onDragOver={(e) => { e.preventDefault(); setDragB(true); }}
                    onDragLeave={() => setDragB(false)}
                    onDrop={(e) => { e.preventDefault(); setDragB(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith("image/")) handleFileB(f); }}
                    onFileChange={(e) => handleFileB(e.target.files[0])}
                    onClear={clearB}
                    fileInputRef={refB}
                  />
                )}
              </div>

              {/* Hint when only A is uploaded but no B yet */}
              {previewA && !previewB && !analyzedA && (
                <div className="second-slot-hint">
                  💡 Add a second image above to compare two locations side-by-side
                </div>
              )}

              {previewA && !analyzedA && (
                <button className="analyze-btn" onClick={analyze}>
                  {previewB ? "Analyze & Compare Both →" : "Run Safety Analysis →"}
                </button>
              )}

              {analyzedA && (
                <button className="analyze-btn" style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", marginTop: "14px" }}
                  onClick={clearA}>Upload New Image(s)</button>
              )}
            </div>

            {/* RIGHT: Metrics (always for Image A) */}
            <div className="metrics-col">
              <div className="glass metric-card">
                <div className="metric-top">
                  <div className="metric-name">Safety Score {bothAnalyzed && <span style={{ color: "#6366f1" }}>· Image A</span>}</div>
                  <span className="metric-icon">🛡️</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "16px" }}>
                  <div>
                    <div className="metric-value" style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {analyzedA ? d.safetyScore : "--"}
                    </div>
                    <div className="metric-sub">out of 100</div>
                  </div>
                  {analyzedA && <GaugeArc score={d.safetyScore} color={gradientForScore(d.safetyScore)} />}
                </div>
                {analyzedA && <div className="progress-bar"><div className="progress-fill" style={{ width: `${d.safetyScore}%`, background: "linear-gradient(90deg,#3b82f6,#8b5cf6)" }} /></div>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="glass metric-card">
                  <div className="metric-top"><div className="metric-name">Risk Level</div><span className="metric-icon">⚠️</span></div>
                  <div className="metric-value" style={{ fontSize: "24px", color: analyzedA ? d.riskColor : "var(--text-dim)" }}>{analyzedA ? d.riskLevel : "—"}</div>
                  {analyzedA && <div className="risk-badge" style={{ background: `${d.riskColor}18`, border: `1px solid ${d.riskColor}44`, color: d.riskColor, marginTop: "8px" }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: d.riskColor, display: "inline-block" }} />Active</div>}
                </div>
                <div className="glass metric-card">
                  <div className="metric-top"><div className="metric-name">Visibility</div><span className="metric-icon">👁️</span></div>
                  <div className="metric-value" style={{ fontSize: "28px", color: analyzedA ? gradientForScore(d.visibilityIndex) : "var(--text-dim)" }}>{analyzedA ? `${d.visibilityIndex}%` : "—"}</div>
                  {analyzedA && <div className="progress-bar"><div className="progress-fill" style={{ width: `${d.visibilityIndex}%`, background: "linear-gradient(90deg,#06b6d4,#6366f1)" }} /></div>}
                </div>
              </div>

              <div className="glass metric-card">
                <div className="metric-top"><div className="metric-name">Blind Spot Severity</div><span className="metric-icon">🔴</span></div>
                {analyzedA ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div className="metric-value" style={{ fontSize: "22px", color: d.severityColor }}>{d.blindSpotSeverity}</div>
                    <div style={{ flex: 1 }}>
                      {["Low", "Medium", "High"].map((l) => (
                        <div key={l} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <div style={{ flex: 1, height: "4px", borderRadius: "999px", background: d.blindSpotSeverity === l ? SEV_COLORS[l.toLowerCase()] : "rgba(255,255,255,0.07)" }} />
                          <span style={{ fontSize: "10px", color: d.blindSpotSeverity === l ? SEV_COLORS[l.toLowerCase()] : "var(--text-dim)", fontWeight: 600, width: 40 }}>{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <div className="metric-value" style={{ fontSize: "22px", color: "var(--text-dim)" }}>—</div>}
              </div>
            </div>
          </div>

          {/* COMPARISON PANEL — only when both analyzed */}
          {bothAnalyzed && <ComparePanel dA={dataA ?? mockDataA} dB={dataB ?? mockDataB} />}

          {/* ANALYSIS PANELS — always for image A when analyzed */}
          {analyzedA && <AnalysisPanels d={dataA ?? mockDataA} />}

          {!analyzedA && !previewA && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-dim)", fontSize: "13px" }}>
              Upload a street photo above to begin the safety analysis.<br />
              <span style={{ fontSize: "11px", marginTop: "6px", display: "block" }}>Optionally add a second image to compare two locations.</span>
            </div>
          )}
        </main>

        <footer>Urban Blind Spot Detector · AI Street Safety Intelligence · Mock Data Demo</footer>
      </div>
    </>
  );
}
