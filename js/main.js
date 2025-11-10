// js/main.js
// Firebase v11 CDN + GSAP 기반

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-functions.js";

// ========== Firebase 초기화 ==========

const firebaseConfig = {
  apiKey: "AIzaSyDx4e4MbsJNQDN5KKcTAwRHczp3tIWvBXA",
  authDomain: "manitto-284e1.firebaseapp.com",
  projectId: "manitto-284e1",
  storageBucket: "manitto-284e1.firebasestorage.app",
  messagingSenderId: "659158102217",
  appId: "1:659158102217:web:ea6e4de47a408eacd45d18",
  measurementId: "G-JLL32VQNS2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

// Cloud Function: getMyManitto (서버에서 구현해야 함)
const getMyManittoFn = httpsCallable(functions, "getMyManitto");

// 클라이언트 전역에 마니또 이름 저장
window.__manittoName = null;
let hasShownResult = false;

// ========== DOM 준비 후 실행 ==========

window.addEventListener("DOMContentLoaded", () => {
  const loginScreen = document.getElementById("login-screen");
  const manittoScreen = document.getElementById("manitto-screen");

  const loginForm = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("login-button");
  const loginErrorEl = document.getElementById("login-error");

  const userNameEl = document.getElementById("user-name");
  const manittoNameEl = document.getElementById("manitto-name");
  const resultCardEl = document.getElementById("result-card");
  const logoutButton = document.getElementById("logout-button");

  // --- 마리오 버튼 텍스트 애니메이션 설정 ---
  setupButtonTextAnimation();

  // --- 로그인 폼 제출 ---
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginErrorEl.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      loginErrorEl.textContent = "이메일과 비밀번호를 모두 입력해주세요.";
      return;
    }

    loginButton.disabled = true;
    loginButton.style.opacity = "0.7";

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged에서 화면 전환 처리
    } catch (err) {
      console.error(err);
      loginErrorEl.textContent = mapAuthError(err);
    } finally {
      loginButton.disabled = false;
      loginButton.style.opacity = "1";
    }
  });

  // --- 로그아웃 ---
  logoutButton.addEventListener("click", async () => {
    await signOut(auth);
  });

  // --- 로그인 상태 변경 감지 ---
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // 메인 화면으로
      loginScreen.classList.add("hidden");
      manittoScreen.classList.remove("hidden");

      // 마니또 정보 로드
      try {
        const result = await getMyManittoFn();
        const data = result.data || {};
        const myName = data.myName || "";
        const manittoName = data.manittoName || "";

        window.__manittoName = manittoName || null;
        hasShownResult = false;

        userNameEl.textContent = myName ? `${myName} 님` : "";
        manittoNameEl.textContent = manittoName || "-";

        // 결과 카드 초기 상태로 (GSAP에서 애니메이션 다시)
        if (resultCardEl) {
          resultCardEl.style.opacity = "0";
          resultCardEl.style.transform = "translateY(12px)";
        }
      } catch (err) {
        console.error(err);
        userNameEl.textContent = "";
        manittoNameEl.textContent = "-";
        if (resultCardEl) {
          resultCardEl.style.opacity = "1";
          resultCardEl.style.transform = "translateY(0)";
        }
        alert("마니또 정보가 아직 준비되지 않았어요.\n인사팀에 문의해주세요.");
      }

      // GSAP 토스터 애니메이션 세팅 (한 번만)
      setupToasterAnimation();
    } else {
      // 로그인 화면으로
      manittoScreen.classList.add("hidden");
      loginScreen.classList.remove("hidden");
      window.__manittoName = null;
      hasShownResult = false;
    }
  });
});

// ========== 유틸: Firebase 에러 메시지 매핑 ==========

function mapAuthError(err) {
  const code = err && err.code ? err.code : "";
  switch (code) {
    case "auth/invalid-email":
      return "이메일 형식을 확인해주세요.";
    case "auth/user-disabled":
      return "비활성화된 계정입니다. 인사팀에 문의해주세요.";
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "이메일 또는 비밀번호를 다시 확인해주세요.";
    default:
      return "로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
}

// ========== 마리오 버튼 텍스트 애니메이션 ==========

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

// ========== GSAP 토스터 + 마니또 결과 연동 ==========

function setupToasterAnimation() {
  if (!window.gsap) {
    console.warn("GSAP not loaded");
    return;
  }

  const gsapInstance = window.gsap;
  const EasePackInstance = window.EasePack;
  if (EasePackInstance) {
    gsapInstance.registerPlugin(EasePackInstance);
  }

  const toastClip = document.getElementById("toast-clip");
  const toastBtn = document.getElementById("button-trigger");
  const resultCardEl = document.getElementById("result-card");
  const manittoNameEl = document.getElementById("manitto-name");

  if (!toastClip || !toastBtn) return;

  let isPlaying = false;

  // 결과 카드 보여주는 함수
  function showResultCard() {
    if (!window.__manittoName || !resultCardEl || !manittoNameEl) return;

    manittoNameEl.textContent = window.__manittoName;

    if (hasShownResult) return;
    hasShownResult = true;

    gsapInstance.fromTo(
      resultCardEl,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
    );
  }

  // 초기 손/조명 애니메이션
  function initiate() {
    const tl = gsapInstance.timeline();
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
    const tl = gsapInstance.timeline({ onComplete: toastReset });
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
    gsapInstance.set("#toast", { x: 5, y: 0, opacity: 1 });
    toastClip.style.clipPath = "url(#clip1)";
    gsapInstance.set("#right-arm", { rotate: 0 });
    gsapInstance.set("#left-arm", { rotate: 0 });
    gsapInstance.to("#knob-main", { fill: "#ffdd15" });
    gsapInstance.to("#knob-highlight2", { duration: 0.2, opacity: 1 });
    gsapInstance.to("#knob-highlight1", { duration: 0.2, opacity: 1 });
    isPlaying = false;
  }

  // 버튼 hover
  toastBtn.addEventListener("mouseover", () => {
    if (isPlaying === false) {
      gsapInstance.to("#knob-main", { duration: 0.2, fill: "#ee5b76" });
      gsapInstance.to("#knob-highlight2", { duration: 0.2, opacity: 0.5 });
      gsapInstance.to("#knob-highlight1", { duration: 0.2, opacity: 0.5 });
    }
  });

  toastBtn.addEventListener("mouseout", () => {
    if (isPlaying === false) {
      gsapInstance.to("#knob-main", { duration: 0.2, fill: "#ffdd15" });
      gsapInstance.to("#knob-highlight2", { duration: 0.2, opacity: 1 });
      gsapInstance.to("#knob-highlight1", { duration: 0.2, opacity: 1 });
    }
  });

  // 버튼 click: 애니메이션 + 결과 카드
  toastBtn.addEventListener("click", () => {
    if (isPlaying === false) {
      if (!window.__manittoName) {
        alert("마니또 정보가 아직 준비되지 않았어요.\n잠시 후 다시 시도하거나 인사팀에 문의해주세요.");
        return;
      }

      isPlaying = true;
      gsapInstance.set("#knob-main", { fill: "#ee5b76" });
      gsapInstance.set("#knob-highlight2", { opacity: 0.5 });
      gsapInstance.set("#knob-highlight1", { opacity: 0.5 });
      gsapInstance.set("#toast", { x: 5, y: 0 });
      toastClip.style.clipPath = "url(#clip1)";

      const tl = gsapInstance.timeline({ onComplete: toastAway });
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
        .call(showResultCard); // 토스트 튀어나온 뒤 결과 카드 보여주기
    }
  });

  // 메인 초기 실행
  const mainTl = gsapInstance.timeline();
  mainTl.add(initiate());
}
