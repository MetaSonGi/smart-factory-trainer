/* 실습 진행 엔진: 단계 체크 + 대시보드 + 평가 */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const F = () => window.__factory;

  let stepIdx = 0, quizIdx = 0, quizScore = 0, finished = false;
  const counters = { conveyor: 'count', robot: 'moved', inspect: 'inspected' };

  /* ---------- 화면 전환 ---------- */
  $('btnStart').addEventListener('click', () => {
    $('landing').classList.add('hidden');
    $('simulator').classList.remove('hidden');
    window.dispatchEvent(new Event('resize'));
    renderSteps();
  });
  $('btnExit').addEventListener('click', () => location.reload());
  $('btnRetry').addEventListener('click', () => location.reload());
  $('btnReset').addEventListener('click', () => location.reload());

  /* ---------- 단계 렌더링 ---------- */
  function renderSteps() {
    const ol = $('stepList');
    ol.innerHTML = LESSON.steps.map((s, i) => {
      const cls = i < stepIdx ? 'done' : i === stepIdx ? 'active' : '';
      const mark = i < stepIdx ? '✓' : (i + 1);
      return `<li class="${cls}"><span class="n">${mark}</span>${s.title}</li>`;
    }).join('');
    $('stepCount').textContent = `${stepIdx}/${LESSON.steps.length} 단계`;
    const pct = Math.round((stepIdx / LESSON.steps.length) * 100);
    $('progressFill').style.width = pct + '%';
    $('progressLabel').textContent = `실습 진도 ${pct}%`;
    const cur = LESSON.steps[stepIdx];
    if (cur) {
      let extra = '';
      if (cur.manual) extra = ` <button id="btnNextStep" class="btn primary" style="margin-left:8px;padding:6px 14px;">다음 ▶</button>`;
      $('stepBannerText').innerHTML = `<b>STEP ${stepIdx + 1}.</b> ${cur.desc}${extra}`;
      const nb = $('btnNextStep');
      if (nb) nb.addEventListener('click', () => { completeStep(); });
    }
  }

  function completeStep() {
    stepIdx++;
    if (stepIdx >= LESSON.steps.length) { startQuiz(); return; }
    renderSteps();
  }

  function checkStepProgress() {
    if (finished) return;
    const cur = LESSON.steps[stepIdx];
    if (!cur || cur.manual || !cur.needCount) return;
    const key = counters[cur.id];
    if (key && F()[key] >= cur.needCount) completeStep();
  }

  /* ---------- 장비 조작 버튼 ---------- */
  const btnPower = $('btnPower'), btnConv = $('btnConveyor'),
        btnRobot = $('btnRobot'), btnInsp = $('btnInspect');
  function markOn(btn) { btn.classList.add('on'); btn.disabled = true; }
  btnPower.addEventListener('click', () => { F().powerOn(); markOn(btnPower); btnConv.disabled = false; });
  btnConv.addEventListener('click', () => { F().conveyorStart(); markOn(btnConv); btnRobot.disabled = false; });
  btnRobot.addEventListener('click', () => { F().robotStart(); markOn(btnRobot); btnInsp.disabled = false; });
  btnInsp.addEventListener('click', () => { F().inspectStart(); markOn(btnInsp); });

  /* ---------- 팩토리 이벤트 구독 ---------- */
  const waitFactory = setInterval(() => {
    if (!window.__factory || !window.__factory.powerOn) return;
    clearInterval(waitFactory);
    F().onEvent = (type) => {
      if (['fed', 'moved', 'inspected'].includes(type)) { updateDash(); checkStepProgress(); }
    };
  }, 200);

  /* ---------- 대시보드 ---------- */
  const dc = $('dashChart'), dctx = dc.getContext('2d');
  function updateDash() {
    const f = F();
    $('dCount').textContent = f.inspected;
    $('dGood').textContent = f.good;
    $('dBad').textContent = f.bad;
    $('dRate').textContent = f.inspected ? ((f.bad / f.inspected) * 100).toFixed(1) + '%' : '0%';
    $('dRate').style.color = f.inspected && f.bad / f.inspected > 0.2 ? '#f85149' : '#e6edf3';
    drawChart(f.results);
  }
  function drawChart(results) {
    const W = dc.width, H = dc.height;
    dctx.clearRect(0, 0, W, H);
    dctx.fillStyle = '#8b949e'; dctx.font = '10px sans-serif';
    dctx.fillText('● 양품', 8, 14); dctx.fillStyle = '#3fb950';
    dctx.fillText('● 불량', 60, 14);
    if (!results.length) {
      dctx.fillStyle = '#8b949e'; dctx.fillText('검사 시작 후 그래프가 표시됩니다', 90, H / 2);
      return;
    }
    let g = 0, b = 0;
    const series = results.map((r) => { r ? g++ : b++; return [g, b]; });
    const max = Math.max(g, b, 1);
    const step = W / Math.max(results.length, 1);
    [['#3fb950', 0], ['#f85149', 1]].forEach(([color, idx]) => {
      dctx.strokeStyle = color; dctx.lineWidth = 2; dctx.beginPath();
      series.forEach(([gg, bb], i) => {
        const v = idx ? bb : gg;
        const x = i * step, y = H - 8 - (v / max) * (H - 30);
        i ? dctx.lineTo(x, y) : dctx.moveTo(x, y);
      });
      dctx.stroke();
    });
  }
  updateDash();

  /* ---------- 평가 ---------- */
  function startQuiz() {
    finished = true;
    $('quizPanel').classList.remove('hidden');
    $('stepBannerText').innerHTML = '<b>📝 이해도 평가</b> — 5문제를 풀어주세요. 4문제 이상 맞으면 수료!';
    $('progressFill').style.width = '100%';
    $('progressLabel').textContent = '실습 진도 100%';
    renderQuiz();
    $('quizPanel').scrollIntoView({ behavior: 'smooth' });
  }
  function renderQuiz() {
    const q = LESSON.quiz[quizIdx];
    $('quizBox').innerHTML = `
      <div class="q"><p>Q${quizIdx + 1}. ${q.q}</p>
        <div class="choices">${q.choices.map((c, i) =>
          `<button data-i="${i}">${i + 1}. ${c}</button>`).join('')}</div>
        <p class="explain" id="qExplain" style="display:none"></p>
      </div>`;
    $('quizBox').querySelectorAll('.choices button').forEach((b) =>
      b.addEventListener('click', () => answerQuiz(parseInt(b.dataset.i, 10), b)));
  }
  function answerQuiz(i, btn) {
    const q = LESSON.quiz[quizIdx];
    const btns = $('quizBox').querySelectorAll('.choices button');
    btns.forEach((b) => { b.disabled = true; });
    if (i === q.answer) { quizScore++; btn.classList.add('correct'); }
    else { btn.classList.add('wrong'); btns[q.answer].classList.add('correct'); }
    const ex = $('qExplain');
    ex.style.display = 'block';
    ex.textContent = (i === q.answer ? '⭕ 정답! ' : '❌ 오답. ') + q.explain;
    setTimeout(() => {
      quizIdx++;
      if (quizIdx < LESSON.quiz.length) renderQuiz();
      else showResult();
    }, 2200);
  }
  function showResult() {
    $('quizPanel').classList.add('hidden');
    $('resultPanel').classList.remove('hidden');
    const pass = quizScore >= 4;
    $('resultBox').innerHTML = `
      <div class="score">${quizScore}/5</div>
      <div class="grade" style="color:${pass ? '#3fb950' : '#d29922'}">${pass ? '🎓 수료 — 축하합니다!' : '💪 아쉬워요 — 다시 도전!'}</div>
      <p>${LESSON.title} ${LESSON.lessonNo} 실습을 완료했습니다.<br>
      생산 ${F().inspected}건 · 양품 ${F().good}건 · 불량 ${F().bad}건을 직접 검증했습니다.</p>`;
    $('stepBannerText').innerHTML = pass
      ? '<b>🏆 실습 완료!</b> 스마트공장 검증 장비 1차시를 수료했습니다.'
      : '<b>📝 평가 완료</b> 4문제 이상 맞으면 수료! 다시 실습하기를 눌러 재도전하세요.';
    $('resultPanel').scrollIntoView({ behavior: 'smooth' });
  }
})();
