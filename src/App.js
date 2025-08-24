import React, { useEffect, useRef, useState } from "react";

export default function App() {
  // ====== Audio + Physics State ======
  const audioCtxRef = useRef(null);
  const oscFundRef = useRef(null);
  const masterGainRef = useRef(null);
  const animRef = useRef(null);

  const [running, setRunning] = useState(false);
  const [throttle, setThrottle] = useState(0); // 0..1
  const [rpm, setRpm] = useState(900);
  const [speed, setSpeed] = useState(0);

  // Sim params
  const MIN_RPM = 900;
  const MAX_RPM = 7900;
  const MAX_SPEED = 240; // km/h (display)

  const targetRpmRef = useRef(MIN_RPM);
  const currentRpmRef = useRef(MIN_RPM);

  // ====== Helpers ======
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const throttleToRpm = (t) => {
    const eased = 1 - Math.pow(1 - t, 2); // ease-out
    return MIN_RPM + eased * (MAX_RPM - MIN_RPM);
  };

  const rpmToSpeed = (rpmVal) => {
    const norm = (rpmVal - MIN_RPM) / (MAX_RPM - MIN_RPM);
    return Math.max(0, Math.min(MAX_SPEED, norm * MAX_SPEED));
  };

  const rpmToFundamental = (rpmVal) => {
    // simple 6-cyl firing model -> keep audible but safe
    const firingsPerRev = 3; // cylinders/2 for flat-6-ish feel
    const f0 = (rpmVal / 60) * firingsPerRev;
    return Math.min(500, Math.max(40, f0));
  };

  // ====== Audio Setup ======
  function ensureAudio() {
    if (audioCtxRef.current) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.gain.value = 0.0;

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = rpmToFundamental(MIN_RPM);

    osc.connect(gain).connect(ctx.destination);
    osc.start();

    audioCtxRef.current = ctx;
    masterGainRef.current = gain;
    oscFundRef.current = osc;
  }

  function startAudio() {
    ensureAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const g = masterGainRef.current.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0.7, now + 0.2);
    setRunning(true);
    startAnim();
  }

  function stopAudio() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const g = masterGainRef.current.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0.0, now + 0.2);
    setRunning(false);
    stopAnim();
  }

  // ====== Animation / Simulation Tick ======
  function startAnim() {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const tick = () => {
      // RPM smoothing (engine inertia)
      const target = targetRpmRef.current;
      const current = currentRpmRef.current;
      const dt = 1 / 60;
      const tau = target > current ? 0.12 : 0.28; // faster up than down
      const alpha = 1 - Math.exp(-dt / tau);
      const next = current + (target - current) * alpha;
      currentRpmRef.current = next;

      // Update audio
      if (oscFundRef.current && audioCtxRef.current) {
        const now = audioCtxRef.current.currentTime;
        const f0 = rpmToFundamental(next);
        oscFundRef.current.frequency.setTargetAtTime(f0, now, 0.03);
      }

      const v = rpmToSpeed(next);
      setRpm(Math.round(next));
      setSpeed(Math.round(v));

      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }

  function stopAnim() {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = null;
  }

  // Update target when throttle changes
  useEffect(() => {
    targetRpmRef.current = throttleToRpm(throttle);
  }, [throttle]);

  // Scroll + keyboard control
  useEffect(() => {
    const onWheel = (e) => {
      e.preventDefault();
      const delta = -e.deltaY; // up = accelerate
      const step = 0.0012 * Math.abs(delta);
      const next = clamp01(throttle + (delta > 0 ? step : -step));
      setThrottle(next);
    };
    const onKey = (e) => {
      if (e.key === "ArrowUp") setThrottle((t) => clamp01(t + 0.03));
      if (e.key === "ArrowDown") setThrottle((t) => clamp01(t - 0.03));
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [throttle]);

  // ====== Gauge math (angles) ======
  // Both gauges sweep from -140° (min) to +140° (max)
  const angleFor = (value, min, max) => {
    const a0 = -140;
    const a1 = 140;
    const n = (value - min) / (max - min);
    const cl = Math.max(0, Math.min(1, n));
    return a0 + (a1 - a0) * cl;
  };

  const rpmAngle = angleFor(rpm, 0, 8000);
  const speedAngle = angleFor(speed, 0, MAX_SPEED);

  return (
    <div className="app">
      <style>{`
        :root { --bg:#0b1220; --panel:#141c2e; --ring:#1f2a44; --accent:#00e0a4; --accent2:#ff4d4d; --text:#e8f0ff; }
        *{box-sizing:border-box}
        body,html,#root{height:100%}
        .app{min-height:100vh; background:linear-gradient(180deg, #0b1220 0%, #0f1526 100%); color:var(--text); display:flex; align-items:center; justify-content:center; padding:24px; font-family:Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif}
        .shell{width:min(1100px,95vw); display:grid; grid-template-columns: 1fr 1fr 260px; gap:20px}
        .card{background:var(--panel); border:1px solid #24304d; border-radius:20px; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,.35)}
        .title{font-weight:700; font-size:20px; opacity:.95}

        /* Gauge base */
        .gauge{ position:relative; width:280px; height:280px; margin:10px auto; border-radius:50%;
          background:
            radial-gradient(closest-side, #101828 60%, transparent 61%),
            conic-gradient(from -140deg, #0e1627 0deg 280deg);
          display:grid; place-items:center;}
        .gauge .ring{ position:absolute; inset:14px; border-radius:50%; background:conic-gradient(from -140deg,
            #2a3658 0deg 20deg,
            #2f7fff 20deg 160deg,
            #2a3658 160deg 220deg,
            #ff4d4d 220deg 280deg);
          mask: radial-gradient(circle at center, transparent 62%, black 63%);
          -webkit-mask: radial-gradient(circle at center, transparent 62%, black 63%);
        }
        .gauge .ticks{ position:absolute; inset:24px; border-radius:50%;}
        .tick{ position:absolute; left:50%; top:50%; width:2px; height:14px; background:#8aa2d6; transform-origin:50% calc(140px - 24px); opacity:.75 }
        .tick.major{ height:20px; width:3px; background:#cfe0ff; }

        .label{ position:absolute; bottom:30px; text-align:center; font-weight:600; letter-spacing:.08em; font-size:14px; opacity:.9 }
        .value{ position:absolute; top:58%; transform:translateY(-50%); text-align:center; font-size:36px; font-weight:800 }

        /* Needle */
        .needle{ position:absolute; width:6px; height:38%; background:linear-gradient(#ff7373,#ff1f1f); left:50%; top:12%; transform-origin:50% 88%; border-radius:4px; box-shadow:0 2px 10px rgba(255,77,77,.5)}
        .hub{ position:absolute; width:20px; height:20px; border-radius:50%; background:#e5eeff; left:50%; top:50%; transform:translate(-50%,-50%); box-shadow:0 0 0 6px rgba(255,255,255,.05)}

        .controls{ display:flex; gap:14px; align-items:center; justify-content:space-between }
        .btn{ padding:10px 16px; border-radius:12px; border:1px solid #2b3b61; background:#13203a; color:var(--text); font-weight:700; cursor:pointer }
        .btn.start{ background:#0a3; border-color:#0a6 }
        .btn.stop{ background:#a00; border-color:#d44 }
        .sliderWrap{ height:260px; width:64px; background:#0f1a32; border:1px solid #24304d; border-radius:16px; position:relative; display:flex; align-items:center; justify-content:center }
        .slider{ writing-mode: bt-lr; -webkit-appearance:none; appearance:none; width:180px; height:8px; transform:rotate(-90deg); background:#172243; border-radius:999px; outline:none }
        .slider::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:22px; height:22px; border-radius:50%; background:#fff; border:2px solid #2b3b61 }
        .meta{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; font-size:14px; opacity:.9 }
      `}</style>

      <div className="shell">
        {/* Gauges */}
        <div className="card" style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:20}}>
          <div>
            <div className="title">Tachometer</div>
            <div className="gauge">
              <div className="ring" />
              <div className="ticks">
                {Array.from({length:29}).map((_,i)=>{
                  const angle = -140 + (280/28)*i;
                  const isMajor = i%4===0;
                  return (
                    <div key={i} className={"tick" + (isMajor?" major":"")} style={{ transform:`rotate(${angle}deg) translate(-50%, -140px)`}} />
                  );
                })}
              </div>
              <div className="needle" style={{ transform:`rotate(${rpmAngle}deg)` }} />
              <div className="hub" />
              <div className="value">{rpm} <span style={{fontSize:16, opacity:.8}}>RPM</span></div>
              <div className="label">x1000</div>
            </div>
          </div>
          <div>
            <div className="title">Speedometer</div>
            <div className="gauge">
              <div className="ring" />
              <div className="ticks">
                {Array.from({length:25}).map((_,i)=>{
                  const angle = -140 + (280/24)*i;
                  const isMajor = i%3===0;
                  return (
                    <div key={i} className={"tick" + (isMajor?" major":"")} style={{ transform:`rotate(${angle}deg) translate(-50%, -140px)`}} />
                  );
                })}
              </div>
              <div className="needle" style={{ transform:`rotate(${speedAngle}deg)` }} />
              <div className="hub" />
              <div className="value">{speed} <span style={{fontSize:16, opacity:.8}}>km/h</span></div>
              <div className="label">0 — {MAX_SPEED}</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="card">
          <div className="title" style={{marginBottom:12}}>Controls</div>
          <div className="controls">
            {!running ? (
              <button className="btn start" onClick={startAudio}>Start</button>
            ) : (
              <button className="btn stop" onClick={stopAudio}>Stop</button>
            )}
            <div className="sliderWrap">
              <input
                className="slider"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={throttle}
                onChange={(e)=> setThrottle(parseFloat(e.target.value))}
                aria-label="Throttle"
              />
            </div>
          </div>
          <div className="meta">
            <div>Throttle: {(throttle*100).toFixed(0)}%</div>
            <div>Audio: {running?"On":"Off"}</div>
            <div>Target RPM: {Math.round(targetRpmRef.current)}</div>
            <div>Fundamental: {Math.round(rpmToFundamental(rpm))} Hz</div>
          </div>
          <p style={{marginTop:10, opacity:.75}}>Tip: Use mouse <b>scroll</b> or <b>↑/↓</b> to accelerate.</p>
        </div>

        {/* About */}
        <div className="card">
          <div className="title" style={{marginBottom:8}}>About</div>
          <p style={{opacity:.9, lineHeight:1.5}}>
            CSS-driven <b>tachometer</b> and <b>speedometer</b> gauges. The needle rotation updates in real time
            based on the simulated engine RPM and speed. No external chart libraries were used — just CSS and React state.
          </p>
          <ul style={{marginTop:10, paddingLeft:18, opacity:.9}}>
            <li>RPM range: {MIN_RPM}–{MAX_RPM}</li>
            <li>Speed range: 0–{MAX_SPEED} km/h</li>
            <li>Audio: Web Audio API (sawtooth oscillator)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

