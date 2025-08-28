import React, { useState, useEffect, useRef } from "react";
import "./App.css";

export default function App() {
  const [acceleration, setAcceleration] = useState(0);
  const [rpm, setRpm] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [engineOn, setEngineOn] = useState(false);

  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainRef = useRef(null);

  // Atualização de RPM e velocidade
  useEffect(() => {
    if (!engineOn) return;

    const interval = setInterval(() => {
      setRpm((prev) => prev + (acceleration * 10000 - prev) * 0.2);
      setSpeed((prev) => prev + (acceleration * 220 - prev) * 0.1);
      setAcceleration((prev) => Math.max(0, prev - 0.02)); // aceleração volta para zero
    }, 100);

    return () => clearInterval(interval);
  }, [acceleration, engineOn]);

  // Controle do som do motor
  useEffect(() => {
    if (!engineOn || !oscillatorRef.current || !gainRef.current) return;

    const freq = 100 + (rpm / 10000) * 1900;
    oscillatorRef.current.frequency.setValueAtTime(
      freq,
      audioCtxRef.current.currentTime
    );

    gainRef.current.gain.setValueAtTime(
      Math.min(0.5, rpm / 10000),
      audioCtxRef.current.currentTime
    );
  }, [rpm, engineOn]);

  // Função para iniciar motor
  const startEngine = () => {
    if (engineOn) return;

    audioCtxRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();

    // Som curto de ignição
    const ignitionOsc = audioCtxRef.current.createOscillator();
    const ignitionGain = audioCtxRef.current.createGain();
    ignitionOsc.type = "square";
    ignitionOsc.frequency.setValueAtTime(200, audioCtxRef.current.currentTime);
    ignitionGain.gain.setValueAtTime(0.5, audioCtxRef.current.currentTime);
    ignitionOsc.connect(ignitionGain);
    ignitionGain.connect(audioCtxRef.current.destination);
    ignitionOsc.start();
    ignitionOsc.stop(audioCtxRef.current.currentTime + 0.3);

    // Som contínuo do motor
    oscillatorRef.current = audioCtxRef.current.createOscillator();
    gainRef.current = audioCtxRef.current.createGain();

    oscillatorRef.current.type = "sawtooth";
    oscillatorRef.current.connect(gainRef.current);
    gainRef.current.connect(audioCtxRef.current.destination);

    oscillatorRef.current.start();

    setEngineOn(true);
  };

  // Função para desligar motor
  const stopEngine = () => {
    if (!engineOn || !oscillatorRef.current) return;

    oscillatorRef.current.stop();
    audioCtxRef.current.close();

    oscillatorRef.current = null;
    gainRef.current = null;
    audioCtxRef.current = null;

    setEngineOn(false);
    setRpm(0);
    setSpeed(0);
  };

  const rpmRotation = (rpm / 10000) * 270 - 135;
  const speedRotation = (speed / 220) * 270 - 135;

  return (
    <div className="App">
      <h1>EV Engine Sound Simulator</h1>

      <div className="controls">
        <button onClick={startEngine} disabled={engineOn}>
          Start Engine
        </button>
        <button onClick={stopEngine} disabled={!engineOn}>
          Stop Engine
        </button>
      </div>

      <div className="gauges">
        <div className="gauge">
          <div className="dial rpm"></div>
          <div
            className="needle"
            style={{ transform: `rotate(${rpmRotation}deg)` }}
          ></div>
          <div className="label">{Math.round(rpm)} RPM</div>
        </div>

        <div className="gauge">
          <div className="dial speed"></div>
          <div
            className="needle"
            style={{ transform: `rotate(${speedRotation}deg)` }}
          ></div>
          <div className="label">{Math.round(speed)} km/h</div>
        </div>
      </div>

      {engineOn && (
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={acceleration}
          onChange={(e) => setAcceleration(parseFloat(e.target.value))}
        />
      )}
    </div>
  );
}
