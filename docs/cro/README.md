# Замеры CRO: живые планы для сайта студии

Набор из пяти JSON-планов для `C:\dev\studio\scripts\cdp.mjs`. Меряют **живой** сайт
`https://mensori-dev.github.io/` — то, что видят люди (GitHub Pages, ветка `main`),
а не локальную копию.

Смысл: перед перестройкой порядка блоков (работы, цена и форма выше; залипающие
сцены ниже) нужен зафиксированный baseline. Числа — в `baseline.md` рядом.

## Как запускать

Один раз поднять Chrome с отдельным профилем (порт 9223, чтобы не мешать другим сессиям):

```
Start-Process -FilePath "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList '--remote-debugging-port=9223','--user-data-dir=C:\Users\skamm\AppData\Local\Temp\opencode\chrome9223','--no-first-run','--no-default-browser-check'
Start-Sleep -Seconds 4
(Invoke-WebRequest "http://127.0.0.1:9223/json/version" -UseBasicParsing -TimeoutSec 8).StatusCode
```

Запускать через `Start-Process`, а не через `& chrome.exe ...` в фоновой команде:
при запуске из фоновой команды процесс умирает вместе с ней, и `cdp.mjs` падает с
`fetch failed`. Если `fetch failed` / `ECONNREFUSED` — Chrome упал, поднять заново
тем же способом, причину в плане не искать.

Дальше каждый план — одна команда, из `C:\dev\studio`:

```
node scripts/cdp.mjs C:\dev\site\docs\cro\plan-map.json
node scripts/cdp.mjs C:\dev\site\docs\cro\plan-shots.json
node scripts/cdp.mjs C:\dev\site\docs\cro\plan-targets.json
node scripts/cdp.mjs C:\dev\site\docs\cro\plan-form.json
node scripts/cdp.mjs C:\dev\site\docs\cro\plan-perf.json
```

Планы сами создают фоновую вкладку (`newTab`) и закрывают её (`closeTab`), вкладки
человека в этом Chrome не трогают.

## Что меряет каждый план

| План | Что на выходе |
|---|---|
| `plan-map.json` | версия CSS, длина страницы, `vw/vh`; карта секций одной строкой `имя:offsetTop:высота`; положение `#price`, `#brief`, `#briefForm`, `#calc`, `#contact` в % от длины и в экранах. Всё на 1440×900 и на 390×844 |
| `plan-shots.json` | снимки 1440×900 (7 шт) и 390×844 (6 шт) по секциям: hero, works+price, brief, calc, pin, mosaic, contact. Перед каждым снимком печатает `scrollY` и `top` элемента — видно, доехала ли прокрутка |
| `plan-targets.json` | высоты тап-таргетов: шапка, рейл, hero, витрина, табы калькулятора, поля и кнопки формы, галочка согласия, контакты. Плюс список всего интерактивного ниже 44 px на обоих разрешениях |
| `plan-form.json` | тест формы `#briefForm`: пустой сабмит (какие поля получили `aria-invalid`), заполненный сабмит без галочки, сабмит с галочкой (`window.open` перехвачен, проверяется адрес `wa.me` и текст заявки) |
| `plan-perf.json` | вес: число запросов, сумма `transferSize`, разбивка по типам, документ отдельно, `PerformanceNavigationTiming` (TTFB, domContentLoaded, load), `scrollHeight` — на 1440 и 390 |

Снимки пишутся в `C:\Users\skamm\AppData\Local\Temp\opencode\cro\base\` — в репозиторий
картинки не кладём.

## Правило, чтобы планы не сломались от переезда блоков

Позиция задаётся **не числом**, а элементом: `document.querySelector(sel)` →
`getBoundingClientRect().top + scrollY` → прокрутка (с учётом Lenis) → проверка
`getBoundingClientRect().top` после прокрутки. Поэтому `plan-shots.json` и
`plan-map.json` переживут любую перестановку секций; жёстких `window.scrollTo(0, 4550)`
в планах нет намеренно.

Если секция переименована или удалена, план не падает: печатает `нет <селектор>` и идёт
дальше. Тогда поправить список в `plan-shots.json` (`__go('...')`) и `plan-map.json`
(селекторы в блоке «положение в %»).

## Оговорки

- `cdp.mjs` режет вывод одного `eval` до 900 символов. Поэтому карта секций и списки
  отдаются компактными строками, а не JSON с отступами. Если список перестал
  помещаться — резать по полям, а не тянуть весь DOM.
- В планах нельзя писать двойные кавычки внутри `eval` и одиночные обратные слэши
  (`\.`): парсер плана падает на «Bad escaped character». Внутри `eval` — одинарные
  кавычки, регулярки через `\\s`.
- `viewport` держит эмуляцию до конца плана; `shot` с полями `w`/`h` её сбрасывает,
  поэтому в `plan-shots.json` снимки идут без `w`/`h`.
- `cdp.mjs` отключает кеш (`Network.setCacheDisabled`), так что вес — честный
  «холодный» прогон по сети, а не из кеша браузера.
