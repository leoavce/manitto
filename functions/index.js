// functions/index.js
// Firebase Cloud Functions (Node.js 환경)
// npm install firebase-functions firebase-admin

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * 관리자용: 14명 사용자에 대한 마니또 매칭 생성 (derangement)
 * users 컬렉션의 모든 문서를 기반으로 assignments 컬렉션에 저장
 * 실제 운영 시에는 호출 제한, 관리자 체크 등을 더 넣는 게 좋음
 */
exports.generateAssignments = functions.https.onCall(async (data, context) => {
  // 간단한 보호: 특정 이메일만 허용 (원하면 수정)
  const allowedAdminEmail = "leo@ahnlab.com";
  if (!context.auth || context.auth.token.email !== allowedAdminEmail) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "이 함수는 관리자만 실행할 수 있습니다."
    );
  }

  const usersSnap = await db.collection("users").get();
  const users = [];
  usersSnap.forEach((doc) => {
    const d = doc.data();
    users.push({ uid: doc.id, name: d.name || "", email: d.email || "" });
  });

  if (users.length < 2) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "사용자가 2명 이상 있어야 매칭을 생성할 수 있습니다."
    );
  }

  // uid 배열
  const original = users.map((u) => u.uid);
  let shuffled = [...original];

  // derangement 만들기
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  let attempts = 0;
  const maxAttempts = 50;
  let ok = false;

  while (!ok && attempts < maxAttempts) {
    shuffle(shuffled);
    ok = true;
    for (let i = 0; i < original.length; i++) {
      if (original[i] === shuffled[i]) {
        ok = false;
        break;
      }
    }
    attempts++;
  }

  if (!ok) {
    throw new functions.https.HttpsError(
      "internal",
      "derangement 생성에 실패했습니다. 다시 시도해주세요."
    );
  }

  // assignments 컬렉션에 저장 (각 uid → targetUid)
  const batch = db.batch();
  for (let i = 0; i < original.length; i++) {
    const uid = original[i];
    const targetUid = shuffled[i];
    const ref = db.collection("assignments").doc(uid);
    batch.set(ref, {
      targetUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  await batch.commit();

  return { success: true, count: original.length };
});

/**
 * 클라이언트에서 호출: 내 마니또 이름 가져오기
 * assignments/{uid}.targetUid → users/{targetUid}.name
 */
exports.getMyManitto = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "로그인이 필요합니다."
    );
  }

  const uid = context.auth.uid;

  // 내 정보
  const meDoc = await db.collection("users").doc(uid).get();
  if (!meDoc.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "사용자 정보가 준비되지 않았습니다."
    );
  }
  const me = meDoc.data();

  // 내 assignment
  const asgDoc = await db.collection("assignments").doc(uid).get();
  if (!asgDoc.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "마니또 매칭 정보가 아직 없습니다."
    );
  }
  const asg = asgDoc.data();
  const targetUid = asg.targetUid;

  if (!targetUid) {
    throw new functions.https.HttpsError(
      "not-found",
      "마니또 정보가 올바르지 않습니다."
    );
  }

  const targetDoc = await db.collection("users").doc(targetUid).get();
  if (!targetDoc.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "마니또 대상 정보를 찾을 수 없습니다."
    );
  }
  const target = targetDoc.data();

  return {
    myName: me.name || "",
    manittoName: target.name || ""
  };
});
