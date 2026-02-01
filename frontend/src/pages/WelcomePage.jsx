import React from "react";
import "../Welcome.css";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";


const Welcome = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/login");
  };

  return (
    <div className="welcome-container">
       {/* Galaxy Sparkles */}
      <div className="sparkles">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${14 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>
      
      {/* Decorative Galaxy Orbs */}
      <div className="decorative-dot dot-1" />
      <div className="decorative-dot dot-2" />
      <div className="decorative-dot dot-3" />

      {/* Main Galaxy Card */}
      <div className="main-card"
        style={{ maxWidth: "850px", padding: "50px 60px", maxHeight:"800px" }}
      >
        
        {/* Logo / Core */}
        <div className="logo-section">
          <div className="logo-outer-ring">
            <div className="logo-inner-circle">
              <img
                src={logo}
                alt="StudyBuddy AI Core"
                className="logo-image"
                draggable="false"
              />
            </div>
          </div>
          <div className="logo-glow-effect" />
        </div>

        {/* Content */}
        <div className="content-wrapper">
          {/* Title */}
          <h1 className="title">
            Study<span className="title-accent">Buddy</span>
          </h1>
          <br></br>

          {/* Features */}
          <div className="subtitle-section">
            <div className="feature-chip">
              <span className="feature-badge">🧠</span>
              <span className="feature-text">Offline AI Engine</span>
            </div>

            <div className="vertical-divider" />

            <span className="platform-tag">LOCAL AI CHAT</span>
          </div>

          {/* Tagline */}
          <div className="tagline-container">
            <br></br>
            <p className="tagline">
              Study Smarter. Mentor Better. Zoom Deeper. Without Servers.
            </p>
          </div>

          <p className="tagline-subtext">
            Fully offline · Zero servers · Absolute privacy
          </p>

          {/* Description */}
          <div className="description-card"
            style={{ maxWidth: "650px", padding: "30px 60px", maxHeight:"690px" }}
          >
            <h1 className="description">
              An intelligent, fully offline educational platform powered by a local AI engine. 
              Designed for students and teachers, this application helps you study smarter, 
              teach better, and understand deeper — without relying on the internet or compromising your data privacy.
            </h1>
          </div>

          {/* CTA */}
          <button
            className="start-button"
            onClick={handleGetStarted}
            aria-label="Start using StudyBuddy"
          >
            <span className="button-text">GET STARTED</span>
            <span className="button-icon">🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
};




export default Welcome;
