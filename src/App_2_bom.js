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
    </div>
  );
}

/* App.css */

.App {
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 20px;
  background: #111;
  color: white;
}

button {
  margin: 10px;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.gauges {
  display: flex;
  justify-content: center;
  gap: 60px;
  margin: 40px;
}

.gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gauge-title {
  font-size: 18px;
  margin-bottom: 10px;
}

.dial {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: conic-gradient(
    green 0deg 162deg, /* até 6000 rpm */
    yellow 162deg 216deg, /* até 8000 rpm */
    red 216deg 270deg, /* zona vermelha */
    #333 270deg 360deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
}

.dial.speed {
  background: conic-gradient(
    #1e90ff 0deg 101deg, /* até 120 km/h */
    white 101deg 202deg, /* até 240 km/h */
    red 202deg 270deg, /* acima de 240 */
    #333 270deg 360deg
  );
}

.needle {
  position: absolute;
  width: 4px;
  height: 90px;
  background: white;
  bottom: 50%;
  left: 50%;
  transform-origin: bottom center;
  transition: transform 0.1s linear;
}

.gauge-value {
  margin-top: 10px;
  font-size: 16px;
}
