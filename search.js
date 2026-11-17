/* Поиск по PDF-документам залов "Ковчег" */
(function () {
    'use strict';

    const INDEX_URL = 'search-index.json';
    let indexData = null;
    let indexPromise = null;
    let modalEl = null;
    let inputEl = null;
    let resultsEl = null;
    let statusEl = null;

    // --- Загрузка индекса (один раз) ---
    function loadIndex() {
        if (indexPromise) return indexPromise;
        indexPromise = fetch(INDEX_URL)
            .then(r => {
                if (!r.ok) throw new Error('Не удалось загрузить индекс: ' + r.status);
                return r.json();
            })
            .then(data => {
                indexData = data;
                return data;
            })
            .catch(err => {
                console.error(err);
                if (statusEl) statusEl.textContent = 'Ошибка загрузки поискового индекса.';
                throw err;
            });
        return indexPromise;
    }

    // --- Экранирование HTML ---
    function esc(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // --- Регистронезависимый поиск с учётом русских окончаний (простая эвристика) ---
    function normalize(s) {
        return String(s).toLowerCase().replace(/ё/g, 'е');
    }

    function makeSnippet(text, query, radius) {
        const norm = normalize(text);
        const q = normalize(query);
        const pos = norm.indexOf(q);
        if (pos === -1) return '';
        const start = Math.max(0, pos - radius);
        const end = Math.min(text.length, pos + q.length + radius);
        let snippet = text.slice(start, end);
        // подсветим все вхождения
        const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        snippet = esc(snippet).replace(re, '<mark>$1</mark>');
        return (start > 0 ? '… ' : '') + snippet + (end < text.length ? ' …' : '');
    }

    function search(query) {
        const q = normalize(query).trim();
        if (q.length < 2) return [];
        const results = [];
        for (const doc of indexData) {
            const haystack = normalize(doc.title + ' ' + doc.hall + ' ' + doc.content);
            if (haystack.indexOf(q) === -1) continue;
            // считаем количество вхождений для сортировки
            let count = 0, from = 0;
            while (true) {
                const p = haystack.indexOf(q, from);
                if (p === -1) break;
                count++;
                from = p + q.length;
                if (count > 200) break;
            }
            results.push({
                doc,
                count,
                snippet: makeSnippet(doc.content, query.trim(), 90)
            });
        }
        results.sort((a, b) => b.count - a.count);
        return results;
    }

    // --- Рендер модального окна ---
    function buildModal() {
        const wrap = document.createElement('div');
        wrap.className = 'kovcheg-search-overlay';
        wrap.setAttribute('role', 'dialog');
        wrap.setAttribute('aria-modal', 'true');
        wrap.setAttribute('aria-label', 'Поиск по техническим документам');
        wrap.innerHTML = `
            <div class="kovcheg-search-modal">
                <button class="kovcheg-search-close" type="button" aria-label="Закрыть">×</button>
                <h3 class="kovcheg-search-title">Поиск по техническим документам</h3>
                <input class="kovcheg-search-input" type="search" inputmode="search"
                       placeholder="Введите слово, например: радиомикрофон"
                       autocomplete="off" autocapitalize="off" spellcheck="false">
                <div class="kovcheg-search-status" aria-live="polite"></div>
                <div class="kovcheg-search-results"></div>
                <div class="kovcheg-search-hint">Поиск идёт по текстам всех PDF-файлов обоих залов.</div>
            </div>
        `;
        document.body.appendChild(wrap);
        return wrap;
    }

    function openModal() {
        if (!modalEl) {
            modalEl = buildModal();
            inputEl = modalEl.querySelector('.kovcheg-search-input');
            resultsEl = modalEl.querySelector('.kovcheg-search-results');
            statusEl = modalEl.querySelector('.kovcheg-search-status');

            modalEl.querySelector('.kovcheg-search-close').addEventListener('click', closeModal);
            modalEl.addEventListener('click', e => {
                if (e.target === modalEl) closeModal();
            });
            document.addEventListener('keydown', e => {
                if (e.key === 'Escape' && modalEl.classList.contains('open')) closeModal();
            });
            inputEl.addEventListener('input', debounce(onInput, 180));
        }
        modalEl.classList.add('open');
        document.body.style.overflow = 'hidden';
        loadIndex().then(() => {
            if (!inputEl.value) {
                statusEl.textContent = 'Начните вводить запрос — минимум 2 символа.';
            }
            inputEl.focus();
        }).catch(() => {});
    }

    function closeModal() {
        if (!modalEl) return;
        modalEl.classList.remove('open');
        document.body.style.overflow = '';
    }

    function debounce(fn, ms) {
        let t;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    function onInput() {
        const q = inputEl.value;
        if (!indexData) {
            loadIndex().then(onInput).catch(() => {});
            return;
        }
        const trimmed = q.trim();
        if (trimmed.length < 2) {
            resultsEl.innerHTML = '';
            statusEl.textContent = trimmed.length === 0
                ? 'Введите запрос для поиска.'
                : 'Введите минимум 2 символа.';
            return;
        }
        const results = search(trimmed);
        if (results.length === 0) {
            resultsEl.innerHTML = '';
            statusEl.textContent = `По запросу «${esc(trimmed)}» ничего не найдено.`;
            return;
        }
        statusEl.textContent = `Найдено документов: ${results.length}. Сортировка — по числу упоминаний.`;
        resultsEl.innerHTML = results.map(r => `
            <a class="kovcheg-search-result" href="${esc(r.doc.url)}" target="_blank" rel="noopener">
                <div class="kovcheg-search-result-head">
                    <span class="kovcheg-search-result-hall">${esc(r.doc.hall)}</span>
                    <span class="kovcheg-search-result-count">${r.count} ×</span>
                </div>
                <div class="kovcheg-search-result-title">${esc(r.doc.title)}</div>
                <div class="kovcheg-search-result-snippet">${r.snippet || '<em>(в этом документе совпадение только в названии)</em>'}</div>
                <div class="kovcheg-search-result-file">${esc(r.doc.id)}</div>
            </a>
        `).join('');
    }

    // --- Плавающая кнопка ---
    function buildFab() {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'kovcheg-search-fab';
        btn.setAttribute('aria-label', 'Открыть поиск по документам');
        btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
        btn.addEventListener('click', openModal);
        document.body.appendChild(btn);
    }

    // --- Стили (добавляем программно, чтобы не трогать HTML) ---
    function injectStyles() {
        if (document.getElementById('kovcheg-search-styles')) return;
        const css = `
        .kovcheg-search-fab {
            position: fixed; right: 22px; bottom: 22px; z-index: 9990;
            width: 56px; height: 56px; border-radius: 50%; border: none;
            background: var(--primary, #C5A059); color: #fff;
            display: inline-flex; align-items: center; justify-content: center;
            box-shadow: 0 8px 24px rgba(197,160,89,0.45);
            cursor: pointer; transition: transform .2s ease, background .2s ease, box-shadow .2s ease;
        }
        .kovcheg-search-fab:hover { transform: translateY(-3px) scale(1.04); background: var(--primary-hover, #B08D4A); box-shadow: 0 12px 30px rgba(197,160,89,0.55); }
        .kovcheg-search-fab:active { transform: translateY(0) scale(0.98); }

        .kovcheg-search-overlay {
            position: fixed; inset: 0; z-index: 9995;
            background: rgba(20,20,20,0.6);
            display: none; align-items: center; justify-content: center;
            padding: 20px; backdrop-filter: blur(3px);
        }
        .kovcheg-search-overlay.open { display: flex; }

        .kovcheg-search-modal {
            position: relative; width: 100%; max-width: 720px; max-height: 88vh;
            background: #fff; border-radius: 14px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.35);
            padding: 26px 24px 18px; overflow: hidden;
            display: flex; flex-direction: column;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #333;
        }
        .kovcheg-search-close {
            position: absolute; top: 10px; right: 12px;
            width: 36px; height: 36px; border: none; background: transparent;
            font-size: 26px; line-height: 1; color: #999; cursor: pointer;
            border-radius: 8px; transition: background .2s, color .2s;
        }
        .kovcheg-search-close:hover { background: #f1efea; color: #333; }
        .kovcheg-search-title {
            font-size: 1.15rem; font-weight: 600; margin: 0 0 14px;
            color: #2A2A2A; letter-spacing: .3px;
        }
        .kovcheg-search-input {
            width: 100%; box-sizing: border-box;
            padding: 13px 16px; font-size: 1rem;
            border: 1px solid #EAE8E3; border-radius: 10px;
            background: #FAF9F6; color: #2A2A2A;
            outline: none; transition: border-color .2s, box-shadow .2s;
        }
        .kovcheg-search-input:focus {
            border-color: var(--primary, #C5A059);
            box-shadow: 0 0 0 3px rgba(197,160,89,0.18);
            background: #fff;
        }
        .kovcheg-search-status {
            font-size: .85rem; color: #777; margin: 10px 2px 8px; min-height: 1.2em;
        }
        .kovcheg-search-results {
            overflow-y: auto; -webkit-overflow-scrolling: touch;
            flex: 1 1 auto; margin-top: 4px; padding-right: 4px;
        }
        .kovcheg-search-result {
            display: block; text-decoration: none; color: inherit;
            padding: 14px 14px 12px; border-radius: 10px;
            border: 1px solid #EAE8E3; background: #FCFCFA;
            margin-bottom: 10px; transition: border-color .2s, box-shadow .2s, transform .2s;
        }
        .kovcheg-search-result:hover {
            border-color: var(--primary, #C5A059);
            box-shadow: 0 6px 18px rgba(197,160,89,0.16);
            transform: translateY(-1px);
        }
        .kovcheg-search-result-head {
            display: flex; justify-content: space-between; align-items: center;
            font-size: .72rem; text-transform: uppercase; letter-spacing: 1px;
            color: #999; margin-bottom: 4px;
        }
        .kovcheg-search-result-hall { color: var(--primary, #C5A059); font-weight: 600; }
        .kovcheg-search-result-count { color: #999; }
        .kovcheg-search-result-title {
            font-size: 1rem; font-weight: 600; color: #2A2A2A; margin-bottom: 6px;
        }
        .kovcheg-search-result-snippet {
            font-size: .9rem; color: #555; line-height: 1.45;
        }
        .kovcheg-search-result-snippet mark {
            background: rgba(197,160,89,0.35); color: #2A2A2A;
            padding: 0 2px; border-radius: 3px;
        }
        .kovcheg-search-result-file {
            font-size: .72rem; color: #aaa; margin-top: 6px;
            font-family: ui-monospace, Menlo, Consolas, monospace;
        }
        .kovcheg-search-hint {
            font-size: .75rem; color: #aaa; text-align: center;
            padding-top: 10px; border-top: 1px solid #EAE8E3; margin-top: 8px;
        }

        @media (max-width: 768px) {
            .kovcheg-search-fab { right: 16px; bottom: 16px; width: 52px; height: 52px; }
            .kovcheg-search-modal { padding: 22px 16px 14px; max-height: 90vh; border-radius: 12px; }
            .kovcheg-search-title { font-size: 1.05rem; margin-bottom: 12px; }
            .kovcheg-search-result { padding: 12px 12px 10px; }
        }
        `;
        const style = document.createElement('style');
        style.id = 'kovcheg-search-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // --- Инициализация ---
    function init() {
        injectStyles();
        buildFab();
        // подгружаем индекс "лениво" — при первом открытии окна
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();