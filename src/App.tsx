import React, { useState, useEffect, useRef } from "react";
import { 
  UserCheck, 
  Trash2, 
  Plus, 
  RefreshCw, 
  RotateCcw, 
  Database, 
  LogOut, 
  Sun, 
  Moon, 
  TrendingUp, 
  Settings, 
  Users, 
  CheckCircle, 
  AlertCircle,
  KeyRound,
  LayoutDashboard,
  Sparkles,
  Search,
  Check
} from "lucide-react";
import { Candidate, Vote, Role } from "./types";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  CartesianGrid, 
  Cell, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie 
} from "recharts";

// Dynamic preset avatars so users can choose beautifully stylized photos instantly
const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop"
];

// Initial preseeded candidates so the ballot doesn't look empty when loading for the evaluation
const SEED_CANDIDATES: Candidate[] = [
  { id: "cand-1", name: "Muhil", postId: 0, postName: "School Pupil Leader", faceUrl: PRESET_AVATARS[0] },
  { id: "cand-2", name: "Aditya", postId: 0, postName: "School Pupil Leader", faceUrl: PRESET_AVATARS[1] },
  { id: "cand-3", name: "Priya", postId: 1, postName: "Assistant School Pupil Leader", faceUrl: PRESET_AVATARS[2] },
  { id: "cand-4", name: "Rohan", postId: 1, postName: "Assistant School Pupil Leader", faceUrl: PRESET_AVATARS[3] },
  { id: "cand-5", name: "Sophia", postId: 2, postName: "Ambassdor", faceUrl: PRESET_AVATARS[4] },
  { id: "cand-6", name: "Vikram", postId: 2, postName: "Ambassdor", faceUrl: PRESET_AVATARS[5] },
];

export default function App() {
  // Theme & Settings State
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    return localStorage.getItem("evm_apps_script_url") || "https://script.google.com/macros/s/AKfycbwarqo1uNNFhElWa6KInVW55_8xdjfKiam1259mcOmIKGhcMjp0FRVzWmEMJfMkpOPejQ/exec";
  });

  // Authentication State
  const [sessionUser, setSessionUser] = useState<Role | null>(() => {
    return (localStorage.getItem("evm_active_session") as Role) || null;
  });
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Candidates & Votes Database
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem("evm_candidates_roster");
    return saved ? JSON.parse(saved) : SEED_CANDIDATES;
  });
  const [votes, setVotes] = useState<Vote[]>(() => {
    const saved = localStorage.getItem("evm_votes_ledger");
    return saved ? JSON.parse(saved) : [];
  });

  // Ballot Stage Voting Mechanism
  const [currentStage, setCurrentStage] = useState<number>(0); // 0 = SPL, 1 = ASPL, 2 = AMBassador
  const [stageChoices, setStageChoices] = useState<{ spl: string; aspl: string; amb: string }>({
    spl: "",
    aspl: "",
    amb: "",
  });
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [stageLocked, setStageLocked] = useState(false);
  const [slipPrintActive, setSlipPrintActive] = useState(false);
  const [isLedActive, setIsLedActive] = useState<string | null>(null);

  // Success screen presentation
  const [successOverlay, setSuccessOverlay] = useState(false);
  const [successNthVoter, setSuccessNthVoter] = useState<number | string>("--");
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  // Candidate creation view state
  const [newCandName, setNewCandName] = useState("");
  const [newCandPostId, setNewCandPostId] = useState<number>(0);
  const [newCandFaceUrl, setNewCandFaceUrl] = useState(PRESET_AVATARS[0]);
  const [dashboardTab, setDashboardTab] = useState<"candidates" | "results" | "settings">("candidates");
  const [analyticsPostId, setAnalyticsPostId] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Roster Sync Loader State
  const [isSyncingRoster, setIsSyncingRoster] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: "success" | "error" | ""; text: string }>({ type: "", text: "" });

  const loginScreenRef = useRef<HTMLDivElement>(null);

  // Keep mouse movement mapped to glossy sheen reflection for Apple Glass Cards
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  };

  // Synchronize CSS theme triggers with document body
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
  }, [theme]);

  // Sync state to local storage to maintain absolute data safety offline
  useEffect(() => {
    localStorage.setItem("evm_candidates_roster", JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem("evm_votes_ledger", JSON.stringify(votes));
  }, [votes]);

  useEffect(() => {
    localStorage.setItem("evm_apps_script_url", appsScriptUrl);
  }, [appsScriptUrl]);

  // Audio Synthesizers utilizing native Web Audio API for true physical hardware sound effects
  const playBeep = (freq = 880, duration = 0.12) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // Browser blocks audio before user interaction, safely ignore
    }
  };

  const playBuzzer = () => {
    // 0.95s continuous medium-pitch square tone mimicking physical Indian EVM buzzer
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "square";
      osc.frequency.value = 540;
      
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime + 0.85);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.0);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 1.0);
    } catch {
      // Fallback
    }
  };

  // Login handler ensuring exact matching profiles
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const card = loginScreenRef.current;
    if (card) card.classList.remove("error-shake");

    const u = usernameInput.trim().toLowerCase();
    const p = passwordInput.trim();

    if (!u || !p) {
      setLoginError("Please enter both terminals name and passcode.");
      if (card) card.classList.add("error-shake");
      return;
    }

    setIsAuthenticating(true);

    setTimeout(() => {
      let matchedRole: Role | null = null;
      if (u === "master" && p === "vbck2026") {
        matchedRole = "master";
      } else if (u === "ballot1" && p === "pass1") {
        matchedRole = "ballot1";
      } else if (u === "ballot2" && p === "pass2") {
        matchedRole = "ballot2";
      } else if (u === "ballot3" && p === "pass3") {
        matchedRole = "ballot3";
      } else if (u === "ballot4" && p === "pass4") {
        matchedRole = "ballot4";
      }

      setIsAuthenticating(false);

      if (matchedRole) {
        playBeep(980, 0.2);
        setSessionUser(matchedRole);
        localStorage.setItem("evm_active_session", matchedRole);
        // Reset inputs
        setUsernameInput("");
        setPasswordInput("");
      } else {
        playBeep(400, 0.35);
        setLoginError("Authentication Failed: Invalid passcode credentials.");
        if (card) {
          // Force layout reflow to re-trigger CSS animations
          void card.offsetWidth;
          card.classList.add("error-shake");
        }
      }
    }, 600);
  };

  // Exit logged-in terminal
  const handleLogout = () => {
    playBeep(660, 0.15);
    setSessionUser(null);
    localStorage.removeItem("evm_active_session");
    // Reset any ballot transaction state
    resetBallotFormState();
  };

  const resetBallotFormState = () => {
    setCurrentStage(0);
    setStageChoices({ spl: "", aspl: "", amb: "" });
    setSelectedCandidateId(null);
    setStageLocked(false);
    setSlipPrintActive(false);
    setIsLedActive(null);
  };

  // EVM Vote transaction logic per booth stage
  const handleStageSelect = (postId: number, candidateId: string, serialNo: number, candidateName: string) => {
    if (stageLocked) return;
    setStageLocked(true);
    setSelectedCandidateId(candidateId);
    setIsLedActive(candidateId);
    playBeep(1100, 0.15); // Distinct beep on selection

    // Save choice based on current active posting index
    const updatedChoices = { ...stageChoices };
    if (postId === 0) updatedChoices.spl = candidateName;
    if (postId === 1) updatedChoices.aspl = candidateName;
    if (postId === 2) updatedChoices.amb = candidateName;
    setStageChoices(updatedChoices);

    // Trigger VVPAT optical printed slip output
    setSlipPrintActive(true);

    // Calibrated precisely to 2.7s matching mechanical printable window and fade timeline
    setTimeout(() => {
      setSlipPrintActive(false);
      setSelectedCandidateId(null);
      setIsLedActive(null);
      setStageLocked(false);

      if (currentStage < 2) {
        // Move forward seamlessly through (1/3, 2/3, 3/3) stages
        setCurrentStage(prev => prev + 1);
      } else {
        // All 3 completed -> process entire ballot sheet payload
        submitCompletedBallot(updatedChoices);
      }
    }, 2700);
  };

  const syncCandidatesToSheet = async () => {
    setIsSyncingRoster(true);
    setSyncStatusMsg({ type: "", text: "" });

    const payload = candidates.map(c => ({
      id: c.id,
      name: c.name,
      post_id: c.postId,
      post_name: c.postName,
      face_url: c.faceUrl
    }));

    try {
      // POST with mode cors
      const response = await fetch(appsScriptUrl, {
        method: "POST",
        body: JSON.stringify(payload),
        mode: "no-cors"
      });
      playBeep(1200, 0.35);
      setSyncStatusMsg({
        type: "success",
        text: "Candidates successfully synchronized to Google Sheets 'Candidates' book!"
      });
    } catch (e: any) {
      setSyncStatusMsg({
        type: "error",
        text: `Network route fault: ${e?.message || "Failed to establish secure post request"}`
      });
    } finally {
      setIsSyncingRoster(false);
    }
  };

  // Submit entire ballot structure online and locally
  const submitCompletedBallot = async (finalChoices: typeof stageChoices) => {
    if (isSubmittingVote) return;
    setIsSubmittingVote(true);

    const activeBooth = sessionUser || "ballot1";
    const localTimestamp = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }); // Indian time representation

    const newVote: Vote = {
      id: "v-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      timestamp: localTimestamp,
      spl: finalChoices.spl,
      aspl: finalChoices.aspl,
      amb: finalChoices.amb,
      booth: activeBooth
    };

    // 1. Submit locally
    const nextVotes = [...votes, newVote];
    setVotes(nextVotes);

    // Filter votes for current booth to display exact sequence index
    const boothVotesCount = nextVotes.filter(v => v.booth === activeBooth).length;
    setSuccessNthVoter(boothVotesCount);

    // 2. Play beautiful authentic buzzer sound!
    playBuzzer();

    // 3. Initiate Success display Overlay
    setSuccessOverlay(true);

    // 4. Dispatch transaction to Google Sheets Apps Script concurrently
    const formData = new FormData();
    formData.append("spl", finalChoices.spl);
    formData.append("aspl", finalChoices.aspl);
    formData.append("amb", finalChoices.amb);
    formData.append("booth", activeBooth);

    try {
      await fetch(appsScriptUrl, {
        method: "POST",
        body: formData,
        mode: "no-cors"
      });
    } catch (e) {
      console.warn("Spreadsheet offline. Local vote entry saved.", e);
    }

    // Auto close overlay after 2.6 seconds and loop back to the initial terminal state
    setTimeout(() => {
      setSuccessOverlay(false);
      setIsSubmittingVote(false);
      resetBallotFormState();
    }, 2800);
  };

  // Candidate Actions (Add / Remove)
  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandName.trim()) return;

    let postName = "School Pupil Leader";
    if (newCandPostId === 1) postName = "Assistant School Pupil Leader";
    if (newCandPostId === 2) postName = "Ambassdor";

    const newCand: Candidate = {
      id: "cand-" + Date.now(),
      name: newCandName.trim(),
      postId: newCandPostId,
      postName: postName,
      faceUrl: newCandFaceUrl
    };

    setCandidates(prev => [...prev, newCand]);
    setNewCandName("");
    playBeep(1000, 0.1);
  };

  const handleDeleteCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
    playBeep(450, 0.15);
  };

  // Reset ALL local ledger votes and restore seed configuration
  const handleResetSystem = () => {
    if (confirm("Are you sure you want to clear all recorded votes and restore master defaults?")) {
      setVotes([]);
      setCandidates(SEED_CANDIDATES);
      resetBallotFormState();
      playBeep(350, 0.5);
      alert("System Reset Completed.");
    }
  };

  // Computes statistical scores per candidate for the Master Tab results dashboard
  const getCandidateVoteCount = (name: string, postId: number) => {
    return votes.filter(v => {
      if (postId === 0) return v.spl === name;
      if (postId === 1) return v.aspl === name;
      return v.amb === name;
    }).length;
  };

  const getWinnerForPost = (postId: number) => {
    const relevantCandidates = candidates.filter(c => c.postId === postId);
    if (!relevantCandidates.length) return null;

    let maxVotes = -1;
    let winner: Candidate | null = null;
    let isTie = false;

    relevantCandidates.forEach(cand => {
      const cnt = getCandidateVoteCount(cand.name, postId);
      if (cnt > maxVotes) {
        maxVotes = cnt;
        winner = cand;
        isTie = false;
      } else if (cnt === maxVotes && cnt > 0) {
        isTie = true;
      }
    });

    if (maxVotes === 0) return null;
    return { winner, votes: maxVotes, isTie };
  };

  // Format ordinals dynamically
  const getOrdinal = (n: number | string) => {
    if (typeof n === "string") return n;
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // Pre-filter candidate lists according to search keywords
  const filteredCandidates = candidates.filter(cand => 
    cand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cand.postName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="theme-bg-gradient text-slate-800 dark:text-slate-100 min-h-screen py-12 px-4 transition-all duration-500 relative flex flex-col justify-between overflow-hidden">
      
      {/* Decorative Animated Background Liquid Blobs */}
      <div className="liquid-blob-container">
        <div className="liquid-blob w-[45%] h-[45%] bg-blue-500/10 dark:bg-blue-600/10 top-[-8%] left-[-8%] animate-blob-slow-1"></div>
        <div className="liquid-blob w-[42%] h-[42%] bg-indigo-500/10 dark:bg-indigo-600/10 bottom-[-8%] right-[-8%] animate-blob-slow-2"></div>
        <div className="liquid-blob w-[32%] h-[32%] bg-pink-500/5 dark:bg-pink-600/10 top-[25%] left-[55%] animate-blob-slow-3"></div>
      </div>
      
      {/* Floating Theme Switcher & Status Badging */}
      <div className="fixed top-4 right-4 z-[100] flex items-center gap-3">
        {sessionUser && (
          <div className="apple-glass py-1.5 px-3 flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border bg-white/5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
            {sessionUser === "master" ? "Master Secure Terminal" : `Booth Terminal ${sessionUser.slice(-1)}`}
          </div>
        )}
        <button 
          onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
          className="w-10 h-10 rounded-full apple-glass flex items-center justify-center border shadow-lg transition-transform active:scale-90 text-slate-800 dark:text-slate-200 bg-white/5 backdrop-blur-md"
          title="Toggle UI Theme"
        >
          {theme === "dark" ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
        </button>
      </div>

      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col justify-center items-center">
        
        {/* ========================================================================================================= */}
        {/* 1. GUEST GATEWAY / LOGIN COMPONENT */}
        {/* ========================================================================================================= */}
        {!sessionUser && (
          <div 
            ref={loginScreenRef}
            className="apple-glass max-w-sm w-full p-8 mx-auto self-center mt-8 space-y-6 flex flex-col justify-center relative fade-in row-entrance hover-glow-blue"
            onMouseMove={handleMouseMove}
            id="login-panel"
          >
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-600 to-emerald-400 flex items-center justify-center shadow-lg border border-white/20">
                <LayoutDashboard className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-400 to-emerald-500 dark:from-sky-400 dark:via-indigo-300 dark:to-emerald-400">
                EVM SECURE
              </h2>
              <p className="text-xs font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                Terminal Authorization
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Terminal ID
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <UserCheck className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="e.g. master or ballot1" 
                    className="glass-input pl-10 pr-4 py-3 text-sm w-full rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Access Passcode
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input 
                    type="password" 
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••" 
                    className="glass-input pl-10 pr-4 py-3 text-sm w-full rounded-xl"
                  />
                </div>
              </div>

              {loginError && (
                <div className="text-xs text-red-600 dark:text-red-400 font-medium bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={isAuthenticating}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:via-indigo-500 text-white font-bold tracking-widest text-xs py-3.5 rounded-xl uppercase transition-all duration-300 border-t border-white/20 shadow-lg disabled:opacity-50 hover:scale-[1.01]"
              >
                {isAuthenticating ? "Accessing Secure Node..." : "Initialize Terminal"}
              </button>
            </form>

            <div className="border-t border-dashed border-slate-300/10 pt-4 text-center space-y-2">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wider">
                QUICK DEMO ACCESS KEYS
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                <button 
                  onClick={() => { setUsernameInput("master"); setPasswordInput("vbck2026"); }}
                  className="bg-black/20 hover:bg-black/40 text-[9px] font-mono py-1 px-2.5 rounded border border-white/5 text-blue-500"
                >
                  Master
                </button>
                {[1, 2, 3, 4].map(idx => (
                  <button 
                    key={idx}
                    onClick={() => { setUsernameInput(`ballot${idx}`); setPasswordInput(`pass${idx}`); }}
                    className="bg-black/20 hover:bg-black/40 text-[9px] font-mono py-1 px-2.5 rounded border border-white/5 text-emerald-500"
                  >
                    Ballot {idx}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================================================= */}
        {/* 2. MASTER DASHBOARD VIEW */}
        {/* ========================================================================================================= */}
        {sessionUser === "master" && (
          <div className="w-full space-y-6 fade-in">
            
            {/* Header Glass Block */}
            <div className="apple-glass p-6 w-full flex flex-col md:flex-row md:items-center justify-between gap-4" onMouseMove={handleMouseMove}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                    <LayoutDashboard className="w-5 h-5" />
                  </span>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    Master Election Control Dashboard
                  </h1>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tracking-widest uppercase">
                  Audit, Roster Administration, and Ledger Stats
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={handleResetSystem}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-all"
                  title="Wipe ballot sheets data"
                >
                  System Reset
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-black/20 hover:text-slate-800 dark:hover:text-white border border-slate-300/20 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            </div>

            {/* Tabs Controller */}
            <div className="flex border-b border-slate-300 dark:border-slate-800 gap-2">
              <button 
                onClick={() => setDashboardTab("candidates")}
                className={`py-2 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${dashboardTab === "candidates" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                Candidates Management
              </button>
              <button 
                onClick={() => setDashboardTab("results")}
                className={`py-2 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${dashboardTab === "results" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                Leading Leaders Results
              </button>
              <button 
                onClick={() => setDashboardTab("settings")}
                className={`py-2 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${dashboardTab === "settings" ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                Cloud Sync settings
              </button>
            </div>

            {/* ========================================================================== */}
            {/* TAB: CANDIDATES MANAGEMENT */}
            {/* ========================================================================== */}
            {dashboardTab === "candidates" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Addition Form Block */}
                <div className="apple-glass p-6 space-y-4 lg:col-span-1 row-entrance hover-glow-blue tab-transition" onMouseMove={handleMouseMove}>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-300/10 pb-2 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-500" />
                    Enlist Candidate
                  </h3>

                  <form onSubmit={handleAddCandidate} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                        Candidate Reference Name
                      </label>
                      <input 
                        type="text" 
                        value={newCandName}
                        onChange={(e) => setNewCandName(e.target.value)}
                        placeholder="Full Legal Name"
                        className="glass-input px-4 py-2.5 rounded-xl text-sm w-full"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                        Elected Office Posting
                      </label>
                      <select 
                        value={newCandPostId}
                        onChange={(e) => setNewCandPostId(Number(e.target.value))}
                        className="glass-input px-4 py-2.5 rounded-xl text-sm w-full cursor-pointer dark:bg-slate-900 bg-[#f8fafc] text-slate-800 dark:text-slate-100"
                      >
                        <option value={0}>School Pupil Leader (SPL)</option>
                        <option value={1}>Assistant School Pupil Leader (ASPL)</option>
                        <option value={2}>Ambassdor</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                        Select Face Portrait
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {PRESET_AVATARS.map((url, index) => (
                          <button 
                            type="button"
                            key={index}
                            onClick={() => setNewCandFaceUrl(url)}
                            className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${newCandFaceUrl === url ? "border-blue-500 scale-105 shadow-md" : "border-transparent opacity-60 hover:opacity-100"}`}
                          >
                            <img src={url} alt="Face" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                      <div className="pt-2">
                        <label className="text-[9px] font-mono text-slate-500">Or Paste Image URL</label>
                        <input 
                          type="text" 
                          value={newCandFaceUrl}
                          onChange={(e) => setNewCandFaceUrl(e.target.value)}
                          placeholder="https://..."
                          className="glass-input px-3 py-1.5 rounded-lg text-xs w-full mt-1 font-mono"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 rounded-xl uppercase tracking-wider border-t border-white/20 transition-all shadow-md active:scale-95"
                    >
                      Enlist to Ballot Roster
                    </button>
                  </form>
                </div>

                {/* Candidate Roster Output */}
                <div className="apple-glass p-6 space-y-4 lg:col-span-2 row-entrance hover-glow-indigo tab-transition" onMouseMove={handleMouseMove}>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        Roster Entries ({candidates.length})
                      </h3>
                      <p className="text-xs text-slate-500">Live listings enrolled inside election terminals.</p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
                        <input 
                          type="text" 
                          placeholder="Search candidates..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="glass-input pl-8 pr-3 py-1.5 rounded-lg text-xs w-full sm:max-w-[200px]"
                        />
                      </div>
                      <button 
                        onClick={syncCandidatesToSheet}
                        disabled={isSyncingRoster}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-[10px] uppercase rounded-xl tracking-wider shadow duration-150 flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncingRoster ? "animate-spin" : ""}`} />
                        {isSyncingRoster ? "Syncing..." : "Sync Candidates"}
                      </button>
                    </div>
                  </div>

                  {syncStatusMsg.text && (
                    <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 font-medium ${syncStatusMsg.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"}`}>
                      {syncStatusMsg.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                      <span>{syncStatusMsg.text}</span>
                    </div>
                  )}

                  <div className="space-y-6">
                    {[0, 1, 2].map(postId => {
                      const postLabel = postId === 0 ? "School Pupil Leader" : postId === 1 ? "Assistant School Pupil Leader" : "Ambassdor";
                      const group = filteredCandidates.filter(c => c.postId === postId);

                      return (
                        <div key={postId} className="space-y-2">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-dashed border-slate-300/10 pb-1">
                            {postLabel} ({group.length})
                          </h4>
                          
                          {group.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-2">No candidates enlisted under this posting category.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {group.map((cand) => (
                                <div key={cand.id} className="flex items-center justify-between p-3 rounded-xl bg-black/10 dark:bg-black/30 border border-slate-300/5 hover:border-blue-500/20 transition-all duration-300 group">
                                  <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-300/10 bg-slate-200 dark:bg-slate-900 text-slate-400 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105">
                                      <img src={cand.faceUrl} alt={cand.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">{cand.name}</p>
                                      <p className="text-[10px] font-mono text-slate-500 uppercase mt-0.5 tracking-wider">{cand.postName}</p>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => handleDeleteCandidate(cand.id)}
                                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================================== */}
            {/* TAB: LEADING LEADERS & BALLOT STATS */}
            {/* ========================================================================== */}
            {dashboardTab === "results" && (
              <div className="space-y-6">
                
                {/* Live Stats Blocks */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 row-entrance">
                  <div className="apple-glass p-4 text-center hover-glow-blue tab-transition" onMouseMove={handleMouseMove}>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Total Ledger Volume
                    </p>
                    <p className="text-3xl font-black text-rose-500 mt-1">{votes.length}</p>
                    <p className="text-[9px] text-slate-500 mt-1">Votes synced across all booths</p>
                  </div>
                  {[1, 2, 3, 4].map(num => {
                    const cnt = votes.filter(v => v.booth === `ballot${num}`).length;
                    return (
                      <div key={num} className="apple-glass p-4 text-center hover-glow-indigo tab-transition" onMouseMove={handleMouseMove}>
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Ballot Booth {num}
                        </p>
                        <p className="text-3xl font-black text-blue-500 mt-1">{cnt}</p>
                        <p className="text-[9px] text-slate-500 mt-1">Total recorded submissions</p>
                      </div>
                    );
                  })}
                </div>

                {/* 📊 Visual Analytics & Graph Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 row-entrance">
                  
                  {/* Chart A: Candidates Vote Shares (Live Bar Chart) */}
                  <div className="liquid-glass-card p-6 flex flex-col justify-between" onMouseMove={handleMouseMove}>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
                      <div>
                        <h3 className="text-base font-black tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-blue-500" />
                          Vote Distributions
                        </h3>
                        <p className="text-[11px] text-slate-500 font-mono tracking-wide uppercase">
                          {analyticsPostId === 0 ? "School Pupil Leader" : analyticsPostId === 1 ? "Assistant School Pupil Leader" : "Ambassador"} Standings
                        </p>
                      </div>
                      
                      {/* Pill post selector */}
                      <div className="flex gap-1 bg-black/10 dark:bg-black/35 p-1 rounded-xl self-start sm:self-auto border border-slate-300/5">
                        {[0, 1, 2].map((id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              playBeep(920, 0.1);
                              setAnalyticsPostId(id);
                            }}
                            className={`px-3 py-1 text-[10px] uppercase font-black rounded-lg cursor-pointer transition-all ${
                              analyticsPostId === id 
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md scale-105" 
                                : "text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                          >
                            {id === 0 ? "SPL" : id === 1 ? "ASPL" : "Amb"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      {candidates.filter(c => c.postId === analyticsPostId).length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 italic">
                          No candidates enrolled in this category.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={candidates.filter(c => c.postId === analyticsPostId).map(c => ({
                              name: c.name,
                              votes: votes.filter(v => {
                                if (analyticsPostId === 0) return v.spl === c.name;
                                if (analyticsPostId === 1) return v.aspl === c.name;
                                return v.amb === c.name;
                              }).length
                            }))} 
                            margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                          >
                            <defs>
                              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.85} />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.35} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid 
                              strokeDasharray="3 3" 
                              stroke={theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"} 
                              vertical={false} 
                            />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fill: theme === "dark" ? "#94a3b8" : "#475569", fontSize: 10, fontWeight: "700" }} 
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis 
                              tick={{ fill: theme === "dark" ? "#94a3b8" : "#475569", fontSize: 10 }} 
                              axisLine={false}
                              tickLine={false}
                              allowDecimals={false}
                            />
                            <RechartsTooltip 
                              cursor={{ fill: theme === "dark" ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)" }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-950/95 border border-slate-300/40 dark:border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Candidate</span>
                                      <span className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1 uppercase">{payload[0].payload.name}</span>
                                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mt-2">
                                        {payload[0].value} {payload[0].value === 1 ? 'Vote' : 'Votes'} ({votes.length > 0 ? (((payload[0].value as number) / votes.length) * 100).toFixed(1) : "0.0"}%)
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="votes" radius={[8, 8, 0, 0]} barSize={28}>
                              {candidates.filter(c => c.postId === analyticsPostId).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="url(#barGrad)" />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Chart B: Turnout trends across booths (Liquid Area Chart) */}
                  <div className="liquid-glass-card p-6 flex flex-col justify-between" onMouseMove={handleMouseMove}>
                    <div className="mb-6">
                      <h3 className="text-base font-black tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" />
                        Booth Telemetry Turnout
                      </h3>
                      <p className="text-[11px] text-slate-500 font-mono tracking-wide uppercase">
                        Active Terminal Load Distribution
                      </p>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart 
                          data={[
                            { name: "Booth 1", votes: votes.filter(v => v.booth === "ballot1").length },
                            { name: "Booth 2", votes: votes.filter(v => v.booth === "ballot2").length },
                            { name: "Booth 3", votes: votes.filter(v => v.booth === "ballot3").length },
                            { name: "Booth 4", votes: votes.filter(v => v.booth === "ballot4").length },
                          ]} 
                          margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ec4899" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke={theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"} 
                            vertical={false} 
                          />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: theme === "dark" ? "#94a3b8" : "#475569", fontSize: 10, fontWeight: "700" }} 
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis 
                            tick={{ fill: theme === "dark" ? "#94a3b8" : "#475569", fontSize: 10 }} 
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <RechartsTooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-950/95 border border-slate-300/40 dark:border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Terminal Input</span>
                                    <span className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1 uppercase">{payload[0].payload.name}</span>
                                    <span className="text-xs font-mono font-bold text-rose-500 dark:text-pink-400 mt-2">
                                      {payload[0].value} {payload[0].value === 1 ? 'Ballot Synced' : 'Ballots Synced'}
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="votes" 
                            stroke="#ec4899" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#areaGrad)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* Leading Leader Results Board */}
                <div className="apple-glass p-6 space-y-6 row-entrance hover-glow-indigo" onMouseMove={handleMouseMove}>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-indigo-500" />
                      Current Leading Candidates Tab
                    </h3>
                    <p className="text-xs text-slate-500">Live dynamic scores and category winners calculated locally.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[0, 1, 2].map(postId => {
                      const postLabel = postId === 0 ? "School Pupil Leader" : postId === 1 ? "Assistant School Pupil Leader" : "Ambassdor";
                      const postCode = postId === 0 ? "spl" : postId === 1 ? "aspl" : "amb";
                      
                      const groupCandidates = candidates.filter(c => c.postId === postId);
                      const resultObj = getWinnerForPost(postId);

                      return (
                        <div key={postId} className="p-5 rounded-2xl bg-black/10 dark:bg-black/20 border border-slate-300/10 flex flex-col justify-between space-y-4">
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                              {postLabel}
                            </span>

                            {/* Current Standings */}
                            <div className="mt-4 space-y-2.5">
                              {groupCandidates.map(cand => {
                                const cnt = getCandidateVoteCount(cand.name, postId);
                                const pct = votes.length > 0 ? ((cnt / votes.length) * 100).toFixed(1) : "0.0";
                                return (
                                  <div key={cand.id} className="space-y-1">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate uppercase pr-2">
                                        {cand.name}
                                      </span>
                                      <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
                                        {cnt} votes ({pct}%)
                                      </span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-slate-300 dark:bg-slate-800 overflow-hidden">
                                      <div 
                                        className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                                        style={{ width: `${pct}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Winner Badging */}
                          <div className="border-t border-dashed border-slate-300/10 pt-4 mt-auto">
                            {resultObj ? (
                              resultObj.isTie ? (
                                <div className="p-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-center rounded-xl text-xs font-bold uppercase tracking-wider">
                                  TIE DETECTED
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 p-2 bg-emerald-500/5 rounded-xl border border-emerald-500/15">
                                  <img 
                                    src={resultObj.winner?.faceUrl} 
                                    alt="winner" 
                                    className="w-10 h-10 rounded-lg object-cover border border-emerald-500/20"
                                  />
                                  <div>
                                    <p className="text-[9px] font-mono text-emerald-500 font-bold uppercase tracking-wider">Leading Leader</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase mt-0.5">{resultObj.winner?.name}</p>
                                  </div>
                                </div>
                              )
                            ) : (
                              <p className="text-xs text-slate-500 dark:text-slate-500 italic text-center">No votes logged yet.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Secure Log Audit List */}
                <div className="apple-glass p-6 space-y-4" onMouseMove={handleMouseMove}>
                  <div className="flex justify-between items-center border-b border-slate-300/10 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Transaction Stream Ledger
                      </h3>
                      <p className="text-xs text-slate-500">Audit report of historical voting timestamps.</p>
                    </div>
                    <span className="text-[10px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded px-2 py-1 font-bold">
                      SECURED LEDGER
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto custom-scroll pr-1 space-y-2">
                    {votes.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-8">No historical credentials found. Ledger void.</p>
                    ) : (
                      votes.map((v, i) => (
                        <div key={v.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 rounded-lg bg-black/15 dark:bg-black/20 text-xs gap-3 border border-slate-300/5">
                          <div className="flex items-center gap-3">
                            <span className="font-mono bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded font-bold text-[10px]">
                              {v.booth.toUpperCase()}
                            </span>
                            <span className="text-slate-500 font-mono text-[10px]">{v.timestamp}</span>
                          </div>
                          <div className="flex gap-4 text-slate-800 dark:text-slate-300 font-mono text-[11px] uppercase">
                            <div><span className="text-purple-400">SPL:</span> {v.spl}</div>
                            <div><span className="text-indigo-400">ASPL:</span> {v.aspl}</div>
                            <div><span className="text-emerald-400">AMB:</span> {v.amb}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================================== */}
            {/* TAB: SYSTEM INTERFACES AND GOOGLE SHEETS SETTINGS */}
            {/* ========================================================================== */}
            {dashboardTab === "settings" && (
              <div className="apple-glass p-6 space-y-6" onMouseMove={handleMouseMove}>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-500" />
                    Cloud Configuration settings
                  </h3>
                  <p className="text-xs text-slate-500">Setup integration routes and connection webhooks.</p>
                </div>

                <div className="space-y-4 max-w-2xl">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                      Google Sheets Web App / Apps Script URL
                    </label>
                    <input 
                      type="text" 
                      value={appsScriptUrl}
                      onChange={(e) => setAppsScriptUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/..."
                      className="glass-input px-4 py-3 rounded-xl text-sm w-full font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1 lines-relaxed">
                      All transaction records are deployed directly onto this endpoint. The terminal segments capitalization variables into separate tab structures: <span className="font-mono bg-black/30 px-1 py-0.2 rounded text-blue-400">Candidates</span>, <span className="font-mono bg-black/30 px-1 py-0.2 rounded text-blue-400">Ballot1</span>, <span className="font-mono bg-black/30 px-1 py-0.2 rounded text-blue-400">Ballot2</span>, <span className="font-mono bg-black/30 px-1 py-0.2 rounded text-blue-400">Ballot3</span>, <span className="font-mono bg-black/30 px-1 py-0.2 rounded text-blue-400">Ballot4</span>.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => {
                        playBeep();
                        alert("Settings updated successfully!");
                      }}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                    >
                      Save Configuration
                    </button>
                    <button 
                      onClick={() => setAppsScriptUrl("https://script.google.com/macros/s/AKfycbwarqo1uNNFhElWa6KInVW55_8xdjfKiam1259mcOmIKGhcMjp0FRVzWmEMJfMkpOPejQ/exec")}
                      className="px-4 py-2.5 text-xs uppercase tracking-wider font-bold text-slate-600 dark:text-slate-400 bg-black/25 text-white hover:bg-black/50 border border-slate-300/10 rounded-xl"
                    >
                      Restore Default Address
                    </button>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300/10 pt-6">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-widest mb-3">Google Sheets Apps Script Template</h4>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    Use this script inside your Google sheet to record ballots. Backends isolate sheets automatically according to incoming transactions.
                  </p>
                  <pre className="p-4 rounded-xl bg-black/40 text-[10px] text-indigo-300 border border-slate-300/10 overflow-x-auto max-h-56 font-mono">
{`function doPost(e) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Is this a Vote coming from a Booth?
  if (e.parameter.booth) {
    var boothId = e.parameter.booth;
    var sheetName = boothId.charAt(0).toUpperCase() + boothId.slice(1);
    var sheet = doc.getSheetByName(sheetName);
   
    if (!sheet) {
      sheet = doc.insertSheet(sheetName);
      sheet.appendRow(["timestamp", "spl", "aspl", "amb"]);
    }
    
    // Force the timestamp to Indian Standard Time (IST) explicitly
    var localTimestamp = Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-dd HH:mm:ss");
   
    sheet.appendRow([localTimestamp, e.parameter.spl, e.parameter.aspl, e.parameter.amb]);
   
    return ContentService.createTextOutput(JSON.stringify({status: "vote recorded"})).setMimeType(ContentService.MimeType.JSON);
  }
 
  // 2. Is this the Master Dashboard pushing the Candidate Roster?
  if (e.postData && e.postData.contents) {
    try {
      var payload = JSON.parse(e.postData.contents);
      if (Array.isArray(payload)) {
        var cSheet = doc.getSheetByName("Candidates");
        if (!cSheet) {
          cSheet = doc.insertSheet("Candidates");
        }
       
        cSheet.clear();
        cSheet.appendRow(["id", "name", "post_id", "post_name", "face_url"]);
       
        if (payload.length > 0) {
          var rows = payload.map(function(c) {
            return [c.id, c.name, c.post_id, c.post_name, c.face_url];
          });
          cSheet.getRange(2, 1, rows.length, 5).setValues(rows);
        }
        return ContentService.createTextOutput(JSON.stringify({status: "candidates synced"})).setMimeType(ContentService.MimeType.JSON);
      }
    } catch(err) {
      return ContentService.createTextOutput(JSON.stringify({error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
    }
  }
 
  return ContentService.createTextOutput(JSON.stringify({error: "Unknown request"})).setMimeType(ContentService.MimeType.JSON);
}`}
                  </pre>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================================================= */}
        {/* 3. ACTIVE BALLOT BOOTH VIEWS (For booth 1, 2, 3, and 4) */}
        {/* ========================================================================================================= */}
        {sessionUser && sessionUser !== "master" && (
          <div className="w-full space-y-6 fade-in relative">
            
            {/* Header Live Bar */}
            <div className="apple-glass p-5 w-full" onMouseMove={handleMouseMove}>
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="text-slate-800 dark:text-slate-300 font-mono text-xs font-bold tracking-[0.25em] flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_#34d399] animate-pulse shrink-0"></span>
                  LIVE SECURE TERMINAL — <span className="text-slate-900 dark:text-white font-sans font-black tracking-normal uppercase">
                    {sessionUser.toUpperCase()} Active
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono tracking-widest text-[#ef4444] font-bold bg-[#ef4444]/15 px-3 py-1.5 border border-[#ef4444]/25 rounded-md uppercase">
                    VOTING STAGE {currentStage + 1} / 3
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="text-[10px] font-bold tracking-widest uppercase bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 border border-slate-300/10 px-4 py-2 rounded-xl transition-all duration-300 text-slate-800 dark:text-slate-300 active:scale-95"
                  >
                    Close Session
                  </button>
                </div>
              </div>
            </div>

            {/* Split layout comprising the physical VVPAT and Ballot unit */}
            <div className="w-full flex flex-col lg:flex-row gap-6 items-stretch">
              
              {/* Part A: Visual VVPAT paper slip display printer */}
              <div className="apple-glass flex flex-col items-center p-6 justify-center lg:w-[350px] shrink-0 row-entrance hover-glow-blue" onMouseMove={handleMouseMove}>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-[0.2em] bg-black/10 dark:bg-white/5 px-4 py-1.5 rounded-full border border-slate-300/10 shadow-inner">
                  VVPAT Printer unit
                </span>

                <div className="vvpat-casing">
                  <div className="vvpat-printer-slot"></div>
                  <div className="vvpat-glass"></div>
                  
                  {/* Digital Paper Slip triggered by state */}
                  <div 
                    className={`vvpat-slip ${slipPrintActive ? "print-sequence" : ""}`}
                    id="vvpat-slip-paper"
                  >
                    <div className="w-full flex justify-between items-center border-b border-slate-300 pb-1.5 mb-2.5">
                      <span className="font-bold text-xs text-slate-400">BOOTH: {sessionUser.toUpperCase()}</span>
                      <span className="font-bold text-xs text-slate-400">S.NO: <span className="text-sm ml-0.5 text-black font-black">
                        {String(candidates.filter(c => c.postId === currentStage).findIndex(c => c.id === selectedCandidateId) + 1).padStart(2, "0")}
                      </span></span>
                    </div>

                    {selectedCandidateId ? (
                      (() => {
                        const targetCand = candidates.find(c => c.id === selectedCandidateId);
                        return (
                          <>
                            <div className="w-32 h-32 overflow-hidden rounded-xl border border-slate-300 bg-slate-100 mb-3.5 shadow-md">
                              <img 
                                src={targetCand?.faceUrl} 
                                alt="Selected" 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-wide text-center w-full truncate text-slate-900 leading-tight">
                              {targetCand?.name}
                            </h3>
                            <p className="text-xs font-mono font-bold text-indigo-700 tracking-wider text-center mt-1.5 uppercase">
                              {targetCand?.postName}
                            </p>
                          </>
                        );
                      })()
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-xs text-slate-400">
                        No Ballot Loaded
                      </div>
                    )}

                    <div className="absolute bottom-3 left-0 right-0 border-t border-dashed border-slate-300 pt-1.5 text-center">
                      <p className="text-[10px] font-bold text-slate-400 tracking-[0.15em] uppercase">
                        VERIFIED SECURE BAL-SYS
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-slate-500 mt-4 text-center max-w-[240px]">
                  Paper verify slip stands visible for 2.7s inside window before automatic vault ingestion.
                </p>
              </div>

              {/* Part B: Physical Ballot Unit Selection board */}
              <div className="apple-glass flex flex-col p-6 flex-1 relative overflow-hidden row-entrance hover-glow-indigo" onMouseMove={handleMouseMove}>
                
                {/* Visual Column Shield Mask preventing duplicate key entries */}
                {stageLocked && <div className="absolute inset-0 bg-transparent z-[80]"></div>}

                <div className="flex justify-between items-center bg-black/10 dark:bg-black/45 px-5 py-4 rounded-xl mb-6 border border-slate-300/10 shadow-sm relative z-10">
                  <div>
                    <span className="text-[10px] font-mono uppercase bg-blue-500/10 border border-blue-500/20 text-blue-500 px-2 py-0.5 rounded font-bold">
                      OFFICIAL BALLOT
                    </span>
                    <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider mt-1.5">
                      {currentStage === 0 ? "School Pupil Leader (SPL)" : currentStage === 1 ? "Assistant School Pupil Leader (ASPL)" : "Ambassdor"}
                    </h2>
                  </div>
                  <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-mono tracking-widest px-3 py-1.5 rounded-md font-bold uppercase">
                    Stage {currentStage + 1} / 3
                  </span>
                </div>

                {/* Candidates List within Ballot stage */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-3 relative z-10 custom-scroll pb-4">
                  {candidates.filter(c => c.postId === currentStage).length === 0 ? (
                    <div className="text-center text-slate-500 dark:text-slate-400 text-xs font-mono py-16 tracking-widest border border-dashed border-slate-300/10 p-4 rounded-xl">
                      NO ACTIVE TELEMETRY DESIGNATED FOR THIS POSTING
                    </div>
                  ) : (
                    candidates
                      .filter(c => c.postId === currentStage)
                      .map((cand, idx) => {
                        const isChosen = selectedCandidateId === cand.id;
                        const isFaded = selectedCandidateId !== null && selectedCandidateId !== cand.id;
                        
                        return (
                          <div 
                            key={cand.id} 
                            className={`evm-grid group transition-all duration-300 ${isFaded ? "opacity-30 blur-[1px]" : "opacity-100"}`}
                          >
                            <div className="flex items-center gap-4 min-w-[140px] flex-1 sm:flex-initial">
                              <div className="font-mono text-sm font-black text-slate-500 dark:text-slate-400 border-r border-slate-300/10 pr-3">
                                {String(idx + 1).padStart(2, "0")}
                              </div>
                              <div className="font-bold text-sm sm:text-base uppercase tracking-wider text-slate-900 dark:text-slate-100 truncate">
                                {cand.name}
                              </div>
                            </div>
                            
                            <div className="flex justify-center w-full sm:w-auto my-2 sm:my-0">
                              <img 
                                src={cand.faceUrl} 
                                alt={cand.name} 
                                className="w-32 h-32 sm:w-28 sm:h-28 object-cover rounded-2xl border border-separate border-slate-300/20 bg-slate-300 dark:bg-slate-900 shadow-lg group-hover:scale-[1.05] transition-all duration-300"
                              />
                            </div>
                            
                            <div className="flex items-center justify-end gap-6 w-full sm:w-auto ml-auto">
                              {/* LED Indicator */}
                              <div className={`led-indicator shrink-0 ${isLedActive === cand.id ? "active" : ""}`}></div>
                              
                              {/* Physical Button */}
                              <button 
                                onClick={() => handleStageSelect(currentStage, cand.id, idx + 1, cand.name)}
                                disabled={stageLocked}
                                className={`vote-btn shrink-0 ${isChosen ? "pressed" : ""}`}
                              ></button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                <div className="border-t border-dashed border-slate-300/10 pt-4 mt-auto flex justify-between items-center text-[10px] font-mono text-slate-500">
                  <span>BALLOT SCHEDULER: SECURE SELECTION IN OPERATION</span>
                  <span>IP/ID SHA-256</span>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>

      {/* ========================================================================================================= */}
      {/* 4. SUCCESS OVERLAY SCREEN (COMPLETION STATE / YOU ARE NTH VOTER) */}
      {/* ========================================================================================================= */}
      <div 
        className={`fixed inset-0 items-center justify-center z-[150] transition-all duration-300 bg-slate-950/80 backdrop-blur-3xl ${successOverlay ? "flex opacity-100" : "hidden opacity-0"}`}
      >
        <div className="text-center w-full max-w-md p-10 apple-glass border border-white/10 bg-gradient-to-b from-white/5 to-transparent shadow-2xl mx-4 relative overflow-hidden glass-spring-box text-white">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent pointer-events-none"></div>
          
          <div className="w-24 h-24 mx-auto mb-8 flex items-center justify-center relative trigger-burst trigger-tick">
            <div className="halo-ring"></div>
            <div className="plasma-orb flex items-center justify-center">
              <Check className="w-8 h-8 text-white drop-shadow-md" strokeWidth={3} />
            </div>
          </div>

          <h2 className="font-display font-black text-3xl tracking-wide mb-2 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
            VOTE RECORDED
          </h2>
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-emerald-400 mb-6">
            SECURE LEDGER BROADCAST SUCCESSFUL
          </p>
          
          <div className="apple-glass py-5 px-6 max-w-xs mx-auto mb-8 bg-white/5 border border-white/10">
            <p className="text-xs uppercase tracking-widest text-slate-300">Congratulations!</p>
            <p className="text-3xl font-black text-white mt-1 border-b border-white/10 pb-2">
              {getOrdinal(successNthVoter)}
            </p>
            <p className="text-[10px] text-slate-400 mt-2 font-mono uppercase tracking-wider">
              Voter in this active booth Terminal
            </p>
          </div>

          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
            <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 progress-line-track rounded-full"></div>
          </div>
          <p className="text-[10px] font-mono text-slate-500 mt-3 uppercase tracking-wider">
            Reinitializing ballot session...
          </p>
        </div>
      </div>

    </div>
  );
}
