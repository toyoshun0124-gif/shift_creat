// 希望日程（preferences）から、シフト案を複数パターン自動生成する簡易スケジューラ。
// 外部AI APIを使わず、希望が重複（同一人物・同日で時間帯が重なる）する場合に
// 決定的な乱数で組み合わせを変えることで、複数の候補案を作る。

function timeToMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function rangesOverlap(a, b) {
  return timeToMin(a.startTime) < timeToMin(b.endTime) && timeToMin(b.startTime) < timeToMin(a.endTime);
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h;
}

function seededRandom(seed) {
  let x = seed % 2147483647;
  if (x <= 0) x += 2147483646;
  return function next() {
    x = (x * 16807) % 2147483647;
    return (x - 1) / 2147483646;
  };
}

function shuffleSeeded(arr, seed) {
  const rand = seededRandom(seed);
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * entries: [{ userId, date, startTime, endTime }]
 * candidateCount: 生成する案の数
 * 戻り値: candidateCount 個の配列。各要素は [{ userId, date, startTime, endTime }]
 */
export function generateCandidates(entries, candidateCount = 5) {
  const groups = new Map();
  for (const e of entries) {
    const key = `${e.userId}|${e.date}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }

  const candidates = [];
  for (let c = 0; c < candidateCount; c++) {
    const assignments = [];
    for (const [key, ranges] of groups.entries()) {
      const shuffled = shuffleSeeded(ranges, hashStr(key) + c * 1000003 + 1);
      const picked = [];
      for (const r of shuffled) {
        if (!picked.some((p) => rangesOverlap(p, r))) {
          picked.push(r);
        }
      }
      picked.sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));
      for (const p of picked) {
        assignments.push({ userId: p.userId, date: p.date, startTime: p.startTime, endTime: p.endTime });
      }
    }
    assignments.sort((a, b) => (a.date === b.date ? timeToMin(a.startTime) - timeToMin(b.startTime) : a.date.localeCompare(b.date)));
    candidates.push(assignments);
  }
  return candidates;
}

/**
 * 再調整依頼を希望日程にマージする。
 * 同一ユーザー・同一日については再調整依頼の時間帯を優先し、元の希望を置き換える。
 */
export function mergeReadjustments(preferences, readjustmentRequests) {
  const overrideKeys = new Set(readjustmentRequests.map((r) => `${r.userId}|${r.date}`));
  const kept = preferences.filter((p) => !overrideKeys.has(`${p.userId}|${p.date}`));
  const overrides = readjustmentRequests.map((r) => ({
    userId: r.userId,
    date: r.date,
    startTime: r.startTime,
    endTime: r.endTime,
  }));
  return [...kept, ...overrides];
}
