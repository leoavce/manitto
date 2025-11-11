// js/main.js

// 하드코딩된 마니또 후보 이름들 (원하는 대로 바꿔서 쓰면 됨)
const HARDCODED_NAMES = [
  "홍정우",
  "김말숙",
  "이철수",
  "박영희",
  "테스트 마니또 A",
  "테스트 마니또 B"
];

window.addEventListener("DOMContentLoaded", () => {
  setupButtonTextAnimation();
  setupScreens();
  setupToasterAnimation();
});

/**
 * 시작 화면 버튼 텍스트 애니메이션 (마리오 버튼)
 */
function setupButtonTextAnimation() {
  const buttonText = document.querySelector(".button-text");
  const container = document.querySelector(".button-text-characters-container");
  if (!buttonText || !container) return;

  const chars = buttonText.textContent.split("");
  const charsWithoutSpace = chars.filter((ch) => !/\s/.test(ch)).length;

  const frag = document.createDocumentFragment();
  let index = 1;

  chars.forEach((ch) => {
    const span = document.createElement("span");
    span.textContent = ch;

    if (!/\s/.test(ch)) {
      span.classList.add("button-text-character");
      const delay = `calc(2s / ${charsWithoutSpace} * ${index} + 1s)`;
      span.style.setProperty("--delay", delay);
      index++;
    }

    frag.appendChild(span);
  });

  container.appendChild(frag);
}

/**
 * 시작 화면 ↔ 마니또 화면 전환
 */
function setupScreens() {
  const startScreen = document.getElementById("start-screen");
  const manittoScreen = document.getElementById("manitto-screen");
  const startButton = document.getElementById("start-button");

  if (!startScreen || !manittoScreen || !startButton) return;

  startButton.addEventListener("click", () => {
    startScreen.classList.add("hidden");
    manittoScreen.classList.remove("hidden");
    // 화면 전환 후 스크롤 상단으로
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/**
 * GSAP 토스터 애니메이션 + 마니또 이름 표시
 */
function setupToasterAnimation() {
  if (!window.gsap) {
    console.warn("GSAP not loaded");
    return;
  }

  const gsap = window.gsap;
  if (window.EasePack) {
    gsap.registerPlugin(window.EasePack);
  }

  const toastClip = document.getElementById("toast-clip");
  const toastBtn = document.getElementById("button-trigger");
  const resultCardEl = document.getElementById("result-card");
  const manittoNameEl = document.getElementById("manitto-name");

  if (!toastClip || !toastBtn || !resultCardEl || !manittoNameEl) return;

  let isPlaying = false;

  // 결과 카드 애니메이션 표시
  function showResultCard(name) {
    manittoNameEl.textContent = name || "-";

    gsap.fromTo(
      resultCardEl,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
    );
  }

  // 토스터 초기 손/빛 애니메이션
  function initiate() {
    const tl = gsap.timeline();
    tl.to("#hand", { delay: 1, duration: 0.6, opacity: 1, ease: "ease.out" })
      .to("#hand", { duration: 2, repeat: -1, yoyo: true, x: -30, ease: "back.out(1)" })
      .to(
        "#light2",
        {
          duration: 1,
          opacity: 0.6,
          ease: "rough({ template: none.out, strength: 1, points: 20, taper: 'none', randomize: true, clamp:  false})"
        },
        "<"
      )
      .to(
        "#light1",
        {
          delay: 0.5,
          duration: 1,
          opacity: 0.9,
          ease: "rough({ template: none.out, strength: 1, points: 20, taper: 'none', randomize: true, clamp:  false})"
        },
        "<"
      );
    return tl;
  }

  function toastAway() {
    toastClip.style.clipPath = "url(#clip2)";
    const tl = gsap.timeline({ onComplete: toastReset });
    tl.to("#toast", { delay: 0.4, duration: 1.6, y: 0, opacity: 0, ease: "ease.out" })
      .to(
        "#right-arm",
        { transformOrigin: "100% 100%", duration: 0.6, rotate: 15, ease: "ease.out" },
        "<"
      )
      .to(
        "#left-arm",
        { transformOrigin: "0% 100%", duration: 0.6, rotate: -15, ease: "ease.out" },
        "<"
      )
      .to(
        "#flash2",
        { duration: 0.6, opacity: 0.3, repeat: 1, yoyo: true, ease: "ease.out" },
        "<"
      );
  }

  function toastReset() {
    gsap.set("#toast", { x: 5, y: 0, opacity: 1 });
    toastClip.style.clipPath = "url(#clip1)";
    gsap.set("#right-arm", { rotate: 0 });
    gsap.set("#left-arm", { rotate: 0 });
    gsap.to("#knob-main", { fill: "#ffdd15" });
    gsap.to("#knob-highlight2", { duration: 0.2, opacity: 1 });
    gsap.to("#knob-highlight1", { duration: 0.2, opacity: 1 });
    isPlaying = false;
  }

  // 호버 효과
  toastBtn.addEventListener("mouseover", () => {
    if (isPlaying === false) {
      gsap.to("#knob-main", { duration: 0.2, fill: "#ee5b76" });
      gsap.to("#knob-highlight2", { duration: 0.2, opacity: 0.5 });
      gsap.to("#knob-highlight1", { duration: 0.2, opacity: 0.5 });
    }
  });

  toastBtn.addEventListener("mouseout", () => {
    if (isPlaying === false) {
      gsap.to("#knob-main", { duration: 0.2, fill: "#ffdd15" });
      gsap.to("#knob-highlight2", { duration: 0.2, opacity: 1 });
      gsap.to("#knob-highlight1", { duration: 0.2, opacity: 1 });
    }
  });

  // 클릭 시: 토스터 애니메이션 + 랜덤 이름
  toastBtn.addEventListener("click", () => {
    if (isPlaying === false) {
      isPlaying = true;

      // 하드코딩된 이름 중 하나 랜덤 선택
      const randomIndex = Math.floor(Math.random() * HARDCODED_NAMES.length);
      const selectedName = HARDCODED_NAMES[randomIndex];

      gsap.set("#knob-main", { fill: "#ee5b76" });
      gsap.set("#knob-highlight2", { opacity: 0.5 });
      gsap.set("#knob-highlight1", { opacity: 0.5 });
      gsap.set("#toast", { x: 5, y: 0 });
      toastClip.style.clipPath = "url(#clip1)";

      const tl = gsap.timeline({ onComplete: toastAway });
      tl.to("#knob-top", { duration: 0.2, x: -3, repeat: 1, yoyo: true, ease: "ease.out" })
        .to(
          "#timer",
          { delay: 0.3, duration: 2, y: -85, ease: "elastic.inOut(1, 0.75)" },
          "<"
        )
        .to("#timer", { duration: 1.2, y: 0, ease: "elastic.inOut(1, 0.75)" })
        .to("#hand", { duration: 0.5, opacity: 0, ease: "ease.out" }, "<")
        .to(
          "#toast",
          { duration: 2, y: -400, ease: "elastic.out(1, 0.5)" },
          "< -0.8"
        )
        .to(
          "#flash1",
          { duration: 0.2, opacity: 0.8, repeat: 1, yoyo: true, ease: "ease.out" },
          "<"
        )
        .from(
          "#right-arm",
          {
            transformOrigin: "100% 100%",
            duration: 1,
            rotate: 15,
            ease: "elastic.inOut(1, 0.75)"
          },
          "< "
        )
        .from(
          "#left-arm",
          {
            transformOrigin: "0% 100%",
            duration: 1,
            rotate: -15,
            ease: "elastic.inOut(1, 0.75)"
          },
          "< -0.8"
        )
        .to(
          "#sparkles > *",
          {
            transformOrigin: "50% 50%",
            opacity: 1,
            scale: 0.5,
            ease: "bounce.out",
            stagger: {
              each: 0.15,
              repeat: 1,
              yoyo: true
            }
          },
          "<"
        )
        .to(
          "#toast",
          { delay: 0.2, duration: 0.6, x: 60, y: -420, ease: "elastic.out(1, 0.5)" },
          ">"
        )
        .call(() => {
          showResultCard(selectedName);
        });
    }
  });

  // 초기 애니메이션 실행
  const mainTl = gsap.timeline();
  mainTl.add(initiate());
}
