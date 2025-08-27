

import React, { useState, useEffect } from "react";
import "./App.css";

export default function App() {
  const [acceleration, setAcceleration] = useState(0);
  const [rpm, setRpm] = useState(0);
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    const handleScroll = (e) => {
      setAcceleration(Math.max(0, Math.min(1, acceleration + e.deltaY * -0.001)));
    };
    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp") setAcceleration(1);
    };
    window.addEventListener("wheel", handleScroll);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("wheel", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [acceleration]);

  useEffect(() => {
    const interval = setInterval(() => {
      // RPM and speed update with smoother deceleration (inertia effect)
      setRpm((prev) => prev + (acceleration * 10000 - prev) * 0.15);
      setSpeed((prev) => prev + (acceleration * 320 - prev) * 0.08);

      // Gradually return acceleration to zero (simulating pedal release)
      setAcceleration((prev) => Math.max(0, prev - 0.02));
    }, 100);
    return () => clearInterval(interval);
  }, [acceleration]);

  const rpmRotation = (rpm / 10000) * 270 - 135;
  const speedRotation = (speed / 320) * 270 - 135;

  const bgColor = `rgb(${Math.min(255, speed * 0.8)}, ${Math.max(0, 255 - speed)}, ${Math.max(0, 255 - speed * 0.5)})`;


import React, { useState, useEffect } from "react";
import "./App.css";

export default function App() {
  const [rpm, setRpm] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [audioCtx, setAudioCtx] = useState(null);
  const [oscillator, setOscillator] = useState(null);

  // Atualiza velocidade proporcional ao RPM (ex: 1.000 rpm ≈ 32 km/h)
  useEffect(() => {
    setSpeed(Math.floor(rpm * 0.032));
  }, [rpm]);

  // Inicializa áudio
  const startAudio = () => {
    if (!audioCtx) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0.05;
      osc.start();
      setAudioCtx(ctx);
      setOscillator(osc);
    }
  };

  // Ajusta frequência do som conforme RPM
  useEffect(() => {
    if (oscillator) {
      oscillator.frequency.setTargetAtTime(rpm * 0.1, audioCtx.currentTime, 0.05);
    }
  }, [rpm, oscillator, audioCtx]);

  // Scroll e setas controlam RPM
  useEffect(() => {
    const handleWheel = (e) => {
      setRpm((prev) => Math.max(0, Math.min(10000, prev + e.deltaY * -2)));
    };
    const handleKey = (e) => {
      if (e.key === "ArrowUp") setRpm((p) => Math.min(10000, p + 200));
      if (e.key === "ArrowDown") setRpm((p) => Math.max(0, p - 200));
    };
    window.addEventListener("wheel", handleWheel);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div className="App">
      <h1>EV Engine Sound Simulator</h1>
      <button onClick={startAudio}>Start</button>

      <div className="gauges">
        {/* Conta-giros */}
        <div className="gauge">
          <div className="gauge-title">RPM</div>
          <div className="dial rpm">
            <div
              className="needle"
              style={{ transform: `rotate(${(rpm / 10000) * 270 - 135}deg)` }}
            />
          </div>
          <div className="gauge-value">{rpm} rpm</div>
        </div>

        {/* Velocímetro */}
        <div className="gauge">
          <div className="gauge-title">Speed</div>
          <div className="dial speed">
            <div
              className="needle"
              style={{ transform: `rotate(${(speed / 320) * 270 - 135}deg)` }}
            />
          </div>
          <div className="gauge-value">{speed} km/h</div>
        </div>
      </div>

      <input
        type="range"
        min="0"
        max="10000"
        value={rpm}
        onChange={(e) => setRpm(parseInt(e.target.value))}
      />


              <div className="App" style={{ background: bgColor, transition: "background 0.5s" }}>
      <h1>EV Engine Sound Simulator</h1>
      <div className="gauges">
        {/* RPM Gauge */}
        <div className="gauge">
          <div className="dial rpm"></div>
          <div className="needle" style={{ transform: `rotate(${rpmRotation}deg)` }}></div>
          <div className="label">{Math.round(rpm)} RPM</div>
        </div>

        {/* Speed Gauge */}
        <div className="gauge">
          <div className="dial speed"></div>
          <div className="needle" style={{ transform: `rotate(${speedRotation}deg)` }}></div>
          <div className="label">{Math.round(speed)} km/h</div>
        </div>
      </div>

      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={acceleration}
        onChange={(e) => setAcceleration(parseFloat(e.target.value))}
      />
    </div>
          
    </div>
  );
}


  
  return (
    <div className="App" style={{ background: bgColor, transition: "background 0.5s" }}>
      <h1>EV Engine Sound Simulator</h1>
      <div className="gauges">
        {/* RPM Gauge */}
        <div className="gauge">
          <div className="dial rpm"></div>
          <div className="needle" style={{ transform: `rotate(${rpmRotation}deg)` }}></div>
          <div className="label">{Math.round(rpm)} RPM</div>
        </div>

        {/* Speed Gauge */}
        <div className="gauge">
          <div className="dial speed"></div>
          <div className="needle" style={{ transform: `rotate(${speedRotation}deg)` }}></div>
          <div className="label">{Math.round(speed)} km/h</div>
        </div>
      </div>

      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={acceleration}
        onChange={(e) => setAcceleration(parseFloat(e.target.value))}
      />
    </div>
  );
}


