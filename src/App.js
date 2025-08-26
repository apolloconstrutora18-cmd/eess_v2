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

