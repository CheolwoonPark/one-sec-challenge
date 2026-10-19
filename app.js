(() => {
  "use strict";

  const TARGET_MS = 1000;
  const STORAGE_KEY = "one-sec-challenge-best-ms";

  const grades = [
    { maxAbsMs: 10, label: "완벽", cls: "result-good" },
    { maxAbsMs: 50, label: "거의", cls: "result-ok" },
    { maxAbsMs: 150, label: "아쉬움", cls: "result-meh" },
    { maxAbsMs: Infinity, label: "다시!", cls: "result-bad" },
  ];

  const els = {
    timeLabel: document.getElementById("timeLabel"),
    timeDisplay: document.getElementById("timeDisplay"),
    resultPanel: document.getElementById("resultPanel"),
    gradeText: document.getElementById("gradeText"),
    errorText: document.getElementById("errorText"),
    tapBtn: document.getElementById("tapBtn"),
    tapLabel: document.getElementById("tapLabel"),
    hintText: document.getElementById("hintText"),
    bestScore: document.getElementById("bestScore"),
  };

  let running = false;
  let startTs = 0;
  let rafId = 0;
  let bestAbsMs = loadBest();

  renderBest();

  els.tapBtn.addEventListener("pointerdown", onTap, { passive: false });

  function onTap(event) {
    event.preventDefault();
    vibrate(running ? 18 : 12);

    if (!running) {
      startRun();
    } else {
      stopRun();
    }
  }

  function startRun() {
    running = true;
    startTs = performance.now();
    els.resultPanel.hidden = true;
    els.timeLabel.textContent = "측정 중";
    els.tapLabel.textContent = "멈춤!";
    els.tapBtn.classList.add("running");
    els.timeDisplay.className = "time-display running";
    els.hintText.textContent = "지금… 1초가 되면 탭!";
    tick();
  }

  function stopRun() {
    running = false;
    cancelAnimationFrame(rafId);

    const elapsedMs = performance.now() - startTs;
    const errorMs = elapsedMs - TARGET_MS;
    const absError = Math.abs(errorMs);
    const grade = grades.find((g) => absError <= g.maxAbsMs) || grades[grades.length - 1];

    els.timeDisplay.textContent = formatSeconds(elapsedMs);
    els.timeDisplay.className = `time-display ${grade.cls}`;
    els.timeLabel.textContent = "결과";
    els.gradeText.textContent = grade.label;
    els.errorText.textContent = formatError(errorMs);
    els.resultPanel.hidden = false;

    els.tapLabel.textContent = "다시";
    els.tapBtn.classList.remove("running");
    els.hintText.textContent = "한 번 더? 최고 기록을 노려보세요.";

    if (bestAbsMs === null || absError < bestAbsMs) {
      bestAbsMs = absError;
      saveBest(bestAbsMs);
      renderBest();
      vibrate([12, 40, 18]);
    }
  }

  function tick() {
    if (!running) return;
    const elapsedMs = performance.now() - startTs;
    els.timeDisplay.textContent = formatSeconds(elapsedMs);
    rafId = requestAnimationFrame(tick);
  }

  function formatSeconds(ms) {
    return (ms / 1000).toFixed(3);
  }

  function formatError(errorMs) {
    const rounded = Math.round(errorMs);
    const sign = rounded > 0 ? "+" : "";
    return `오차 ${sign}${rounded} ms`;
  }

  function formatBest(absMs) {
    if (absMs === null) return "—";
    return `±${Math.round(absMs)} ms`;
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  }

  function saveBest(absMs) {
    try {
      localStorage.setItem(STORAGE_KEY, String(absMs));
    } catch {
      /* ignore quota / private mode */
    }
  }

  function renderBest() {
    els.bestScore.textContent = formatBest(bestAbsMs);
  }

  function vibrate(pattern) {
    if (typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(pattern);
      } catch {
        /* ignore */
      }
    }
  }
})();
