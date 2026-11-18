/* ============================================================
   🚩 САПЁР — «Мы следим за сценой. Господь следит за нами.
   Сапёр следит за Вами)»
   Автор: Константин Леонидович Карманов
   ============================================================ */

(function () {
    'use strict';

    // --- 1. ВНЕДРЕНИЕ СТИЛЕЙ ---
    const style = document.createElement('style');
    style.textContent = `
        /* Иконка-триггер */
        #saper-trigger {
            position: fixed;
            left: 20px;
            bottom: 20px;
            z-index: 9990;
            width: 52px;
            height: 52px;
            background: #2A2A2A;
            border: 1px solid rgba(197, 160, 89, 0.6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            opacity: 0.35;
            transition: opacity 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }
        #saper-trigger:hover {
            opacity: 1;
            transform: scale(1.1);
            box-shadow: 0 0 20px rgba(197, 160, 89, 0.5);
        }

        /* Модальное окно */
        #saper-modal {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(20, 20, 20, 0.85);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: saperFadeIn 0.3s ease;
        }
        #saper-modal.active { display: flex; }

        @keyframes saperFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .saper-window {
            background: #FAF9F6;
            border-radius: 16px;
            max-width: 520px;
            width: 100%;
            padding: 30px 25px 25px;
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
            border-top: 4px solid #C5A059;
            position: relative;
            animation: saperSlideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            max-height: 95vh;
            overflow-y: auto;
        }
        @keyframes saperSlideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .saper-close {
            position: absolute;
            top: 12px;
            right: 16px;
            background: none;
            border: none;
            font-size: 26px;
            color: #999;
            cursor: pointer;
            line-height: 1;
            padding: 5px;
            transition: color 0.2s, transform 0.2s;
        }
        .saper-close:hover { color: #C5A059; transform: rotate(90deg); }

        .saper-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #2A2A2A;
            text-align: center;
            margin-bottom: 6px;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .saper-slogan {
            font-size: 0.8rem;
            color: #888;
            text-align: center;
            font-style: italic;
            line-height: 1.5;
            margin-bottom: 20px;
            padding: 0 10px;
        }

        /* Панель управления */
        .saper-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }
        .saper-difficulty {
            display: flex;
            gap: 6px;
        }
        .saper-diff-btn {
            padding: 6px 12px;
            font-size: 0.75rem;
            border: 1px solid #ddd;
            background: #fff;
            border-radius: 6px;
            cursor: pointer;
            color: #555;
            transition: all 0.2s;
            font-weight: 500;
        }
        .saper-diff-btn:hover { border-color: #C5A059; color: #C5A059; }
        .saper-diff-btn.active {
            background: #2A2A2A;
            color: #fff;
            border-color: #2A2A2A;
        }

        .saper-stats {
            display: flex;
            gap: 15px;
            font-size: 0.85rem;
            font-weight: 600;
            color: #2A2A2A;
        }
        .saper-stats span { color: #C5A059; }

        /* Игровое поле */
        .saper-board-wrap {
            display: flex;
            justify-content: center;
            margin-bottom: 15px;
        }
        .saper-board {
            display: grid;
            gap: 2px;
            background: #EAE8E3;
            padding: 4px;
            border-radius: 8px;
            user-select: none;
            touch-action: manipulation;
        }
        .saper-cell {
            width: 30px;
            height: 30px;
            background: #fff;
            border: none;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: background 0.1s, transform 0.1s;
            color: #2A2A2A;
            padding: 0;
            line-height: 1;
            font-family: inherit;
        }
        .saper-cell:hover:not(.revealed) { background: #F0EBE0; }
        .saper-cell:active:not(.revealed) { transform: scale(0.95); }
        .saper-cell.revealed { background: #F5F1EA; cursor: default; }
        .saper-cell.mine { background: #E74C3C !important; color: #fff; }
        .saper-cell.flag { color: #C5A059; }
        .saper-cell.wrong { background: #fce4e4 !important; color: #E74C3C; }

        /* Цвета цифр */
        .saper-cell[data-n="1"] { color: #1976D2; }
        .saper-cell[data-n="2"] { color: #388E3C; }
        .saper-cell[data-n="3"] { color: #D32F2F; }
        .saper-cell[data-n="4"] { color: #7B1FA2; }
        .saper-cell[data-n="5"] { color: #E65100; }
        .saper-cell[data-n="6"] { color: #00838F; }
        .saper-cell[data-n="7"] { color: #2A2A2A; }
        .saper-cell[data-n="8"] { color: #666; }

        /* Статус */
        .saper-status {
            text-align: center;
            font-size: 0.9rem;
            font-weight: 600;
            min-height: 22px;
            color: #2A2A2A;
            margin-bottom: 10px;
        }
        .saper-status.win { color: #388E3C; }
        .saper-status.lose { color: #E74C3C; }

        /* Кнопка рестарта */
        .saper-restart {
            display: block;
            width: 100%;
            padding: 11px;
            background: #2A2A2A;
            color: #fff;
            border: none;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s, transform 0.2s;
            font-family: inherit;
        }
        .saper-restart:hover {
            background: #C5A059;
            transform: translateY(-2px);
        }

        /* Адаптив */
        @media (max-width: 480px) {
            #saper-trigger { width: 44px; height: 44px; font-size: 20px; left: 12px; bottom: 12px; }
            .saper-window { padding: 25px 15px 20px; }
            .saper-cell { width: 26px; height: 26px; font-size: 12px; }
            .saper-title { font-size: 0.95rem; }
            .saper-slogan { font-size: 0.72rem; }
            .saper-controls { flex-direction: column; }
        }
        @media (max-width: 380px) {
            .saper-cell { width: 22px; height: 22px; font-size: 11px; }
        }
    `;
    document.head.appendChild(style);

    // --- 2. ИКОНКА-ТРИГГЕР ---
    const trigger = document.createElement('div');
    trigger.id = 'saper-trigger';
    trigger.innerHTML = '🚩';
    trigger.title = 'Секретный уровень для своих';
    document.body.appendChild(trigger);

    // --- 3. МОДАЛЬНОЕ ОКНО ---
    const modal = document.createElement('div');
    modal.id = 'saper-modal';
    modal.innerHTML = `
        <div class="saper-window">
            <button class="saper-close" aria-label="Закрыть">×</button>
            <div class="saper-title">🚩 Сапёр: технический перерыв</div>
            <div class="saper-slogan">Мы следим за сценой. Господь следит за нами.<br>Сапёр следит за Вами)</div>
            <div class="saper-controls">
                <div class="saper-difficulty">
                    <button class="saper-diff-btn active" data-level="easy">Новичок</button>
                    <button class="saper-diff-btn" data-level="medium">Средний</button>
                    <button class="saper-diff-btn" data-level="hard">Сложный</button>
                </div>
                <div class="saper-stats">
                    <div>💣 <span id="saper-mines">10</span></div>
                    <div>⏱ <span id="saper-time">0</span></div>
                </div>
            </div>
            <div class="saper-board-wrap">
                <div class="saper-board" id="saper-board"></div>
            </div>
            <div class="saper-status" id="saper-status"></div>
            <button class="saper-restart" id="saper-restart">Начать заново</button>
        </div>
    `;
    document.body.appendChild(modal);

    // --- 4. ИГРОВАЯ ЛОГИКА ---
    const boardEl = modal.querySelector('#saper-board');
    const statusEl = modal.querySelector('#saper-status');
    const minesEl = modal.querySelector('#saper-mines');
    const timeEl = modal.querySelector('#saper-time');
    const restartBtn = modal.querySelector('#saper-restart');
    const diffBtns = modal.querySelectorAll('.saper-diff-btn');
    const closeBtn = modal.querySelector('.saper-close');

    const LEVELS = {
        easy:   { rows: 9,  cols: 9,  mines: 10 },
        medium: { rows: 12, cols: 12, mines: 22 },
        hard:   { rows: 14, cols: 14, mines: 35 }
    };

    let currentLevel = 'easy';
    let rows, cols, totalMines;
    let grid = [];
    let revealed = [];
    let flagged = [];
    let gameOver = false;
    let firstMove = true;
    let timer = null;
    let seconds = 0;
    let flagsUsed = 0;

    function initGame() {
        const cfg = LEVELS[currentLevel];
        rows = cfg.rows;
        cols = cfg.cols;
        totalMines = cfg.mines;

        grid = Array.from({ length: rows }, () => Array(cols).fill(0));
        revealed = Array.from({ length: rows }, () => Array(cols).fill(false));
        flagged = Array.from({ length: rows }, () => Array(cols).fill(false));
        gameOver = false;
        firstMove = true;
        flagsUsed = 0;
        seconds = 0;

        clearInterval(timer);
        timer = null;
        timeEl.textContent = '0';
        statusEl.textContent = '';
        statusEl.className = 'saper-status';
        minesEl.textContent = totalMines;

        renderBoard();
    }

    function renderBoard() {
        boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        boardEl.innerHTML = '';

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('button');
                cell.className = 'saper-cell';
                cell.dataset.r = r;
                cell.dataset.c = c;
                cell.addEventListener('click', () => handleClick(r, c));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    handleFlag(r, c);
                });
                // Long press для мобильных (флаг)
                let pressTimer = null;
                cell.addEventListener('touchstart', () => {
                    pressTimer = setTimeout(() => {
                        handleFlag(r, c);
                        pressTimer = null;
                    }, 500);
                }, { passive: true });
                cell.addEventListener('touchend', () => {
                    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
                });
                cell.addEventListener('touchmove', () => {
                    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
                }, { passive: true });

                boardEl.appendChild(cell);
            }
        }
    }

    function startTimer() {
        if (timer) return;
        timer = setInterval(() => {
            seconds++;
            timeEl.textContent = seconds;
        }, 1000);
    }

    function placeMines(safeR, safeC) {
        const safeZone = new Set();
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                safeZone.add(`${safeR + dr},${safeC + dc}`);
            }
        }

        let placed = 0;
        while (placed < totalMines) {
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * cols);
            if (grid[r][c] === -1) continue;
            if (safeZone.has(`${r},${c}`)) continue;
            grid[r][c] = -1;
            placed++;
        }

        // Подсчёт чисел
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (grid[r][c] === -1) continue;
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === -1) count++;
                    }
                }
                grid[r][c] = count;
            }
        }
    }

    function getCell(r, c) {
        return boardEl.children[r * cols + c];
    }

    function handleClick(r, c) {
        if (gameOver || revealed[r][c] || flagged[r][c]) return;

        if (firstMove) {
            placeMines(r, c);
            firstMove = false;
            startTimer();
        }

        if (grid[r][c] === -1) {
            revealAllMines();
            gameOver = true;
            clearInterval(timer);
            statusEl.textContent = '💥 Подрыв! Попробуйте ещё раз.';
            statusEl.className = 'saper-status lose';
            return;
        }

        revealCell(r, c);
        checkWin();
    }

    function revealCell(r, c) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) return;
        if (revealed[r][c] || flagged[r][c]) return;

        revealed[r][c] = true;
        const cell = getCell(r, c);
        cell.classList.add('revealed');

        if (grid[r][c] > 0) {
            cell.textContent = grid[r][c];
            cell.dataset.n = grid[r][c];
        } else {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    revealCell(r + dr, c + dc);
                }
            }
        }
    }

    function handleFlag(r, c) {
        if (gameOver || revealed[r][c]) return;

        flagged[r][c] = !flagged[r][c];
        flagsUsed += flagged[r][c] ? 1 : -1;
        const cell = getCell(r, c);
        cell.classList.toggle('flag');
        cell.textContent = flagged[r][c] ? '🚩' : '';
        minesEl.textContent = totalMines - flagsUsed;
    }

    function revealAllMines() {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (grid[r][c] === -1) {
                    const cell = getCell(r, c);
                    cell.classList.add('revealed', 'mine');
                    cell.textContent = '💣';
                } else if (flagged[r][c]) {
                    const cell = getCell(r, c);
                    cell.classList.add('wrong');
                    cell.textContent = '✕';
                }
            }
        }
    }

    function checkWin() {
        let revealedCount = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (revealed[r][c]) revealedCount++;
            }
        }
        if (revealedCount === rows * cols - totalMines) {
            gameOver = true;
            clearInterval(timer);
            statusEl.textContent = `🎉 Победа! Время: ${seconds} сек.`;
            statusEl.className = 'saper-status win';
            // Автоматически ставим флажки на все мины
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (grid[r][c] === -1 && !flagged[r][c]) {
                        const cell = getCell(r, c);
                        cell.classList.add('flag');
                        cell.textContent = '🚩';
                    }
                }
            }
            minesEl.textContent = 0;
        }
    }

    // --- 5. СОБЫТИЯ ---
    trigger.addEventListener('click', () => {
        modal.classList.add('active');
        if (!timer && !gameOver) initGame();
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    restartBtn.addEventListener('click', () => {
        initGame();
    });

    diffBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            diffBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLevel = btn.dataset.level;
            initGame();
        });
    });

    // Блокировка контекстного меню на поле
    boardEl.addEventListener('contextmenu', (e) => e.preventDefault());

    // Инициализация при первом открытии
    initGame();

})();