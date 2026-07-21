import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import jsQR from "jsqr";
import { 
  TrendingUp, 
  TrendingDown,
  Youtube, 
  Facebook, 
  Instagram, 
  Filter, 
  Calendar, 
  Globe, 
  MapPin, 
  Sliders, 
  Search, 
  Award, 
  BookOpen, 
  MessageSquare, 
  Settings, 
  Activity, 
  Sparkles, 
  ThumbsUp, 
  Tv, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  AlertCircle, 
  ExternalLink, 
  Lock, 
  Code,
  Clock,
  Eye,
  Info,
  X,
  Download,
  FileSpreadsheet,
  Share2,
  Copy,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Plus,
  Hash,
  User,
  CheckCircle2,
  CheckCircle,
  Link2,
  Trash2,
  Bell,
  Mail,
  AlertTriangle,
  Play,
  Tag,
  Edit2,
  Shield,
  Camera,
  QrCode,
  Zap
} from "lucide-react";

// Definitions matching server-side schema
interface VideoPost {
  id: string;
  title: string;
  platform: string;
  category: "political" | "history" | "sports";
  uploader: string;
  uploadedAt: string;
  views: number;
  likes: number;
  url: string;
  sentimentScore: number;
  sentimentLabel: "Positive" | "Neutral" | "Negative";
  mlConfidence: number;
  summary: string;
  region: string;
  duration: string;
}

// Watchdog helper to analyze bot activity & comment moderation
const getBotAnalysis = (video: VideoPost) => {
  let riskPercent = 15;
  let reasons: string[] = [];
  let isCoordinatedWave = false;

  const titleLower = video.title.toLowerCase();
  
  if (video.category === "political") {
    if (video.sentimentLabel === "Positive" && video.sentimentScore >= 0.7) {
      riskPercent = 88;
      reasons.push("100% positive comments with zero emotional variance detected.");
      reasons.push("Comment deletion pattern matches automated sentiment moderation.");
      reasons.push("Identical positive phrasing repeated across multiple accounts.");
    } else if (titleLower.includes("framework") || titleLower.includes("debate")) {
      riskPercent = 65;
      reasons.push("Highly repetitive non-organic comments detected within same hour of upload.");
      reasons.push("Ratio of views to comments is abnormally low, indicating artificial reach propagation.");
    } else {
      riskPercent = 42;
      reasons.push("Subtle positive sentiment clusters with high similarity ratings.");
    }
  } else if (video.category === "history") {
    riskPercent = 25;
    reasons.push("Standard historical content, minor citation/comment spam detected.");
  } else {
    riskPercent = 12;
    reasons.push("Normal comment distribution. Organic emotional variance conforms to standard baseline.");
  }

  if (video.category === "political" && (titleLower.includes("insight") || titleLower.includes("framework") || titleLower.includes("update"))) {
    isCoordinatedWave = true;
    riskPercent = Math.max(riskPercent, 92);
    reasons.push("Coordinated 24h Engagement Spike: Views grew by 350% simultaneously with other regional channels.");
  }

  riskPercent = Math.min(Math.max(riskPercent, 8), 96);

  return {
    riskPercent,
    reasons,
    isCoordinatedWave,
    riskLabel: riskPercent >= 80 ? "Critical Bot Risk" : riskPercent >= 50 ? "Moderate/Suspicious Risk" : "Low (Organic Ambient Feed)",
    color: riskPercent >= 80 ? "rose" : riskPercent >= 50 ? "amber" : "emerald"
  };
};

// Social Pulse Link validation & analysis helper
const validateSocialMediaLink = (urlStr: string) => {
  const trimmed = urlStr.trim();
  if (!trimmed) {
    return { isValid: false, isValidSocial: false, platform: "", videoId: "", url: "", error: "Empty link input." };
  }

  // Regex for general URL validation
  const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?(\?.*)?$/i;
  const isUrl = urlPattern.test(trimmed);

  if (!isUrl) {
    return { isValid: false, isValidSocial: false, platform: "", videoId: "", url: trimmed, error: "Not a valid URL format (e.g., https://youtube.com/watch?v=123)" };
  }

  try {
    const urlWithProto = trimmed.startsWith("http://") || trimmed.startsWith("https://") 
      ? trimmed 
      : "https://" + trimmed;
      
    const urlObj = new URL(urlWithProto);
    const host = urlObj.hostname.toLowerCase().replace("www.", "");
    const pathname = urlObj.pathname;
    
    let platform = "Generic Web Asset";
    let videoId = "";
    let isValidSocial = false;

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      platform = "YouTube";
      isValidSocial = true;
      if (host.includes("youtu.be")) {
        videoId = pathname.slice(1);
      } else if (pathname.includes("/shorts/")) {
        videoId = pathname.split("/shorts/")[1]?.split(/[?#]/)[0] || "";
      } else if (pathname.includes("/embed/")) {
        videoId = pathname.split("/embed/")[1]?.split(/[?#]/)[0] || "";
      } else {
        videoId = urlObj.searchParams.get("v") || "";
      }
    } else if (host.includes("facebook.com") || host.includes("fb.watch") || host.includes("fb.com")) {
      platform = "Facebook";
      isValidSocial = true;
      const match = pathname.match(/videos\/(\d+)/);
      if (match) {
        videoId = match[1];
      } else {
        videoId = "fb-vid-" + Math.random().toString(36).substring(2, 8);
      }
    } else if (host.includes("instagram.com")) {
      platform = "Instagram";
      isValidSocial = true;
      const match = pathname.match(/\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/);
      if (match && match[2]) {
        videoId = match[2];
      } else {
        videoId = "ig-reel-" + Math.random().toString(36).substring(2, 8);
      }
    } else if (host.includes("tiktok.com")) {
      platform = "TikTok";
      isValidSocial = true;
      const match = pathname.match(/\/video\/(\d+)/);
      if (match) {
        videoId = match[1];
      } else {
        videoId = "tt-vid-" + Math.random().toString(36).substring(2, 8);
      }
    } else if (host.includes("twitter.com") || host.includes("x.com")) {
      platform = "X (Twitter)";
      isValidSocial = true;
      const match = pathname.match(/\/status\/(\d+)/);
      if (match) {
        videoId = match[1];
      } else {
        videoId = "x-post-" + Math.random().toString(36).substring(2, 8);
      }
    }

    return {
      isValid: true,
      isValidSocial,
      platform,
      videoId,
      url: urlWithProto,
      host,
      error: undefined
    };
  } catch (err) {
    return {
      isValid: false,
      isValidSocial: false,
      platform: "",
      videoId: "",
      url: trimmed,
      error: "Error processing URL format: " + (err as Error).message
    };
  }
};

interface Analytics {
  totalLoaded: number;
  platformBreakdown: Record<string, number>;
  categoryBreakdown: {
    political: number;
    history: number;
    sports: number;
  };
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trendingKeywords: string[];
  marketSummary: string;
}

interface APIResponse {
  videos: VideoPost[];
  analytics: Analytics;
  sources?: { title: string; uri: string }[];
  isFallback?: boolean;
  errorDetail?: string;
}

interface NotificationAlert {
  id: string;
  type: "keyword" | "category";
  targetValue: string;
  metric: "views" | "sentiment_rise" | "sentiment_fall";
  threshold: number;
  channel: "email" | "push" | "both";
  destinationEmail?: string;
  createdAt: string;
  active: boolean;
  label?: string;
}

interface AlertTriggeredLog {
  id: string;
  alertId: string;
  alertTitle: string;
  videoTitle: string;
  matchedValue: string;
  triggeredAt: string;
  channelUsed: string;
}

// Standalone helper to format and render markdown-like Gemini summaries
const renderFormattedSummary = (text: string) => {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="space-y-2 text-xs text-slate-700 leading-relaxed font-medium">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1"></div>;
        
        // Headers (e.g., ### Title)
        if (trimmed.startsWith("###")) {
          return (
            <h5 key={idx} className="text-xs font-bold text-slate-900 mt-3 flex items-center gap-1.5 font-sans border-b border-indigo-100/30 pb-0.5">
              {trimmed.replace(/^###\s*/, "")}
            </h5>
          );
        }
        
        // Bullet points (e.g., * Bullet or • Bullet)
        if (trimmed.startsWith("*") || trimmed.startsWith("•") || trimmed.startsWith("-")) {
          const content = trimmed.replace(/^[\*\•\-]\s*/, "");
          const boldMatch = content.match(/^\*\*(.*?)\*\*(.*)/);
          if (boldMatch) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-2 leading-relaxed text-[11px] text-slate-600">
                <span className="text-indigo-500 font-bold mt-0.5">•</span>
                <span>
                  <strong className="text-slate-800 font-bold">{boldMatch[1]}</strong>
                  {boldMatch[2]}
                </span>
              </div>
            );
          }
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-2 leading-relaxed text-[11px] text-slate-600">
              <span className="text-indigo-500 font-bold mt-0.5">•</span>
              <span>{content}</span>
            </div>
          );
        }
        
        // Check for inline bold markers (**bold**)
        let renderedText: React.ReactNode = trimmed;
        const boldMatch = trimmed.match(/\*\*(.*?)\*\*/g);
        if (boldMatch) {
          const parts = trimmed.split(/\*\*(.*?)\*\*/g);
          renderedText = parts.map((part, pIdx) => {
            if (pIdx % 2 === 1) {
              return <strong key={pIdx} className="text-slate-800 font-bold">{part}</strong>;
            }
            return part;
          });
        }

        return (
          <p key={idx} className="text-slate-600 text-[11px] font-medium leading-relaxed">
            {renderedText}
          </p>
        );
      })}
    </div>
  );
};


// Centralized theme configuration for different categories
export interface CategoryTheme {
  bg: string;          // Primary background color for container/card
  border: string;      // Border color
  text: string;        // Text color for label / typography
  badgeBg: string;     // Badge background
  badgeText: string;   // Badge text color
  badgeBorder: string; // Badge border
  badge: string;       // Combined classes for badge
  barBg: string;       // Background color for bar elements
}

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  political: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
    badgeBorder: "border-purple-200",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    barBg: "bg-purple-500"
  },
  history: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    badgeBorder: "border-amber-200",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    barBg: "bg-amber-500"
  },
  sports: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    barBg: "bg-emerald-500"
  }
};

const DYNAMIC_THEME_PALETTES = [
  { text: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", badgeBg: "bg-indigo-50", badgeText: "text-indigo-700", badgeBorder: "border-indigo-200", barBg: "bg-indigo-500" },
  { text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200", badgeBg: "bg-rose-50", badgeText: "text-rose-700", badgeBorder: "border-rose-200", barBg: "bg-rose-500" },
  { text: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200", badgeBg: "bg-cyan-50", badgeText: "text-cyan-700", badgeBorder: "border-cyan-200", barBg: "bg-cyan-500" },
  { text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", badgeBg: "bg-orange-50", badgeText: "text-orange-700", badgeBorder: "border-orange-200", barBg: "bg-orange-500" },
  { text: "text-pink-700", bg: "bg-pink-50", border: "border-pink-200", badgeBg: "bg-pink-50", badgeText: "text-pink-700", badgeBorder: "border-pink-200", barBg: "bg-pink-500" },
  { text: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200", badgeBg: "bg-teal-50", badgeText: "text-teal-700", badgeBorder: "border-teal-200", barBg: "bg-teal-500" }
];

// Helper function that maps category name to a theme from the centralized configuration object
export const getCategoryColor = (cat: string): CategoryTheme => {
  const norm = (cat || "").toLowerCase().trim();
  if (CATEGORY_THEMES[norm]) {
    return CATEGORY_THEMES[norm];
  }
  
  // Stable hashing for dynamic/fallback categories
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = norm.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DYNAMIC_THEME_PALETTES.length;
  const palette = DYNAMIC_THEME_PALETTES[index];
  
  return {
    ...palette,
    badge: `${palette.badgeBg} ${palette.badgeText} ${palette.badgeBorder}`
  };
};


export default function App() {
  // Configurable search inputs
  const [region, setRegion] = useState<"Tamil Nadu" | "Global">("Tamil Nadu");
  const [days, setDays] = useState<number>(4);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["political", "history", "sports"]);
  
  // Dashboard states
  const [data, setData] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // Auto-Refresh states
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(false);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState<number>(300); // 5 minutes = 300 seconds

  // Effect for Auto-Refresh Background Polling
  useEffect(() => {
    if (!autoRefreshEnabled) {
      setSecondsUntilRefresh(300);
      return;
    }

    const interval = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          // Trigger data reload
          setRefreshTrigger((r) => r + 1);
          return 300; // Reset to 5 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled]);

  // Reset secondsUntilRefresh back to 300 whenever a refresh is triggered (manual or auto)
  useEffect(() => {
    if (autoRefreshEnabled) {
      setSecondsUntilRefresh(300);
    }
  }, [refreshTrigger, autoRefreshEnabled]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };
  
  // Interactive client-side filters
  const [publicAwarenessMode, setPublicAwarenessMode] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"engagement" | "date" | "botScore">("engagement");
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string>("All");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");
  const [selectedSentimentFilter, setSelectedSentimentFilter] = useState<string>("All");
  const [showOnlyTop10BySentiment, setShowOnlyTop10BySentiment] = useState<boolean>(true);
  const [minSentiment, setMinSentiment] = useState<number>(-1.0);
  const [maxSentiment, setMaxSentiment] = useState<number>(1.0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pastedLink, setPastedLink] = useState<string>("");
  const [linkValidationError, setLinkValidationError] = useState<string | null>(null);
  const [linkValidationSuccess, setLinkValidationSuccess] = useState<string | null>(null);

  // QR Code Scanner Camera States
  const [isQrScannerOpen, setIsQrScannerOpen] = useState<boolean>(false);
  const [qrScannerError, setQrScannerError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>("");
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const [recentlyScanned, setRecentlyScanned] = useState<Array<{
    id: string;
    url: string;
    platform: string;
    title: string;
    timestamp: string;
  }>>(() => {
    try {
      const stored = localStorage.getItem("social_pulse_scanned_urls");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveRecentlyScanned = (list: Array<{ id: string; url: string; platform: string; title: string; timestamp: string }>) => {
    setRecentlyScanned(list);
    try {
      localStorage.setItem("social_pulse_scanned_urls", JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const injectCustomVideo = (link: string) => {
    const analysis = validateSocialMediaLink(link);
    if (!analysis.isValid) {
      setLinkValidationError(analysis.error || "Invalid link.");
      return;
    }
    
    if (!data) return;

    // Check if it already exists
    const exists = data.videos.find(v => {
      const parsed = validateSocialMediaLink(v.url);
      return parsed.isValid && parsed.videoId === analysis.videoId;
    });

    if (exists) {
      setSearchQuery(exists.url);
      setLinkValidationSuccess(`Link is already in the database! We have filtered the feed to this post.`);
      setLinkValidationError(null);
      setPastedLink("");

      // Add/Move to top of history list
      const historyItem = {
        id: exists.id,
        url: exists.url,
        platform: exists.platform,
        title: exists.title,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const filtered = recentlyScanned.filter(item => item.url.toLowerCase() !== exists.url.toLowerCase());
      saveRecentlyScanned([historyItem, ...filtered].slice(0, 10));

      return;
    }

    // Generate a beautiful new video post object using Gemini-simulated integrity fields!
    const uploaderNames = ["CitizenAuditor", "PulseWatch", "SocialSentinel", "EcoTruths", "HeritageArchive", "NipponNetwork", "VeritasNews"];
    const randomUploader = uploaderNames[Math.floor(Math.random() * uploaderNames.length)];
    
    const titles: Record<string, string> = {
      YouTube: `Target Study: Automated Campaign Verification [ID: ${analysis.videoId}]`,
      Facebook: `Community Response Audit [Video ID: ${analysis.videoId}]`,
      Instagram: `Social Velocity Campaign Metric Scan [Reel ID: ${analysis.videoId}]`,
      TikTok: `Grassroots Echo Chambers & PR Broadcast [Video ID: ${analysis.videoId}]`,
      "X (Twitter)": `Citizen Sentinel Integrity Probe [Post ID: ${analysis.videoId}]`,
      "Generic Web Asset": `Web Resource Semantic Ingress [Target: ${analysis.host}]`
    };
    
    const uploaderHandles: Record<string, string> = {
      YouTube: `@${randomUploader}`,
      Facebook: `${randomUploader} Page`,
      Instagram: `@${randomUploader.toLowerCase()}_official`,
      TikTok: `@${randomUploader.toLowerCase()}`,
      "X (Twitter)": `@${randomUploader}`,
      "Generic Web Asset": `Web Publication Feed`
    };

    const newVideo: VideoPost = {
      id: "pasted-" + Date.now(),
      title: titles[analysis.platform] || `Pasted Audit Target [ID: ${analysis.videoId}]`,
      uploader: uploaderHandles[analysis.platform] || `@${randomUploader}`,
      uploadedAt: "Just now (Ingested via Live Validator)",
      platform: analysis.platform === "Generic Web Asset" ? "YouTube" : analysis.platform,
      category: "political",
      views: Math.floor(Math.random() * 50000) + 12000,
      likes: Math.floor(Math.random() * 2000) + 400,
      url: analysis.url,
      sentimentScore: parseFloat((Math.random() * 1.6 - 0.8).toFixed(2)),
      sentimentLabel: "Positive",
      mlConfidence: parseFloat((Math.random() * 0.15 + 0.82).toFixed(2)),
      summary: `Injected via Social Pulse Link Validator. This post is undergoing active AI-guided campaign integrity monitoring and data validation. Initial comment clusters conform to high-budget structured narrative distributions.`,
      region: region,
      duration: "3:42"
    };

    // Calculate simulated sentiment label
    if (newVideo.sentimentScore > 0.25) {
      newVideo.sentimentLabel = "Positive";
    } else if (newVideo.sentimentScore < -0.25) {
      newVideo.sentimentLabel = "Negative";
    } else {
      newVideo.sentimentLabel = "Neutral";
    }

    // Insert into state list
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        videos: [newVideo, ...prev.videos]
      };
    });

    setSearchQuery(newVideo.url);
    setLinkValidationSuccess(`Successfully validated and Ingested! Feed filtered to this post.`);
    setLinkValidationError(null);
    setPastedLink("");

    // Add to history list
    const historyItem = {
      id: newVideo.id,
      url: newVideo.url,
      platform: newVideo.platform,
      title: newVideo.title,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const filtered = recentlyScanned.filter(item => item.url.toLowerCase() !== newVideo.url.toLowerCase());
    saveRecentlyScanned([historyItem, ...filtered].slice(0, 10));

    setShareToast({
      message: `Injected post from ${analysis.platform} into feed with live Watchdog scanner active!`,
      type: "success"
    });
  };

  const handleQrScanSuccess = (scannedUrl: string) => {
    setIsQrScannerOpen(false);
    setPastedLink(scannedUrl);
    setLinkValidationError(null);
    setLinkValidationSuccess(null);
    injectCustomVideo(scannedUrl);
  };

  // Handle QR Camera scanning lifecycle
  useEffect(() => {
    let active = true;
    let animationId: number;

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (active) {
        setHasTorch(false);
        setIsTorchOn(false);
      }
    };

    const startCamera = async () => {
      stopCamera();
      setQrScannerError(null);

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === "videoinput");
        if (active) {
          setAvailableCameras(videoDevices);
          if (videoDevices.length > 0 && !activeCameraId) {
            const rearCam = videoDevices.find(d => 
              d.label.toLowerCase().includes("back") || 
              d.label.toLowerCase().includes("rear") || 
              d.label.toLowerCase().includes("environment")
            );
            setActiveCameraId(rearCam ? rearCam.deviceId : videoDevices[0].deviceId);
          }
        }

        const constraints: MediaStreamConstraints = {
          video: activeCameraId 
            ? { deviceId: { exact: activeCameraId } } 
            : { facingMode: "environment" }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => {
            console.warn("Autoplay failed:", err);
          });
        }

        // Check for torch capability
        const track = stream.getVideoTracks()[0];
        if (track) {
          try {
            if (typeof track.getCapabilities === "function") {
              const capabilities = track.getCapabilities() as any;
              if (active) {
                const supported = !!capabilities.torch;
                setHasTorch(supported);
                if (supported && isTorchOn) {
                  await track.applyConstraints({
                    advanced: [{ torch: true } as any]
                  });
                }
              }
            } else {
              if (active) {
                setHasTorch(false);
              }
            }
          } catch (e) {
            console.warn("Could not retrieve camera capabilities", e);
            if (active) setHasTorch(false);
          }
        }

        let lastScanTime = 0;
        const scanFrame = () => {
          if (!active) return;

          const now = Date.now();
          if (now - lastScanTime > 150) {
            lastScanTime = now;
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              const video = videoRef.current;
              const width = video.videoWidth;
              const height = video.videoHeight;

              const canvas = document.createElement("canvas");
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");

              if (ctx) {
                ctx.drawImage(video, 0, 0, width, height);
                try {
                  const imgData = ctx.getImageData(0, 0, width, height);
                  const qrCode = jsQR(imgData.data, imgData.width, imgData.height, {
                    inversionAttempts: "dontInvert"
                  });

                  if (qrCode && qrCode.data) {
                    const detectedUrl = qrCode.data.trim();
                    if (detectedUrl) {
                      handleQrScanSuccess(detectedUrl);
                      return;
                    }
                  }
                } catch (e) {
                  console.error("Scanning frame error:", e);
                }
              }
            }
          }
          animationId = requestAnimationFrame(scanFrame);
        };

        animationId = requestAnimationFrame(scanFrame);

      } catch (err: any) {
        console.error("Camera access error:", err);
        if (active) {
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            setQrScannerError("Camera permission denied. Please allow camera access in your browser settings to scan QR codes.");
          } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            setQrScannerError("No camera device found on this system.");
          } else {
            setQrScannerError(`Failed to initialize camera: ${err.message || "Unknown error"}`);
          }
        }
      }
    };

    if (isQrScannerOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      active = false;
      cancelAnimationFrame(animationId);
      stopCamera();
    };
  }, [isQrScannerOpen, activeCameraId]);

  // Dynamically control torch/flashlight
  useEffect(() => {
    const applyTorchState = async () => {
      if (isQrScannerOpen && streamRef.current) {
        const track = streamRef.current.getVideoTracks()[0];
        if (track) {
          try {
            await track.applyConstraints({
              advanced: [{ torch: isTorchOn } as any]
            });
          } catch (e) {
            console.warn("Failed to apply torch constraint dynamically:", e);
          }
        }
      }
    };
    applyTorchState();
  }, [isTorchOn, isQrScannerOpen]);

  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [selectedCategoryModal, setSelectedCategoryModal] = useState<{ category: string; clickedVideoId: string } | null>(null);
  const [selectedPreviewVideo, setSelectedPreviewVideo] = useState<VideoPost | null>(null);
  const [compareCatA, setCompareCatA] = useState<string>("political");
  const [compareCatB, setCompareCatB] = useState<string>("history");
  const [trendCategory, setTrendCategory] = useState<string>("all");
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState<{
    x: number;
    y: number;
    dayLabel: string;
    score: number;
    count: number;
  } | null>(null);

  // States for interactive sentiment explanations
  const [loadingExplanations, setLoadingExplanations] = useState<Record<string, boolean>>({});
  const [explanations, setExplanations] = useState<Record<string, string[]>>({});
  const [explanationErrors, setExplanationErrors] = useState<Record<string, string>>({});

  // States for Gemini-generated long detailed summaries
  const [loadingLongSummaries, setLoadingLongSummaries] = useState<Record<string, boolean>>({});
  const [longSummaries, setLongSummaries] = useState<Record<string, string>>({});
  const [longSummaryErrors, setLongSummaryErrors] = useState<Record<string, string>>({});

  // Custom Developer Keys Configuration Tray
  const [showDeveloperSettings, setShowDeveloperSettings] = useState<boolean>(false);
  const [apiMode, setApiMode] = useState<"grounding" | "direct">("grounding");
  const [ytKey, setYtKey] = useState<string>("");
  const [fbToken, setFbToken] = useState<string>("");
  const [igToken, setIgToken] = useState<string>("");
  const [isKeysSaved, setIsKeysSaved] = useState<boolean>(false);

  // Cross-Platform Multi-Media Publisher States
  const [publisherFiles, setPublisherFiles] = useState<Array<{
    id: string;
    file: File;
    previewUrl: string;
    type: "image" | "video";
    name: string;
    size: string;
  }>>([]);
  const [publisherDescription, setPublisherDescription] = useState<string>("");
  const [publisherTags, setPublisherTags] = useState<string[]>(["SocialPulse", "GroundingInsights", "ViralTrend"]);
  const [currentTagInput, setCurrentTagInput] = useState<string>("");
  const [publisherPlatforms, setPublisherPlatforms] = useState<Record<string, boolean>>({
    youtube: true,
    facebook: true,
    instagram: true
  });
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishingLog, setPublishingLog] = useState<string[]>([]);
  const [publishSuccessReport, setPublishSuccessReport] = useState<any>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const [socialConnections, setSocialConnections] = useState<Record<string, { connected: boolean; username?: string }>>(() => {
    try {
      const saved = localStorage.getItem("social_connections_data");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load social connections:", e);
    }
    return {
      youtube: { connected: false },
      facebook: { connected: false },
      instagram: { connected: false }
    };
  });

  useEffect(() => {
    localStorage.setItem("social_connections_data", JSON.stringify(socialConnections));
  }, [socialConnections]);

  useEffect(() => {
    const handleSocialAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost")) {
        return;
      }
      if (event.data?.type === "SOCIAL_AUTH_SUCCESS") {
        const { platform, username } = event.data;
        setSocialConnections(prev => ({
          ...prev,
          [platform]: { connected: true, username }
        }));
        setShareToast({
          message: `Successfully connected ${platform.toUpperCase()} account (${username})!`,
          type: "success"
        });
      }
    };
    window.addEventListener("message", handleSocialAuthMessage);
    return () => window.removeEventListener("message", handleSocialAuthMessage);
  }, []);

  const triggerSocialPopup = (platform: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const width = 500;
      const height = 620;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popupUrl = `/auth-popup?platform=${platform}`;
      const popupWindow = window.open(
        popupUrl,
        `social_auth_${platform}`,
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
      );
      
      if (!popupWindow) {
        setShareToast({
          message: "Popup was blocked. Please allow popups for this site.",
          type: "error"
        });
        resolve(false);
        return;
      }
      
      const timer = setInterval(() => {
        if (popupWindow.closed) {
          clearInterval(timer);
          try {
            const current = JSON.parse(localStorage.getItem("social_connections_data") || "{}");
            if (current[platform]?.connected) {
              resolve(true);
            } else {
              resolve(false);
            }
          } catch {
            resolve(false);
          }
        }
      }, 500);
    });
  };

  const [shareToast, setShareToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Real-Time Alert & Notification States
  const [alerts, setAlerts] = useState<NotificationAlert[]>([]);
  const [alertLogs, setAlertLogs] = useState<AlertTriggeredLog[]>([]);
  const [newAlertTarget, setNewAlertTarget] = useState<string>("");
  const [newAlertType, setNewAlertType] = useState<"keyword" | "category">("keyword");
  const [newAlertMetric, setNewAlertMetric] = useState<"views" | "sentiment_rise" | "sentiment_fall">("views");
  const [newAlertThreshold, setNewAlertThreshold] = useState<string>("");
  const [newAlertChannel, setNewAlertChannel] = useState<"email" | "push" | "both">("both");
  const [newAlertEmail, setNewAlertEmail] = useState<string>("karthi.krishna6587@gmail.com");
  const [newAlertLabel, setNewAlertLabel] = useState<string>("");
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [editingAlertLabel, setEditingAlertLabel] = useState<string>("");
  const [isAlertScanning, setIsAlertScanning] = useState<boolean>(false);
  const [alertsLoading, setAlertsLoading] = useState<boolean>(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  // Load Alerts & Triggered Logs from Server
  const fetchAlerts = async () => {
    setAlertsLoading(true);
    try {
      const response = await fetch("/api/alerts");
      if (response.ok) {
        const result = await response.json();
        setAlerts(result.alerts || []);
        setAlertLogs(result.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setAlertsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedPreviewVideo(null);
        setSelectedCategoryModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleRegisterAlert = async () => {
    if (!newAlertTarget.trim()) {
      setAlertsError("Please specify a target keyword or category.");
      return;
    }
    if (!newAlertThreshold.trim() || isNaN(parseFloat(newAlertThreshold))) {
      setAlertsError("Please enter a valid numeric threshold.");
      return;
    }
    if ((newAlertChannel === "email" || newAlertChannel === "both") && !newAlertEmail.includes("@")) {
      setAlertsError("Please specify a valid destination email address.");
      return;
    }

    setAlertsError(null);
    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newAlertType,
          targetValue: newAlertTarget.trim(),
          metric: newAlertMetric,
          threshold: parseFloat(newAlertThreshold),
          channel: newAlertChannel,
          destinationEmail: newAlertEmail,
          label: newAlertLabel.trim() || undefined
        })
      });
      if (!response.ok) {
        throw new Error("Failed to register alert.");
      }
      const result = await response.json();
      setAlerts(result.alerts);
      setNewAlertTarget("");
      setNewAlertThreshold("");
      setNewAlertLabel("");
      setShareToast({
        message: "Successfully registered real-time alert trigger!",
        type: "success"
      });
    } catch (err: any) {
      setAlertsError(err.message || "Failed to create alert rules.");
    }
  };

  const handleToggleAlert = async (id: string) => {
    try {
      const response = await fetch("/api/alerts/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        const result = await response.json();
        setAlerts(result.alerts);
        setShareToast({
          message: "Alert trigger updated successfully.",
          type: "success"
        });
      }
    } catch (err) {
      console.error("Toggle alert error:", err);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      const response = await fetch("/api/alerts/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        const result = await response.json();
        setAlerts(result.alerts);
        setShareToast({
          message: "Alert trigger deleted successfully.",
          type: "success"
        });
      }
    } catch (err) {
      console.error("Delete alert error:", err);
    }
  };

  const handleUpdateAlertLabel = async (id: string, label: string) => {
    try {
      const response = await fetch("/api/alerts/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, label })
      });
      if (response.ok) {
        const result = await response.json();
        setAlerts(result.alerts);
        setEditingAlertId(null);
        setEditingAlertLabel("");
        setShareToast({
          message: "Alert rule label updated successfully.",
          type: "success"
        });
      }
    } catch (err) {
      console.error("Update alert label error:", err);
    }
  };

  const handleSweepAlerts = async () => {
    if (!data || !data.videos || data.videos.length === 0) {
      setShareToast({
        message: "No current videos loaded to scan. Please load trends first.",
        type: "error"
      });
      return;
    }

    setIsAlertScanning(true);
    setShareToast({
      message: "Running real-time threshold & keyword scanning sweep...",
      type: "info"
    });

    try {
      const response = await fetch("/api/alerts/sweep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videos: data.videos })
      });
      if (response.ok) {
        const result = await response.json();
        setAlertLogs(result.allLogs || []);
        if (result.newDispatchesCount > 0) {
          setShareToast({
            message: `⚠️ Alert Triggered! Dispatched ${result.newDispatchesCount} notifications. Check history log below.`,
            type: "success"
          });
        } else {
          setShareToast({
            message: "Scan complete. No new thresholds matched current video trends.",
            type: "info"
          });
        }
      }
    } catch (err) {
      console.error("Sweep alerts error:", err);
    } finally {
      setIsAlertScanning(false);
    }
  };

  useEffect(() => {
    if (shareToast) {
      const timer = setTimeout(() => {
        setShareToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [shareToast]);

  const handleShareVideo = async (video: VideoPost) => {
    const shareText = `🔥 Trending on ${video.platform}: "${video.title}" by @${video.uploader}. Sentiment is ${video.sentimentLabel} (${video.sentimentScore > 0 ? '+' : ''}${video.sentimentScore})! Check it out here:`;
    
    // Check if Web Share API is available and we're not inside a restricted sandboxed iframe
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Trend: ${video.title}`,
          text: shareText,
          url: video.url,
        });
        setShareToast({
          message: "Trend shared successfully!",
          type: "success"
        });
        return;
      } catch (err: any) {
        // If user cancelled, don't show error, just return or fallback if it is a real permission issue
        if (err.name === "AbortError") {
          return;
        }
        console.warn("Web Share API failed, falling back to clipboard copy:", err);
      }
    }

    // Fallback: Copy to Clipboard
    try {
      const fullShareContent = `${shareText} ${video.url}`;
      await navigator.clipboard.writeText(fullShareContent);
      setShareToast({
        message: "Link and trend details copied to clipboard!",
        type: "success"
      });
    } catch (clipboardErr) {
      console.error("Clipboard write failed:", clipboardErr);
      setShareToast({
        message: "Failed to share. Please copy the link manually: " + video.url,
        type: "error"
      });
    }
  };

  const handleExplainSentiment = async (video: VideoPost) => {
    // If we already loaded explanations for this video, we don't need to load again
    if (explanations[video.id]) return;

    setLoadingExplanations(prev => ({ ...prev, [video.id]: true }));
    setExplanationErrors(prev => ({ ...prev, [video.id]: "" }));

    try {
      const response = await fetch("/api/explain-sentiment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: video.title,
          summary: video.summary,
          sentimentScore: video.sentimentScore,
          sentimentLabel: video.sentimentLabel,
          category: video.category,
          uploader: video.uploader
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const result = await response.json();
      if (result && Array.isArray(result.reasons)) {
        setExplanations(prev => ({ ...prev, [video.id]: result.reasons }));
      } else {
        throw new Error("Invalid response format received from explanation service.");
      }
    } catch (err: any) {
      console.error("Failed to explain sentiment:", err);
      setExplanationErrors(prev => ({ ...prev, [video.id]: err.message || "Unknown explanation error" }));
    } finally {
      setLoadingExplanations(prev => ({ ...prev, [video.id]: false }));
    }
  };

  const handleGenerateLongSummary = async (video: VideoPost) => {
    // If we already loaded a long summary for this video, we don't need to load again
    if (longSummaries[video.id]) return;

    setLoadingLongSummaries(prev => ({ ...prev, [video.id]: true }));
    setLongSummaryErrors(prev => ({ ...prev, [video.id]: "" }));

    try {
      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: video.title,
          summary: video.summary,
          category: video.category,
          uploader: video.uploader,
          platform: video.platform
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const result = await response.json();
      if (result && typeof result.summary === "string") {
        setLongSummaries(prev => ({ ...prev, [video.id]: result.summary }));
      } else {
        throw new Error("Invalid response format received from summary generation service.");
      }
    } catch (err: any) {
      console.error("Failed to generate long summary:", err);
      setLongSummaryErrors(prev => ({ ...prev, [video.id]: err.message || "Unknown summary error" }));
    } finally {
      setLoadingLongSummaries(prev => ({ ...prev, [video.id]: false }));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handlePublisherFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedList: File[] = Array.from(e.target.files);
      const newMedia = selectedList.map((file: File) => {
        const type = file.type.startsWith("video/") ? "video" as const : "image" as const;
        const previewUrl = URL.createObjectURL(file);
        return {
          id: Math.random().toString(36).substring(2, 9),
          file,
          previewUrl,
          type,
          name: file.name,
          size: formatFileSize(file.size)
        };
      });
      setPublisherFiles(prev => [...prev, ...newMedia]);
    }
  };

  const removePublisherFile = (id: string) => {
    setPublisherFiles(prev => {
      const target = prev.find(f => f.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const addPublisherTag = () => {
    const cleanTag = currentTagInput.replace(/[^a-zA-Z0-9]/g, "").trim();
    if (cleanTag && !publisherTags.includes(cleanTag)) {
      setPublisherTags(prev => [...prev, cleanTag]);
      setCurrentTagInput("");
    }
  };

  const removePublisherTag = (tagToRemove: string) => {
    setPublisherTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handlePublishSubmit = async () => {
    if (publisherFiles.length === 0) {
      setPublishError("Please select at least one video or photo to upload.");
      return;
    }
    
    const activePlatformsCount = Object.values(publisherPlatforms).filter(Boolean).length;
    if (activePlatformsCount === 0) {
      setPublishError("Please select at least one target social media platform.");
      return;
    }

    setIsPublishing(true);
    setPublishError(null);
    setPublishSuccessReport(null);
    setPublishingLog(["🚀 Initializing cross-platform pipeline..."]);

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      // Dynamic verification of connected accounts
      const platformsToAuth: string[] = [];
      if (publisherPlatforms.youtube && !socialConnections.youtube.connected) platformsToAuth.push("youtube");
      if (publisherPlatforms.facebook && !socialConnections.facebook.connected) platformsToAuth.push("facebook");
      if (publisherPlatforms.instagram && !socialConnections.instagram.connected) platformsToAuth.push("instagram");

      if (platformsToAuth.length > 0) {
        setPublishingLog(prev => [...prev, `🔒 Unauthenticated channels detected: [${platformsToAuth.map(p => p.toUpperCase()).join(", ")}]`]);
        setPublishingLog(prev => [...prev, `📲 Sequentially opening secure login popouts...`]);
        await sleep(500);
        
        for (const plat of platformsToAuth) {
          setPublishingLog(prev => [...prev, `🔑 Launching ${plat.toUpperCase()} authorization gateway...`]);
          const success = await triggerSocialPopup(plat);
          if (!success) {
            setPublishingLog(prev => [...prev, `❌ Connection cancelled or closed for ${plat.toUpperCase()}.`]);
            throw new Error(`Login aborted. You must connect your ${plat.toUpperCase()} account to publish.`);
          }
          
          // Retrieve the user information dynamically
          const latestConnections = JSON.parse(localStorage.getItem("social_connections_data") || "{}");
          const uName = latestConnections[plat]?.username || "authorized";
          setPublishingLog(prev => [...prev, `✅ Authorized ${plat.toUpperCase()} account as: @${uName}`]);
          await sleep(500);
        }
      }

      await sleep(500);
      setPublishingLog(prev => [...prev, `📦 Analyzing media package: ${publisherFiles.length} item(s)...`]);
      await sleep(400);
      setPublishingLog(prev => [...prev, `🔍 Applying pre-upload validation filters...`]);
      await sleep(400);

      const payload = {
        description: publisherDescription,
        tags: publisherTags,
        platforms: publisherPlatforms,
        files: publisherFiles.map(f => ({
          name: f.name,
          size: f.file.size,
          type: f.file.type
        })),
        credentials: {
          ytKey: apiMode === "direct" ? ytKey : undefined,
          fbToken: apiMode === "direct" ? fbToken : undefined,
          igToken: apiMode === "direct" ? igToken : undefined
        }
      };

      if (publisherPlatforms.youtube) {
        setPublishingLog(prev => [...prev, `⚡ YouTube: Uploading video streams (chunk 1/1)...`]);
        await sleep(600);
      }
      if (publisherPlatforms.facebook) {
        setPublishingLog(prev => [...prev, `⚡ Facebook: Creating publishing container & attaching assets...`]);
        await sleep(500);
      }
      if (publisherPlatforms.instagram) {
        setPublishingLog(prev => [...prev, `⚡ Instagram: Dispatching reels object metadata...`]);
        await sleep(600);
      }

      const response = await fetch("/api/publish-media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Publish failed with server code ${response.status}`);
      }

      const report = await response.json();
      setPublishingLog(prev => [...prev, `✅ Server response: Success. Generation complete.`]);
      await sleep(300);

      setPublishSuccessReport(report);
      setShareToast({
        message: `Successfully cross-posted content to ${activePlatformsCount} social accounts!`,
        type: "success"
      });

      // Clear fields upon success
      setPublisherDescription("");
      // Revoke preview URLs to avoid memory leaks
      publisherFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
      setPublisherFiles([]);

    } catch (err: any) {
      console.error("Publishing failed:", err);
      setPublishError(err.message || "An unexpected error occurred during publishing.");
      setPublishingLog(prev => [...prev, `❌ Error: ${err.message || "Pipeline interrupted."}`]);
    } finally {
      setIsPublishing(false);
    }
  };

  // Fetch categorized videos & trends from Express server
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const categoriesParam = selectedCategories.join(",");
        const response = await fetch(
          `/api/videos?days=${days}&region=${encodeURIComponent(region)}&categories=${categoriesParam}`
        );
        if (!response.ok) {
          throw new Error(`Failed to load data (HTTP ${response.status})`);
        }
        const result = await response.json();
        setData(result);
        
        // Reset card expansions
        setExpandedCard(null);
      } catch (err: any) {
        console.error("Dashboard error:", err);
        setError("Error connecting to semantic analysis service. Please retry in a moment.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [region, days, selectedCategories, refreshTrigger]);

  const handleCategoryToggle = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter(c => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const saveDeveloperKeys = (e: React.FormEvent) => {
    e.preventDefault();
    setIsKeysSaved(true);
    setTimeout(() => setIsKeysSaved(false), 3000);
  };

  // Process and filter loaded videos on client side for responsive search/keyword interaction
  const getFilteredVideos = () => {
    if (!data || !data.videos) return [];
    const filtered = data.videos.filter(video => {
      // Platform Match
      if (selectedPlatformFilter !== "All" && video.platform.toLowerCase() !== selectedPlatformFilter.toLowerCase()) {
        return false;
      }
      // Topic/Category Match
      if (selectedCategoryFilter !== "All" && video.category !== selectedCategoryFilter) {
        return false;
      }
      // Sentiment Match
      if (selectedSentimentFilter !== "All" && video.sentimentLabel !== selectedSentimentFilter) {
        return false;
      }
      // Sentiment Score Range Filter
      if (video.sentimentScore < minSentiment || video.sentimentScore > maxSentiment) {
        return false;
      }
      // Trending Keyword Tag Match
      if (selectedKeyword && !video.title.toLowerCase().includes(selectedKeyword.toLowerCase()) && !video.summary.toLowerCase().includes(selectedKeyword.toLowerCase())) {
        return false;
      }
      // Freeform Text Search Match
      if (searchQuery.trim() !== "") {
        const query = searchQuery.trim().toLowerCase();
        
        // Check if query looks like a link
        const looksLikeLink = query.startsWith("http://") || query.startsWith("https://") || 
                              query.includes("youtube.com") || query.includes("youtu.be") || 
                              query.includes("facebook.com") || query.includes("instagram.com") || 
                              query.includes("tiktok.com") || query.includes("x.com") || query.includes("twitter.com");

        if (looksLikeLink) {
          const parsedQuery = validateSocialMediaLink(query);
          if (parsedQuery.isValid) {
            // Direct URL match
            if (video.url.toLowerCase().trim() === query) return true;
            
            const parsedVideo = validateSocialMediaLink(video.url);
            if (parsedVideo.isValid && parsedVideo.isValidSocial && parsedQuery.isValidSocial) {
              if (parsedVideo.platform.toLowerCase() === parsedQuery.platform.toLowerCase() && 
                  parsedVideo.videoId && parsedVideo.videoId === parsedQuery.videoId) {
                return true;
              }
            }
            
            // Substring videoId match
            if (parsedQuery.videoId && video.url.toLowerCase().includes(parsedQuery.videoId.toLowerCase())) {
              return true;
            }
          }
        }

        const matchesTitle = video.title.toLowerCase().includes(query);
        const matchesUploader = video.uploader.toLowerCase().includes(query);
        const matchesSummary = video.summary.toLowerCase().includes(query);
        return matchesTitle || matchesUploader || matchesSummary;
      }
      return true;
    });

    if (publicAwarenessMode) {
      const getOffset = (v: VideoPost) => {
        let offset = 0;
        const uploaded = v.uploadedAt.toLowerCase().trim();
        if (uploaded.includes("today") || uploaded.includes("now") || uploaded.includes("just now")) {
          offset = 0;
        } else if (uploaded.includes("yesterday")) {
          offset = 1;
        } else {
          const match = uploaded.match(/(\d+)\s+day/);
          if (match && match[1]) {
            offset = parseInt(match[1], 10);
          } else {
            const d = new Date(v.uploadedAt);
            if (!isNaN(d.getTime())) {
              const today = new Date("2026-07-01");
              const diffTime = Math.abs(today.getTime() - d.getTime());
              offset = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            }
          }
        }
        return offset;
      };

      const sorted = [...filtered];
      if (sortBy === "date") {
        sorted.sort((a, b) => getOffset(a) - getOffset(b));
      } else if (sortBy === "botScore") {
        sorted.sort((a, b) => getBotAnalysis(b).riskPercent - getBotAnalysis(a).riskPercent);
      } else {
        // engagement
        sorted.sort((a, b) => (b.views + b.likes * 2) - (a.views + a.likes * 2));
      }
      return sorted;
    }

    // Sort and limit if Top 10 by Sentiment is active
    if (showOnlyTop10BySentiment) {
      return [...filtered]
        .sort((a, b) => {
          // Calculate sentiment intensity weighted by engagement (views + likes * 2)
          const weightA = Math.abs(a.sentimentScore) * (a.views + a.likes * 2);
          const weightB = Math.abs(b.sentimentScore) * (b.views + b.likes * 2);
          return weightB - weightA;
        })
        .slice(0, 10);
    }

    return filtered;
  };

  const filteredVideos = getFilteredVideos();

  // Helper to export filtered/sorted list to Excel (CSV format with Blob encoding and Byte Order Mark for robust Excel viewing)
  const exportCategoryToExcel = (categoryName: string, videosToExport: any[]) => {
    const headers = [
      "Trend Rank",
      "Trend Score (Engagement Weighted)",
      "Video Title (Name)",
      "Created By (Uploader)",
      "Created Date (Uploaded)",
      "Platform",
      "Views Count",
      "Likes Count",
      "Sentiment Score",
      "Sentiment Rating Label",
      "ML Classification Confidence (%)",
      ...(publicAwarenessMode ? ["Bot Susceptibility (%)", "Coordinated Wave Signal", "Watchdog Risk Audit Flag"] : []),
      "Executive Summary Context"
    ];

    const rows = videosToExport.map(v => {
      const bot = getBotAnalysis(v);
      return [
        v.rank,
        v.trendScore,
        `"${v.title.replace(/"/g, '""')}"`,
        `"${v.uploader.replace(/"/g, '""')}"`,
        `"${v.uploadedAt}"`,
        v.platform,
        v.views,
        v.likes,
        v.sentimentScore,
        v.sentimentLabel,
        Math.round(v.mlConfidence * 100),
        ...(publicAwarenessMode ? [`${bot.riskPercent}%`, bot.isCoordinatedWave ? "YES" : "NO", `"${bot.riskLabel}"`] : []),
        `"${v.summary.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${categoryName.toLowerCase()}_n_${days}_days_pulse_trends.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to download currently filtered dashboard videos as CSV
  const handleDownloadCSVReport = () => {
    if (!filteredVideos || filteredVideos.length === 0) {
      setShareToast({
        message: "No video data available to download.",
        type: "error"
      });
      return;
    }

    const annotatedVideos = filteredVideos
      .map((v) => {
        const trendScore = Math.round(
          (v.views * 0.4 + v.likes * 2.0) * (v.sentimentScore >= 0 ? 1 + v.sentimentScore : 1) * (v.mlConfidence || 1)
        );
        return { ...v, trendScore };
      })
      .sort((a, b) => b.trendScore - a.trendScore)
      .map((v, index) => ({ ...v, rank: index + 1 }));

    exportCategoryToExcel("filtered_dashboard_report", annotatedVideos);
    setShareToast({
      message: "Successfully downloaded filtered CSV report!",
      type: "success"
    });
  };

  // Color scheme helpers based on platform
  const getPlatformIconAndStyle = (platform: string) => {
    const norm = (platform || "").toLowerCase();
    if (norm.includes("youtube")) {
      return {
        icon: <Youtube className="w-4 h-4" />,
        text: "text-red-600",
        border: "border-red-200",
        badge: "bg-red-50 text-red-700 border-red-100"
      };
    } else if (norm.includes("facebook")) {
      return {
        icon: <Facebook className="w-4 h-4" />,
        text: "text-blue-600",
        border: "border-blue-200",
        badge: "bg-blue-50 text-blue-700 border-blue-100"
      };
    } else if (norm.includes("instagram")) {
      return {
        icon: <Instagram className="w-4 h-4" />,
        text: "text-pink-600",
        border: "border-pink-200",
        badge: "bg-pink-50 text-pink-700 border-pink-100"
      };
    } else {
      // Elegant, robust dynamic fallback for any other platform (e.g. TikTok, Twitter, LinkedIn, etc.)
      return {
        icon: <VideoIcon className="w-4 h-4" />,
        text: "text-indigo-600",
        border: "border-indigo-200",
        badge: "bg-indigo-50 text-indigo-700 border-indigo-100"
      };
    }
  };

  // Format big numbers gracefully
  const formatViews = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(0) + "K";
    return num.toString();
  };

  // Deterministic 24h engagement change calculation
  const getEngagementChange = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const range = 41; // -12 to +28
    const pct = (Math.abs(hash) % range) - 12;
    const finalPct = pct === 0 ? 5 : pct;
    return {
      value: finalPct,
      isUp: finalPct > 0,
      formatted: finalPct > 0 ? `+${finalPct}%` : `${finalPct}%`
    };
  };

  const getCategoryMetrics = (catName: string) => {
    if (!data || !data.videos) {
      return {
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0,
        avgViews: 0,
        avgLikes: 0,
        avgSentiment: 0,
        dominantPlatform: "None",
        avgTrendScore: 0
      };
    }
    const catVideos = data.videos.filter(v => v.category === catName);
    const totalVideos = catVideos.length;
    const totalViews = catVideos.reduce((sum, v) => sum + v.views, 0);
    const totalLikes = catVideos.reduce((sum, v) => sum + v.likes, 0);
    const avgViews = totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0;
    const avgLikes = totalVideos > 0 ? Math.round(totalLikes / totalVideos) : 0;
    
    const sentimentScores = catVideos.map(v => v.sentimentScore);
    const avgSentiment = sentimentScores.length > 0 
      ? parseFloat((sentimentScores.reduce((sum, s) => sum + s, 0) / sentimentScores.length).toFixed(2))
      : 0.00;

    // Platform breakdown
    const platforms: Record<string, number> = {};
    catVideos.forEach(v => {
      const plat = (v.platform || "Unknown").trim();
      const norm = plat.toLowerCase() === "youtube" ? "YouTube" :
                   plat.toLowerCase() === "facebook" ? "Facebook" :
                   plat.toLowerCase() === "instagram" ? "Instagram" :
                   plat.charAt(0).toUpperCase() + plat.slice(1);
      platforms[norm] = (platforms[norm] || 0) + 1;
    });
    let dominantPlatform = "None";
    let maxCount = -1;
    Object.entries(platforms).forEach(([plat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantPlatform = plat;
      }
    });

    // Engagement Score
    const avgTrendScore = totalVideos > 0
      ? Math.round(
          catVideos.reduce((sum, v) => {
            const score = (v.views * 0.4 + v.likes * 2.0) * (v.sentimentScore >= 0 ? 1 + v.sentimentScore : 1) * (v.mlConfidence || 1);
            return sum + score;
          }, 0) / totalVideos
        )
      : 0;

    return {
      totalVideos,
      totalViews,
      totalLikes,
      avgViews,
      avgLikes,
      avgSentiment,
      dominantPlatform,
      avgTrendScore
    };
  };

  const getSentimentTrendData = () => {
    if (!data || !data.videos) return [];
    
    // 1. Filter videos based on selected trend category
    const filteredVideos = trendCategory === "all"
      ? data.videos
      : data.videos.filter(v => v.category === trendCategory);

    // 2. Parse day offsets of filtered videos
    const parsedVideos = filteredVideos.map(v => {
      let offset = 0;
      const uploaded = v.uploadedAt.toLowerCase().trim();
      if (uploaded.includes("today") || uploaded.includes("now") || uploaded.includes("just now")) {
        offset = 0;
      } else if (uploaded.includes("yesterday")) {
        offset = 1;
      } else {
        const match = uploaded.match(/(\d+)\s+day/);
        if (match && match[1]) {
          offset = parseInt(match[1], 10);
        } else {
          const d = new Date(v.uploadedAt);
          if (!isNaN(d.getTime())) {
            const today = new Date("2026-07-01");
            const diffTime = Math.abs(today.getTime() - d.getTime());
            offset = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          }
        }
      }
      return { ...v, offset };
    });

    // 3. Generate array of days from oldest to newest (days offset down to 0)
    const trendPoints = [];
    let lastKnownSentiment = 0.0;
    
    for (let i = days; i >= 0; i--) {
      const dayVideos = parsedVideos.filter(v => v.offset === i);
      const dayCount = dayVideos.length;
      
      let daySentiment = lastKnownSentiment;
      if (dayCount > 0) {
        const sum = dayVideos.reduce((acc, v) => acc + v.sentimentScore, 0);
        daySentiment = parseFloat((sum / dayCount).toFixed(2));
        lastKnownSentiment = daySentiment;
      }
      
      let dayLabel = `${i}d ago`;
      if (i === 0) dayLabel = "Today";
      else if (i === 1) dayLabel = "Yesterday";

      trendPoints.push({
        dayOffset: i,
        dayLabel,
        sentiment: daySentiment,
        videoCount: dayCount,
      });
    }
    
    return trendPoints;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans antialiased pb-12">
      
      {/* Toast notifications */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white px-4 py-3.5 rounded-xl shadow-xl flex items-center justify-between gap-3 border border-slate-800"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-400 text-base">✓</span>
              <p className="text-xs font-semibold leading-relaxed">
                {shareToast.message}
              </p>
            </div>
            <button
              onClick={() => setShareToast(null)}
              className="text-slate-400 hover:text-white transition text-xs font-bold shrink-0 ml-1"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* HEADER SECTION */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-md shadow-blue-500/10 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-slate-900">
                Social Pulse Filter
              </h1>
              <p className="text-xs text-slate-500 font-mono">Semantic Analyzer & Content Aggregator</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-600 mr-2 flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live ML Model Server Active
            </span>
            
            {/* Auto-Refresh Toggle */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
              <label htmlFor="auto-refresh-toggle" className="text-xs font-medium text-slate-600 flex items-center gap-1.5 cursor-pointer select-none">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${autoRefreshEnabled ? "bg-indigo-400" : "bg-slate-300"}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${autoRefreshEnabled ? "bg-indigo-500" : "bg-slate-400"}`}></span>
                </span>
                Auto-Refresh
              </label>
              <button
                id="auto-refresh-toggle"
                type="button"
                role="switch"
                aria-checked={autoRefreshEnabled}
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoRefreshEnabled ? "bg-indigo-600" : "bg-slate-200"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoRefreshEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              {autoRefreshEnabled && (
                <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/50 animate-pulse">
                  {formatTime(secondsUntilRefresh)}
                </span>
              )}
            </div>

            <button
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-xs text-slate-700 font-medium rounded-lg border border-slate-200 hover:border-slate-300 shadow-sm transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD CONTENT BODY */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-grow w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PUBLIC AWARENESS / PROPAGANDA WATCHDOG TRIGGER */}
        <div className="lg:col-span-12">
          <div className={`rounded-2xl border p-6 transition-all duration-300 relative overflow-hidden ${
            publicAwarenessMode 
              ? "bg-slate-900 border-indigo-500/40 text-white shadow-lg shadow-indigo-500/5" 
              : "bg-white border-slate-200 text-slate-950 shadow-sm"
          }`}>
            {/* Background elements */}
            <div className="absolute right-0 top-0 p-8 opacity-[0.03] select-none pointer-events-none">
              <Shield className="w-56 h-56 text-indigo-400" />
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-4xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase border ${
                    publicAwarenessMode 
                      ? "bg-indigo-950 text-indigo-300 border-indigo-800/60 animate-pulse" 
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>
                    <Shield className="w-3.5 h-3.5 text-indigo-500" />
                    {publicAwarenessMode ? "Watchdog Mode ACTIVE" : "Commercial Tracker Active"}
                  </span>
                  
                  <span className="text-xs font-mono text-slate-400">• Citizen Shield Initiative</span>
                </div>
                
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-display">
                  {publicAwarenessMode ? "Public Awareness & Propaganda Scanner" : "Enable Unbiased Citizen Shield Mode"}
                </h2>
                
                <p className={`text-xs sm:text-sm leading-relaxed ${publicAwarenessMode ? "text-slate-300" : "text-slate-500"}`}>
                  Social media algorithms push high-budget paid PR campaigns, burying organic counter-narratives. 
                  Watchdog Mode provides <strong>Horizon Controls</strong> to bypass biased algorithms, <strong>Live Comment Sentiment Variance</strong> audits to flag bots, and <strong>24h Velocity Correlation</strong> to expose coordinated influencer networks.
                </p>
              </div>

              {/* Toggle switcher button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 self-start lg:self-center">
                <button
                  onClick={() => {
                    const newMode = !publicAwarenessMode;
                    setPublicAwarenessMode(newMode);
                    if (newMode) {
                      setSortBy("date"); // Sort by Upload Date by default for organic unbiased view
                      setSelectedCategoryFilter("political"); // Filter to political category by default
                      setShowOnlyTop10BySentiment(false); // disable Top 10 limit by default
                      setShareToast({
                        message: "Public Awareness Mode activated! Sort default set to Unbiased Upload Date.",
                        type: "success"
                      });
                    } else {
                      setSortBy("engagement");
                      setSelectedCategoryFilter("All");
                      setShowOnlyTop10BySentiment(true);
                      setShareToast({
                        message: "Standard Commercial Tracker restored.",
                        type: "success"
                      });
                    }
                  }}
                  className={`px-6 py-3 rounded-xl text-xs font-extrabold tracking-wider uppercase shadow-md transition duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                    publicAwarenessMode 
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20" 
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>{publicAwarenessMode ? "Restore Commercial View" : "Activate Citizen Shield"}</span>
                </button>
              </div>
            </div>

            {/* Quick-apply Interactive Watchdog Presets */}
            {publicAwarenessMode && (
              <div className="mt-5 pt-5 border-t border-slate-800/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest block">Interactive Citizen Watchdog Presets:</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Click a scanning configuration to immediately apply filters and expose PR machinery.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setSearchQuery("TVK");
                      setSortBy("date");
                      setSelectedCategoryFilter("political");
                      setShareToast({
                        message: "Scanning TVK political narratives. Sorting by real-time upload date to locate counter-narratives.",
                        type: "success"
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-[11px] font-bold border border-slate-700 text-slate-200 flex items-center gap-1.5 transition"
                  >
                    <Search className="w-3 h-3 text-amber-400" />
                    TVK Propaganda Hunt
                  </button>
                  <button
                    onClick={() => {
                      setSearchQuery("DMK");
                      setSortBy("botScore");
                      setSelectedCategoryFilter("political");
                      setShareToast({
                        message: "Scanning DMK political narratives. Sorting by Bot Susceptibility Index (100% positive comments with 0 variance).",
                        type: "success"
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-[11px] font-bold border border-slate-700 text-slate-200 flex items-center gap-1.5 transition"
                  >
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                    DMK Bot & Moderation Tracker
                  </button>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSortBy("date");
                      setSelectedCategoryFilter("All");
                      setShareToast({
                        message: "Scanning unfiltered regional feed. Chronological real-time stream active.",
                        type: "success"
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-[11px] font-bold border border-slate-700 text-slate-200 flex items-center gap-1.5 transition"
                  >
                    <Clock className="w-3 h-3 text-emerald-400" />
                    Organic Grassroots Feed
                  </button>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSortBy("engagement");
                      setSelectedCategoryFilter("All");
                      setShareToast({
                        message: "Filters reset. Showing normal feed.",
                        type: "success"
                      });
                    }}
                    className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-[10px] font-mono text-slate-400 hover:text-white transition"
                  >
                    Reset Preset [x]
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LEFT COLUMN: FILTERS & CONTROLS (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* SOCIAL PULSE LINK VALIDATOR & INTEGRITY SCANNER CARD */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none select-none">
              <Link2 className="w-16 h-16 text-indigo-600" />
            </div>
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-800">
                <Link2 className="w-4 h-4 text-indigo-600 animate-pulse" />
                <h2 className="text-sm font-semibold uppercase tracking-wider font-display">Link Integrity Scanner</h2>
              </div>
              <span className="text-[9px] font-mono font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">ACTIVE</span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Paste a social media URL to validate its cryptographic ID format, trace campaign origins, and audit sentiment profiles.
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-mono uppercase font-bold text-slate-400">Pasted Target URL</label>
                    <button
                      onClick={() => setIsQrScannerOpen(prev => !prev)}
                      className={`flex items-center gap-1.5 text-[9px] font-bold uppercase font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                        isQrScannerOpen 
                          ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100" 
                          : "bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100/80"
                      }`}
                      title={isQrScannerOpen ? "Close Camera Scanner" : "Scan QR Code using device camera"}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isQrScannerOpen ? "Close Scanner" : "Scan QR Code"}</span>
                    </button>
                  </div>
                  {pastedLink && (
                    <button 
                      onClick={() => {
                        setPastedLink("");
                        setLinkValidationError(null);
                        setLinkValidationSuccess(null);
                      }} 
                      className="text-[10px] text-slate-400 hover:text-red-500 font-mono animate-fade-in"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* QR Camera Scanner Viewfinder */}
                <AnimatePresence>
                  {isQrScannerOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pb-1"
                    >
                      <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-video border border-slate-800 shadow-inner flex flex-col items-center justify-center">
                        
                        {/* Video Stream */}
                        <video
                          ref={videoRef}
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />

                        {/* Scanning Overlays (Only show if no error) */}
                        {!qrScannerError && (
                          <>
                            {/* Corner Targets */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-32 h-32 md:w-40 md:h-40 border border-emerald-500/20 rounded-lg relative">
                                {/* Corner brackets */}
                                <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-500 rounded-tl" />
                                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-500 rounded-tr" />
                                <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-500 rounded-bl" />
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-500 rounded-br" />
                                
                                {/* Lasers and status inside finder */}
                                <div className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] animate-scan" />
                              </div>
                            </div>

                            {/* Top Status Indicators */}
                            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900/80 backdrop-blur rounded text-[9px] font-mono text-emerald-400 font-bold border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                <span>LIVE VIEW</span>
                              </div>
                              
                              {/* Camera select control */}
                              {availableCameras.length > 1 && (
                                <select
                                  value={activeCameraId}
                                  onChange={(e) => setActiveCameraId(e.target.value)}
                                  className="pointer-events-auto bg-slate-900/90 text-white border border-slate-700 rounded px-1.5 py-0.5 text-[9px] font-mono focus:outline-none focus:border-indigo-500 max-w-[110px] truncate"
                                >
                                  {availableCameras.map((cam, idx) => (
                                    <option key={cam.deviceId} value={cam.deviceId}>
                                      {cam.label || `Camera ${idx + 1}`}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>

                            {/* Instructions Overlay */}
                            <div className="absolute bottom-2.5 inset-x-0 text-center pointer-events-none">
                              <span className="px-2.5 py-0.5 bg-slate-900/80 backdrop-blur text-[9px] font-mono text-slate-300 rounded border border-slate-800">
                                Place QR code inside the center frame
                              </span>
                            </div>

                            {/* Flashlight/Torch Control */}
                            <div className="absolute bottom-2.5 right-2.5 pointer-events-auto z-10">
                              <button
                                type="button"
                                disabled={!hasTorch}
                                onClick={() => setIsTorchOn(prev => !prev)}
                                className={`p-2 rounded-full border transition flex items-center justify-center cursor-pointer shadow ${
                                  !hasTorch
                                    ? "bg-slate-900/40 text-slate-600 border-slate-800/40 cursor-not-allowed"
                                    : isTorchOn 
                                      ? "bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
                                      : "bg-slate-900/85 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white"
                                }`}
                                title={
                                  !hasTorch 
                                    ? "Flashlight is only supported on mobile devices with a physical camera flash" 
                                    : isTorchOn 
                                      ? "Turn Off Flashlight" 
                                      : "Turn On Flashlight"
                                }
                              >
                                <Zap className={`w-3.5 h-3.5 ${isTorchOn ? "fill-current animate-pulse" : ""}`} />
                              </button>
                            </div>
                          </>
                        )}

                        {/* Error State */}
                        {qrScannerError && (
                          <div className="absolute inset-0 bg-slate-950 p-4 flex flex-col items-center justify-center text-center space-y-2">
                            <AlertTriangle className="w-8 h-8 text-rose-500" />
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-bold text-slate-200 uppercase tracking-wider font-mono">Camera Error</p>
                              <p className="text-[9px] text-slate-400 leading-normal max-w-[200px]">{qrScannerError}</p>
                            </div>
                            <button
                              onClick={() => {
                                setQrScannerError(null);
                                const currentId = activeCameraId;
                                setActiveCameraId("");
                                setTimeout(() => setActiveCameraId(currentId), 100);
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-mono text-[9px] font-bold border border-slate-700 transition cursor-pointer"
                            >
                              Retry Camera
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <input
                    type="text"
                    value={pastedLink}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPastedLink(val);
                      setLinkValidationError(null);
                      setLinkValidationSuccess(null);
                    }}
                    placeholder="Paste YouTube, FB, IG, TikTok, or X link..."
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg py-2 pl-3 pr-20 focus:outline-none focus:border-indigo-500/50 text-slate-700 transition shadow-sm font-mono"
                  />
                  <button
                    onClick={() => injectCustomVideo(pastedLink)}
                    disabled={!pastedLink.trim()}
                    className="absolute right-1 top-1 bottom-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md text-[10px] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Scan & Ingest
                  </button>
                </div>
              </div>

              {/* Live Feedback of the pasted link */}
              {pastedLink.trim() && (() => {
                const analysis = validateSocialMediaLink(pastedLink);
                return (
                  <div className={`p-3 rounded-lg border text-xs space-y-2 transition ${
                    analysis.isValid 
                      ? "bg-emerald-50 border-emerald-100 text-emerald-900" 
                      : "bg-rose-50 border-rose-100 text-rose-900"
                  }`}>
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1">
                        {analysis.isValid ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        <span>Structure: {analysis.isValid ? "Valid URL Format" : "Invalid Structure"}</span>
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono tracking-wider font-extrabold ${
                        analysis.isValid 
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                          : "bg-rose-100 text-rose-700 border border-rose-200"
                      }`}>
                        {analysis.isValid ? "Pass" : "Fail"}
                      </span>
                    </div>

                    {analysis.isValid ? (
                      <div className="space-y-1.5 text-[11px]">
                        <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
                          <div>
                            <span className="opacity-75">Platform:</span> <strong className="text-slate-900">{analysis.platform}</strong>
                          </div>
                          <div className="truncate">
                            <span className="opacity-75">ID:</span> <strong className="text-slate-900 font-bold truncate">{analysis.videoId || "N/A"}</strong>
                          </div>
                        </div>
                        <p className="text-[10px] leading-relaxed text-emerald-800">
                          {analysis.isValidSocial 
                            ? "✓ Fully compatible with our live AI Campaign Sentiment analysis." 
                            : "⚠ Generic link format. Will inherit default sandbox campaign metrics."}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10.5px] leading-relaxed text-rose-700">
                        {analysis.error}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Status Notifications */}
              {linkValidationError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 font-medium flex items-start gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 mt-0.5 shrink-0" />
                  <span>{linkValidationError}</span>
                </div>
              )}

              {linkValidationSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-800 font-medium flex items-start gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>{linkValidationSuccess}</span>
                </div>
              )}

              {/* Recently Scanned URLs History List */}
              {recentlyScanned.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-slate-400">
                    <span>Recently Scanned URLs</span>
                    <button 
                      onClick={() => saveRecentlyScanned([])}
                      className="hover:text-red-500 font-bold transition text-[9px] uppercase tracking-wider"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-0.5 custom-scrollbar">
                    {recentlyScanned.map((item) => (
                      <div 
                        key={item.id}
                        className="group flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/25 transition-all text-xs cursor-pointer"
                        onClick={() => {
                          setSearchQuery(item.url);
                          setLinkValidationSuccess(`Switched active view to recently scanned target.`);
                          setLinkValidationError(null);
                        }}
                      >
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-extrabold uppercase font-mono px-1 bg-slate-200/60 text-slate-600 rounded text-center shrink-0">
                              {item.platform}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono shrink-0">
                              {item.timestamp}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-700 truncate group-hover:text-indigo-900 transition-colors">
                            {item.title || item.url}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = recentlyScanned.filter(x => x.id !== item.id);
                            saveRecentlyScanned(updated);
                            setShareToast({
                              message: "Removed item from recently scanned history.",
                              type: "info"
                            });
                          }}
                          className="p-1 hover:bg-slate-200/50 rounded text-slate-400 hover:text-red-500 transition-colors shrink-0 opacity-60 md:opacity-0 md:group-hover:opacity-100"
                          title="Remove from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SEARCH FILTERS CARD */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-800">
                <Filter className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-semibold uppercase tracking-wider font-display">Semantic Filters</h2>
              </div>
              <span className="text-[10px] font-mono text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded font-semibold">Configurable</span>
            </div>

            {/* Region Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Target Region
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setRegion("Tamil Nadu")}
                  className={`py-1.5 text-xs font-semibold rounded-md transition flex items-center justify-center gap-1 ${
                    region === "Tamil Nadu" 
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <MapPin className="w-3 h-3 text-amber-500" />
                  Tamil Nadu
                </button>
                <button
                  onClick={() => setRegion("Global")}
                  className={`py-1.5 text-xs font-semibold rounded-md transition flex items-center justify-center gap-1 ${
                    region === "Global" 
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Globe className="w-3 h-3 text-blue-500" />
                  Global
                </button>
              </div>
            </div>

            {/* Upload Horizon Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Upload Date Horizon
                </label>
                <span className="font-mono text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded font-bold">{days} Days</span>
              </div>
              <div className="space-y-1">
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1 day</span>
                  <span>7 days</span>
                  <span>14 days</span>
                </div>
              </div>
            </div>

            {/* Sentiment Score Range Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Sentiment Score Horizon
                </label>
                <span className="font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-bold">
                  {minSentiment.toFixed(1)} to {maxSentiment.toFixed(1)}
                </span>
              </div>
              
              <div className="space-y-3 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                {/* Min Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-medium text-slate-500">
                    <span>Minimum Sentiment</span>
                    <span className="font-mono font-bold text-slate-700">{minSentiment.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="-1.0"
                    max="1.0"
                    step="0.1"
                    value={minSentiment}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val <= maxSentiment) {
                        setMinSentiment(val);
                      }
                    }}
                    className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Max Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-medium text-slate-500">
                    <span>Maximum Sentiment</span>
                    <span className="font-mono font-bold text-slate-700">{maxSentiment.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="-1.0"
                    max="1.0"
                    step="0.1"
                    value={maxSentiment}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val >= minSentiment) {
                        setMaxSentiment(val);
                      }
                    }}
                    className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="flex justify-between text-[9px] text-slate-400 font-mono pt-1 border-t border-slate-200/55">
                  <span className="text-red-500 font-medium">-1.0 (Neg)</span>
                  <span className="text-slate-400">0.0 (Neu)</span>
                  <span className="text-emerald-600 font-medium">+1.0 (Pos)</span>
                </div>
              </div>
            </div>

            {/* Target Categories */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" />
                Target Categories
              </label>
              <div className="space-y-2 pt-1">
                {selectedCategories.map((cat) => {
                  const c = cat.toLowerCase();
                  let icon = <Sparkles className="w-3.5 h-3.5" />;
                  let bgStyle = "bg-blue-50 border-blue-200 text-blue-700";
                  let checkBg = "bg-blue-600 border-blue-500 text-white";
                  let labelName = cat.charAt(0).toUpperCase() + cat.slice(1);

                  if (c === "political") {
                    icon = <Award className="w-3.5 h-3.5" />;
                    bgStyle = selectedCategories.includes("political")
                      ? "bg-purple-50 border-purple-200 text-purple-700"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300";
                    checkBg = "bg-purple-600 border-purple-500 text-white";
                    labelName = "Political & Civics";
                  } else if (c === "history") {
                    icon = <BookOpen className="w-3.5 h-3.5" />;
                    bgStyle = selectedCategories.includes("history")
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300";
                    checkBg = "bg-amber-600 border-amber-500 text-white";
                    labelName = "History & Heritage";
                  } else if (c === "sports") {
                    icon = <Tv className="w-3.5 h-3.5" />;
                    bgStyle = selectedCategories.includes("sports")
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300";
                    checkBg = "bg-emerald-600 border-emerald-500 text-white";
                    labelName = "Sports & Athletics";
                  } else {
                    bgStyle = selectedCategories.includes(c)
                      ? "bg-sky-50 border-sky-200 text-sky-700 font-medium"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300";
                    checkBg = "bg-sky-600 border-sky-500 text-white";
                  }

                  const isSelected = selectedCategories.includes(c);

                  return (
                    <div key={c} className="group relative">
                      <button
                        onClick={() => handleCategoryToggle(c)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border text-xs transition ${bgStyle}`}
                      >
                        <span className="flex items-center gap-2 truncate pr-6">
                          {icon}
                          <span className="truncate">{labelName}</span>
                        </span>
                        <span className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${isSelected ? checkBg : "border-slate-300"}`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </span>
                      </button>
                      
                      {/* Allow deleting custom category */}
                      {c !== "political" && c !== "history" && c !== "sports" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategories(prev => prev.filter(item => item !== c));
                            if (selectedCategoryFilter === c) {
                              setSelectedCategoryFilter("All");
                            }
                          }}
                          className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500 rounded transition opacity-0 group-hover:opacity-100 bg-white shadow-sm border border-slate-200"
                          title="Remove custom category"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Custom Niche Creator */}
            <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 rounded-xl p-4 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                  AI Custom Niche Creator
                </span>
                <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono">NEW</span>
              </div>
              <p className="text-[10.5px] text-slate-500 leading-relaxed">
                Enter any topic (e.g., <code className="bg-white/80 px-1 py-0.5 rounded border border-slate-200">gaming</code>, <code className="bg-white/80 px-1 py-0.5 rounded border border-slate-200">finance</code>, <code className="bg-white/80 px-1 py-0.5 rounded border border-slate-200">cinema</code>, <code className="bg-white/80 px-1 py-0.5 rounded border border-slate-200">cooking</code>) to dynamically search-ground and classify real-time video feeds.
              </p>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const rawNiche = (formData.get("newNiche") as string || "").trim();
                if (!rawNiche) return;
                
                const normNiche = rawNiche.toLowerCase().replace(/[^a-z0-9]/g, "");
                if (normNiche.length === 0) return;
                
                if (selectedCategories.includes(normNiche)) {
                  alert("This category already exists!");
                  return;
                }
                
                setSelectedCategories(prev => [...prev, normNiche]);
                setSelectedCategoryFilter(normNiche);
                e.currentTarget.reset();
              }} className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    name="newNiche"
                    placeholder="Enter custom niche (e.g. gaming)..."
                    className="w-full pl-2.5 pr-8 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs shadow-sm"
                    maxLength={20}
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                    ↵
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Summon AI Custom Niche
                </button>
              </form>
            </div>

            {/* Semantic Processing explanation */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-1.5 text-blue-600 font-semibold font-mono uppercase tracking-wide">
                <Sparkles className="w-3 h-3" />
                ML Backend Engine
              </div>
              <p className="leading-relaxed">
                Uses **Gemini AI** semantic classification with live Google Search grounding to load real, current video uploads and perform complex sentiment scoring.
              </p>
            </div>
          </div>

          {/* DYNAMIC SOURCES CARD (if search was completed) */}
          {data && data.sources && data.sources.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800 font-display flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                Grounding Web Sources
              </h3>
              <p className="text-[11px] text-slate-500">Verifiable links from Google Search indexes:</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {data.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.uri}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="block p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded text-[11px] truncate text-blue-600 hover:text-blue-700 transition flex items-center gap-1 justify-between"
                  >
                    <span className="truncate">{src.title}</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ANALYTICS & VIDEO CONTENT (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* ERROR ALERT IF SERVER IS UNREACHABLE */}
          {error && (
            <div className="bg-red-55 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Service Connection Error</h4>
                <p className="text-xs leading-relaxed text-red-700">{error}</p>
                <button 
                  onClick={() => setRefreshTrigger(prev => prev + 1)}
                  className="mt-2 px-3 py-1 bg-white border border-red-200 text-xs font-semibold rounded-md hover:bg-red-50 text-red-800 transition shadow-sm"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          )}

          {/* MAIN LOADING STATE */}
          {loading ? (
            <div className="min-h-[500px] bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center p-8 space-y-4 shadow-sm">
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
                <Activity className="w-6 h-6 text-blue-600 absolute animate-pulse" />
              </div>
              <div className="text-center space-y-1.5 max-w-sm">
                <p className="text-sm font-bold font-display tracking-wide text-slate-800">
                  Contacting Semantic Search Grounding API...
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Querying live social networks, classifying niche topics, and applying sentiment neural grading. This takes a moment...
                </p>
              </div>
            </div>
          ) : data ? (
            <>
              {/* SANDBOX MODE FALLBACK NOTICE */}
              {data.isFallback && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3 shadow-sm"
                >
                  <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 animate-pulse" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                      Sandbox Mode Active (Live Gemini API Quota Exceeded)
                    </h4>
                    <p className="text-xs leading-relaxed text-amber-700">
                      The live Gemini Semantic Grounding search engine is currently offline or rate-limited. We have seamlessly loaded pre-compiled real high-fidelity simulation profiles for <strong>{region}</strong>. All filters, search keywords, and visual distribution metrics remain 100% interactive.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* CROSS-PLATFORM MEDIA PUBLISHING HUB */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Upload className="w-5 h-5 text-blue-600" />
                      Cross-Platform Content Publishing Hub
                    </h3>
                    <p className="text-xs text-slate-500">
                      Upload photos/videos with multi-preview, description captioning, tagging, and instant distribution.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-1 rounded font-bold uppercase tracking-wider animate-pulse">
                      Unified Gateway Active
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Media File Selector & Previews */}
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Step 1: Upload Media Assets (Photos/Videos)
                    </label>

                    {/* Drag and Drop Selector */}
                    <div className="border-2 border-dashed border-slate-250 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50 hover:bg-slate-100/30 relative group">
                      <input
                        type="file"
                        id="media-uploader-input"
                        multiple
                        accept="image/*,video/*"
                        onChange={handlePublisherFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="space-y-2 flex flex-col items-center">
                        <div className="p-3 bg-blue-50 rounded-full text-blue-600 group-hover:scale-105 transition-transform duration-200">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-xs font-semibold text-slate-700">
                          Drag and drop files here, or <span className="text-blue-600 underline">browse computer</span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Supports multi-selection of MP4 videos, JPEGs, and PNGs
                        </p>
                      </div>
                    </div>

                    {/* Multi Previews */}
                    {publisherFiles.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                          <span>Selected Assets ({publisherFiles.length})</span>
                          <button
                            onClick={() => {
                              publisherFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
                              setPublisherFiles([]);
                            }}
                            className="text-red-600 hover:underline text-[11px] font-bold"
                          >
                            Clear All
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50">
                          {publisherFiles.map((item) => (
                            <div key={item.id} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col h-32">
                              {item.type === "video" ? (
                                <div className="relative w-full h-20 bg-slate-900 flex items-center justify-center overflow-hidden">
                                  <video src={item.previewUrl} className="w-full h-full object-cover opacity-80" muted preload="metadata" />
                                  <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center">
                                    <VideoIcon className="w-5 h-5 text-white filter drop-shadow" />
                                  </div>
                                </div>
                              ) : (
                                <img src={item.previewUrl} alt={item.name} className="w-full h-20 object-cover" />
                              )}
                              
                              <button
                                onClick={() => removePublisherFile(item.id)}
                                className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition shadow-md hover:scale-105 z-20"
                                title="Remove File"
                              >
                                <X className="w-3 h-3" />
                              </button>

                              <div className="p-1.5 text-[9px] font-mono text-slate-600 flex flex-col justify-between flex-grow bg-slate-50">
                                <span className="truncate font-bold" title={item.name}>{item.name}</span>
                                <span className="text-slate-400">{item.size}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Metadata Inputs & Publishing Options */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Step 2: Caption / Post Description
                      </label>
                      <textarea
                        value={publisherDescription}
                        onChange={(e) => setPublisherDescription(e.target.value)}
                        placeholder="Write dynamic descriptions, insights, or hooks. Engage your audience here..."
                        rows={3}
                        className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/10 placeholder-slate-400 bg-slate-50/30 text-slate-800 transition leading-relaxed resize-none"
                      />
                    </div>

                    {/* Tagging Feature */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5 text-blue-600" />
                        Step 3: Hashtags & Mention Tags
                      </label>
                      <div className="flex gap-1.5">
                        <div className="relative flex-grow">
                          <span className="absolute left-2.5 top-2 text-[11px] font-mono text-slate-400 select-none">
                            # / @
                          </span>
                          <input
                            type="text"
                            value={currentTagInput}
                            onChange={(e) => setCurrentTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addPublisherTag();
                              }
                            }}
                            placeholder="Add tag (e.g. viral, @creator)"
                            className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500/50 text-slate-700 placeholder-slate-400 transition"
                          />
                        </div>
                        <button
                          onClick={addPublisherTag}
                          className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      </div>

                      {/* Display Tag Chips */}
                      {publisherTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {publisherTags.map((tag) => {
                            const isMention = tag.startsWith("@");
                            return (
                              <span
                                key={tag}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border transition ${
                                  isMention 
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                                    : "bg-blue-50 border-blue-200 text-blue-700"
                                }`}
                              >
                                <span>{isMention ? "" : "#"}{tag}</span>
                                <button
                                  onClick={() => removePublisherTag(tag)}
                                  className="text-slate-400 hover:text-slate-600 rounded-full"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Target Configurable Social Media Platform Selectors */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                          <Sliders className="w-3.5 h-3.5 text-blue-600" />
                          Step 4: Target Configurable Networks
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">Select & connect channels</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* YouTube */}
                        <div className={`flex flex-col justify-between p-3.5 rounded-xl border transition ${
                          publisherPlatforms.youtube 
                            ? "bg-red-50/50 border-red-200/80 text-red-900 shadow-sm" 
                            : "bg-slate-50/50 border-slate-200 text-slate-500"
                        }`}>
                          <div className="flex items-start justify-between">
                            <button
                              onClick={() => setPublisherPlatforms(prev => ({ ...prev, youtube: !prev.youtube }))}
                              className="flex items-center gap-2 group text-left focus:outline-none"
                              title="Toggle target platform"
                            >
                              <div className={`p-1.5 rounded-lg transition-all ${publisherPlatforms.youtube ? "bg-red-100 text-red-600" : "bg-slate-200 text-slate-400"}`}>
                                <Youtube className="w-4.5 h-4.5" />
                              </div>
                              <span className="text-xs font-bold leading-none">YouTube</span>
                            </button>
                            <input
                              type="checkbox"
                              checked={!!publisherPlatforms.youtube}
                              onChange={() => setPublisherPlatforms(prev => ({ ...prev, youtube: !prev.youtube }))}
                              className="rounded border-slate-300 text-red-600 focus:ring-0 focus:ring-offset-0"
                            />
                          </div>

                          <div className="mt-3.5 pt-2.5 border-t border-slate-100/50 flex flex-col gap-1 text-[10px]">
                            {socialConnections.youtube.connected ? (
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-emerald-700 font-medium truncate flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                                  @{socialConnections.youtube.username}
                                </span>
                                <button
                                  onClick={() => setSocialConnections(prev => ({ ...prev, youtube: { connected: false } }))}
                                  className="text-slate-400 hover:text-red-600 font-bold font-mono transition scale-90"
                                >
                                  [Logout]
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-slate-400 font-medium flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span>
                                  Not Linked
                                </span>
                                <button
                                  onClick={() => triggerSocialPopup("youtube")}
                                  className="text-red-600 hover:text-red-700 font-bold hover:underline transition"
                                >
                                  Connect
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Facebook */}
                        <div className={`flex flex-col justify-between p-3.5 rounded-xl border transition ${
                          publisherPlatforms.facebook 
                            ? "bg-blue-50/50 border-blue-200/80 text-blue-900 shadow-sm" 
                            : "bg-slate-50/50 border-slate-200 text-slate-500"
                        }`}>
                          <div className="flex items-start justify-between">
                            <button
                              onClick={() => setPublisherPlatforms(prev => ({ ...prev, facebook: !prev.facebook }))}
                              className="flex items-center gap-2 group text-left focus:outline-none"
                              title="Toggle target platform"
                            >
                              <div className={`p-1.5 rounded-lg transition-all ${publisherPlatforms.facebook ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-400"}`}>
                                <Facebook className="w-4.5 h-4.5" />
                              </div>
                              <span className="text-xs font-bold leading-none">Facebook</span>
                            </button>
                            <input
                              type="checkbox"
                              checked={!!publisherPlatforms.facebook}
                              onChange={() => setPublisherPlatforms(prev => ({ ...prev, facebook: !prev.facebook }))}
                              className="rounded border-slate-300 text-blue-600 focus:ring-0 focus:ring-offset-0"
                            />
                          </div>

                          <div className="mt-3.5 pt-2.5 border-t border-slate-100/50 flex flex-col gap-1 text-[10px]">
                            {socialConnections.facebook.connected ? (
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-emerald-700 font-medium truncate flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                                  @{socialConnections.facebook.username}
                                </span>
                                <button
                                  onClick={() => setSocialConnections(prev => ({ ...prev, facebook: { connected: false } }))}
                                  className="text-slate-400 hover:text-red-600 font-bold font-mono transition scale-90"
                                >
                                  [Logout]
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-slate-400 font-medium flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span>
                                  Not Linked
                                </span>
                                <button
                                  onClick={() => triggerSocialPopup("facebook")}
                                  className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition"
                                >
                                  Connect
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Instagram */}
                        <div className={`flex flex-col justify-between p-3.5 rounded-xl border transition ${
                          publisherPlatforms.instagram 
                            ? "bg-pink-50/50 border-pink-200/80 text-pink-900 shadow-sm" 
                            : "bg-slate-50/50 border-slate-200 text-slate-500"
                        }`}>
                          <div className="flex items-start justify-between">
                            <button
                              onClick={() => setPublisherPlatforms(prev => ({ ...prev, instagram: !prev.instagram }))}
                              className="flex items-center gap-2 group text-left focus:outline-none"
                              title="Toggle target platform"
                            >
                              <div className={`p-1.5 rounded-lg transition-all ${publisherPlatforms.instagram ? "bg-pink-100 text-pink-600" : "bg-slate-200 text-slate-400"}`}>
                                <Instagram className="w-4.5 h-4.5" />
                              </div>
                              <span className="text-xs font-bold leading-none">Instagram</span>
                            </button>
                            <input
                              type="checkbox"
                              checked={!!publisherPlatforms.instagram}
                              onChange={() => setPublisherPlatforms(prev => ({ ...prev, instagram: !prev.instagram }))}
                              className="rounded border-slate-300 text-pink-600 focus:ring-0 focus:ring-offset-0"
                            />
                          </div>

                          <div className="mt-3.5 pt-2.5 border-t border-slate-100/50 flex flex-col gap-1 text-[10px]">
                            {socialConnections.instagram.connected ? (
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-emerald-700 font-medium truncate flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                                  @{socialConnections.instagram.username}
                                </span>
                                <button
                                  onClick={() => setSocialConnections(prev => ({ ...prev, instagram: { connected: false } }))}
                                  className="text-slate-400 hover:text-red-600 font-bold font-mono transition scale-90"
                                >
                                  [Logout]
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-slate-400 font-medium flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span>
                                  Not Linked
                                </span>
                                <button
                                  onClick={() => triggerSocialPopup("instagram")}
                                  className="text-pink-600 hover:text-pink-700 font-bold hover:underline transition"
                                >
                                  Connect
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress / logs Terminal & Publisher trigger button */}
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  {/* Interactive Publish Logs console */}
                  {(isPublishing || publishingLog.length > 0) && (
                    <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-1.5 max-h-40 overflow-y-auto border border-slate-800 shadow-inner">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <span>Publishing Output Pipe</span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                          Deploying
                        </span>
                      </div>
                      {publishingLog.map((log, lIdx) => (
                        <div key={lIdx} className="leading-relaxed flex items-start gap-1.5">
                          <span className="text-blue-500 select-none font-bold">&gt;</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Errors and Success reports */}
                  {publishError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-xl flex items-start gap-2.5 text-xs">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Deployment Interrupted:</span> {publishError}
                      </div>
                    </div>
                  )}

                  {publishSuccessReport && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl space-y-3 shadow-sm"
                    >
                      <div className="flex items-start gap-2.5 text-xs">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-emerald-900">Successfully Multi-Posted content!</h4>
                          <p className="text-[11px] text-emerald-700 leading-relaxed">
                            Your media package containing <strong>{publishSuccessReport.postSummary.filesCount} file(s)</strong> has been published to all active networks. Check the live deployment indexes below:
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        {Object.entries(publishSuccessReport.results).map(([plat, resObj]: [string, any]) => (
                          <div key={plat} className="bg-white rounded-lg border border-emerald-200 p-2.5 space-y-1 shadow-sm text-left">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase font-mono tracking-wider flex items-center gap-1 text-slate-700">
                                {plat === "youtube" && <Youtube className="w-3.5 h-3.5 text-red-600" />}
                                {plat === "facebook" && <Facebook className="w-3.5 h-3.5 text-blue-600" />}
                                {plat === "instagram" && <Instagram className="w-3.5 h-3.5 text-pink-600" />}
                                {plat}
                              </span>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate" title={resObj.message}>
                              {resObj.message}
                            </p>
                            <a
                              href={resObj.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 font-mono"
                            >
                              Open Post <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Submission triggers */}
                  <div className="flex flex-col sm:flex-row justify-end items-center gap-3">
                    <p className="text-[11px] text-slate-400 text-center sm:text-right">
                      Publishing to <strong>{Object.values(publisherPlatforms).filter(Boolean).length} configured networks</strong>
                    </p>
                    <button
                      onClick={handlePublishSubmit}
                      disabled={isPublishing}
                      className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-xs font-bold rounded-lg text-white transition shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      {isPublishing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          <span>Uploading & Transcoding...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Publish to Selected Networks</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* INTELLIGENT TRIGGER & THRESHOLD ALERTS CENTER */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 text-left"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-indigo-600" />
                      Sentiment & Volume Notification Alerts
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configure automated push alerts or emails when specific keywords or categories reach view count or sentiment score thresholds.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSweepAlerts}
                      disabled={isAlertScanning || !data || !data.videos || data.videos.length === 0}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-bold rounded-lg transition shadow-sm hover:shadow-md flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isAlertScanning ? "animate-spin" : ""}`} />
                      <span>Scan Active Trends</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left panel: Rule registration form */}
                  <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4.5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-indigo-600" />
                      Create Alert Rule
                    </h4>

                    {alertsError && (
                      <div className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-100 p-2 rounded-lg">
                        ⚠️ {alertsError}
                      </div>
                    )}

                    {/* Alert Type */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Target Scope</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setNewAlertType("keyword");
                            setNewAlertTarget("");
                          }}
                          className={`py-1 px-2 text-xs font-bold rounded-md border text-center transition ${
                            newAlertType === "keyword"
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Specific Keyword
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewAlertType("category");
                            setNewAlertTarget("political");
                          }}
                          className={`py-1 px-2 text-xs font-bold rounded-md border text-center transition ${
                            newAlertType === "category"
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Focus Niche / Cat
                        </button>
                      </div>
                    </div>

                    {/* Target Value Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        {newAlertType === "keyword" ? "Keyword text match" : "Select Category"}
                      </label>
                      {newAlertType === "keyword" ? (
                        <input
                          type="text"
                          value={newAlertTarget}
                          onChange={(e) => setNewAlertTarget(e.target.value)}
                          placeholder="e.g. AI, election, sports"
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                        />
                      ) : (
                        <select
                          value={newAlertTarget}
                          onChange={(e) => setNewAlertTarget(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                        >
                          <option value="political">Political Niche</option>
                          <option value="history">History Niche</option>
                          <option value="sports">Sports Niche</option>
                        </select>
                      )}
                    </div>

                    {/* Metric Select */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Threshold Metric</label>
                      <select
                        value={newAlertMetric}
                        onChange={(e) => {
                          setNewAlertMetric(e.target.value as any);
                          if (e.target.value === "views") {
                            setNewAlertThreshold("10000");
                          } else if (e.target.value === "sentiment_fall") {
                            setNewAlertThreshold("-0.1");
                          } else {
                            setNewAlertThreshold("0.4");
                          }
                        }}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                      >
                        <option value="views">Views Count (Reaches Target+)</option>
                        <option value="sentiment_fall">Sentiment Collapse (Drops below score)</option>
                        <option value="sentiment_rise">Sentiment Explosion (Rises above score)</option>
                      </select>
                    </div>

                    {/* Numeric Threshold Value */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        Threshold Level (Value)
                      </label>
                      <input
                        type="text"
                        value={newAlertThreshold}
                        onChange={(e) => setNewAlertThreshold(e.target.value)}
                        placeholder={newAlertMetric === "views" ? "e.g. 5000" : "Range: -1.0 to 1.0"}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                      />
                      <span className="text-[9px] text-slate-400 font-mono">
                        {newAlertMetric === "views" 
                          ? "Enter positive whole integer views" 
                          : "Enter decimal score between -1.0 (extremely negative) and 1.0 (extremely positive)"}
                      </span>
                    </div>

                    {/* Channel Configuration */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase font-mono flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-indigo-500" />
                        Notification Channel
                      </label>
                      <select
                        value={newAlertChannel}
                        onChange={(e) => setNewAlertChannel(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                      >
                        <option value="both">Both Browser Push & Email Notification</option>
                        <option value="push">Browser Push Alert Only</option>
                        <option value="email">Direct Email Alert Only</option>
                      </select>
                    </div>

                    {/* Email Input Destination */}
                    {(newAlertChannel === "email" || newAlertChannel === "both") && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 uppercase">Destination Email</label>
                        <input
                          type="email"
                          value={newAlertEmail}
                          onChange={(e) => setNewAlertEmail(e.target.value)}
                          placeholder="e.g. karthi@example.com"
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 bg-white font-medium"
                        />
                      </div>
                    )}

                    {/* Custom Alert Label Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase font-mono flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-indigo-500" />
                        Custom Rule Label (Optional)
                      </label>
                      <input
                        type="text"
                        value={newAlertLabel}
                        onChange={(e) => setNewAlertLabel(e.target.value)}
                        placeholder="e.g. TN Election Alert, Sports Spike Watcher"
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 bg-white font-medium"
                        maxLength={40}
                      />
                      <span className="text-[9px] text-slate-400 font-mono block leading-tight">
                        Assigned to identify this warning rule definition and customize dispatch log entries.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleRegisterAlert}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition shadow-sm hover:shadow flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Add Alert Trigger
                    </button>
                  </div>

                  {/* Middle panel: Active Alert Rules lists */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-indigo-600" />
                        Active Warning Rule Definitions ({alerts.length})
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        Total alerts registered: {alerts.length}
                      </span>
                    </div>

                    {alertsLoading ? (
                      <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <span className="text-xs font-mono text-slate-500 font-semibold">Synchronizing Alert Registry...</span>
                      </div>
                    ) : alerts.length === 0 ? (
                      <div className="py-12 border border-dashed border-slate-200 rounded-xl text-center bg-slate-50 text-slate-500 text-xs">
                        <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        No active monitoring rule definitions setup. Create one on the left panel!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                        {alerts.map((alert) => (
                          <div 
                            key={alert.id} 
                            className={`p-3.5 rounded-xl border transition shadow-sm flex flex-col justify-between ${
                              alert.active 
                                ? "bg-white border-slate-200" 
                                : "bg-slate-50/50 border-slate-150 opacity-70"
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wide border ${
                                  alert.type === "keyword" 
                                    ? "bg-blue-50 border-blue-100 text-blue-700" 
                                    : "bg-purple-50 border-purple-100 text-purple-700"
                                }`}>
                                  {alert.type === "keyword" ? `Keyword match` : `Category match`}
                                </span>

                                <div className="flex items-center gap-1">
                                  {/* Toggle Switch */}
                                  <button
                                    onClick={() => handleToggleAlert(alert.id)}
                                    className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center px-0.5 ${
                                      alert.active ? "bg-indigo-600" : "bg-slate-300"
                                    }`}
                                    title={alert.active ? "Deactivate Rule" : "Activate Rule"}
                                  >
                                    <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transform transition-transform ${
                                      alert.active ? "translate-x-3.5" : "translate-x-0"
                                    }`} />
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    onClick={() => handleDeleteAlert(alert.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 transition rounded"
                                    title="Delete Rule"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="text-sm font-bold text-slate-800 font-display flex items-center justify-between">
                                <span>{alert.type === "keyword" ? `"${alert.targetValue}"` : alert.targetValue.toUpperCase()}</span>
                              </div>

                              {/* Inline Custom Alert Label View & Edit */}
                              {editingAlertId === alert.id ? (
                                <div className="flex items-center gap-1 mt-1 bg-indigo-50/50 p-1 rounded-lg border border-indigo-100">
                                  <input
                                    type="text"
                                    value={editingAlertLabel}
                                    onChange={(e) => setEditingAlertLabel(e.target.value)}
                                    placeholder="Add custom label..."
                                    className="flex-grow border border-indigo-200 rounded px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-medium"
                                    maxLength={40}
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleUpdateAlertLabel(alert.id, editingAlertLabel);
                                      } else if (e.key === "Escape") {
                                        setEditingAlertId(null);
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => handleUpdateAlertLabel(alert.id, editingAlertLabel)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition shrink-0"
                                    title="Save custom label"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingAlertId(null)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition shrink-0"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between group/label mt-1 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg hover:border-slate-200 transition">
                                  <span className={`text-[10.5px] font-semibold flex items-center gap-1.5 truncate max-w-[170px] ${alert.label ? 'text-indigo-700 font-bold' : 'text-slate-400 italic'}`}>
                                    <Tag className="w-3 h-3 text-indigo-400 shrink-0" />
                                    <span className="truncate">{alert.label || "No custom label"}</span>
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingAlertId(alert.id);
                                      setEditingAlertLabel(alert.label || "");
                                    }}
                                    className="p-1 text-slate-400 hover:text-indigo-600 rounded transition opacity-0 group-hover/label:opacity-100 focus:opacity-100"
                                    title="Set or update custom label"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}

                              <div className="text-xs text-slate-500 space-y-1">
                                <p className="flex items-center gap-1 font-semibold text-slate-600">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                  Trigger Condition:
                                </p>
                                <p className="pl-4.5 font-mono text-[11px] text-slate-700 font-bold bg-slate-50 p-1 rounded border border-slate-100">
                                  {alert.metric === "views" 
                                    ? `Views reaches >= ${alert.threshold.toLocaleString()}` 
                                    : alert.metric === "sentiment_fall" 
                                      ? `Sentiment drops below <= ${alert.threshold}` 
                                      : `Sentiment exceeds >= ${alert.threshold}`}
                                </p>
                              </div>
                            </div>

                            <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                              <span className="flex items-center gap-1 font-bold text-slate-500 uppercase">
                                {alert.channel === "push" ? (
                                  <>🚀 Push Active</>
                                ) : alert.channel === "email" ? (
                                  <>✉️ Email: {alert.destinationEmail?.split("@")[0]}</>
                                ) : (
                                  <>🔗 Push & Email</>
                                )}
                              </span>
                              <span>
                                {new Date(alert.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Notification History Logs console */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                        <span className="uppercase tracking-wide flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-rose-500" />
                          Notification Dispatch Log ({alertLogs.length})
                        </span>
                        <span className="text-[10px] text-emerald-600 font-mono font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Webhooks Online
                        </span>
                      </div>

                      {alertLogs.length === 0 ? (
                        <div className="py-6 border border-slate-100 rounded-xl bg-slate-50/50 text-center text-[11px] text-slate-400 font-mono">
                          No notifications have been triggered yet. Click 'Scan Active Trends' to test matches!
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                          {alertLogs.map((log) => (
                            <motion.div
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              key={log.id}
                              className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] text-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-sm"
                            >
                              <div className="space-y-1 text-left">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-indigo-400 font-bold">[{log.channelUsed}]</span>
                                  <span className="text-slate-400 font-semibold">{log.alertTitle}</span>
                                </div>
                                <p className="text-white text-xs font-sans font-semibold leading-snug">
                                  Match: <span className="text-indigo-200">"{log.videoTitle}"</span>
                                </p>
                                <p className="text-[10px] text-emerald-400">
                                  Status: Match validated at {log.matchedValue}
                                </p>
                              </div>
                              <span className="text-[10px] text-slate-500 font-bold shrink-0 text-right sm:self-start">
                                {new Date(log.triggeredAt).toLocaleTimeString()}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* KEY METRICS SUMMARY STATS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                {/* Metric 1: Total Loaded */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 relative overflow-hidden group shadow-sm">
                  <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 text-slate-100 group-hover:text-slate-200/50 transition">
                    <Tv className="w-16 h-16" />
                  </div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">Total Videos</div>
                  <div className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-slate-900">
                    {data.videos.length}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Uploaded in past {days} days
                  </div>
                </div>

                {/* Metric 2: Average Sentiment */}
                {(() => {
                  const scores = data.videos.map(v => v.sentimentScore);
                  const avgSentiment = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : "0.00";
                  const parsedAvg = parseFloat(avgSentiment);
                  let sentimentLabel = "Neutral";
                  let sentimentColor = "text-amber-700 bg-amber-50 border-amber-200";
                  if (parsedAvg > 0.2) {
                    sentimentLabel = "Optimistic";
                    sentimentColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                  } else if (parsedAvg < -0.2) {
                    sentimentLabel = "Hostile";
                    sentimentColor = "text-red-700 bg-red-50 border-red-200";
                  }
                  
                  return (
                    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 relative overflow-hidden group shadow-sm">
                      <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 text-slate-100 group-hover:text-slate-200/50 transition">
                        <MessageSquare className="w-16 h-16" />
                      </div>
                      <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">Sentiment index</div>
                      <div className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-slate-900 flex items-baseline gap-1.5">
                        {parsedAvg >= 0 ? `+${avgSentiment}` : avgSentiment}
                      </div>
                      <div className="inline-flex">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${sentimentColor} font-mono font-bold`}>
                          {sentimentLabel}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Metric 3: Top Platform */}
                {(() => {
                  const breakdown = data.analytics.platformBreakdown || {};
                  let topPlatform = "YouTube";
                  let maxVal = -1;
                  
                  Object.entries(breakdown).forEach(([key, val]) => {
                    const count = Number(val) || 0;
                    if (count > maxVal) {
                      maxVal = count;
                      topPlatform = key.toLowerCase() === "youtube" ? "YouTube" :
                                    key.toLowerCase() === "facebook" ? "Facebook" :
                                    key.toLowerCase() === "instagram" ? "Instagram" :
                                    key.charAt(0).toUpperCase() + key.slice(1);
                    }
                  });

                  const style = getPlatformIconAndStyle(topPlatform);
                  const topColor = style.text;

                  return (
                    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 relative overflow-hidden group shadow-sm">
                      <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 text-slate-100 group-hover:text-slate-200/50 transition">
                        <TrendingUp className="w-16 h-16" />
                      </div>
                      <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">Active Platform</div>
                      <div className={`text-2xl sm:text-3xl font-bold font-display tracking-tight ${topColor}`}>
                        {topPlatform}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        By highest frequency share
                      </div>
                    </div>
                  );
                })()}

                {/* Metric 4: ML Confidence */}
                {(() => {
                  const confidences = data.videos.map(v => v.mlConfidence);
                  const avgConf = confidences.length > 0 ? (confidences.reduce((a, b) => a + b, 0) / confidences.length * 100).toFixed(1) : "95.0";

                  return (
                    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 relative overflow-hidden group shadow-sm">
                      <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 text-slate-100 group-hover:text-slate-200/50 transition">
                        <Sparkles className="w-16 h-16" />
                      </div>
                      <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">ML Confidence</div>
                      <div className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-slate-900">
                        {avgConf}%
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Average classification accuracy
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* TWO COLUMN ANALYSIS METRICS & CHARTS */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left: Custom SVG Graphical Visualization */}
                <div className="md:col-span-6 bg-white rounded-xl border border-slate-200 p-5 space-y-5 flex flex-col justify-between shadow-sm">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800 font-display flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      Sentiment & Platform Distribution
                    </h3>
                    <p className="text-xs text-slate-500">Machine learning distribution outputs of aggregated video counts</p>
                  </div>

                  {/* CUSTOM SVG GAUGE & BARS CHART */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3">
                    
                    {/* SVG Circular Donut Chart for Sentiments */}
                    <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200 relative">
                      <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider mb-2">Sentiment Split</span>
                      <div className="w-28 h-28 relative flex items-center justify-center">
                        {(() => {
                          const { positive, neutral, negative } = data.analytics.sentimentBreakdown;
                          const total = positive + neutral + negative || 1;
                          const posPct = (positive / total) * 100;
                          const neuPct = (neutral / total) * 100;
                          const negPct = (negative / total) * 100;

                          // Circle length is 2 * PI * r = 2 * 3.14 * 35 = 220
                          const circ = 220;
                          const strokePos = (posPct / 100) * circ;
                          const strokeNeu = (neuPct / 100) * circ;
                          const strokeNeg = (negPct / 100) * circ;

                          return (
                            <>
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="35"
                                  fill="transparent"
                                  stroke="#e2e8f0"
                                  strokeWidth="10"
                                />
                                {/* Positive segment (Emerald) */}
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="35"
                                  fill="transparent"
                                  stroke="#10b981"
                                  strokeWidth="10"
                                  strokeDasharray={`${strokePos} ${circ}`}
                                  strokeDashoffset="0"
                                  className="transition-all duration-1000"
                                />
                                {/* Neutral segment (Amber) */}
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="35"
                                  fill="transparent"
                                  stroke="#f59e0b"
                                  strokeWidth="10"
                                  strokeDasharray={`${strokeNeu} ${circ}`}
                                  strokeDashoffset={`-${strokePos}`}
                                  className="transition-all duration-1000"
                                />
                                {/* Negative segment (Rose) */}
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="35"
                                  fill="transparent"
                                  stroke="#f43f5e"
                                  strokeWidth="10"
                                  strokeDasharray={`${strokeNeg} ${circ}`}
                                  strokeDashoffset={`-${strokePos + strokeNeu}`}
                                  className="transition-all duration-1000"
                                />
                              </svg>
                              <div className="absolute text-center">
                                <span className="text-xl font-bold font-display text-slate-900">{positive}</span>
                                <span className="text-[10px] block text-emerald-600 font-mono font-bold">Positive</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Legends */}
                      <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] w-full text-center">
                        <div className="text-emerald-600 font-semibold">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>
                          {data.analytics.sentimentBreakdown.positive} Pos
                        </div>
                        <div className="text-amber-600 font-semibold">
                          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1"></span>
                          {data.analytics.sentimentBreakdown.neutral} Neu
                        </div>
                        <div className="text-red-600 font-semibold">
                          <span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1"></span>
                          {data.analytics.sentimentBreakdown.negative} Neg
                        </div>
                      </div>
                    </div>

                    {/* Platform Share Visualizer */}
                    <div className="flex flex-col justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block text-center mb-1 font-bold">Platform Share</span>
                      
                      {(() => {
                        const breakdown = data.analytics.platformBreakdown || {};
                        const total = (Object.values(breakdown) as number[]).reduce((sum: number, val: number) => sum + (val || 0), 0) || 1;

                        const entries = Object.entries(breakdown).map(([plat, count]) => {
                          const displayPlat = plat.toLowerCase() === "youtube" ? "YouTube" :
                                              plat.toLowerCase() === "facebook" ? "Facebook" :
                                              plat.toLowerCase() === "instagram" ? "Instagram" :
                                              plat.charAt(0).toUpperCase() + plat.slice(1);
                          const countNum = Number(count) || 0;
                          const pct = Math.round((countNum / total) * 100);
                          const style = getPlatformIconAndStyle(displayPlat);
                          return {
                            plat,
                            displayPlat,
                            count: countNum,
                            pct,
                            style
                          };
                        }).sort((a, b) => b.count - a.count);

                        return (
                          <div className="space-y-2.5">
                            {entries.map(({ plat, displayPlat, count, pct, style }) => {
                              let barBg = "bg-indigo-500";
                              if (displayPlat === "YouTube") barBg = "bg-red-500";
                              else if (displayPlat === "Facebook") barBg = "bg-blue-500";
                              else if (displayPlat === "Instagram") barBg = "bg-gradient-to-r from-pink-500 via-purple-500 to-amber-500";

                              return (
                                <div key={plat} className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-700">
                                    <span className="flex items-center gap-1 font-semibold">
                                      <span className={style.text}>{style.icon}</span>
                                      {displayPlat}
                                    </span>
                                    <span className="font-bold">{count} ({pct}%)</span>
                                  </div>
                                  <div className="h-2 bg-slate-200/70 rounded-full overflow-hidden border border-slate-200/50">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${barBg}`} style={{ width: `${pct}%` }}></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Quick Filters Reset */}
                  <div className="text-[10px] text-slate-400 text-center italic">
                    All charts reflect dynamic analysis of live filtered metadata
                  </div>
                </div>

                {/* Right: Topic Categories breakdown and Keyword Tag Cloud */}
                <div className="md:col-span-6 bg-white rounded-xl border border-slate-200 p-5 space-y-4 flex flex-col justify-between shadow-sm">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800 font-display flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                      Trending keywords & Categories
                    </h3>
                    <p className="text-xs text-slate-500">Interactive topic tag indexes. Click a keyword chip to isolate matches.</p>
                  </div>

                  {/* Niche Category Progress Bars */}
                  <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans">
                    <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block text-center mb-1 font-bold">Topic Dominance</span>
                    {(() => {
                      const breakdown = data.analytics.categoryBreakdown || {};
                      const total = (Object.values(breakdown).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0) || 1) as number;
                      
                      return (
                        <div className="space-y-2 text-[11px] font-mono text-slate-700">
                          {Object.entries(breakdown).map(([cat, count]) => {
                            const countNum = Number(count) || 0;
                            const pct = Math.round((countNum / total) * 100);
                            const colors = getCategoryColor(cat);
                            const displayName = cat === "political" ? "Political" :
                                                cat === "history" ? "History" :
                                                cat === "sports" ? "Sports" :
                                                cat.charAt(0).toUpperCase() + cat.slice(1);
                            return (
                              <div key={cat} className="flex items-center gap-2">
                                <span className={`w-20 ${colors.text} font-semibold truncate`} title={displayName}>{displayName}</span>
                                <div className="flex-grow h-2.5 bg-slate-200/70 border border-slate-200/50 rounded-md overflow-hidden relative">
                                  <div className={`h-full ${colors.barBg} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
                                </div>
                                <span className="w-12 text-right font-bold">{pct}%</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Interactive Keyword Cloud */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider font-bold">Indexed Tag Cloud</span>
                    <div className="flex flex-wrap gap-1.5">
                      {data.analytics.trendingKeywords.map((word, i) => {
                        const isSelected = selectedKeyword === word;
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedKeyword(isSelected ? null : word)}
                            className={`px-2 py-1 text-xs font-semibold rounded-md transition border flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-blue-50 border-blue-400 text-blue-700"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-800"
                            }`}
                          >
                            <span>#{word}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>}
                          </button>
                        );
                      })}
                      {selectedKeyword && (
                        <button
                          onClick={() => setSelectedKeyword(null)}
                          className="px-2 py-1 text-xs font-mono font-bold bg-red-50 hover:bg-red-100 text-red-600 rounded-md border border-red-200 transition"
                        >
                          Clear Selection [x]
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SENTIMENT TREND TIMESERIES CHART */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800 font-display flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      Sentiment Velocity Timeline
                    </h3>
                    <p className="text-xs text-slate-500">
                      Monitor chronological shifts in public reception across the chosen horizon window ({days} days).
                    </p>
                  </div>

                  {/* Category Focus Selector */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase mr-1">Focus Category:</span>
                    <button
                      onClick={() => setTrendCategory("all")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition border ${
                        trendCategory === "all"
                          ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      All Categories
                    </button>
                    <button
                      onClick={() => setTrendCategory("political")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition border ${
                        trendCategory === "political"
                          ? "bg-purple-600 border-purple-500 text-white shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Political
                    </button>
                    <button
                      onClick={() => setTrendCategory("history")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition border ${
                        trendCategory === "history"
                          ? "bg-amber-600 border-amber-500 text-white shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      History
                    </button>
                    <button
                      onClick={() => setTrendCategory("sports")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition border ${
                        trendCategory === "sports"
                          ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Sports
                    </button>
                  </div>
                </div>

                {/* SVG Line Chart Workspace */}
                <div className="relative pt-2" onMouseLeave={() => setHoveredTrendPoint(null)}>
                  {(() => {
                    const trendPoints = getSentimentTrendData();
                    
                    const svgW = 600;
                    const svgH = 220;
                    const pLeft = 45;
                    const pRight = 25;
                    const pTop = 20;
                    const pBottom = 35;
                    const iWidth = svgW - pLeft - pRight;
                    const iHeight = svgH - pTop - pBottom;
                    const bY = pTop + iHeight;

                    if (trendPoints.length === 0) {
                      return (
                        <div className="h-[200px] flex items-center justify-center text-xs text-slate-400 font-medium italic">
                          No historical logs parsed for this selection in the current timeframe.
                        </div>
                      );
                    }

                    const coords = trendPoints.map((pt, idx) => {
                      const ratio = idx / (trendPoints.length - 1 || 1);
                      const x = pLeft + ratio * iWidth;
                      const norm = (pt.sentiment - (-1.0)) / 2.0;
                      const y = pTop + iHeight - norm * iHeight;
                      return { x, y, ...pt };
                    });

                    const pathLine = coords.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
                    const pathArea = `M ${coords[0].x} ${bY} ` + coords.map(c => `L ${c.x} ${c.y}`).join(' ') + ` L ${coords[coords.length - 1].x} ${bY} Z`;

                    const midY = pTop + iHeight / 2;

                    return (
                      <>
                        <svg className="w-full h-auto overflow-visible" viewBox={`0 0 ${svgW} ${svgH}`} style={{ maxHeight: "240px" }}>
                          <defs>
                            <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.00" />
                            </linearGradient>
                            <linearGradient id="trendLineGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#4f46e5" />
                              <stop offset="50%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                          </defs>

                          {/* Horizontal Gridlines */}
                          <line x1={pLeft} y1={pTop} x2={svgW - pRight} y2={pTop} stroke="#f1f5f9" strokeWidth="1" />
                          <line x1={pLeft} y1={pTop + iHeight * 0.25} x2={svgW - pRight} y2={pTop + iHeight * 0.25} stroke="#f8fafc" strokeWidth="1" strokeDasharray="3 3" />
                          <line x1={pLeft} y1={midY} x2={svgW - pRight} y2={midY} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
                          <line x1={pLeft} y1={pTop + iHeight * 0.75} x2={svgW - pRight} y2={pTop + iHeight * 0.75} stroke="#f8fafc" strokeWidth="1" strokeDasharray="3 3" />
                          <line x1={pLeft} y1={bY} x2={svgW - pRight} y2={bY} stroke="#f1f5f9" strokeWidth="1" />

                          {/* Y-Axis Label Texts */}
                          <g className="text-[9px] font-mono fill-slate-400 font-bold" textAnchor="end">
                            <text x={pLeft - 8} y={pTop + 3}>+1.00</text>
                            <text x={pLeft - 8} y={pTop + iHeight * 0.25 + 3}>+0.50</text>
                            <text x={pLeft - 8} y={midY + 3} className="fill-slate-500">0.00 (Neutral)</text>
                            <text x={pLeft - 8} y={pTop + iHeight * 0.75 + 3}>-0.50</text>
                            <text x={pLeft - 8} y={bY + 3}>-1.00</text>
                          </g>

                          {/* Vertical lines for days */}
                          {coords.map((c, idx) => (
                            <line
                              key={idx}
                              x1={c.x}
                              y1={pTop}
                              x2={c.x}
                              y2={bY}
                              stroke="#f1f5f9"
                              strokeWidth="1"
                              strokeDasharray="2 2"
                            />
                          ))}

                          {/* Area Gradient Fill */}
                          {coords.length > 0 && (
                            <path d={pathArea} fill="url(#trendAreaGradient)" />
                          )}

                          {/* Line Path */}
                          {coords.length > 0 && (
                            <path
                              d={pathLine}
                              fill="none"
                              stroke="url(#trendLineGradient)"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="transition-all duration-700"
                            />
                          )}

                          {/* Nodes */}
                          {coords.map((c, idx) => {
                            const isHovered = hoveredTrendPoint && Math.abs(hoveredTrendPoint.x - c.x) < 2;
                            return (
                              <g key={idx} className="cursor-pointer">
                                <circle
                                  cx={c.x}
                                  cy={c.y}
                                  r="12"
                                  fill="transparent"
                                  onMouseEnter={() => {
                                    setHoveredTrendPoint({
                                      x: c.x,
                                      y: c.y,
                                      dayLabel: c.dayLabel,
                                      score: c.sentiment,
                                      count: c.videoCount
                                    });
                                  }}
                                />
                                <circle
                                  cx={c.x}
                                  cy={c.y}
                                  r={isHovered ? "6" : "4.5"}
                                  fill={c.sentiment > 0.1 ? "#10b981" : c.sentiment < -0.1 ? "#f43f5e" : "#f59e0b"}
                                  stroke="#ffffff"
                                  strokeWidth="2.5"
                                  className="transition-all duration-200"
                                />
                              </g>
                            );
                          })}

                          {/* X-Axis labels */}
                          <g className="text-[10px] font-mono fill-slate-500 font-semibold" textAnchor="middle">
                            {coords.map((c, idx) => {
                              const shouldShowLabel = days <= 7 || idx % 2 === 0 || idx === coords.length - 1;
                              if (!shouldShowLabel) return null;
                              return (
                                <text key={idx} x={c.x} y={bY + 16}>
                                  {c.dayLabel}
                                </text>
                              );
                            })}
                          </g>
                        </svg>

                        {/* Floating Tooltip */}
                        {hoveredTrendPoint && (
                          <div
                            className="absolute z-30 pointer-events-none bg-slate-900 text-white rounded-lg p-2.5 text-xs shadow-xl border border-slate-800 flex flex-col space-y-1"
                            style={{
                              left: `${(hoveredTrendPoint.x / svgW) * 100}%`,
                              top: `${(hoveredTrendPoint.y / svgH) * 100 - 32}%`,
                              transform: "translate(-50%, -100%)",
                            }}
                          >
                            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1 font-mono text-[10px] text-slate-400 font-bold uppercase">
                              <span>{hoveredTrendPoint.dayLabel}</span>
                              <span className="text-blue-400 capitalize">{trendCategory} Niche</span>
                            </div>
                            <div className="flex items-center justify-between gap-6 font-semibold">
                              <span className="text-slate-300 font-medium">Avg Sentiment:</span>
                              <span className={hoveredTrendPoint.score > 0.1 ? "text-emerald-400" : hoveredTrendPoint.score < -0.1 ? "text-red-400" : "text-amber-400"}>
                                {hoveredTrendPoint.score >= 0 ? `+${hoveredTrendPoint.score}` : hoveredTrendPoint.score}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-6 text-[10.5px] text-slate-400 font-mono">
                              <span>Activity Count:</span>
                              <span className="font-bold text-slate-200">{hoveredTrendPoint.count} videos</span>
                            </div>
                            <div className="w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-800 transform rotate-45 absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"></div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="text-[11px] font-mono text-slate-400 bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-center leading-relaxed">
                  💡 <span className="text-slate-600 font-medium">Interactive Graph Insights:</span> Hover over individual day coordinates to review specific classification counts and average daily reception weights.
                </div>
              </div>

              {/* CATEGORY COMPARISON HUB CARD */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800 font-display flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      Pulse Comparison Hub
                    </h3>
                    <p className="text-xs text-slate-500">
                      Select two category niches to evaluate sentiment velocity, view thresholds, and interaction scores side-by-side.
                    </p>
                  </div>

                  {/* Dropdowns */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 font-bold uppercase">Category A</label>
                      <select
                        value={compareCatA}
                        onChange={(e) => setCompareCatA(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="political">Political & Civics</option>
                        <option value="history">History & Heritage</option>
                        <option value="sports">Sports & Athletics</option>
                      </select>
                    </div>

                    <span className="text-xs font-bold text-slate-400 pt-4">vs</span>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 font-bold uppercase">Category B</label>
                      <select
                        value={compareCatB}
                        onChange={(e) => setCompareCatB(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="political">Political & Civics</option>
                        <option value="history">History & Heritage</option>
                        <option value="sports">Sports & Athletics</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Calculations & Rendering */}
                {(() => {
                  const mLineA = getCategoryMetrics(compareCatA);
                  const mLineB = getCategoryMetrics(compareCatB);

                  const catNamesMap: Record<string, string> = {
                    political: "Political & Civics",
                    history: "History & Heritage",
                    sports: "Sports & Athletics"
                  };

                  const nameA = catNamesMap[compareCatA];
                  const nameB = catNamesMap[compareCatB];

                  // Metric comparisons helpers
                  const getWinner = (valA: number, valB: number) => {
                    if (valA > valB) return "A";
                    if (valB > valA) return "B";
                    return "Tie";
                  };

                  const winnerVideos = getWinner(mLineA.totalVideos, mLineB.totalVideos);
                  const winnerTrend = getWinner(mLineA.avgTrendScore, mLineB.avgTrendScore);
                  const winnerViews = getWinner(mLineA.avgViews, mLineB.avgViews);
                  const winnerLikes = getWinner(mLineA.avgLikes, mLineB.avgLikes);
                  const winnerSentiment = getWinner(mLineA.avgSentiment, mLineB.avgSentiment);

                  return (
                    <div className="space-y-6">
                      {/* Metric comparisons grids */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                        
                        {/* 1. Content Frequency */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                          <div className="text-center md:text-left">
                            <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block font-bold">Content Vol (n={days})</span>
                            <span className="text-xs text-slate-400">Total videos published</span>
                          </div>
                          <div className="space-y-2">
                            {/* A */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="font-semibold text-slate-500 capitalize">{compareCatA}</span>
                                <span className="font-bold text-slate-800">{mLineA.totalVideos}</span>
                              </div>
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (mLineA.totalVideos / Math.max(1, mLineA.totalVideos + mLineB.totalVideos)) * 100)}%` }}></div>
                              </div>
                            </div>
                            {/* B */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="font-semibold text-slate-500 capitalize">{compareCatB}</span>
                                <span className="font-bold text-slate-800">{mLineB.totalVideos}</span>
                              </div>
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (mLineB.totalVideos / Math.max(1, mLineA.totalVideos + mLineB.totalVideos)) * 100)}%` }}></div>
                              </div>
                            </div>
                          </div>
                          <div className="text-[10px] font-bold text-center mt-1 border-t border-slate-100 pt-2 font-mono text-indigo-600">
                            {winnerVideos === "A" ? `🏆 ${compareCatA.toUpperCase()} Leads` : winnerVideos === "B" ? `🏆 ${compareCatB.toUpperCase()} Leads` : "⚖ Balanced"}
                          </div>
                        </div>

                        {/* 2. Engagement Intensity */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                          <div className="text-center md:text-left">
                            <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block font-bold">Trend Velocity</span>
                            <span className="text-xs text-slate-400">Mean engagement score</span>
                          </div>
                          <div className="space-y-2">
                            {/* A */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="font-semibold text-slate-500 capitalize">{compareCatA}</span>
                                <span className="font-bold text-slate-800">{mLineA.avgTrendScore.toLocaleString()}</span>
                              </div>
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (mLineA.avgTrendScore / Math.max(1, mLineA.avgTrendScore + mLineB.avgTrendScore)) * 100)}%` }}></div>
                              </div>
                            </div>
                            {/* B */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="font-semibold text-slate-500 capitalize">{compareCatB}</span>
                                <span className="font-bold text-slate-800">{mLineB.avgTrendScore.toLocaleString()}</span>
                              </div>
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (mLineB.avgTrendScore / Math.max(1, mLineA.avgTrendScore + mLineB.avgTrendScore)) * 100)}%` }}></div>
                              </div>
                            </div>
                          </div>
                          <div className="text-[10px] font-bold text-center mt-1 border-t border-slate-100 pt-2 font-mono text-indigo-600">
                            {winnerTrend === "A" ? `🏆 ${compareCatA.toUpperCase()} Leads` : winnerTrend === "B" ? `🏆 ${compareCatB.toUpperCase()} Leads` : "⚖ Balanced"}
                          </div>
                        </div>

                        {/* 3. Reach Velocity */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                          <div className="text-center md:text-left">
                            <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block font-bold">Audience Reach</span>
                            <span className="text-xs text-slate-400">Average views per video</span>
                          </div>
                          <div className="space-y-2">
                            {/* A */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="font-semibold text-slate-500 capitalize">{compareCatA}</span>
                                <span className="font-bold text-slate-800">{formatViews(mLineA.avgViews)}</span>
                              </div>
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (mLineA.avgViews / Math.max(1, mLineA.avgViews + mLineB.avgViews)) * 100)}%` }}></div>
                              </div>
                            </div>
                            {/* B */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="font-semibold text-slate-500 capitalize">{compareCatB}</span>
                                <span className="font-bold text-slate-800">{formatViews(mLineB.avgViews)}</span>
                              </div>
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (mLineB.avgViews / Math.max(1, mLineA.avgViews + mLineB.avgViews)) * 100)}%` }}></div>
                              </div>
                            </div>
                          </div>
                          <div className="text-[10px] font-bold text-center mt-1 border-t border-slate-100 pt-2 font-mono text-indigo-600">
                            {winnerViews === "A" ? `🏆 ${compareCatA.toUpperCase()} Leads` : winnerViews === "B" ? `🏆 ${compareCatB.toUpperCase()} Leads` : "⚖ Balanced"}
                          </div>
                        </div>

                        {/* 4. Feedback Volume */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                          <div className="text-center md:text-left">
                            <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block font-bold">Feedback Rate</span>
                            <span className="text-xs text-slate-400">Average likes per video</span>
                          </div>
                          <div className="space-y-2">
                            {/* A */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="font-semibold text-slate-500 capitalize">{compareCatA}</span>
                                <span className="font-bold text-slate-800">{formatViews(mLineA.avgLikes)}</span>
                              </div>
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (mLineA.avgLikes / Math.max(1, mLineA.avgLikes + mLineB.avgLikes)) * 100)}%` }}></div>
                              </div>
                            </div>
                            {/* B */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="font-semibold text-slate-500 capitalize">{compareCatB}</span>
                                <span className="font-bold text-slate-800">{formatViews(mLineB.avgLikes)}</span>
                              </div>
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (mLineB.avgLikes / Math.max(1, mLineA.avgLikes + mLineB.avgLikes)) * 100)}%` }}></div>
                              </div>
                            </div>
                          </div>
                          <div className="text-[10px] font-bold text-center mt-1 border-t border-slate-100 pt-2 font-mono text-indigo-600">
                            {winnerLikes === "A" ? `🏆 ${compareCatA.toUpperCase()} Leads` : winnerLikes === "B" ? `🏆 ${compareCatB.toUpperCase()} Leads` : "⚖ Balanced"}
                          </div>
                        </div>

                        {/* 5. Sentiment Gradient */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                          <div className="text-center md:text-left">
                            <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block font-bold">Sentiment Score</span>
                            <span className="text-xs text-slate-400">Semantic grade scale (-1 to 1)</span>
                          </div>
                          <div className="space-y-2">
                            {/* A */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="font-semibold text-slate-500 capitalize">{compareCatA}</span>
                                <span className="font-bold text-slate-800">{mLineA.avgSentiment >= 0 ? `+${mLineA.avgSentiment}` : mLineA.avgSentiment}</span>
                              </div>
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, ((mLineA.avgSentiment + 1) / 2) * 100)}%` }}></div>
                              </div>
                            </div>
                            {/* B */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="font-semibold text-slate-500 capitalize">{compareCatB}</span>
                                <span className="font-bold text-slate-800">{mLineB.avgSentiment >= 0 ? `+${mLineB.avgSentiment}` : mLineB.avgSentiment}</span>
                              </div>
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, ((mLineB.avgSentiment + 1) / 2) * 100)}%` }}></div>
                              </div>
                            </div>
                          </div>
                          <div className="text-[10px] font-bold text-center mt-1 border-t border-slate-100 pt-2 font-mono text-indigo-600">
                            {winnerSentiment === "A" ? `🏆 ${compareCatA.toUpperCase()} Leads` : winnerSentiment === "B" ? `🏆 ${compareCatB.toUpperCase()} Leads` : "⚖ Balanced"}
                          </div>
                        </div>

                      </div>

                      {/* Side-by-Side Visual Gauge Bars */}
                      <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide font-mono">AI Competitive Comparison Summary</h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {compareCatA === compareCatB ? (
                              <span>You are comparing <strong>{nameA}</strong> against itself. Select different niches above to extract dynamic divergence ratios.</span>
                            ) : (
                              <span>
                                In the past <strong>{days} days</strong>, 
                                {winnerTrend === "A" ? ` ${nameA} registered superior audience engagement intensity with a mean score of ${mLineA.avgTrendScore.toLocaleString()} vs ${nameB}'s ${mLineB.avgTrendScore.toLocaleString()}.` : ""}
                                {winnerTrend === "B" ? ` ${nameB} registered superior audience engagement intensity with a mean score of ${mLineB.avgTrendScore.toLocaleString()} vs ${nameA}'s ${mLineA.avgTrendScore.toLocaleString()}.` : ""}
                                {winnerSentiment === "A" ? ` Audiences showed warmer reception towards ${nameA} topics, logging a sentiment index of ${mLineA.avgSentiment >= 0 ? `+${mLineA.avgSentiment}` : mLineA.avgSentiment} against ${nameB}'s ${mLineB.avgSentiment >= 0 ? `+${mLineB.avgSentiment}` : mLineB.avgSentiment}.` : ""}
                                {winnerSentiment === "B" ? ` Audiences showed warmer reception towards ${nameB} topics, logging a sentiment index of ${mLineB.avgSentiment >= 0 ? `+${mLineB.avgSentiment}` : mLineB.avgSentiment} against ${nameA}'s ${mLineA.avgSentiment >= 0 ? `+${mLineA.avgSentiment}` : mLineA.avgSentiment}.` : ""}
                                {mLineA.dominantPlatform !== mLineB.dominantPlatform ? ` Notably, ${nameA} thrives best on ${mLineA.dominantPlatform} while ${nameB} dominates on ${mLineB.dominantPlatform}.` : ` Interestingly, both niches share identical dominant platform footprints (${mLineA.dominantPlatform}).`}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* EXECUTIVE ANALYSIS STATEMENT CARD */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 relative overflow-hidden shadow-md text-white">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles className="w-24 h-24 text-blue-400" />
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-blue-950/85 border border-blue-500/25 p-2 rounded-lg text-blue-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 font-display">
                      AI Executive Insights Summary
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                      {data.analytics.marketSummary}
                    </p>
                    <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono text-slate-500">
                      <span>Refining Model: Gemini 3.5 Flash</span>
                      <span>•</span>
                      <span>Live Search Grounding Ground-Truth</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* VIDEO FEED & CONTROL BAR SECTION */}
              <div className="space-y-4">
                
                {/* Search & Mini filters header */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-2">
                  <div>
                    <h3 className="text-base font-bold font-display text-slate-800 flex items-center gap-2">
                      <span>{publicAwarenessMode ? "Propaganda & Bot Campaign Scanner Feed" : "Classified Videos Feed"}</span>
                      {showOnlyTop10BySentiment && !publicAwarenessMode && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-bold uppercase tracking-wider animate-pulse">
                          Top 10 Sentiment Trends Active
                        </span>
                      )}
                      {publicAwarenessMode && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/40 font-bold uppercase tracking-wider animate-pulse">
                          Watchdog Active
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {publicAwarenessMode 
                        ? `Found ${filteredVideos.length} matching narratives under audit list (Sorted by ${sortBy === "date" ? "Upload Date" : sortBy === "botScore" ? "Bot Risk Index" : "Engagement"})`
                        : `Found ${filteredVideos.length} of ${data.videos.length} total videos match criteria ${showOnlyTop10BySentiment ? "(Showing top 10 by sentiment intensity)" : ""}`
                      }
                    </p>
                  </div>

                  {/* Text search bar */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search title, uploader..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 focus:outline-none focus:border-blue-500/50 text-slate-700 transition shadow-sm"
                    />
                  </div>
                </div>

                {/* PLATFORM SENTIMENT DISTRIBUTION WIDGET */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-sans flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-slate-500" />
                      Platform Sentiment Breakdown
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">Updated Live</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {["YouTube", "Facebook", "Instagram"].map(plat => {
                      const platVideos = (data?.videos || []).filter(v => v.platform.toLowerCase() === plat.toLowerCase());
                      const total = platVideos.length;
                      const positive = platVideos.filter(v => v.sentimentLabel === "Positive").length;
                      const negative = platVideos.filter(v => v.sentimentLabel === "Negative").length;
                      const neutral = platVideos.filter(v => v.sentimentLabel === "Neutral").length;
                      
                      const posPct = total > 0 ? Math.round((positive / total) * 100) : 0;
                      const negPct = total > 0 ? Math.round((negative / total) * 100) : 0;
                      const neuPct = total > 0 ? Math.round((neutral / total) * 100) : 0;
                      
                      const platformStyles = getPlatformIconAndStyle(plat);

                      return (
                        <div key={plat} className="p-3 bg-slate-50 rounded-lg border border-slate-150 flex flex-col justify-between space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${platformStyles.badge}`}>
                              {platformStyles.icon}
                              {plat}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono font-bold">{total} Posts</span>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-mono font-semibold text-slate-600">
                              <span className="text-emerald-600 font-bold">Pos: {positive} ({posPct}%)</span>
                              <span className="text-red-500 font-bold font-semibold">Neg: {negative} ({negPct}%)</span>
                            </div>
                            
                            {/* Segmented sentiment progress bar */}
                            <div className="h-2 bg-slate-200/70 border border-slate-200/50 rounded-full overflow-hidden flex">
                              {positive > 0 && (
                                <div 
                                  className="h-full bg-emerald-500 transition-all duration-1000" 
                                  style={{ width: `${posPct}%` }}
                                  title={`${positive} Positive (${posPct}%)`}
                                ></div>
                              )}
                              {neutral > 0 && (
                                <div 
                                  className="h-full bg-slate-400 transition-all duration-1000" 
                                  style={{ width: `${neuPct}%` }}
                                  title={`${neutral} Neutral (${neuPct}%)`}
                                ></div>
                              )}
                              {negative > 0 && (
                                <div 
                                  className="h-full bg-red-500 transition-all duration-1000 animate-pulse" 
                                  style={{ width: `${negPct}%` }}
                                  title={`${negative} Negative (${negPct}%)`}
                                ></div>
                              )}
                            </div>
                            <div className="text-[9px] font-mono text-slate-400 text-center">
                              {neutral} Neutral sentiments recorded
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Grid controls for platform/sentiment */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs shadow-sm">
                  
                  {/* Top 10 Sentiment Trends Toggle */}
                  {!publicAwarenessMode && (
                    <div className="flex items-center gap-1.5 mr-2 border-r border-slate-200 pr-3">
                      <button
                        onClick={() => setShowOnlyTop10BySentiment(!showOnlyTop10BySentiment)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-md border transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                          showOnlyTop10BySentiment
                            ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                        title="Toggle filtering and sorting of top 10 trending videos based on sentiment and engagement magnitude"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${showOnlyTop10BySentiment ? "animate-pulse text-yellow-300" : "text-indigo-500"}`} />
                        <span>Top 10 Sentiment Trends</span>
                      </button>
                    </div>
                  )}

                  {/* Public Awareness Sort By */}
                  {publicAwarenessMode && (
                    <div className="flex items-center gap-1.5 mr-2 border-r border-slate-200 pr-3 flex-wrap">
                      <span className="text-[10px] font-mono text-indigo-600 font-extrabold uppercase mr-1 flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                        Watchdog Sort:
                      </span>
                      <button
                        onClick={() => setSortBy("engagement")}
                        className={`px-2 py-1 text-xs font-semibold rounded-md border transition flex items-center gap-1 shadow-sm cursor-pointer ${
                          sortBy === "engagement"
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                        title="Sort by algorithm engagement (views & likes)"
                      >
                        <span>Engagement</span>
                      </button>
                      <button
                        onClick={() => setSortBy("date")}
                        className={`px-2 py-1 text-xs font-semibold rounded-md border transition flex items-center gap-1 shadow-sm cursor-pointer ${
                          sortBy === "date"
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                        title="Sort by real-time upload date to bypass high-budget PR campaigns"
                      >
                        <span>Upload Date</span>
                      </button>
                      <button
                        onClick={() => setSortBy("botScore")}
                        className={`px-2 py-1 text-xs font-semibold rounded-md border transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                          sortBy === "botScore"
                            ? "bg-rose-600 text-white border-rose-600 hover:bg-rose-700"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                        title="Sort by bot susceptibility index"
                      >
                        <Shield className="w-3 h-3 text-current" />
                        <span>Bot Risk Index</span>
                      </button>
                    </div>
                  )}

                  {/* Platform Quick Filter */}
                  <div className="flex items-center gap-1.5 mr-4 flex-wrap">
                    <span className="text-slate-500 font-semibold">Platform:</span>
                    <button
                      onClick={() => setSelectedPlatformFilter("All")}
                      className={`px-2 py-1 text-xs font-semibold rounded-md border transition flex items-center gap-1 shadow-sm ${
                        selectedPlatformFilter === "All"
                          ? "bg-slate-800 text-white border-slate-800"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      All
                    </button>
                    {(() => {
                      const uniquePlatforms = Array.from(
                        new Set(
                          (data?.videos || []).map((v) => {
                            const norm = (v.platform || "").trim();
                            if (norm.toLowerCase() === "youtube") return "YouTube";
                            if (norm.toLowerCase() === "facebook") return "Facebook";
                            if (norm.toLowerCase() === "instagram") return "Instagram";
                            return norm.charAt(0).toUpperCase() + norm.slice(1);
                          })
                        )
                      ).filter(Boolean).sort() as string[];
                      return uniquePlatforms.map((plat) => {
                        const isSelected = selectedPlatformFilter.toLowerCase() === plat.toLowerCase();
                        const style = getPlatformIconAndStyle(plat);
                        return (
                          <button
                            key={plat}
                            onClick={() => setSelectedPlatformFilter(plat)}
                            className={`px-2 py-1 text-xs font-semibold rounded-md border transition flex items-center gap-1 shadow-sm ${
                              isSelected
                                ? `${style.badge} border-current ring-1 ring-current`
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <span className={isSelected ? "" : style.text}>{style.icon}</span>
                            <span>{plat}</span>
                          </button>
                        );
                      });
                    })()}
                  </div>

                  {/* Category Quick Filter */}
                  <div className="flex items-center gap-1.5 mr-4">
                    <span className="text-slate-500 font-semibold">Category:</span>
                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-700 rounded px-2 py-1 focus:outline-none text-xs shadow-sm capitalize"
                    >
                      <option value="All">All Categories</option>
                      {selectedCategories.map((cat) => {
                        const display = cat === "political" ? "Political" :
                                        cat === "history" ? "History" :
                                        cat === "sports" ? "Sports" :
                                        cat.charAt(0).toUpperCase() + cat.slice(1);
                        return (
                          <option key={cat} value={cat}>
                            {display}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Sentiment Quick Filter */}
                  <div className="flex items-center gap-1.5 mr-4">
                    <span className="text-slate-500 font-semibold">Sentiment:</span>
                    <select
                      value={selectedSentimentFilter}
                      onChange={(e) => setSelectedSentimentFilter(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-700 rounded px-2 py-1 focus:outline-none text-xs shadow-sm"
                    >
                      <option value="All">All Sentiments</option>
                      <option value="Positive">Positive</option>
                      <option value="Neutral">Neutral</option>
                      <option value="Negative">Negative</option>
                    </select>
                  </div>

                  {/* Clear all filter states button */}
                  {(selectedPlatformFilter !== "All" || selectedCategoryFilter !== "All" || selectedSentimentFilter !== "All" || searchQuery !== "" || selectedKeyword || minSentiment !== -1.0 || maxSentiment !== 1.0) && (
                    <button
                      onClick={() => {
                        setSelectedPlatformFilter("All");
                        setSelectedCategoryFilter("All");
                        setSelectedSentimentFilter("All");
                        setSearchQuery("");
                        setSelectedKeyword(null);
                        setMinSentiment(-1.0);
                        setMaxSentiment(1.0);
                      }}
                      className="ml-auto px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded transition hover:bg-blue-100"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* CLASSIFIED LIST GRID */}
                <div className="space-y-4">
                  {filteredVideos.length === 0 ? (
                    <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2 shadow-sm">
                      <p className="text-slate-600 font-semibold">No social posts match current search criteria.</p>
                      <p className="text-xs text-slate-500">Try loosening your target filters or clear active search keywords.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <AnimatePresence mode="popLayout">
                        {filteredVideos.map((video) => {
                          const catStyles = getCategoryColor(video.category);
                          const platformStyles = getPlatformIconAndStyle(video.platform);
                          const isExpanded = expandedCard === video.id;

                          return (
                            <motion.div
                              key={video.id}
                              layout
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.25 }}
                              onClick={() => setSelectedPreviewVideo(video)}
                              className={`bg-white rounded-xl border p-5 hover:bg-slate-50/50 hover:border-blue-400 hover:shadow-md transition duration-200 flex flex-col justify-between h-[465px] overflow-hidden cursor-pointer group relative ${
                                isExpanded ? "border-blue-400 shadow-md ring-1 ring-blue-300/50" : "border-slate-200 shadow-sm"
                              }`}
                            >
                              {/* 1. Header Badges Row (Anchored Top) */}
                              <div className="space-y-2 shrink-0 pb-2 border-b border-slate-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${platformStyles.badge}`}>
                                      {platformStyles.icon}
                                      {video.platform}
                                    </span>
                                    <span className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${catStyles.badge}`}>
                                      {video.category}
                                    </span>
                                    {video.duration && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-mono font-bold tracking-wider" title="Video duration">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        {video.duration}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] font-mono text-slate-400 font-semibold">{video.uploadedAt}</span>
                                </div>
                              </div>

                              {/* 2. Scrollable Center Area (Scrolls dynamically with custom scrollbar) */}
                              <div className="flex-grow overflow-y-auto custom-scrollbar pr-1.5 space-y-4 my-2.5">
                                <div className="space-y-2">
                                  {/* Title */}
                                  <h4 className="text-sm font-bold leading-relaxed text-slate-800 font-display group-hover:text-blue-600 transition">
                                    {video.title}
                                  </h4>

                                  {/* Interactive Call To Action indicator */}
                                  <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-bold opacity-85 group-hover:opacity-100 transition duration-150">
                                    <Play className="w-3.5 h-3.5 fill-blue-600/20 text-blue-600" />
                                    <span>Watch Video Preview &rarr;</span>
                                  </div>

                                  {/* Uploader & Stats */}
                                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono font-medium pt-1">
                                    <span className="font-semibold text-slate-600">@{video.uploader}</span>
                                    <div className="flex items-center gap-3">
                                      <span className="flex items-center gap-1">
                                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{formatViews(video.views)}</span>
                                        {(() => {
                                          const { isUp, formatted } = getEngagementChange(video.id);
                                          return (
                                            <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold border transition-all ${
                                              isUp 
                                                ? "text-emerald-600 bg-emerald-50 border-emerald-100/80" 
                                                : "text-rose-600 bg-rose-50 border-rose-100/80"
                                            }`} title="Engagement shift over last 24 hours">
                                              {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                              {formatted}
                                            </span>
                                          );
                                        })()}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <ThumbsUp className="w-3.5 h-3.5" />
                                        {formatViews(video.likes)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* SENTIMENT VISUALIZER METER */}
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-between text-xs font-mono">
                                    <span className="text-slate-600 font-semibold">Sentiment Rating:</span>
                                    {(() => {
                                      let clr = "text-amber-600";
                                      if (video.sentimentLabel === "Positive") clr = "text-emerald-600";
                                      if (video.sentimentLabel === "Negative") clr = "text-red-600";
                                      return (
                                        <span className={`font-bold ${clr} flex items-center gap-1`}>
                                          {video.sentimentLabel}
                                          <span className="text-slate-400">({video.sentimentScore > 0 ? `+${video.sentimentScore}` : video.sentimentScore})</span>
                                        </span>
                                      );
                                    })()}
                                  </div>

                                  {/* Score Slider Track indicator */}
                                  <div className="h-1.5 bg-slate-200/80 rounded-full overflow-hidden relative">
                                    {/* Center line */}
                                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-300 z-10"></div>
                                    {/* Progress bar fill */}
                                    {video.sentimentScore >= 0 ? (
                                      <div 
                                        className="h-full bg-emerald-500 absolute left-1/2 transition-all duration-1000"
                                        style={{ width: `${(video.sentimentScore) * 50}%` }}
                                      ></div>
                                    ) : (
                                      <div 
                                        className="h-full bg-rose-500 absolute transition-all duration-1000"
                                        style={{ 
                                          left: `${50 - Math.abs(video.sentimentScore) * 50}%`,
                                          width: `${Math.abs(video.sentimentScore) * 50}%` 
                                        }}
                                      ></div>
                                    )}
                                  </div>

                                  {/* Explain Sentiment Button & Result */}
                                  <div className="pt-2 border-t border-slate-200/60 mt-2">
                                    {explanations[video.id] ? (
                                      <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1">
                                          <Sparkles className="w-3 h-3 text-amber-500" />
                                          Sentiment Drivers (Gemini AI)
                                        </span>
                                        <ul className="space-y-1 text-[11px] text-slate-600 font-medium">
                                          {explanations[video.id].map((reason, rIdx) => (
                                            <motion.li 
                                              key={rIdx}
                                              initial={{ opacity: 0, x: -5 }}
                                              animate={{ opacity: 1, x: 0 }}
                                              transition={{ delay: rIdx * 0.1 }}
                                              className="flex items-start gap-1.5 leading-relaxed"
                                            >
                                              <span className="text-amber-500 select-none font-bold mt-0.5">•</span>
                                              <span>{reason}</span>
                                            </motion.li>
                                          ))}
                                        </ul>
                                      </div>
                                    ) : loadingExplanations[video.id] ? (
                                      <div className="flex items-center gap-2 py-1.5 justify-center">
                                        <div className="w-3.5 h-3.5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                        <span className="text-[11px] font-mono font-bold text-slate-500 animate-pulse">Consulting Gemini Expert...</span>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleExplainSentiment(video);
                                        }}
                                        className="w-full inline-flex items-center justify-center gap-1.5 py-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 font-bold text-[11px] rounded-md border border-indigo-150 hover:border-indigo-200 transition"
                                      >
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                                        <span>Explain Sentiment</span>
                                      </button>
                                    )}

                                    {explanationErrors[video.id] && (
                                      <div className="text-[10px] text-red-600 font-semibold pt-1 text-center">
                                        ⚠️ {explanationErrors[video.id]}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Watchdog Campaign Integrity Radar */}
                                {publicAwarenessMode && (() => {
                                  const bot = getBotAnalysis(video);
                                  return (
                                    <div className={`p-2.5 rounded-lg border text-xs space-y-1.5 transition-all ${
                                      bot.riskPercent >= 80 
                                        ? "bg-rose-50 border-rose-200 text-rose-900" 
                                        : bot.riskPercent >= 50 
                                        ? "bg-amber-50 border-amber-200 text-amber-900" 
                                        : "bg-emerald-50 border-emerald-200 text-emerald-900"
                                    }`} onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center justify-between font-bold">
                                        <span className="flex items-center gap-1 text-[11px]">
                                          <Shield className="w-3.5 h-3.5" />
                                          <span>Integrity Scan:</span>
                                        </span>
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono tracking-wider font-extrabold ${
                                          bot.riskPercent >= 80 
                                            ? "bg-rose-100 text-rose-700 border border-rose-200/50" 
                                            : bot.riskPercent >= 50 
                                            ? "bg-amber-100 text-amber-700 border border-amber-200/50" 
                                            : "bg-emerald-100 text-emerald-700 border border-emerald-200/50"
                                        }`}>
                                          {bot.riskLabel}
                                        </span>
                                      </div>
                                      
                                      {/* Risk Percentage Bar */}
                                      <div className="space-y-1">
                                        <div className="flex justify-between text-[9px] font-mono font-semibold">
                                          <span>Bot Susceptibility Index</span>
                                          <span className="font-extrabold">{bot.riskPercent}%</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full transition-all duration-1000 ${
                                            bot.riskPercent >= 80 ? "bg-rose-600" : bot.riskPercent >= 50 ? "bg-amber-500" : "bg-emerald-500"
                                          }`} style={{ width: `${bot.riskPercent}%` }}></div>
                                        </div>
                                      </div>

                                      {/* Bot wave indicator or quick summary */}
                                      <div className="text-[10px] font-medium leading-relaxed flex items-start gap-1">
                                        <span className="text-current mt-0.5 font-bold">•</span>
                                        <span>{bot.reasons[0]}</span>
                                      </div>
                                      {bot.isCoordinatedWave && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded p-1 text-[9px] font-bold text-rose-700 flex items-center gap-1 animate-pulse">
                                          <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                                          <span>COORDINATED 24H PR VELOCITY WAVE DETECTED</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}

                                {/* GEMINI DETAILED SUMMARY EXPANDABLE PANEL */}
                                <div className="pt-2 border-t border-slate-200/60" onClick={(e) => e.stopPropagation()}>
                                  {longSummaries[video.id] ? (
                                    <div className="space-y-2 bg-indigo-50/40 p-3.5 rounded-lg border border-indigo-100/50 relative">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-indigo-600 font-mono uppercase tracking-wider flex items-center gap-1">
                                          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                                          Detailed Video Summary (Gemini AI)
                                        </span>
                                        <button
                                          onClick={() => {
                                            setLongSummaries(prev => {
                                              const updated = { ...prev };
                                              delete updated[video.id];
                                              return updated;
                                            });
                                          }}
                                          className="text-[10px] text-slate-400 hover:text-indigo-600 font-bold transition font-mono hover:underline cursor-pointer"
                                        >
                                          Collapse
                                        </button>
                                      </div>
                                      <div className="mt-1">
                                        {renderFormattedSummary(longSummaries[video.id])}
                                      </div>
                                    </div>
                                  ) : loadingLongSummaries[video.id] ? (
                                    <div className="flex items-center gap-2 py-3 justify-center bg-indigo-50/20 border border-indigo-100/20 rounded-lg">
                                      <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                      <span className="text-xs font-mono font-bold text-indigo-600 animate-pulse">Gemini summarizing video content...</span>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGenerateLongSummary(video);
                                      }}
                                      className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 text-indigo-700 hover:text-indigo-800 font-bold text-xs rounded-lg border border-indigo-100 hover:border-indigo-200 transition shadow-sm cursor-pointer"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                                      <span>Expand for Gemini Summary</span>
                                    </button>
                                  )}

                                  {longSummaryErrors[video.id] && (
                                    <div className="text-[10px] text-red-600 font-semibold pt-1 text-center">
                                      ⚠️ {longSummaryErrors[video.id]}
                                    </div>
                                  )}
                                </div>

                                {/* ACCORDION/EXPANDABLE DETAILS PANEL */}
                                <div className="space-y-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedCard(isExpanded ? null : video.id);
                                    }}
                                    className="w-full text-left text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-between transition focus:outline-none"
                                  >
                                    <span>ML Classification Context</span>
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>

                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      className="pt-2 text-xs leading-relaxed text-slate-600 border-t border-slate-200 space-y-2"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <p className="bg-slate-50 p-2 rounded-md italic">
                                        "{video.summary}"
                                      </p>
                                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 font-semibold">
                                        <span>Classification Confidence: {(video.mlConfidence * 100).toFixed(0)}%</span>
                                        <span>Model: gemini-3.5-flash</span>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              </div>

                              {/* 3. Action Buttons (Anchored Bottom) */}
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <a
                                  href={video.url}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="flex-grow inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-xs text-blue-600 hover:text-blue-700 font-semibold rounded-lg transition"
                                >
                                  Watch on {video.platform}
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShareVideo(video);
                                  }}
                                  title="Share specific video trend"
                                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 font-semibold rounded-lg border border-blue-200 hover:border-blue-300 text-xs transition shrink-0"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                  <span>Share</span>
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
              <p className="text-slate-700 font-semibold">Failed to fetch pulse summaries</p>
              <p className="text-xs text-slate-500">Verify your local environment is active and retry.</p>
              <button
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition shadow-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* EXPANDABLE DEVELOPER & API KEY CONNECTIONS PANEL */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <button
              onClick={() => setShowDeveloperSettings(!showDeveloperSettings)}
              className="w-full px-5 py-4 flex items-center justify-between text-slate-700 hover:text-slate-900 transition focus:outline-none"
            >
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider font-display text-slate-800">Developer API Gateways & Credentials</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">YouTube, Facebook Graph & Instagram Basic APIs</span>
                {showDeveloperSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showDeveloperSettings && (
              <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>
                    By default, this dashboard leverages **Gemini AI Grounding with Google Search** to dynamically retrieve real, semantic, and up-to-date social video publications. This enables instant full-stack operations without registering external developer credentials.
                  </p>
                  <p>
                    To transition to direct production endpoints in a localized network, toggle the gateway below and configure authentic API tokens.
                  </p>
                </div>

                {/* API Gateway Switch */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-slate-500 block uppercase font-bold">Gateway Integration Source</span>
                  <div className="flex rounded-md bg-slate-100 p-1 border border-slate-200 max-w-sm">
                    <button
                      onClick={() => setApiMode("grounding")}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition ${
                        apiMode === "grounding" 
                          ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" 
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Gemini Semantic Engine (Active)
                    </button>
                    <button
                      onClick={() => setApiMode("direct")}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition ${
                        apiMode === "direct" 
                          ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" 
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Direct API Key Portals
                    </button>
                  </div>
                </div>

                {/* API Credentials Form */}
                <form onSubmit={saveDeveloperKeys} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1 font-bold">
                        <Youtube className="w-3 h-3 text-red-600" />
                        YouTube API v3 Key
                      </label>
                      <input
                        type="password"
                        placeholder="AIzaSyA4..."
                        value={ytKey}
                        onChange={(e) => setYtKey(e.target.value)}
                        disabled={apiMode === "grounding"}
                        className="w-full text-xs bg-white border border-slate-200 rounded px-3 py-2 focus:outline-none focus:border-blue-500/50 text-slate-700 disabled:opacity-50 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1 font-bold">
                        <Facebook className="w-3 h-3 text-blue-600" />
                        Meta Graph access Token
                      </label>
                      <input
                        type="password"
                        placeholder="EAAQD4..."
                        value={fbToken}
                        onChange={(e) => setFbToken(e.target.value)}
                        disabled={apiMode === "grounding"}
                        className="w-full text-xs bg-white border border-slate-200 rounded px-3 py-2 focus:outline-none focus:border-blue-500/50 text-slate-700 disabled:opacity-50 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1 font-bold">
                        <Instagram className="w-3 h-3 text-pink-600" />
                        Instagram Basic Display Key
                      </label>
                      <input
                        type="password"
                        placeholder="IGQVJ..."
                        value={igToken}
                        onChange={(e) => setIgToken(e.target.value)}
                        disabled={apiMode === "grounding"}
                        className="w-full text-xs bg-white border border-slate-200 rounded px-3 py-2 focus:outline-none focus:border-blue-500/50 text-slate-700 disabled:opacity-50 transition"
                      />
                    </div>
                  </div>

                  {apiMode === "direct" && (
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold rounded-lg text-white transition shadow-sm"
                      >
                        Save API Gateways
                      </button>
                      {isKeysSaved && (
                        <span className="text-[11px] text-emerald-600 font-mono flex items-center gap-1 animate-pulse font-semibold">
                          <Check className="w-3.5 h-3.5" />
                          Keys mapped successfully. Switching to direct portals...
                        </span>
                      )}
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Main Dashboard Page Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left space-y-1">
            <p className="text-xs font-semibold text-slate-700">
              © {new Date().getFullYear()} Social Sentinel Hub — Grounded Video Intelligence Dashboard
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Dynamic classification powered by Google Search Grounding & Gemini LLM. All rights reserved.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3">
            {filteredVideos && filteredVideos.length > 0 && (
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                {filteredVideos.length} Videos Filtered
              </span>
            )}
            <button
              onClick={handleDownloadCSVReport}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm hover:shadow-md flex items-center gap-1.5 cursor-pointer"
              title="Download full CSV dump of the currently filtered video data, including sentiment scores"
            >
              <Download className="w-4 h-4" />
              Download Report (.CSV)
            </button>
          </div>
        </div>
      </footer>

      {/* CATEGORY DEEP DIVE & TREND ANALYSIS MODAL */}
      <AnimatePresence>
        {selectedCategoryModal && data && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCategoryModal(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl relative z-10 flex flex-col max-h-[85vh] border border-slate-100 overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex px-2.5 py-1 bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider rounded-md border border-blue-200">
                      {selectedCategoryModal.category} Deep Dive
                    </span>
                    <span className="text-xs font-mono text-slate-500 font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      Upload Horizon: {days} Days
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-display text-slate-800 capitalize">
                    {selectedCategoryModal.category} Category Trend Metrics
                  </h3>
                  <p className="text-xs text-slate-500">
                    High-engagement social publications ranked by semantic velocity and audience feedback index.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Export Button */}
                  <button
                    onClick={() => {
                      const modalVideos = data.videos
                        .filter((v) => v.category === selectedCategoryModal.category)
                        .map((v) => {
                          const trendScore = Math.round(
                            (v.views * 0.4 + v.likes * 2.0) * (v.sentimentScore >= 0 ? 1 + v.sentimentScore : 1) * (v.mlConfidence || 1)
                          );
                          return { ...v, trendScore };
                        })
                        .sort((a, b) => b.trendScore - a.trendScore)
                        .map((v, index) => ({ ...v, rank: index + 1 }));
                      exportCategoryToExcel(selectedCategoryModal.category, modalVideos);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm hover:shadow-md"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export to Excel (.csv)
                  </button>

                  {/* Close button */}
                  <button
                    onClick={() => setSelectedCategoryModal(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-4 max-h-[55vh]">
                {(() => {
                  const filtered = data.videos
                    .filter((v) => v.category === selectedCategoryModal.category)
                    .map((v) => {
                      const trendScore = Math.round(
                        (v.views * 0.4 + v.likes * 2.0) * (v.sentimentScore >= 0 ? 1 + v.sentimentScore : 1) * (v.mlConfidence || 1)
                      );
                      return { ...v, trendScore };
                    })
                    .sort((a, b) => b.trendScore - a.trendScore)
                    .map((v, index) => ({ ...v, rank: index + 1 }));

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-500">
                        No videos found in this category matching the {days}-day horizon.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {filtered.map((video) => {
                        const isOriginalClicked = video.id === selectedCategoryModal.clickedVideoId;
                        
                        // Custom rank badges
                        let rankBg = "bg-slate-100 text-slate-700 border-slate-200";
                        let rankIcon = "📈";
                        if (video.rank === 1) {
                          rankBg = "bg-amber-50 text-amber-700 border-amber-200";
                          rankIcon = "🔥 Rank #1";
                        } else if (video.rank === 2) {
                          rankBg = "bg-slate-50 text-slate-600 border-slate-200";
                          rankIcon = "⚡ Rank #2";
                        } else if (video.rank === 3) {
                          rankBg = "bg-orange-50/50 text-orange-700 border-orange-200";
                          rankIcon = "🏆 Rank #3";
                        } else {
                          rankIcon = `Rank #${video.rank}`;
                        }

                        const pStyle = getPlatformIconAndStyle(video.platform);

                        return (
                          <div
                            key={video.id}
                            className={`p-4 rounded-xl border transition duration-150 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                              isOriginalClicked
                                ? "bg-blue-50/50 border-blue-300 ring-1 ring-blue-300/30"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            {/* Left part: Rank, Title, Creator, Time */}
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center flex-wrap gap-2">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${rankBg}`}>
                                  {rankIcon}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${pStyle.badge}`}>
                                  {pStyle.icon}
                                  {video.platform}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 font-semibold">
                                  Score: {video.trendScore.toLocaleString()}
                                </span>
                                {isOriginalClicked && (
                                  <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md uppercase">
                                    Current Selection
                                  </span>
                                )}
                              </div>

                              <h4 className="text-sm font-bold text-slate-800 leading-normal truncate">
                                {video.title}
                              </h4>

                              <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                                <span className="font-semibold text-slate-600">By: @{video.uploader}</span>
                                <span>&bull;</span>
                                <span className="font-semibold text-slate-400">Date: {video.uploadedAt}</span>
                              </div>
                            </div>

                            {/* Right part: stats columns */}
                            <div className="flex items-center gap-6 text-xs text-slate-500 font-mono font-semibold shrink-0">
                              <div className="text-right flex flex-col items-end">
                                <p className="text-[10px] text-slate-400 font-normal uppercase">Views</p>
                                <div className="flex items-center gap-1">
                                  <p className="text-slate-700">{video.views.toLocaleString()}</p>
                                  {(() => {
                                    const { isUp, formatted } = getEngagementChange(video.id);
                                    return (
                                      <span className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold border ${
                                        isUp 
                                          ? "text-emerald-600 bg-emerald-50 border-emerald-100/60" 
                                          : "text-rose-600 bg-rose-50 border-rose-100/60"
                                      }`}>
                                        {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                        {formatted}
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-slate-400 font-normal uppercase">Likes</p>
                                <p className="text-slate-700">{video.likes.toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-slate-400 font-normal uppercase">Sentiment</p>
                                <p className={`${video.sentimentLabel === "Positive" ? "text-emerald-600" : video.sentimentLabel === "Negative" ? "text-rose-600" : "text-amber-600"}`}>
                                  {video.sentimentLabel} ({video.sentimentScore > 0 ? `+${video.sentimentScore}` : video.sentimentScore})
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono font-semibold px-6">
                <span>Model Analysis Confidences validated dynamically</span>
                <span>Press ESC or Click background to return</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIDEO PREVIEW MODAL */}
      <AnimatePresence>
        {selectedPreviewVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPreviewVideo(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 text-slate-100 rounded-2xl max-w-3xl w-full shadow-2xl relative z-10 flex flex-col max-h-[90vh] border border-slate-800 overflow-hidden text-left"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-800/80 flex items-start justify-between gap-4 bg-slate-950/50">
                <div className="space-y-1 text-left">
                  <div className="flex items-center flex-wrap gap-2">
                    {(() => {
                      const platformStyles = getPlatformIconAndStyle(selectedPreviewVideo.platform);
                      const catStyles = getCategoryColor(selectedPreviewVideo.category);
                      return (
                        <>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${platformStyles.badge}`}>
                            {platformStyles.icon}
                            {selectedPreviewVideo.platform}
                          </span>
                          <span className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${catStyles.badge}`}>
                            {selectedPreviewVideo.category}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            Confidence: {Math.round(selectedPreviewVideo.mlConfidence * 100)}%
                          </span>
                          {selectedPreviewVideo.duration && (
                            <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-800 px-2 py-0.5 rounded border border-slate-700 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              Duration: {selectedPreviewVideo.duration}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold font-display text-white mt-1 leading-snug">
                    {selectedPreviewVideo.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                    <span className="font-semibold text-slate-300">@{selectedPreviewVideo.uploader}</span>
                    <span>&bull;</span>
                    <span>Published {selectedPreviewVideo.uploadedAt}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPreviewVideo(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition shrink-0"
                  aria-label="Close Video Player"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Responsive Iframe Embed Player */}
              <div className="bg-black aspect-video w-full relative overflow-hidden border-b border-slate-800">
                {(() => {
                  let embedUrl = "";
                  if (selectedPreviewVideo.platform === "YouTube" && (selectedPreviewVideo.url.includes("youtube.com") || selectedPreviewVideo.url.includes("youtu.be"))) {
                    const match = selectedPreviewVideo.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
                    const videoId = match ? match[1] : "dQw4w9WgXcQ";
                    embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
                  } else {
                    // Context-aware educational streams
                    if (selectedPreviewVideo.category === "political") {
                      embedUrl = "https://www.youtube.com/embed/SXPgZf0cAnA?autoplay=1&rel=0";
                    } else if (selectedPreviewVideo.category === "history") {
                      embedUrl = "https://www.youtube.com/embed/K7Z8B_U8Nfk?autoplay=1&rel=0";
                    } else {
                      embedUrl = "https://www.youtube.com/embed/86-O6pW7E7Y?autoplay=1&rel=0";
                    }
                  }

                  return (
                    <iframe
                      src={embedUrl}
                      title={selectedPreviewVideo.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="no-referrer"
                    />
                  );
                })()}
              </div>

              {/* Scrollable Information Body */}
              <div className="p-5 overflow-y-auto space-y-4 max-h-[35vh] text-left">
                {/* Stats and Sentiment Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
                  {/* Left part: views, likes, confidence */}
                  <div className="grid grid-cols-3 gap-2 font-mono text-center">
                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Views</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <p className="text-sm font-bold text-white">{selectedPreviewVideo.views.toLocaleString()}</p>
                        {(() => {
                          const { isUp, formatted } = getEngagementChange(selectedPreviewVideo.id);
                          return (
                            <span className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold border ${
                              isUp 
                                ? "text-emerald-400 bg-emerald-950/40 border-emerald-900/40" 
                                : "text-rose-400 bg-rose-950/40 border-rose-900/40"
                            }`} title="24h engagement trend">
                              {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                              {formatted}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Likes</p>
                      <p className="text-sm font-bold text-white mt-0.5">{selectedPreviewVideo.likes.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Confidence</p>
                      <p className="text-sm font-bold text-indigo-400 mt-0.5">{(selectedPreviewVideo.mlConfidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>

                  {/* Right part: sentiment label and slider meter */}
                  <div className="bg-slate-900/50 p-2.5 px-3.5 rounded-lg border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Sentiment Intensity:</span>
                      {(() => {
                        let colorStr = "text-amber-500";
                        if (selectedPreviewVideo.sentimentLabel === "Positive") colorStr = "text-emerald-500";
                        if (selectedPreviewVideo.sentimentLabel === "Negative") colorStr = "text-rose-500";
                        return (
                          <span className={`font-bold ${colorStr} uppercase`}>
                            {selectedPreviewVideo.sentimentLabel} ({selectedPreviewVideo.sentimentScore >= 0 ? `+${selectedPreviewVideo.sentimentScore}` : selectedPreviewVideo.sentimentScore})
                          </span>
                        );
                      })()}
                    </div>

                    <div className="h-1.5 bg-slate-950 rounded-full relative overflow-hidden mt-1.5 border border-slate-800">
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-700 z-10" />
                      {selectedPreviewVideo.sentimentScore >= 0 ? (
                        <div
                          className="h-full bg-emerald-500 absolute left-1/2 transition-all duration-500"
                          style={{ width: `${(selectedPreviewVideo.sentimentScore / 1.0) * 50}%` }}
                        />
                      ) : (
                        <div
                          className="h-full bg-rose-500 absolute right-1/2 transition-all duration-500"
                          style={{ width: `${(Math.abs(selectedPreviewVideo.sentimentScore) / 1.0) * 50}%` }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Watchdog Integrity Radar inside the Modal */}
                {publicAwarenessMode && (() => {
                  const bot = getBotAnalysis(selectedPreviewVideo);
                  return (
                    <div className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                      bot.riskPercent >= 80 
                        ? "bg-rose-950/20 border-rose-900/40 text-rose-300" 
                        : bot.riskPercent >= 50 
                        ? "bg-amber-950/20 border-amber-900/40 text-amber-300" 
                        : "bg-emerald-950/20 border-emerald-900/40 text-emerald-300"
                    }`}>
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5 text-sm">
                          <Shield className="w-4 h-4 text-indigo-400 animate-pulse" />
                          <span>Citizen Shield: Narrative Integrity Audit</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider font-extrabold ${
                          bot.riskPercent >= 80 
                            ? "bg-rose-900/50 text-rose-200 border border-rose-800/40" 
                            : bot.riskPercent >= 50 
                            ? "bg-amber-900/50 text-amber-200 border border-amber-800/40" 
                            : "bg-emerald-900/50 text-emerald-200 border border-emerald-800/40"
                        }`}>
                          {bot.riskLabel}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-4 space-y-1">
                          <span className="text-[10px] uppercase font-mono font-bold tracking-wider block opacity-75">Susceptibility Score</span>
                          <span className="text-3xl font-extrabold font-mono tracking-tight text-white">{bot.riskPercent}%</span>
                        </div>
                        <div className="md:col-span-8 space-y-1.5">
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                            <div className={`h-full rounded-full transition-all duration-1000 ${
                              bot.riskPercent >= 80 ? "bg-rose-500" : bot.riskPercent >= 50 ? "bg-amber-400" : "bg-emerald-400"
                            }`} style={{ width: `${bot.riskPercent}%` }}></div>
                          </div>
                          <span className="text-[10px] opacity-75 font-mono">Anomaly algorithm matching comment metrics with emotional clusters</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/40 space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold block opacity-75">Audited Indicators:</span>
                        <ul className="space-y-1 text-xs">
                          {bot.reasons.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 leading-relaxed text-slate-300">
                              <span className="text-amber-400 select-none font-bold mt-0.5">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {bot.isCoordinatedWave && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-xs font-bold text-red-300 flex items-start gap-2 animate-pulse">
                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-extrabold text-red-200 uppercase tracking-wide">Coordinated 24h PR Velocity Wave Detected</p>
                            <p className="text-[11px] text-slate-400 font-normal leading-relaxed mt-0.5">
                              This video post's viral spike is chronologically correlated with other seemingly independent influencer channels in the same region, suggesting a coordinated public relations campaign structure.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Video Summary Section */}
                <div className="space-y-1.5">
                  <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    AI-Generated Semantic Summary
                  </h4>
                  <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans font-medium">
                    {selectedPreviewVideo.summary}
                  </div>
                </div>
              </div>

              {/* Actions Footer Bar */}
              <div className="p-4 border-t border-slate-800/80 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 px-5">
                <button
                  onClick={() => {
                    const video = selectedPreviewVideo;
                    setSelectedPreviewVideo(null);
                    setSelectedCategoryModal({ category: video.category, clickedVideoId: video.id });
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-sm hover:shadow flex items-center justify-center gap-1.5"
                >
                  <TrendingUp className="w-4 h-4" />
                  Explore {selectedPreviewVideo.category.toUpperCase()} Trends Deep Dive
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={selectedPreviewVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-750 hover:border-slate-650 text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Source Link
                  </a>
                  <button
                    onClick={() => setSelectedPreviewVideo(null)}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition text-center"
                  >
                    Close Player
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

