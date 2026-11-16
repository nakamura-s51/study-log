// HTMLの入力欄や表示場所を取得します。
const studyForm = document.getElementById("studyForm");
const dateInput = document.getElementById("dateInput");
const subjectInput = document.getElementById("subjectInput");
const durationInput = document.getElementById("durationInput");
const memoInput = document.getElementById("memoInput");
const recordList = document.getElementById("recordList");
const emptyMessage = document.getElementById("emptyMessage");
const formMessage = document.getElementById("formMessage");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const storageKey = "app08-study-records";
const timerStorageKey = "app08-active-timer";
const goalStorageKey = "app08-study-goals";
const todoStorageKey = "app08-study-todos";
const themeStorageKey = "app08-theme";
const settingsStorageKey = "app08-settings";
const blockOrderStorageKey = "app08-dashboard-order";
const themeSelect = document.getElementById("themeSelect");
const textSizeSelect = document.getElementById("textSizeSelect");
const settingsDialog = document.getElementById("settingsDialog");
const settingsForm = document.getElementById("settingsForm");
const openSettingsButton = document.getElementById("openSettingsButton");
const closeSettingsButton = document.getElementById("closeSettingsButton");
const focusMinutesInput = document.getElementById("focusMinutesInput");
const breakMinutesInput = document.getElementById("breakMinutesInput");
const timerSoundInput = document.getElementById("timerSoundInput");
const backupFileInput = document.getElementById("backupFileInput");
const exportJsonButton = document.getElementById("exportJsonButton");
const exportCsvButton = document.getElementById("exportCsvButton");
const clearDataButton = document.getElementById("clearDataButton");
const settingsMessage = document.getElementById("settingsMessage");
const dataMessage = document.getElementById("dataMessage");
const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");
const calendarGrid = document.getElementById("calendarGrid");
const timerPanel = document.getElementById("timerPanel");
const timerDisplay = document.getElementById("timerDisplay");
const timerStatus = document.getElementById("timerStatus");
const startTimerButton = document.getElementById("startTimerButton");
const stopTimerButton = document.getElementById("stopTimerButton");
const dailyGoalInput = document.getElementById("dailyGoalInput");
const settingsWeeklyGoalInput = document.getElementById("settingsWeeklyGoalInput");
const weekStartSelect = document.getElementById("weekStartSelect");
const settingsExamNameInput = document.getElementById("settingsExamNameInput");
const settingsExamDateInput = document.getElementById("settingsExamDateInput");
const subjectSettingsList = document.getElementById("subjectSettingsList");
const newSubjectColor = document.getElementById("newSubjectColor");
const newSubjectName = document.getElementById("newSubjectName");
const addSubjectButton = document.getElementById("addSubjectButton");
const subjectMessage = document.getElementById("subjectMessage");
const timerModeInputs = document.querySelectorAll('input[name="timerMode"]');

// 重ならない ID を作ります（科目や ToDo で使います）。
function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// 最初から用意しておく科目と色です。
const defaultSubjects = [
  { name: "JavaScript", color: "#d9a03a" },
  { name: "Excel", color: "#2f855a" },
  { name: "Spring", color: "#6c9895" },
  { name: "HTML/CSS", color: "#d1603d" },
  { name: "Python", color: "#3b6ea5" }
];

// 科目の一覧を確認して、正しい形にそろえます（名前の重なりや空の名前は取り除く）。
function normalizeSubjects(subjectList) {
  if (!Array.isArray(subjectList)) {
    return null;
  }
  const usedNames = new Set();
  return subjectList
    .filter((subject) => subject && typeof subject.name === "string" && subject.name.trim())
    .map((subject) => ({
      id: String(subject.id || makeId()),
      name: subject.name.trim().slice(0, 40),
      color: /^#[0-9a-f]{6}$/i.test(subject.color) ? subject.color : "#6c9895"
    }))
    .filter((subject) => {
      const key = subject.name.toLowerCase();
      if (usedNames.has(key)) {
        return false;
      }
      usedNames.add(key);
      return true;
    });
}

// 今表示しているカレンダーの月を、今月にします。
const currentDate = new Date();
let shownMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

// 設定がまだないときに使う初期値です。
let settings = {
  focusMinutes: 25,
  breakMinutes: 5,
  soundEnabled: false,
  theme: localStorage.getItem(themeStorageKey) || "ocean",
  textSize: "medium",
  dailyGoalMinutes: 60,
  weekStart: "monday",
  subjects: null,
  timerMode: "alarm"
};
try {
  const savedSettings = JSON.parse(localStorage.getItem(settingsStorageKey));
  if (savedSettings) {
    settings = { ...settings, ...savedSettings };
  }
} catch (error) {
  settings.theme = localStorage.getItem(themeStorageKey) || "ocean";
}
settings.focusMinutes = Number.isFinite(settings.focusMinutes) ? Math.min(180, Math.max(1, settings.focusMinutes)) : 25;
settings.breakMinutes = Number.isFinite(settings.breakMinutes) ? Math.min(60, Math.max(1, settings.breakMinutes)) : 5;
settings.soundEnabled = Boolean(settings.soundEnabled);
settings.theme = ["ocean", "sage", "night", "system"].includes(settings.theme) ? settings.theme : "ocean";
settings.textSize = ["small", "medium", "large"].includes(settings.textSize) ? settings.textSize : "medium";
const subjectsWereSaved = Array.isArray(settings.subjects);
normalizeStudySettings();

// 学習の設定（1日の目標・週の始まり・科目）を確認して、正しい形にそろえます。
function normalizeStudySettings() {
  const dailyGoal = Number(settings.dailyGoalMinutes);
  settings.dailyGoalMinutes = Number.isFinite(dailyGoal) ? Math.min(1440, Math.max(0, Math.round(dailyGoal))) : 60;
  settings.weekStart = settings.weekStart === "sunday" ? "sunday" : "monday";
  settings.timerMode = settings.timerMode === "stopwatch" ? "stopwatch" : "alarm";
  settings.subjects = normalizeSubjects(settings.subjects)
    || defaultSubjects.map((subject) => ({ ...subject, id: makeId() }));
}

focusMinutesInput.value = String(settings.focusMinutes);
breakMinutesInput.value = String(settings.breakMinutes);
timerSoundInput.checked = settings.soundEnabled;
textSizeSelect.value = settings.textSize;

// 日付を「年-月-日」の文字列にします。
function toDateText(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 今日より後の日付は選べないようにして、今日を初期値にします。
const todayText = toDateText(new Date());
dateInput.value = todayText;
dateInput.max = todayText;

// localStorageから学習記録を読み込みます。
let records = [];
try {
  const savedRecords = JSON.parse(localStorage.getItem(storageKey)) || [];
  if (Array.isArray(savedRecords)) {
    records = savedRecords.filter((record) => (
      record
      && typeof record.date === "string"
      && typeof record.subject === "string"
      && Number.isFinite(record.minutes)
    ));
  }
} catch (error) {
  records = [];
}

// 科目の一覧をまだ保存していないときは、これまでの記録に出てくる科目も一覧に加えます。
if (!subjectsWereSaved) {
  records.forEach((record) => {
    const exists = settings.subjects.some((subject) => subject.name.toLowerCase() === record.subject.toLowerCase());
    if (!exists) {
      settings.subjects.push({ id: makeId(), name: record.subject, color: "#8a9a97" });
    }
  });
}

// 目標とToDoも、記録とは別の名前でlocalStorageへ保存します。
let goals = { weeklyHours: 10, examName: "", examDate: "" };
let todos = [];
try {
  const savedGoals = JSON.parse(localStorage.getItem(goalStorageKey));
  if (savedGoals && Number.isFinite(savedGoals.weeklyHours)) {
    goals = { ...goals, ...savedGoals };
  }
  const savedTodos = JSON.parse(localStorage.getItem(todoStorageKey)) || [];
  if (Array.isArray(savedTodos)) {
    todos = savedTodos.filter((todo) => todo && typeof todo.text === "string");
  }
} catch (error) {
  goals = { weeklyHours: 10, examName: "", examDate: "" };
  todos = [];
}

// 編集中の記録IDです。何も編集していないときはnullです。
let editingId = null;
let activeTimer = null;
let timerInterval = null;
try {
  activeTimer = JSON.parse(localStorage.getItem(timerStorageKey));
} catch (error) {
  activeTimer = null;
}

// 配列の内容をlocalStorageへ保存します。
function saveRecords() {
  localStorage.setItem(storageKey, JSON.stringify(records));
}

// 分数を「1時間30分」のような表示に変えます。
function formatDuration(minutes) {
  if (minutes === 0) {
    return "0時間";
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) {
    return `${remainingMinutes}分`;
  }
  if (remainingMinutes === 0) {
    return `${hours}時間`;
  }
  return `${hours}時間${remainingMinutes}分`;
}

// 保存された日付の文字列を、画面用の日付にします。
function formatDate(dateText) {
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(date);
}

// 保存済みテーマを読み込み、CSSへ設定します。
function applyTheme(themeName) {
  const allowedThemes = ["ocean", "sage", "night", "system"];
  const theme = allowedThemes.includes(themeName) ? themeName : "ocean";
  const actualTheme = theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "ocean")
    : theme;
  document.documentElement.dataset.theme = actualTheme;
  themeSelect.value = theme;
}

try {
  applyTheme(settings.theme);
} catch (error) {
  applyTheme("ocean");
}

themeSelect.addEventListener("change", () => {
  applyTheme(themeSelect.value);
});

function applyTextSize(size) {
  const allowedSizes = ["small", "medium", "large"];
  const textSize = allowedSizes.includes(size) ? size : "medium";
  document.documentElement.dataset.textSize = textSize;
  textSizeSelect.value = textSize;
}

applyTextSize(settings.textSize);

// システムテーマ選択中は、端末の外観変更に合わせます。
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (themeSelect.value === "system") {
    applyTheme("system");
  }
});

// 設定画面で編集中の科目一覧です。「設定を保存」を押すまでは本物の一覧を変えません。
let draftSubjects = [];

// 科目の一覧を、設定画面に並べます（色・名前・削除ボタン）。
function renderSubjectSettings() {
  subjectSettingsList.innerHTML = "";
  draftSubjects.forEach((subject) => {
    const item = document.createElement("li");
    item.className = "subject-settings-item";

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = subject.color;
    colorInput.setAttribute("aria-label", `${subject.name}の色`);
    colorInput.addEventListener("input", () => {
      subject.color = colorInput.value;
    });

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.maxLength = 40;
    nameInput.value = subject.name;
    nameInput.setAttribute("aria-label", "科目の名前");
    nameInput.addEventListener("input", () => {
      subject.name = nameInput.value;
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "secondary-button subject-remove-button";
    removeButton.textContent = "削除";
    removeButton.setAttribute("aria-label", `${subject.name}を一覧から削除`);
    removeButton.addEventListener("click", () => {
      draftSubjects = draftSubjects.filter((itemToKeep) => itemToKeep.id !== subject.id);
      subjectMessage.textContent = "一覧から外しました（これまでの記録は消えません）";
      renderSubjectSettings();
    });

    item.append(colorInput, nameInput, removeButton);
    subjectSettingsList.appendChild(item);
  });
}

// 「追加」ボタンで、新しい科目を一覧に加えます。
addSubjectButton.addEventListener("click", () => {
  const name = newSubjectName.value.trim();
  if (!name) {
    subjectMessage.textContent = "科目の名前を入力してください";
    newSubjectName.focus();
    return;
  }
  if (draftSubjects.some((subject) => subject.name.trim().toLowerCase() === name.toLowerCase())) {
    subjectMessage.textContent = "同じ名前の科目がすでにあります";
    return;
  }
  draftSubjects.push({ id: makeId(), name, color: newSubjectColor.value });
  newSubjectName.value = "";
  subjectMessage.textContent = `「${name}」を追加しました（保存すると反映されます）`;
  renderSubjectSettings();
});

// 入力欄で Enter を押したときも、設定全体ではなく科目の追加にします。
newSubjectName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addSubjectButton.click();
  }
});

// 設定画面を開くときに、今の設定を入力欄へ入れます。
function fillStudySettings() {
  dailyGoalInput.value = String(settings.dailyGoalMinutes);
  settingsWeeklyGoalInput.value = String(goals.weeklyHours);
  weekStartSelect.value = settings.weekStart;
  settingsExamNameInput.value = goals.examName || "";
  settingsExamDateInput.value = goals.examDate || "";
  draftSubjects = settings.subjects.map((subject) => ({ ...subject }));
  subjectMessage.textContent = "";
  newSubjectName.value = "";
  renderSubjectSettings();
}

// 設定ダイアログを開いたり閉じたりします。
openSettingsButton.addEventListener("click", () => {
  fillStudySettings();
  settingsDialog.showModal();
});
closeSettingsButton.addEventListener("click", () => settingsDialog.close());
settingsDialog.addEventListener("click", (event) => {
  if (event.target === settingsDialog) {
    settingsDialog.close();
  }
});

// 設定を保存して、タイマーや見た目へ反映します。
settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();

  // 科目の名前が空っぽ・重なっていないかを確かめます。
  const subjectNames = draftSubjects.map((subject) => subject.name.trim());
  if (subjectNames.some((name) => !name)) {
    subjectMessage.textContent = "名前が空っぽの科目があります";
    return;
  }
  const lowerNames = subjectNames.map((name) => name.toLowerCase());
  if (new Set(lowerNames).size !== lowerNames.length) {
    subjectMessage.textContent = "同じ名前の科目が2つあります";
    return;
  }

  // 名前を変えた科目は、これまでの記録の科目名も新しい名前に変えます。
  let recordsChanged = false;
  draftSubjects.forEach((subject) => {
    const before = settings.subjects.find((oldSubject) => oldSubject.id === subject.id);
    const newName = subject.name.trim();
    if (before && before.name !== newName) {
      records.forEach((record) => {
        if (record.subject === before.name) {
          record.subject = newName;
          recordsChanged = true;
        }
      });
    }
  });

  settings = {
    focusMinutes: Number(focusMinutesInput.value),
    breakMinutes: Number(breakMinutesInput.value),
    soundEnabled: timerSoundInput.checked,
    theme: themeSelect.value,
    textSize: textSizeSelect.value,
    dailyGoalMinutes: Number(dailyGoalInput.value),
    weekStart: weekStartSelect.value,
    timerMode: settings.timerMode,
    subjects: draftSubjects.map((subject) => ({ ...subject, name: subject.name.trim() }))
  };
  normalizeStudySettings();
  localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
  localStorage.setItem(themeStorageKey, settings.theme);

  // 1週間の目標と試験日は、「目標と試験日」と同じデータに保存します。
  goals = {
    weeklyHours: Number(settingsWeeklyGoalInput.value),
    examName: settingsExamNameInput.value.trim(),
    examDate: settingsExamDateInput.value
  };
  localStorage.setItem(goalStorageKey, JSON.stringify(goals));

  if (recordsChanged) {
    saveRecords();
  }
  applyTheme(settings.theme);
  applyTextSize(settings.textSize);
  renderSubjectOptions();
  renderRecords();
  if (!activeTimer) {
    renderTimerDisplay();
  }
  settingsMessage.textContent = "設定を保存しました";
  settingsDialog.close();
});

// 保存せずに閉じた場合は、保存済みの設定へ戻します。
settingsDialog.addEventListener("close", () => {
  focusMinutesInput.value = String(settings.focusMinutes);
  breakMinutesInput.value = String(settings.breakMinutes);
  timerSoundInput.checked = settings.soundEnabled;
  applyTheme(settings.theme);
  applyTextSize(settings.textSize);
});

// 画面の大きなブロックを、保存した順番で並べ直します。
function restoreDashboardOrder() {
  const dashboardBlocks = [...document.querySelectorAll(".app > [data-dashboard-block]")];
  const blockById = new Map(dashboardBlocks.map((block) => [block.dataset.dashboardBlock, block]));
  let savedOrder = [];

  try {
    savedOrder = JSON.parse(localStorage.getItem(blockOrderStorageKey)) || [];
  } catch (error) {
    savedOrder = [];
  }

  const knownIds = dashboardBlocks.map((block) => block.dataset.dashboardBlock);
  const orderedIds = [
    ...savedOrder.filter((id) => blockById.has(id)),
    ...knownIds.filter((id) => !savedOrder.includes(id))
  ];
  orderedIds.forEach((id) => document.querySelector(".app").appendChild(blockById.get(id)));
  updateBlockOrderButtons();
}

// 現在位置に合わせて、先頭・末尾の移動ボタンを使えなくします。
function updateBlockOrderButtons() {
  const blocks = [...document.querySelectorAll(".app > [data-dashboard-block]")];
  blocks.forEach((block, index) => {
    block.querySelectorAll("[data-move-direction]").forEach((button) => {
      button.disabled = button.dataset.moveDirection === "up"
        ? index === 0
        : index === blocks.length - 1;
    });
  });
}

// 上下ボタンでブロックを移動して、順番を保存します。
document.querySelectorAll("[data-move-block]").forEach((button) => {
  button.addEventListener("click", () => {
    const blocks = [...document.querySelectorAll(".app > [data-dashboard-block]")];
    const currentIndex = blocks.findIndex((block) => block.dataset.dashboardBlock === button.dataset.moveBlock);
    const nextIndex = currentIndex + (button.dataset.moveDirection === "up" ? -1 : 1);
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= blocks.length) {
      return;
    }

    [blocks[currentIndex], blocks[nextIndex]] = [blocks[nextIndex], blocks[currentIndex]];
    blocks.forEach((block) => document.querySelector(".app").appendChild(block));
    localStorage.setItem(blockOrderStorageKey, JSON.stringify(
      blocks.map((block) => block.dataset.dashboardBlock)
    ));
    updateBlockOrderButtons();
    blocks[nextIndex].querySelector("[data-move-direction]").focus();
  });
});

// 秒数を「時:分:秒」の文字にします。
function formatClock(totalSeconds) {
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

// タイマーの表示を更新します。
// 「測るだけ」は 0 から増えていき、「時間で知らせる」は設定の時間から減っていきます。
function renderTimerDisplay() {
  if (!activeTimer) {
    timerDisplay.textContent = settings.timerMode === "stopwatch"
      ? "00:00:00"
      : `${String(settings.focusMinutes).padStart(2, "0")}:00`;
    return;
  }

  if (activeTimer.mode === "stopwatch") {
    const elapsed = Math.max(0, Math.floor((Date.now() - activeTimer.startedAt) / 1000));
    timerDisplay.textContent = formatClock(elapsed);
    return;
  }

  const phaseMinutes = activeTimer.phase === "break" ? activeTimer.breakMinutes : activeTimer.focusMinutes;
  const phaseStartedAt = activeTimer.phaseStartedAt || activeTimer.startedAt;
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - phaseStartedAt) / 1000));
  const remainingSeconds = Math.max(0, phaseMinutes * 60 - elapsedSeconds);
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");
  timerDisplay.textContent = `${minutes}:${seconds}`;

  if (remainingSeconds === 0) {
    completeTimerPhase();
  }
}

// 計測中は日付・科目・手入力時間を固定します。
function setTimerRunning(isRunning) {
  timerPanel.classList.toggle("is-running", isRunning);
  dateInput.disabled = isRunning;
  subjectInput.disabled = isRunning;
  durationInput.disabled = isRunning;
  submitButton.disabled = isRunning;
  startTimerButton.disabled = isRunning;
  stopTimerButton.hidden = !isRunning;
  timerModeInputs.forEach((input) => {
    input.disabled = isRunning;
  });
  if (!isRunning) {
    timerStatus.textContent = "科目を選んで計測を開始";
    return;
  }
  if (activeTimer.mode === "stopwatch") {
    timerStatus.textContent = `${activeTimer.subject}を計測中`;
    stopTimerButton.textContent = "終了して記録";
    return;
  }
  timerStatus.textContent = activeTimer.phase === "break" ? "休憩中" : `${activeTimer.subject}を集中計測中`;
  stopTimerButton.textContent = activeTimer.phase === "break" ? "休憩を終了" : "集中を終了して記録";
}

// タイマー終了音が設定されているときだけ、短い音を鳴らします。
function playTimerSound() {
  if (!settings.soundEnabled) {
    return;
  }
  const audioContext = getAudioContext();
  if (!audioContext) {
    return;
  }

  // 「ピッ、ピッ、ピッ」と3回鳴らします。
  [0, 0.5, 1].forEach((delay) => {
    const startAt = audioContext.currentTime + delay;
    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    volume.gain.setValueAtTime(0.0001, startAt);
    volume.gain.exponentialRampToValueAtTime(0.2, startAt + 0.02);
    volume.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.3);
    oscillator.connect(volume);
    volume.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.32);
  });
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }
}

// 音を鳴らすための部品を1つだけ作って使い回します。
// iPhone は「ボタンを押したとき」に準備しておかないと、あとで音が鳴らないため、開始ボタンで準備します。
let sharedAudioContext = null;
function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextClass();
  }
  if (sharedAudioContext.state === "suspended") {
    sharedAudioContext.resume();
  }
  return sharedAudioContext;
}

// 集中時間を、通常の学習記録として保存します。
function saveTimerRecord(minutes) {
  records.push({
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    date: activeTimer.date,
    subject: activeTimer.subject,
    minutes: Math.max(1, minutes),
    memo: memoInput.value.trim(),
    createdAt: Date.now()
  });
  saveRecords();
  renderRecords();
}

// 計測を完全に終了し、次の学習を始められる状態へ戻します。
function finishTimerSession(statusMessage) {
  clearInterval(timerInterval);
  timerInterval = null;
  activeTimer = null;
  localStorage.removeItem(timerStorageKey);
  setTimerRunning(false);
  timerStatus.textContent = statusMessage;
  renderTimerDisplay();
  studyForm.reset();
  dateInput.value = todayText;
}

// 集中時間が終わったら記録し、休憩時間へ切り替えます。
function completeTimerPhase() {
  if (!activeTimer) {
    return;
  }

  if (activeTimer.phase === "focus") {
    const finishedTimer = activeTimer;
    saveTimerRecord(finishedTimer.focusMinutes);
    playTimerSound();
    activeTimer = {
      ...finishedTimer,
      phase: "break",
      phaseStartedAt: Date.now(),
      memo: memoInput.value.trim()
    };
    localStorage.setItem(timerStorageKey, JSON.stringify(activeTimer));
    timerStatus.textContent = `集中終了。${activeTimer.breakMinutes}分休憩しましょう`;
    stopTimerButton.textContent = "休憩を終了";
    renderTimerDisplay();
    formMessage.textContent = `${finishedTimer.subject}を${formatDuration(finishedTimer.focusMinutes)}で記録しました`;
    return;
  }

  playTimerSound();
  finishTimerSession("休憩終了。次の学習を始めましょう");
}

// 選択中の科目でタイマーを開始し、開始時刻を保存します。
function startTimer() {
  const subject = subjectInput.value.trim();
  if (!subject) {
    // メッセージは画面の下のほうだと見えないので、タイマーの中に表示します。
    timerStatus.textContent = "先に下の「科目」を選んでください";
    timerStatus.classList.add("is-warning");
    subjectInput.classList.add("needs-input");
    subjectInput.focus();
    return;
  }
  if (editingId) {
    timerStatus.textContent = "記録の編集中はタイマーを開始できません";
    timerStatus.classList.add("is-warning");
    return;
  }
  timerStatus.classList.remove("is-warning");
  subjectInput.classList.remove("needs-input");

  if (settings.timerMode === "alarm" && settings.soundEnabled) {
    getAudioContext();
  }

  activeTimer = {
    mode: settings.timerMode,
    startedAt: Date.now(),
    phaseStartedAt: Date.now(),
    phase: "focus",
    focusMinutes: settings.focusMinutes,
    breakMinutes: settings.breakMinutes,
    date: dateInput.value || todayText,
    subject,
    memo: memoInput.value.trim()
  };
  localStorage.setItem(timerStorageKey, JSON.stringify(activeTimer));
  setTimerRunning(true);
  renderTimerDisplay();
  timerInterval = window.setInterval(renderTimerDisplay, 1000);
  formMessage.textContent = "計測を開始しました";
  if (activeTimer.mode === "alarm" && !settings.soundEnabled) {
    timerStatus.textContent = `${subject}を集中計測中（音は設定でオンにできます）`;
  }
}

// 集中を手動終了するか、休憩をスキップします。
function stopTimer() {
  if (!activeTimer) {
    return;
  }

  if (activeTimer.mode === "stopwatch" || activeTimer.phase === "focus") {
    const elapsedMinutes = Math.round((Date.now() - activeTimer.phaseStartedAt) / 60000);
    const subject = activeTimer.subject;
    saveTimerRecord(elapsedMinutes);
    finishTimerSession(`${subject}の学習を記録しました`);
    formMessage.textContent = `${subject}を${formatDuration(Math.max(1, elapsedMinutes))}で記録しました`;
    return;
  }

  finishTimerSession("休憩を終了しました");
}

// ページを再読み込みしたとき、計測中ならタイマーを復元します。
function restoreTimer() {
  if (!activeTimer || !Number.isFinite(activeTimer.startedAt) || !activeTimer.subject || !activeTimer.date) {
    activeTimer = null;
    localStorage.removeItem(timerStorageKey);
    return;
  }

  if (activeTimer.mode !== "stopwatch") {
    activeTimer.mode = "alarm";
  }
  if (!activeTimer.phase) {
    activeTimer.phase = "focus";
    activeTimer.phaseStartedAt = activeTimer.startedAt;
    activeTimer.focusMinutes = settings.focusMinutes;
    activeTimer.breakMinutes = settings.breakMinutes;
  }

  dateInput.value = activeTimer.date;
  ensureSubjectOption(activeTimer.subject);
  subjectInput.value = activeTimer.subject;
  memoInput.value = activeTimer.memo || "";
  setTimerRunning(true);
  renderTimerDisplay();
  timerInterval = window.setInterval(renderTimerDisplay, 250);
}

// 週の始まりの曜日の番号です（日曜 = 0、月曜 = 1）。
function getWeekStartDay() {
  return settings.weekStart === "sunday" ? 0 : 1;
}

// 今週の始まりの日（月曜日 または 日曜日）の日付を返します。
function getWeekStartText(date = new Date()) {
  const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceStart = (weekStart.getDay() - getWeekStartDay() + 7) % 7;
  weekStart.setDate(weekStart.getDate() - daysSinceStart);
  return toDateText(weekStart);
}

// 科目の名前から、設定した色を探します。見つからないときは null です。
function getSubjectColor(subjectName) {
  const subject = settings.subjects.find((item) => item.name.toLowerCase() === subjectName.toLowerCase());
  return subject ? subject.color : null;
}

// 科目の選択肢の一番下に出す「科目を追加・編集」の目印です。
const manageSubjectsValue = "__manage-subjects__";

// <option> を1つ作ります。
function createOption(value, text) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  return option;
}

// 科目の選択肢を、設定で登録した科目一覧から作ります。
function renderSubjectOptions() {
  const selected = subjectInput.value;
  subjectInput.innerHTML = "";
  subjectInput.appendChild(createOption("", "科目を選んでください"));
  settings.subjects.forEach((subject) => {
    subjectInput.appendChild(createOption(subject.name, subject.name));
  });
  subjectInput.appendChild(createOption(manageSubjectsValue, "＋ 科目を追加・編集する"));

  // 選んでいた科目が一覧から消えていても、選んだままにしておきます。
  if (selected && selected !== manageSubjectsValue) {
    ensureSubjectOption(selected);
    subjectInput.value = selected;
  }
}

// 一覧にない科目（設定から外した科目など）を、選択肢に一時的に加えます。
function ensureSubjectOption(subjectName) {
  const exists = [...subjectInput.options].some((option) => option.value === subjectName);
  if (!exists) {
    subjectInput.insertBefore(createOption(subjectName, subjectName), subjectInput.lastElementChild);
  }
}

// カレンダーの曜日の見出しを、週の始まりに合わせて並べます。
function renderWeekdayRow() {
  const weekdayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const weekdayRow = document.getElementById("weekdayRow");
  weekdayRow.innerHTML = "";
  for (let index = 0; index < 7; index += 1) {
    const name = document.createElement("span");
    name.textContent = weekdayNames[(getWeekStartDay() + index) % 7];
    weekdayRow.appendChild(name);
  }
}

// 記録を日付ごとに合計し、科目別の棒グラフを作ります。
function renderSubjectChart() {
  const subjectChart = document.getElementById("subjectChart");
  const empty = document.getElementById("subjectChartEmpty");
  const totals = new Map();
  records.forEach((record) => {
    totals.set(record.subject, (totals.get(record.subject) || 0) + record.minutes);
  });
  const subjects = [...totals.entries()].sort((first, second) => second[1] - first[1]);
  subjectChart.innerHTML = "";
  empty.hidden = subjects.length > 0;

  if (subjects.length === 0) {
    return;
  }

  const maximumMinutes = subjects[0][1];
  subjects.forEach(([subjectName, minutes]) => {
    const row = document.createElement("div");
    row.className = "subject-row";

    const color = getSubjectColor(subjectName);
    const label = document.createElement("div");
    label.className = "subject-row-label";
    const name = document.createElement("strong");
    if (color) {
      const dot = document.createElement("span");
      dot.className = "subject-dot";
      dot.style.background = color;
      name.appendChild(dot);
    }
    name.append(subjectName);
    const duration = document.createElement("span");
    duration.textContent = formatDuration(minutes);
    label.append(name, duration);

    const track = document.createElement("div");
    track.className = "subject-track";
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-label", `${subjectName}の学習時間`);
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", String(maximumMinutes));
    track.setAttribute("aria-valuenow", String(minutes));
    const bar = document.createElement("span");
    bar.className = "subject-bar";
    bar.style.width = `${(minutes / maximumMinutes) * 100}%`;
    if (color) {
      bar.style.background = color;
    }
    track.appendChild(bar);
    row.append(label, track);
    subjectChart.appendChild(row);
  });
}

// 学習した日を月間カレンダーで色分けします。
function renderCalendar() {
  const year = shownMonth.getFullYear();
  const month = shownMonth.getMonth();
  // 1日の前に空ける枠の数（週の始まりに合わせる）
  const firstWeekday = (new Date(year, month, 1).getDay() - getWeekStartDay() + 7) % 7;
  renderWeekdayRow();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = document.getElementById("calendarMonthLabel");
  monthLabel.textContent = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long"
  }).format(shownMonth);
  calendarGrid.innerHTML = "";

  for (let blank = 0; blank < firstWeekday; blank += 1) {
    const emptyDay = document.createElement("span");
    emptyDay.className = "calendar-empty";
    calendarGrid.appendChild(emptyDay);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateText = toDateText(new Date(year, month, day));
    const minutes = records
      .filter((record) => record.date === dateText)
      .reduce((total, record) => total + record.minutes, 0);
    const dayButton = document.createElement("button");
    dayButton.type = "button";
    dayButton.className = "calendar-day";
    dayButton.setAttribute("aria-label", `${dateText}${minutes ? `、学習時間${formatDuration(minutes)}` : "、学習記録なし"}`);

    if (minutes > 0) {
      dayButton.classList.add("has-study");
      dayButton.title = formatDuration(minutes);
      if (minutes >= 180) {
        dayButton.classList.add("study-high");
      } else if (minutes >= 60) {
        dayButton.classList.add("study-medium");
      }
    }

    const dayNumber = document.createElement("span");
    dayNumber.className = "calendar-day-number";
    dayNumber.textContent = String(day);
    dayButton.appendChild(dayNumber);

    if (minutes > 0) {
      const duration = document.createElement("span");
      duration.className = "calendar-day-duration";
      duration.textContent = formatDuration(minutes);
      dayButton.appendChild(duration);
    }

    if (dateText > todayText) {
      dayButton.disabled = true;
    } else {
      dayButton.addEventListener("click", () => {
        dateInput.value = dateText;
        subjectInput.focus();
      });
    }
    calendarGrid.appendChild(dayButton);
  }
}

// 連続して勉強した日数を数えます。今日はまだなら昨日までの連続日数を表示します。
function renderStreak() {
  const studyDates = new Set(records.map((record) => record.date));
  const today = new Date();
  const todayText = toDateText(today);
  const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!studyDates.has(todayText)) {
    startDate.setDate(startDate.getDate() - 1);
  }

  let streak = 0;
  const checkDate = new Date(startDate);
  while (studyDates.has(toDateText(checkDate))) {
    streak += 1;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  document.getElementById("streakValue").textContent = `🔥 ${streak}日`;
  document.getElementById("streakMessage").textContent = streak > 0
    ? `${streak}日連続で勉強中！`
    : "今日から記録を始めよう";
}

// 今週の目標の進み具合と、試験日までの日数を表示します。
function renderGoalProgress() {
  const today = new Date();
  const todayText = toDateText(today);
  const weekStart = getWeekStartText(today);
  const weekMinutes = records
    .filter((record) => record.date >= weekStart && record.date <= todayText)
    .reduce((total, record) => total + record.minutes, 0);
  const goalMinutes = goals.weeklyHours * 60;
  const remainingMinutes = Math.max(0, goalMinutes - weekMinutes);
  const progress = goalMinutes > 0 ? Math.min(100, Math.round((weekMinutes / goalMinutes) * 100)) : 0;
  // 「0時間 / 10時間」の形で、今週の分と目標を並べます。
  document.getElementById("weeklyGoalDone").textContent = formatDuration(weekMinutes);
  document.getElementById("weeklyGoalTotal").textContent = formatDuration(goalMinutes);
  const goalText = document.getElementById("weeklyGoalText");
  goalText.textContent = remainingMinutes > 0
    ? `あと ${formatDuration(remainingMinutes)}（${progress}%）`
    : "今週の目標を達成しました！";

  const progressBar = document.getElementById("goalProgress");
  progressBar.setAttribute("aria-valuenow", String(progress));
  document.getElementById("goalProgressBar").style.width = `${progress}%`;

  const countdown = document.getElementById("examCountdown");
  if (!goals.examDate) {
    countdown.textContent = "試験日を設定すると、ここでカウントダウンします";
    return;
  }

  const [examYear, examMonth, examDay] = goals.examDate.split("-").map(Number);
  const examUtc = Date.UTC(examYear, examMonth - 1, examDay);
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const daysLeft = Math.round((examUtc - todayUtc) / 86400000);
  const examName = goals.examName.trim() || "試験";
  const examLabel = examName.endsWith("試験") ? examName : `${examName}試験`;
  if (daysLeft > 0) {
    countdown.textContent = `${examLabel}まであと ${daysLeft} 日`;
  } else if (daysLeft === 0) {
    countdown.textContent = `${examLabel}は今日です！`;
  } else {
    countdown.textContent = `${examLabel}から ${Math.abs(daysLeft)} 日経過しました`;
  }
}

// 保存したToDoを、チェックできる一覧にします。
function renderTodos() {
  const empty = document.getElementById("todoEmptyMessage");
  todoList.innerHTML = "";
  empty.hidden = todos.length > 0;
  const incompleteCount = todos.filter((todo) => !todo.done).length;
  document.getElementById("todoCount").textContent = `未完了 ${incompleteCount}件`;

  todos.forEach((todo) => {
    const item = document.createElement("li");
    item.className = "todo-item";
    if (todo.done) {
      item.classList.add("is-done");
    }

    const label = document.createElement("label");
    label.className = "todo-check-label";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(todo.done);
    checkbox.setAttribute("aria-label", `${todo.text}を完了にする`);
    checkbox.addEventListener("change", () => {
      todo.done = checkbox.checked;
      localStorage.setItem(todoStorageKey, JSON.stringify(todos));
      renderTodos();
    });
    const text = document.createElement("span");
    text.textContent = todo.text;
    label.append(checkbox, text);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "todo-delete";
    deleteButton.textContent = "削除";
    deleteButton.setAttribute("aria-label", `${todo.text}を削除`);
    deleteButton.addEventListener("click", () => {
      todos = todos.filter((itemToKeep) => itemToKeep.id !== todo.id);
      localStorage.setItem(todoStorageKey, JSON.stringify(todos));
      renderTodos();
    });

    item.append(label, deleteButton);
    todoList.appendChild(item);
  });
}

// 今日・今週・今月の学習時間を集計します。
function renderTotals() {
  const today = new Date();
  const todayText = toDateText(today);
  const currentMonth = todayText.slice(0, 7);
  const weekStartText = getWeekStartText(today);

  const todayMinutes = records
    .filter((record) => record.date === todayText)
    .reduce((total, record) => total + record.minutes, 0);
  const weekMinutes = records
    .filter((record) => record.date >= weekStartText && record.date <= todayText)
    .reduce((total, record) => total + record.minutes, 0);
  const monthMinutes = records
    .filter((record) => record.date.startsWith(currentMonth))
    .reduce((total, record) => total + record.minutes, 0);

  document.getElementById("todayTotal").textContent = formatDuration(todayMinutes);
  document.getElementById("weekTotal").textContent = formatDuration(weekMinutes);
  document.getElementById("monthTotal").textContent = formatDuration(monthMinutes);
  document.getElementById("weekRangeLabel").textContent = settings.weekStart === "sunday"
    ? "日曜から今日まで"
    : "月曜から今日まで";

  // 1日の目標（0分のときは表示しない）
  const dailyGoalText = document.getElementById("dailyGoalText");
  const dailyGoal = settings.dailyGoalMinutes;
  dailyGoalText.hidden = dailyGoal === 0;
  if (dailyGoal > 0) {
    const remaining = dailyGoal - todayMinutes;
    dailyGoalText.textContent = remaining > 0
      ? `目標 ${formatDuration(dailyGoal)}まで あと ${formatDuration(remaining)}`
      : "今日の目標を達成しました！";
  }
  renderStreak();
  renderGoalProgress();
}

// 記録を一覧に並べ、編集・削除ボタンを用意します。
function renderRecords() {
  recordList.innerHTML = "";
  const sortedRecords = [...records].sort((first, second) => (
    second.date.localeCompare(first.date)
    || (second.createdAt || 0) - (first.createdAt || 0)
  ));

  emptyMessage.hidden = sortedRecords.length > 0;
  document.getElementById("recordCount").textContent = `${sortedRecords.length}件`;

  sortedRecords.forEach((record) => {
    const item = document.createElement("li");
    item.className = "study-record";

    const details = document.createElement("div");
    const topline = document.createElement("div");
    topline.className = "record-topline";

    const date = document.createElement("time");
    date.className = "record-date";
    date.dateTime = record.date;
    date.textContent = formatDate(record.date);

    const subject = document.createElement("strong");
    subject.className = "record-subject";
    subject.textContent = record.subject;
    topline.append(date, subject);

    const memo = document.createElement("p");
    memo.className = "record-memo";
    memo.textContent = record.memo || "メモなし";
    if (!record.memo) {
      memo.classList.add("is-empty");
    }
    details.append(topline, memo);

    const duration = document.createElement("span");
    duration.className = "record-duration";
    duration.textContent = formatDuration(record.minutes);

    const actions = document.createElement("div");
    actions.className = "record-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "編集";
    editButton.setAttribute("aria-label", `${record.subject}の記録を編集`);
    editButton.addEventListener("click", () => startEditing(record));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "削除";
    deleteButton.setAttribute("aria-label", `${record.subject}の記録を削除`);
    deleteButton.addEventListener("click", () => deleteRecord(record.id));
    actions.append(editButton, deleteButton);

    item.append(details, duration, actions);
    recordList.appendChild(item);
  });

  renderTotals();
  renderSubjectChart();
  renderCalendar();
}

// 編集ボタンを押した記録を入力欄へ戻します。
function startEditing(record) {
  editingId = record.id;
  dateInput.value = record.date;
  ensureSubjectOption(record.subject);
  subjectInput.value = record.subject;
  durationInput.value = String(record.minutes / 60);
  memoInput.value = record.memo || "";
  submitButton.textContent = "変更を保存";
  cancelEditButton.hidden = false;
  formMessage.textContent = "記録を編集しています";
  document.getElementById("formTitle").textContent = "学習記録を編集";
  subjectInput.focus();
}

// 編集をやめて、入力欄を新規記録の状態へ戻します。
function cancelEditing(clearMessage = true) {
  editingId = null;
  studyForm.reset();
  dateInput.value = todayText;
  submitButton.textContent = "記録を追加";
  cancelEditButton.hidden = true;
  if (clearMessage) {
    formMessage.textContent = "";
  }
  document.getElementById("formTitle").textContent = "学習を記録";
}

// 指定したIDの記録を削除して保存します。
function deleteRecord(recordId) {
  records = records.filter((record) => record.id !== recordId);
  if (editingId === recordId) {
    cancelEditing();
  }
  saveRecords();
  renderRecords();
  formMessage.textContent = "記録を削除しました";
}

// 新しい記録を追加するか、編集中の記録を書き換えます。
studyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const durationHours = Number(durationInput.value);
  const recordData = {
    date: dateInput.value,
    subject: subjectInput.value.trim(),
    minutes: Math.round(durationHours * 60),
    memo: memoInput.value.trim()
  };

  if (editingId) {
    const record = records.find((item) => item.id === editingId);
    if (record) {
      Object.assign(record, recordData);
    }
    formMessage.textContent = "記録を更新しました";
  } else {
    records.push({
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      ...recordData,
      createdAt: Date.now()
    });
    formMessage.textContent = "学習を記録しました";
  }

  saveRecords();
  renderRecords();
  cancelEditing(false);
});

// ファイルを作り、ブラウザーからダウンロードします。
function downloadFile(filename, content, mimeType) {
  const file = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// 記録や設定をまとめたJSONバックアップを作ります。
function createBackup() {
  return {
    format: "StudyLogBackup",
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
    goals,
    todos,
    settings,
    dashboardOrder: JSON.parse(localStorage.getItem(blockOrderStorageKey) || "[]")
  };
}

exportJsonButton.addEventListener("click", () => {
  const backup = JSON.stringify(createBackup(), null, 2);
  downloadFile(`study-log-backup-${todayText}.json`, backup, "application/json;charset=utf-8");
  dataMessage.textContent = "JSONバックアップを書き出しました";
});

// CSVで特別な意味を持つ文字を、ダブルクォートで囲みます。
function escapeCsv(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

exportCsvButton.addEventListener("click", () => {
  const rows = [
    ["date", "subject", "minutes", "memo", "createdAt"],
    ...records.map((record) => [record.date, record.subject, record.minutes, record.memo || "", record.createdAt || ""])
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`;
  downloadFile(`study-log-records-${todayText}.csv`, csv, "text/csv;charset=utf-8");
  dataMessage.textContent = "CSVを書き出しました";
});

// CSVの引用符、カンマ、改行を考慮して表を読み込みます。
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let insideQuotes = false;
  const source = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (insideQuotes && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (character === "," && !insideQuotes) {
      row.push(cell);
      cell = "";
    } else if (character === "\n" && !insideQuotes) {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

// 読み込んだ記録を確認し、保存用の形に整えます。
function normalizeImportedRecords(importedRecords) {
  if (!Array.isArray(importedRecords)) {
    throw new Error("学習記録の一覧が見つかりません");
  }

  return importedRecords.map((record, index) => {
    const date = String(record.date || "");
    const subject = String(record.subject || "").trim();
    const minutes = Number(record.minutes);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !subject || !Number.isFinite(minutes) || minutes < 1) {
      throw new Error(`${index + 1}件目の記録を読み取れません`);
    }
    return {
      id: String(record.id || `${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 6)}`),
      date,
      subject,
      minutes: Math.round(minutes),
      memo: String(record.memo || ""),
      createdAt: Number(record.createdAt) || Date.now() + index
    };
  });
}

// JSONバックアップまたはCSV記録を読み込みます。
backupFileInput.addEventListener("change", async () => {
  const file = backupFileInput.files[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const isCsv = file.name.toLowerCase().endsWith(".csv");
    let importedRecords;
    let backup = null;

    if (isCsv) {
      const rows = parseCsv(text);
      const headers = rows.shift().map((header) => header.trim());
      const dateIndex = headers.indexOf("date");
      const subjectIndex = headers.indexOf("subject");
      const minutesIndex = headers.indexOf("minutes");
      const memoIndex = headers.indexOf("memo");
      const createdAtIndex = headers.indexOf("createdAt");
      if ([dateIndex, subjectIndex, minutesIndex].some((column) => column < 0)) {
        throw new Error("CSVの列名が正しくありません");
      }
      importedRecords = rows.filter((row) => row.length > 1).map((row) => ({
        date: row[dateIndex],
        subject: row[subjectIndex],
        minutes: row[minutesIndex],
        memo: memoIndex < 0 ? "" : row[memoIndex],
        createdAt: createdAtIndex < 0 ? "" : row[createdAtIndex]
      }));
    } else {
      backup = JSON.parse(text);
      importedRecords = Array.isArray(backup) ? backup : backup.records;
    }

    const normalizedRecords = normalizeImportedRecords(importedRecords);
    const confirmMessage = `学習記録 ${normalizedRecords.length}件で、現在の学習記録を置き換えます。続けますか？`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    records = normalizedRecords;
    saveRecords();
    localStorage.removeItem(timerStorageKey);

    if (backup && !Array.isArray(backup)) {
      if (backup.goals) {
        goals = { ...goals, ...backup.goals };
        localStorage.setItem(goalStorageKey, JSON.stringify(goals));
      }
      if (Array.isArray(backup.todos)) {
        todos = backup.todos.filter((todo) => todo && typeof todo.text === "string");
        localStorage.setItem(todoStorageKey, JSON.stringify(todos));
      }
      if (backup.settings) {
        settings = { ...settings, ...backup.settings };
        normalizeStudySettings();
        localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
        localStorage.setItem(themeStorageKey, settings.theme);
      }
      if (Array.isArray(backup.dashboardOrder)) {
        localStorage.setItem(blockOrderStorageKey, JSON.stringify(backup.dashboardOrder));
      }
    }
    window.location.reload();
  } catch (error) {
    dataMessage.textContent = `読み込みできませんでした: ${error.message}`;
  } finally {
    backupFileInput.value = "";
  }
});

// すべての学習データと設定を確認のうえ初期化します。
clearDataButton.addEventListener("click", () => {
  const confirmed = window.confirm("学習記録・目標・ToDo・設定をすべて削除します。この操作は元に戻せません。よろしいですか？");
  if (!confirmed) {
    return;
  }

  [storageKey, timerStorageKey, goalStorageKey, todoStorageKey, themeStorageKey, settingsStorageKey, blockOrderStorageKey]
    .forEach((key) => localStorage.removeItem(key));
  window.location.reload();
});

// 編集をやめるボタンを設定します。
cancelEditButton.addEventListener("click", cancelEditing);

// タイマーの開始・終了ボタンを設定します。
startTimerButton.addEventListener("click", startTimer);

// タイマーの使い方（測るだけ / 時間で知らせる）を切り替えて、保存します。
timerModeInputs.forEach((input) => {
  input.checked = input.value === settings.timerMode;
  input.addEventListener("change", () => {
    if (activeTimer) {
      return;
    }
    settings.timerMode = input.value;
    localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
    renderTimerDisplay();
    timerStatus.classList.remove("is-warning");
    timerStatus.textContent = settings.timerMode === "stopwatch"
      ? "0 から時間を測ります（止めるまで続きます）"
      : `${settings.focusMinutes}分たったら知らせます`;
  });
});

// 「＋ 科目を追加・編集する」を選んだら、設定画面を開きます。
let lastSubjectValue = "";
subjectInput.addEventListener("focus", () => {
  lastSubjectValue = subjectInput.value;
});
subjectInput.addEventListener("change", () => {
  if (subjectInput.value === manageSubjectsValue) {
    subjectInput.value = lastSubjectValue;
    fillStudySettings();
    settingsDialog.showModal();
    newSubjectName.focus();
    return;
  }
  lastSubjectValue = subjectInput.value;
});

// 科目を選んだら、注意の表示を元に戻します。
subjectInput.addEventListener("input", () => {
  if (subjectInput.value && subjectInput.value !== manageSubjectsValue && !activeTimer) {
    subjectInput.classList.remove("needs-input");
    timerStatus.classList.remove("is-warning");
    timerStatus.textContent = "開始を押すと計測が始まります";
  }
});
stopTimerButton.addEventListener("click", stopTimer);

// 計測中に入力したメモを一時保存し、再読み込み後にも残します。
memoInput.addEventListener("input", () => {
  if (activeTimer) {
    activeTimer.memo = memoInput.value.trim();
    localStorage.setItem(timerStorageKey, JSON.stringify(activeTimer));
  }
});

// 「目標・試験日を変更する」ボタンで、設定画面の「学習」を開きます。
document.getElementById("openGoalSettingsButton").addEventListener("click", () => {
  fillStudySettings();
  settingsDialog.showModal();
  settingsWeeklyGoalInput.focus();
});

// ToDoを追加します。
todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = todoInput.value.trim();
  if (!text) {
    return;
  }
  todos.push({
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    done: false
  });
  localStorage.setItem(todoStorageKey, JSON.stringify(todos));
  todoForm.reset();
  renderTodos();
  todoInput.focus();
});

// 月送りボタンで、カレンダーに表示する月を切り替えます。
document.getElementById("previousMonth").addEventListener("click", () => {
  shownMonth.setMonth(shownMonth.getMonth() - 1);
  renderCalendar();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  shownMonth.setMonth(shownMonth.getMonth() + 1);
  renderCalendar();
});

// ページを開いたときに、保存済みの記録と合計を表示します。
restoreDashboardOrder();
renderSubjectOptions();
renderTodos();
renderRecords();
restoreTimer();
renderTimerDisplay();
