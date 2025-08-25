import React, { useState, useEffect, useRef } from "react";
import "./App.css";

export default function App() {
  const [acceleration, setAcceleration] = useState(0);
  const [rpm, setRpm] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [engineType, setEngineType] = useState("porsche");

  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainRef = useRef(null);

  // Configurações para diferentes motores
  const engineConfigs = {
    porsche: { type: "sawtooth", baseFreq: 120, maxFreq: 2200, volume: 0.6 },
    moto: { type: "square", baseFreq: 180, maxFreq: 6000, volume: 0.4 },
    popular: { type: "triangle", baseFreq: 80, maxFreq: 3500, volume: 0.5 },
  };

  useEffect(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      oscillatorRef.current = audioCtxRef.current.createOscillator();
      gainRef.current = audioCtxRef.current.createGain();

      oscillatorRef.current.type = engineConfigs[engineType].type;
      oscillatorRef.current.connect(gainRef.current);
      gainRef.current.connect(audioCtxRef.current.destination);

      oscillatorRef.current.start();
    }
  }, []);

  // Atualiza o tipo de motor quando o usuário troca
  useEffect(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.type = engineConfigs[engineType].type;
    }
  }, [engineType]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRpm((prev) => prev + (acceleration * 10000 - prev) * 0.15);
      setSpeed((prev) => prev + (acceleration * 320 - prev) * 0.08);
      setAcceleration((prev) => Math.max(0, prev - 0.02));
    }, 100);
    return () => clearInterval(interval);
  }, [acceleration]);

  useEffect(() => {
    if (oscillatorRef.current && gainRef.current) {
      const config = engineConfigs[engineType];
      const freq = config.baseFreq + (rpm / 10000) * (config.maxFreq - config.baseFreq);

      oscillatorRef.current.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
      gainRef.current.gain.setValueAtTime(Math.min(config.volume, rpm / 10000), audioCtxRef.current.currentTime);
    }
  }, [rpm, engineType]);

  const rpmRotation = (rpm / 10000) * 270 - 135;
  const speedRotation = (speed / 320) * 270 - 135;

  return (
    <div className="App">
      <h1>EV Engine Sound Simulator</h1>

      <div className="engine-selector">
        <label>Select Engine Sound: </label>
        <select value={engineType} onChange={(e) => setEngineType(e.target.value)}>
          <option value="porsche">Porsche</option>
          <option value="moto">Sport Bike</option>
          <option value="popular">Compact Car</option>
        </select>
      </div>

      <div className="gauges">
        <div className="gauge">
          <div className="dial rpm"></div>
          <div className="needle" style={{ transform: `rotate(${rpmRotation}deg)` }}></div>
          <div className="label">{Math.round(rpm)} RPM</div>
        </div>

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
