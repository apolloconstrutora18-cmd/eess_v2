import React, { useState, useEffect } from "react";
import "./App.css";

export default function App() {
  const [acceleration, setAcceleration] = useState(0);
  const [rpm, setRpm] = useState(0);
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    const handleScroll = (e) => {
      setAcceleration((prev) => Math.max(0, Math.min(1, prev + e.deltaY * -0.001)));
    };
    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp") setAcceleration((prev) => Math.min(1, prev + 0.02));
      if (e.key === "ArrowDown") setAcceleration((prev) => Math.max(0, prev - 0.02));
    };
    window.addEventListener("wheel", handleScroll);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("wheel", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRpm((prev) => prev + (acceleration * 10000 - prev) * 0.1);
      setSpeed((prev) => prev + (acceleration * 320 - prev) * 0.1);
    }, 100);
    return () => clearInterval(interval);
  }, [acceleration]);

  const rpmRotation = (rpm / 10000) * 270 - 135;
  const speedRotation = (speed / 320) * 270 - 135;

  const bgColor = `rgb(${Math.min(255, speed * 0.8)}, ${Math.max(0, 255 - speed)}, ${Math.max(0, 255 - speed * 0.5)})`;

  const rpmMarks = [0, 2000, 4000, 6000, 8000, 10000];
  const speedMarks = [0, 80, 160, 240, 320];

  return (
    <div className="App" style={{ background: bgColor, transition: "background 0.5s" }}>
      <h1>EV Engine Sound Simulator</h1>
      <div className="gauges">
        {/* RPM Gauge */}
        <div className="gauge">
          <div className="dial rpm">
            {rpmMarks.map((mark) => (
              <div
                key={mark}
                className="mark"
                style={{ transform: `rotate(${(mark / 10000) * 270 - 135}deg) translate(0, -90px)` }}
              >
                <span className="mark-label" style={{ color: mark >= 8000 ? "red" : mark >= 6000 ? "orange" : "white" }}>{mark / 1000}</span>
              </div>
            ))}
          </div>
          <div className="needle" style={{ transform: `rotate(${rpmRotation}deg)` }}></div>
          <div className="label">{Math.round(rpm)} RPM</div>
        </div>

        {/* Speed Gauge */}
        <div className="gauge">
          <div className="dial speed">
            {speedMarks.map((mark) => (
              <div
                key={mark}
                className="mark"
                style={{ transform: `rotate(${(mark / 320) * 270 - 135}deg) translate(0, -90px)` }}
              >
                <span className="mark-label" style={{ color: mark >= 240 ? "red" : mark >= 120 ? "orange" : "white" }}>{mark}</span>
              </div>
            ))}
          </div>
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
