import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Html5Qrcode } from 'html5-qrcode';
import { getEventWindowState } from './eventWindow.js';
import './styles.css';

function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`} aria-label="South BLR">
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
      <span>SOUTH <b>BLR</b></span>
    </div>
  );
}

function App() {
  const [windowState, setWindowState] = useState(() => getEventWindowState());
  const [scannerState, setScannerState] = useState('idle');
  const [passValue, setPassValue] = useState('');
  const [scanCount, setScanCount] = useState(0);
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const scannerRef = useRef(null);
  const cooldownRef = useRef(false);

  useEffect(() => {
    const refresh = () => setWindowState(getEventWindowState());
    refresh();
    const timer = window.setInterval(refresh, 1000);
    const onVisible = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
    } catch { /* Camera may already have stopped after a device or tab change. */ }
    try { scanner.clear(); } catch { /* The element may already be unmounted. */ }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (windowState !== 'active') {
      setScannerState('idle');
      void stopScanner();
      return undefined;
    }

    const start = async () => {
      setScannerState('requesting');
      setPassValue('');
      const scanner = new Html5Qrcode('south-blr-reader', {
        verbose: false,
        formatsToSupport: [Html5Qrcode.FORMAT_QR_CODE],
      });
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 12, qrbox: (width, height) => {
            const size = Math.floor(Math.min(width, height) * 0.76);
            return { width: size, height: size };
          }, aspectRatio: 1, disableFlip: false },
          (decodedText) => {
            if (cooldownRef.current || cancelled || getEventWindowState() !== 'active') return;
            cooldownRef.current = true;
            setPassValue(decodedText);
            setScanCount((count) => count + 1);
            setScannerState('detected');
            window.setTimeout(() => {
              cooldownRef.current = false;
              if (!cancelled && getEventWindowState() === 'active') setScannerState('ready');
            }, 1800);
          },
          () => {},
        );
        if (cancelled || getEventWindowState() !== 'active') {
          if (scannerRef.current === scanner) scannerRef.current = null;
          try { await scanner.stop(); } catch { /* Start/close raced. */ }
          try { scanner.clear(); } catch { /* Ignore cleanup race. */ }
        } else {
          setScannerState('ready');
        }
      } catch (error) {
        if (scannerRef.current === scanner) scannerRef.current = null;
        try { if (scanner.isScanning) await scanner.stop(); } catch { /* No active stream. */ }
        try { scanner.clear(); } catch { /* Ignore cleanup race. */ }
        if (!cancelled && getEventWindowState() === 'active') {
          setScannerState('error');
        }
      }
    };

    void start();
    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [windowState, stopScanner, cameraAttempt]);

  const retry = () => {
    setPassValue('');
    cooldownRef.current = false;
    void stopScanner().then(() => setCameraAttempt((attempt) => attempt + 1));
  };

  const active = windowState === 'active';
  const status = windowState === 'closed' ? 'CLOSED'
    : windowState === 'locked' ? 'LOCKED'
      : scannerState === 'requesting' || scannerState === 'idle' ? 'REQUESTING CAMERA'
        : scannerState === 'error' ? 'CAMERA ERROR'
          : scannerState === 'detected' ? 'QR DETECTED' : 'READY TO SCAN';

  return (
    <main className="app-shell">
      <header className="topbar">
        <Brand compact />
        <div className="event-tag"><span className={`status-dot ${active && scannerState === 'ready' ? 'is-live' : ''}`} />
          <span>{active ? 'GATE CHECK-IN' : 'EVENT ACCESS'}</span>
        </div>
      </header>

      {windowState === 'locked' && (
        <section className="locked-screen" aria-live="polite">
          <div className="ambient ambient-one" /><div className="ambient ambient-two" />
          <div className="lock-emblem"><span className="lock-ring">✳</span></div>
          <Brand />
          <div className="state-label"><span className="status-dot" /> CHECK-IN LOCKED</div>
          <div className="locked-copy">
            <p>Check-in opens at</p>
            <h1>5:30 <span>PM</span></h1>
            <div className="date-line"><span />10 OCTOBER 2026<span /></div>
          </div>
          <p className="locked-foot">THE NIGHT STARTS HERE</p>
        </section>
      )}

      {active && (
        <section className="scanner-screen" aria-live="polite">
          <div className="scanner-heading">
            <div>
              <p className="eyebrow">SOUTH BLR&nbsp; / &nbsp;GATE 01</p>
              <h1>SCAN <span>PASS</span></h1>
            </div>
            <div className={`status-chip ${scannerState === 'ready' ? 'chip-ready' : ''} ${scannerState === 'detected' ? 'chip-detected' : ''}`}>
              <span className="status-dot" />{status}
            </div>
          </div>

          <div className={`scanner-frame ${scannerState === 'detected' ? 'frame-detected' : ''}`}>
            <div id="south-blr-reader" className="reader" />
            <div className="scanner-overlay" aria-hidden="true">
              <span className="corner corner-tl" /><span className="corner corner-tr" />
              <span className="corner corner-bl" /><span className="corner corner-br" />
              {scannerState === 'requesting' && <div className="camera-pending"><span className="spinner" /><span>CONNECTING CAMERA</span></div>}
              {scannerState === 'ready' && <div className="scan-line" />}
              {scannerState === 'error' && <div className="camera-pending error-mark">!</div>}
            </div>
          </div>

          {scannerState === 'error' ? (
            <div className="result-panel camera-error" role="alert">
              <div className="result-title"><span className="result-icon">!</span><span>CAMERA UNAVAILABLE</span></div>
              <p>Allow camera access in your browser settings, then try again.</p>
              <button className="retry-button" onClick={retry}>RETRY CAMERA <span>↗</span></button>
            </div>
          ) : passValue ? (
            <div className="result-panel" key={scanCount}>
              <div className="result-title"><span className="result-icon">✓</span><span>PASS SCANNED</span><span className="result-time">JUST NOW</span></div>
              <p className="pass-label">PASS ID</p>
              <div className="pass-value">{passValue}</div>
              <p className="disclaimer">Decoded from QR · Not validated</p>
            </div>
          ) : (
            <div className="scan-prompt">
              <div className="prompt-icon">⌗</div>
              <div><strong>{scannerState === 'requesting' || scannerState === 'idle' ? 'Starting camera' : 'Hold pass in frame'}</strong>
                <span>{scannerState === 'requesting' || scannerState === 'idle' ? 'Camera access is requested only during check-in' : 'Keep the QR code steady to scan'}</span></div>
            </div>
          )}

          <footer className="scanner-footer"><span><span className="status-dot" /> CAMERA LIVE</span><span>SCANS&nbsp; {String(scanCount).padStart(2, '0')}</span></footer>
        </section>
      )}

      {windowState === 'closed' && (
        <section className="closed-screen" aria-live="polite">
          <div className="closed-orbit" aria-hidden="true"><span /><span /><span /></div>
          <div className="close-glyph">✳</div>
          <Brand />
          <div className="state-label closed-label"><span className="status-dot" /> CHECK-IN CLOSED</div>
          <div className="closed-copy"><h1>That’s a<br /><span>wrap.</span></h1><p>Check-in ended at 10:00 PM.</p></div>
          <div className="closed-time"><span /> EVENT WINDOW COMPLETE <span /></div>
        </section>
      )}
      <div className="bottom-glow" aria-hidden="true" />
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
