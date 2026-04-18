# Nebula Quiz — полный технический документ

**Версия:** 2.0 (на основе Figma-макета)
**Дата:** 2026-04-17
**Backend:** Go (модульный монолит)
**Frontend:** React + Vite + TypeScript
**Real-time:** WebSocket

---

## Оглавление

1. Обзор продукта
2. Технологический стек
3. Дизайн-система (из Figma)
4. Модель пользователей и ролей
5. Экраны фронтенда (по макету)
6. Компонентная архитектура
7. Модель данных (PostgreSQL)
8. REST API
9. WebSocket-протокол
10. Структура проекта
11. Real-time Hub на Go
12. Скоринг и правила
13. Power-ups и бонусы
14. Безопасность
15. Развёртывание
16. Тестирование
17. Roadmap

---

## 1. Обзор продукта

**Nebula Quiz** — live-платформа для проведения квизов в реальном времени. Терминология продукта (из макета):

- **Game Master** — организатор (создаёт и проводит квизы).
- **Player** — участник (присоединяется по коду или через аккаунт).
- **Match / Session** — проведённая игра.
- **Room code** — 7-символьный код формата `XXX-XXXX` (например, `7X9-2B4`).
- **Library** — публичный каталог квизов.
- **Explore** — рекомендации/поиск.
- **Reports** — история и статистика.

Ключевая особенность UX: **лендинг совмещён со входом** — слева «Join a Game» для игроков (code → Enter Room), справа «Game Masters» login-карточка для организаторов.

---

## 2. Технологический стек

### Backend (Go 1.22+)

| Слой | Выбор |
|------|-------|
| HTTP router | `go-chi/chi` v5 |
| WebSocket | `gorilla/websocket` |
| БД-драйвер | `jackc/pgx/v5` |
| SQL-генератор | `sqlc` |
| Миграции | `pressly/goose` |
| Валидация | `go-playground/validator/v10` |
| JWT | `golang-jwt/jwt/v5` |
| Password hashing | `golang.org/x/crypto/argon2` |
| Конфиг | `caarlos0/env/v11` |
| Логи | `log/slog` |
| UUID | `google/uuid` |
| S3 (MinIO) | `minio/minio-go/v7` |
| Тесты | `stretchr/testify`, `testcontainers-go` |

### Frontend

| Слой | Выбор |
|------|-------|
| Framework | React 18 + TypeScript 5 |
| Сборка | Vite 5 |
| Роутинг | `react-router-dom` v6 |
| Server state | `@tanstack/react-query` v5 |
| Client state | `zustand` |
| Формы | `react-hook-form` + `zod` |
| HTTP | `ky` |
| UI | `shadcn/ui` + Tailwind CSS v3 |
| Иконки | `lucide-react` (bell, rocket, play, pencil, etc. — все есть в макете) |
| Анимации | `framer-motion` (countdown, leaderboard pop-in, podium) |
| Даты | `date-fns` |

### Инфраструктура

- **PostgreSQL 16** — основное хранилище.
- **Redis 7** — live-состояние + pub/sub + rate limit.
- **MinIO** — изображения вопросов, аватары, cover'ы квизов.
- **Nginx** — TLS, reverse proxy, WS upgrade, статика.
- **Docker Compose** — локалка.

---

## 3. Дизайн-система (извлечена из Figma)

> Токены синхронизированы с макетом Figma (node `1:776` «Results & Leaderboard», снят 2026-04-17). Палитра мягче и теплее, чем стандартный `violet-500` / `slate-950` — **не подставлять дефолты Tailwind**.

### Палитра

```css
:root {
  /* Фоны */
  --bg-primary:     #0C0C1F;   /* глубокий почти чёрный синий — основной фон */
  --bg-secondary:   #12132B;   /* sidebar, app shell */
  --bg-card:        #111128;   /* карточки, pill-ряды */
  --bg-elevated:    #222247;   /* highlighted row (YOU), модалки, поповеры */
  --bg-input:       #0F1127;   /* инпуты на тёмных панелях */

  /* Brand */
  --primary-500:    #7C4DFF;   /* основной фиолетовый (CTA, active tab, 1st-place подиум) */
  --primary-600:    #6B3FEB;   /* hover */
  --primary-400:    #A68CFF;   /* светлый — ссылки, «YOU» ранг, highlights */
  --primary-glow:   rgba(166, 139, 255, 0.20); /* тень под primary-кнопками */

  /* Акценты */
  --accent-cyan:    #8DCDFF;   /* score Runner Ups, progress bars, «Exit Match» текст */
  --accent-amber:   #FFB778;   /* 1st-place border/score, medal, «+14%» */
  --accent-orange:  #FB923C;   /* Sign Up link, VIP badge */
  --accent-success: #34D399;
  --accent-error:   #EF4444;

  /* Типографика */
  --text-primary:   #E5E3FF;   /* не чистый white — мягкий лавандовый */
  --text-secondary: #A8A7D5;
  --text-muted:     #8B8FB8;
  --text-placeholder:#5C5E85;

  /* Бордеры */
  --border-subtle:  rgba(255, 255, 255, 0.06);
  --border-default: rgba(68, 68, 108, 0.30);   /* подсмотрено на YOU-строке */
  --border-focus:   var(--primary-500);
}
```

### Типографика

Из макета: **Space Grotesk** — заголовки/цифры; **Plus Jakarta Sans** — body (не Inter); **JetBrains Mono** — room code.

```css
--font-display: 'Space Grotesk', ui-sans-serif;
--font-body:    'Plus Jakarta Sans', ui-sans-serif;
--font-mono:    'JetBrains Mono', ui-monospace;

/* Размеры */
--text-xs:   12px;
--text-sm:   14px;
--text-base: 16px;
--text-lg:   18px;
--text-xl:   24px;
--text-2xl:  32px;
--text-3xl:  48px;   /* "Welcome back, Master" */
--text-4xl:  80px;   /* "Enter The Nebula." */
--text-mega: 120px;  /* room code "7X9-2B4" */
```

### Радиусы и тени

```css
--radius-sm:   8px;
--radius-md:   12px;
--radius-lg:   16px;
--radius-xl:   20px;
--radius-2xl:  48px;    /* крупные pill-карточки: Runner Ups ряды, Action Buttons, Nav-капсула */
--radius-pill: 9999px;  /* мелкие pills, кнопки, бейджи */

--shadow-glow-primary: 0 10px 20px 0 var(--primary-glow);  /* под Play Again / CTA */
--shadow-row-elevated: 0 10px 20px 0 rgba(0, 0, 0, 0.30);  /* под highlighted «YOU» рядом */
--shadow-podium:       0 20px 40px 0 rgba(0, 0, 0, 0.50);  /* тумбы 2/3 места */
--shadow-podium-gold:  0 20px 40px 0 rgba(166, 139, 255, 0.20); /* тумба 1 места */
--shadow-card:         0 4px 24px rgba(0, 0, 0, 0.35);
```

### Ключевые UI-паттерны из макета

1. **Pill-кнопки** — все CTA скруглены до капсулы (`border-radius: 9999px`). Primary — фиолетовый градиент, outline — прозрачный с бордером.
2. **Glow под primary-кнопками** — крупные главные кнопки (Login, Enter Room, Start Game, Play Again) имеют мягкое фиолетовое свечение снизу.
3. **Карточки** — `bg-card`, радиус 16–20px, лёгкий бордер, иногда внутренний тонкий highlight сверху.
4. **Dashed placeholder card** — «Draft New Quiz» с пунктирным бордером и плюсом в центре; аналогично «пустые слоты» в lobby.
5. **Статусные pills** — маленькие pill'ы с точкой-индикатором (`● LOBBY OPEN`, `● Currently live`).
6. **Иконки-кружки** — иконки в круглых контейнерах с полупрозрачным фоном primary (в KPI-карточках).

### Tailwind config (фрагмент)

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        bg: {
          primary:  '#0C0C1F',
          secondary:'#12132B',
          card:     '#111128',
          elevated: '#222247',
          input:    '#0F1127',
        },
        primary: {
          400: '#A68CFF',
          500: '#7C4DFF',
          600: '#6B3FEB',
        },
        accent: {
          cyan:   '#8DCDFF',
          amber:  '#FFB778',
          orange: '#FB923C',
        },
        text: {
          primary:   '#E5E3FF',
          secondary: '#A8A7D5',
          muted:     '#8B8FB8',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body:    ['Plus Jakarta Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '48px',   /* runner-up rows, action buttons, nav capsule */
      },
      boxShadow: {
        'glow-primary':  '0 10px 20px 0 rgba(166, 139, 255, 0.20)',
        'row-elevated':  '0 10px 20px 0 rgba(0, 0, 0, 0.30)',
        'podium':        '0 20px 40px 0 rgba(0, 0, 0, 0.50)',
        'podium-gold':   '0 20px 40px 0 rgba(166, 139, 255, 0.20)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(180deg, #A68CFF 0%, #7C4DFF 100%)',
        'gradient-logo':    'linear-gradient(168deg, #A68CFF 0%, #7C4DFF 100%)',
      },
    },
  },
};
```

---

## 4. Модель пользователей и ролей

```
participant  — играет, может быть гостем без аккаунта
organizer    — Game Master: создаёт квизы, проводит сессии
admin        — модерация (вне MVP)
```

**Гостевой вход** присутствует в макете: «No account required to play. Just enter the code». Гость указывает только ник на экране Join.

---

## 5. Экраны фронтенда (по макету Figma)

### 5.1. Landing / Login (`/`)

Единый экран с top navigation и двумя колонками.

**Top nav:**
- Логотип `NEBULA QUIZ` (фиолетовый, uppercase).
- Ссылки: `Explore`, `Library`, `Reports`.
- Справа: иконка колокольчика (уведомления), аватар/профиль.

**Левая колонка — Join a Game:**
- Заголовок h1 крупный: «Enter The Nebula.»
- Абзац «Join live games instantly. No account required to play…»
- Карточка с label «Join a Game», инпут `ROOM CODE` (моноспейс), primary-кнопка `Enter Room` с glow.
- Декоративная иконка ракеты 🚀 в правом углу карточки.

**Правая колонка — Game Masters card:**
- Заголовок `Game Masters`, подзаголовок `Create, host, and analyze.`
- Инпуты Email Address, Password.
- Чекбокс `Remember me`, ссылка `Forgot password?` справа.
- Primary outline-кнопка `Login` (pill, фиолетовый текст, тонкий бордер).
- Футер: `New organizer? Sign Up` (Sign Up — оранжевая ссылка).

**Роуты:**
- `/` — landing/login.
- `/register` — отдельный экран регистрации (в макете только Sign Up-линк; экран предполагаем).
- `/join/:code?` — переход после `Enter Room`: если код валиден, запрос nickname (если гость) и редирект в лобби.

### 5.2. Organizer Dashboard (`/dashboard`)

**Sidebar (слева):**
- Логотип `NEBULA QUIZ`.
- Навигация (с active-состоянием в виде pill): `Dashboard`, `My Quizzes`, `Live Sessions`, `Analytics`, `Settings`.
- Внизу: primary-кнопка `+ Create New Quiz` + блок пользователя (аватар, имя, `Pro Account`).

**Main:**
- Заголовок «Welcome back, {name}» + саб «Your quizzes are reaching new galaxies today.»
- Три **KPI-карточки**:
  - `Total Players` — число (cyan), `+14% this week` (amber).
  - `Active Sessions` — число + `● Currently live`.
  - `Avg Completion Rate` — % + прогресс-бар amber.
- Секция `My Quizzes` с ссылкой `VIEW ALL →` справа.
- Горизонтальный ряд карточек квизов + dashed-карточка «Draft New Quiz» в конце.

**Карточка квиза:**
- Cover image (cover_url).
- Pill-бейдж категории в правом верхнем углу.
- Title + описание.
- Футер: `? 15 Qs`, `▶ 1.2k Plays`, иконка-кнопка pencil (edit).

### 5.3. My Quizzes (`/quizzes`)

Список/сетка всех квизов организатора с фильтрами. В макете не раскрыт — экстраполируем из Dashboard-карточек + добавим панель фильтров (категория, статус Draft/Published, сортировка).

### 5.4. Quiz Builder (`/quizzes/:id/edit`)

**Header:**
- `← Back to My Quizzes`.
- Title квиза крупный: «Cosmic Trivia Challenge».
- Подзаголовок `Editing Draft • 12 Questions`.
- Справа: `Preview` (outline), `Publish Quiz` (primary с glow).

**Центр — Question Editor:**
- Pill `13` (номер вопроса) + заголовок `Question Editor` + trash-иконка.
- Textarea `Type your question here...`.
- В правом нижнем углу textarea — иконки: 🖼 (прикрепить изображение), Σ (формула/math — **опциональная фича**, можно LaTeX через KaTeX).
- Список вариантов в сетке 2×N: каждый вариант — pill с буквой `A/B/C/D`, текстом и радио-кружком (для single) / чекбоксом (для multiple). Активный правильный — подсвечен primary + amber-галочкой.
- Кнопка `+ Add Option` как dashed-pill.

**Правая панель — Question Settings:**
- `Time Limit`: сегмент-кнопки `10s`, `20s`, `30s`, `60s` (один активный).
- `Answer Type`: toggle `Single Choice | Multiple Choice`.

**Правая панель — Quiz Overview:**
- `12 Qs` в углу.
- Список вопросов: номер, превью текста, иконка типа (image/text), drag-handle `⋮⋮`.
- Кнопка `+ Add Question` снизу.

### 5.5. Host Lobby / Live Session (`/host/:code`)

**Layout:** sidebar + центр.

**Центр:**
- Pill `● LOBBY OPEN` (cyan индикатор).
- Текст `Join at nebula.live with code:`.
- **Room code огромным шрифтом** — градиентный фиолетовый `7X9-2B4` (mono-font, ~120px).
- Подпись `Waiting for players to connect...`.
- Секция `👥 Players` + pill `8 Joined`.
- Сетка 4×2 карточек-игроков (аватар, имя, статус `Ready`/`VIP`). Пустые слоты — dashed-карточка с иконкой «add person».
- Primary pill-кнопка `START GAME ▶` внизу по центру, с glow.

### 5.6. Host Question View (`/host/:code/question`)

**[FIGMA-TBD]** — специального host-экрана во время вопроса в макетах нет, экстраполируем:

- Вопрос крупно.
- Счётчики «ответили / всего» в real-time для каждого варианта (bar chart).
- Таймер.
- Кнопки `Skip Question`, `Next Question` (primary).

### 5.7. Player Question (`/play/:code/question`)

Полноэкранный live-режим на тёмном фоне.

**Header:**
- Слева pill `● Q. 4/10` (номер вопроса / всего).
- Справа pill `⭐ 1,250 pts` (текущие очки, amber).

**Центр — карточка вопроса:**
- Сверху прогресс-бар (cyan) — остаток времени.
- Большая цифра `12` + подпись `SECONDS`.
- Текст вопроса крупным display-шрифтом по центру.

**Варианты ответа:**
- Сетка 2×2: pill-кнопки с буквой A/B/C/D, текстом варианта, радио-кружком справа.
- При клике — кружок превращается в галочку, карточка подсвечивается primary.

**Правый нижний угол:**
- Кружок с числом `0` — счётчик power-up'ов.
- Жёлтая молния ⚡ — кнопка power-up'а (см. §13).

**Состояния:**
- `waiting` — вопрос ещё не начался (для late-join).
- `answering` — активный приём ответов.
- `answered` — ответ отправлен, ждём окончания.
- `result` — показ правильного ответа (правильные — зелёным, выбранный неправильный — красным).

### 5.8. Match Complete / Results (`/play/:code/results`)

Источник: Figma node `1:776` «Results & Leaderboard».

**Top nav (sticky, backdrop-blur 12px, `rgba(12,12,31,0.8)`):** логотип `NEBULA QUIZ` (градиент `#A68CFF → #7C4DFF`), центральная pill-капсула `bg-card` с ссылками `Explore | Library | Reports`. Активная ссылка — `border-bottom: 2px solid #A68CFF`, цвет `#A68CFF`. Справа: bell, profile.

**Main (max-width 1280px, центрирован):**
- Заголовок `Match Complete` — 60px Space Grotesk Bold, `tracking: -1.5px`, `#E5E3FF`.
- Подзаголовок `Cosmic Trivia Challenge #{match_number}` — 18px Plus Jakarta Sans Regular, `#A8A7D5`.

**Подиум (раскладка 2-1-3, items-end):**
| Место | Ширина тумбы | Высота | Фон | Аватар | Score цвет |
|-------|-------------|--------|-----|--------|-----------|
| 1 | 220px | 224px | `linear-gradient(180deg, #A68CFF → #7C4DFF)` + `shadow-podium-gold` | 96px, border `4px #FFB778`, корона/halo 24×32 сверху | `#FFB778` 18px |
| 2 | 200px | 160px | `#1C1C3D` + top gradient `rgba(39,39,82,0.5→0)` + `shadow-podium` | 80px, border `4px #111128` | `#8DCDFF` 16px |
| 3 | 200px | 128px | `#1C1C3D` + top gradient `rgba(39,39,82,0.3→0)` + `shadow-podium` | 80px, border `4px #111128` | `#8DCDFF` 16px |

Цифра места на тумбе: Space Grotesk Bold, `1` — 48px белым, `2` — 36px `#A8A7D5`, `3` — 30px `#A8A7D5`. Радиус тумбы: `rounded-tl-[24px] rounded-tr-[24px]`, низ прямой.

**Runner Ups (max-width 672px):**
- Заголовок `Runner Ups` — 20px Space Grotesk Bold, `#A8A7D5`.
- Каждая строка — pill `rounded-[48px]`, `bg-card` (`#111128`), padding 16px, flex `justify-between`.
- Слева: ранг (32px ширина, 20px `#A8A7D5`) → avatar 40px → ник (16px Plus Jakarta Medium, `#E5E3FF`).
- Справа: score Space Grotesk Bold 16px `#8DCDFF`.
- **Highlighted «YOU» row** (текущий пользователь): `bg-elevated` (`#222247`), `border 1px rgba(68,68,108,0.3)`, `shadow-row-elevated`, padding 17px. Ранг — `#A68CFF`. Вместо аватара — круг 40px `bg-primary-500` с текстом `YOU` (16px белый). Имя — Plus Jakarta **Bold**. Score — `#A68CFF`.

**Action Buttons (max-width 448px, gap 16px, centered):**
- `Play Again` — flex-1, `rounded-[48px]`, `bg-gradient-primary`, `shadow-glow-primary`, текст 16px Plus Jakarta Bold белый.
- `Exit Match` — flex-1, `rounded-[48px]`, border `1px rgba(68,68,108,0.15)`, текст `#8DCDFF` 16px Plus Jakarta Bold.

**Ambient background (за контентом, `overflow-clip`):**
- Круг 640px, `bg rgba(166,140,255,0.1)`, `blur(50px)`, top-left (-128, -103).
- Круг 512px, `bg rgba(141,205,255,0.1)`, `blur(50px)`, bottom-right (-128, -103).

### 5.9. Analytics (`/analytics`)

**[FIGMA-TBD]** — в макете только пункт меню. Предполагаю:
- Графики участников по времени.
- Топ квизов.
- Вопросы с самой низкой accuracy (для автора — сигнал переформулировать).

### 5.10. Settings (`/settings`)

Профиль, смена пароля, аватар, нотификации.

### 5.11. Player-специфичные экраны

- `/explore` — публичный каталог.
- `/library` — закладки (?) — уточнить по макету.
- `/reports` — история игр участника.

### Итого экранов

| Группа | Экраны |
|--------|--------|
| Public | Landing/Login, Register, Join by code |
| Organizer | Dashboard, My Quizzes, Quiz Builder, Live Sessions, Analytics, Settings |
| Live (Host) | Host Lobby, Host Question, Host Results |
| Live (Player) | Player Lobby, Player Question, Player Results |
| Player area | Explore, Library, Reports (History), Profile |

---

## 6. Компонентная архитектура

### Структура src/

```
src/
├── app/
│   ├── router.tsx
│   ├── providers.tsx           # QueryClient, ThemeProvider, Router
│   └── main.tsx
│
├── pages/
│   ├── LandingPage.tsx
│   ├── RegisterPage.tsx
│   ├── JoinByCodePage.tsx
│   ├── organizer/
│   │   ├── DashboardPage.tsx
│   │   ├── MyQuizzesPage.tsx
│   │   ├── QuizBuilderPage.tsx
│   │   ├── LiveSessionsPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── host/
│   │   ├── HostLobbyPage.tsx
│   │   ├── HostQuestionPage.tsx
│   │   └── HostResultsPage.tsx
│   ├── play/
│   │   ├── PlayerLobbyPage.tsx
│   │   ├── PlayerQuestionPage.tsx
│   │   └── PlayerResultsPage.tsx
│   └── player/
│       ├── ExplorePage.tsx
│       ├── LibraryPage.tsx
│       └── ReportsPage.tsx
│
├── features/
│   ├── auth/
│   │   ├── api.ts
│   │   ├── store.ts
│   │   ├── guards.tsx              # RequireAuth, RequireRole
│   │   └── components/
│   │       ├── GameMasterLoginCard.tsx
│   │       └── JoinGameCard.tsx
│   │
│   ├── quizzes/
│   │   ├── api.ts
│   │   ├── components/
│   │   │   ├── QuizCard.tsx        # карточка на dashboard
│   │   │   ├── DraftNewQuizCard.tsx
│   │   │   └── CategoryBadge.tsx
│   │   └── hooks/useQuizzes.ts
│   │
│   ├── quiz-builder/
│   │   ├── api.ts
│   │   ├── store.ts                # локальное состояние билдера
│   │   ├── components/
│   │   │   ├── QuestionEditor.tsx
│   │   │   ├── AnswerOption.tsx
│   │   │   ├── TimeLimitSelector.tsx
│   │   │   ├── AnswerTypeToggle.tsx
│   │   │   ├── QuizOverview.tsx    # правая панель
│   │   │   └── ImageUploader.tsx
│   │
│   ├── live-game/
│   │   ├── ws-client.ts            # синглтон WS
│   │   ├── protocol.ts             # типы WS-сообщений
│   │   ├── store.ts                # zustand
│   │   ├── hooks/
│   │   │   ├── useQuizSocket.ts
│   │   │   └── useServerTimer.ts
│   │   └── components/
│   │       ├── RoomCodeDisplay.tsx # гигантский код
│   │       ├── PlayerCard.tsx      # карточка в lobby
│   │       ├── PlayerSlots.tsx     # grid 4x2
│   │       ├── CountdownCard.tsx   # таймер + вопрос
│   │       ├── AnswerGrid.tsx      # 2x2 варианты
│   │       ├── ScoreBadge.tsx      # "1,250 pts"
│   │       ├── Podium.tsx
│   │       ├── RunnerUpsList.tsx
│   │       └── PowerUpButton.tsx
│   │
│   └── dashboard/
│       └── components/
│           ├── KpiCard.tsx
│           └── WelcomeHeader.tsx
│
├── shared/
│   ├── ui/                     # shadcn/ui + кастомные
│   │   ├── Button.tsx          # pill, glow variant
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Pill.tsx
│   │   ├── StatusPill.tsx      # "● LOBBY OPEN"
│   │   ├── Avatar.tsx
│   │   ├── SegmentedControl.tsx
│   │   └── Toggle.tsx
│   ├── layout/
│   │   ├── AppShell.tsx        # sidebar + main
│   │   ├── Sidebar.tsx
│   │   ├── TopNav.tsx
│   │   └── PublicLayout.tsx
│   ├── lib/
│   │   ├── http.ts             # ky instance
│   │   └── formatters.ts
│   └── config/
│       └── env.ts
│
└── styles/
    ├── globals.css
    └── tokens.css              # CSS-переменные из §3
```

### Примеры ключевых компонентов

#### `Button` с glow-вариантом

```tsx
// shared/ui/Button.tsx
import { cva, VariantProps } from 'class-variance-authority';

const button = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold ' +
  'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
  {
    variants: {
      variant: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600 shadow-glow-primary',
        outline: 'border border-white/15 text-white hover:bg-white/5',
        ghost:   'text-primary-400 hover:bg-primary-500/10',
      },
      size: {
        sm:  'h-9 px-4 text-sm',
        md:  'h-11 px-6 text-base',
        lg:  'h-14 px-8 text-lg',
        xl:  'h-16 px-10 text-xl',     // Start Game, Enter Room
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export function Button({ variant, size, className, ...props }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>
) {
  return <button className={button({ variant, size, className })} {...props} />;
}
```

#### `RoomCodeDisplay`

```tsx
// features/live-game/components/RoomCodeDisplay.tsx
export function RoomCodeDisplay({ code }: { code: string }) {
  // '7X92B4' -> '7X9-2B4'
  const formatted = `${code.slice(0, 3)}-${code.slice(3)}`;
  return (
    <div className="flex flex-col items-center gap-4">
      <StatusPill status="live">LOBBY OPEN</StatusPill>
      <p className="text-text-muted">Join at nebula.live with code:</p>
      <div
        className="font-mono font-bold leading-none tracking-tight"
        style={{
          fontSize: 'clamp(64px, 10vw, 140px)',
          backgroundImage: 'linear-gradient(180deg, #E9E4FF 0%, #8B5CF6 100%)',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {formatted}
      </div>
      <p className="text-text-muted">Waiting for players to connect...</p>
    </div>
  );
}
```

#### `useServerTimer` — точный таймер

```ts
/**
 * Клиентский таймер, синхронизированный с server_ts.
 * rAF для плавности. Возвращает оставшееся время и progress [0..1].
 */
export function useServerTimer(serverStartTs: number, durationMs: number) {
  const [remaining, setRemaining] = useState(durationMs);

  useEffect(() => {
    const offset = Date.now() - serverStartTs;
    const clientStart = performance.now();

    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - clientStart + offset;
      const left = Math.max(0, durationMs - elapsed);
      setRemaining(left);
      if (left > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [serverStartTs, durationMs]);

  return { remainingMs: remaining, progress: 1 - remaining / durationMs };
}
```

#### `QuizSocket` (синглтон) + `useLiveGame` (zustand)

```ts
// features/live-game/ws-client.ts
export type WSMessage = { type: string; payload: unknown };
type Listener = (msg: WSMessage) => void;

class QuizSocket {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private attempts = 0;
  private url = '';

  connect(url: string) {
    this.url = url;
    this.open();
  }

  private open() {
    const ws = new WebSocket(this.url);
    this.ws = ws;
    ws.onmessage = (e) => {
      try { this.listeners.forEach(l => l(JSON.parse(e.data))); }
      catch {}
    };
    ws.onopen  = () => { this.attempts = 0; };
    ws.onclose = () => {
      const delay = Math.min(1000 * 2 ** this.attempts++, 30_000) + Math.random() * 1000;
      setTimeout(() => this.open(), delay);
    };
  }

  send(msg: WSMessage)     { this.ws?.send(JSON.stringify(msg)); }
  on(fn: Listener)         { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  close()                  { this.ws?.close(); this.listeners.clear(); }
}
export const quizSocket = new QuizSocket();
```

```ts
// features/live-game/store.ts
export const useLiveGame = create<LiveGameState>((set, get) => ({
  roomState: null,
  activeQuestion: null,
  leaderboard: [],
  myAnswer: null,
  myResult: null,
  myScore: 0,

  handle: (msg) => {
    switch (msg.type) {
      case 'room.state':       set({ roomState: msg.payload as any }); break;
      case 'question.start':   set({ activeQuestion: msg.payload as any, myAnswer: null, myResult: null }); break;
      case 'question.end':     set({ myResult: (msg.payload as any).my_result,
                                     myScore:  get().myScore + ((msg.payload as any).my_result?.score_awarded ?? 0) });
                               break;
      case 'leaderboard.update': set({ leaderboard: (msg.payload as any).top }); break;
    }
  },

  submitAnswer: (optionIds) => {
    const q = get().activeQuestion;
    if (!q || get().myAnswer) return;
    set({ myAnswer: optionIds });
    quizSocket.send({ type: 'answer.submit',
      payload: { question_id: q.question_id, option_ids: optionIds } });
  },
}));
```

---

## 7. Модель данных (PostgreSQL)

Отличия от v1: `room_code` 7 символов `XXX-XXXX`, добавлены таблицы `power_ups`, `user_avatars`, `saved_quizzes` (Library).

```sql
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role      AS ENUM ('participant', 'organizer', 'admin');
CREATE TYPE question_type  AS ENUM ('single', 'multiple');
CREATE TYPE game_status    AS ENUM ('lobby', 'in_progress', 'finished', 'aborted');
CREATE TYPE participant_status AS ENUM ('joined', 'ready', 'vip', 'left');

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'participant',
  display_name  TEXT NOT NULL,
  avatar_url    TEXT,
  plan          TEXT NOT NULL DEFAULT 'free',      -- 'free' | 'pro' (Pro Account в макете)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash BYTEA NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  user_agent TEXT,
  ip         INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON refresh_tokens (user_id);

CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT UNIQUE NOT NULL,   -- Science, Pop Culture, ...
  slug       TEXT UNIQUE NOT NULL,
  icon       TEXT
);

CREATE TABLE quizzes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id  UUID REFERENCES categories(id),
  title        TEXT NOT NULL,
  description  TEXT,
  cover_url    TEXT,
  settings     JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  plays_count  INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON quizzes (owner_id);
CREATE INDEX ON quizzes (is_published, category_id);

CREATE TABLE questions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id            UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  order_idx          INT NOT NULL,
  text               TEXT NOT NULL,
  image_url          TEXT,
  question_type      question_type NOT NULL,
  time_limit_seconds INT NOT NULL DEFAULT 20 CHECK (time_limit_seconds IN (10, 20, 30, 60)),
  points             INT NOT NULL DEFAULT 1000,
  UNIQUE (quiz_id, order_idx)
);

CREATE TABLE answer_options (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  is_correct  BOOLEAN NOT NULL DEFAULT false,
  order_idx   INT NOT NULL
);
CREATE INDEX ON answer_options (question_id);

CREATE TABLE game_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id      UUID NOT NULL REFERENCES quizzes(id),
  host_id      UUID NOT NULL REFERENCES users(id),
  room_code    CHAR(7) NOT NULL,               -- XXX-XXXX
  match_number SERIAL,                         -- #442 из макета
  status       game_status NOT NULL DEFAULT 'lobby',
  started_at   TIMESTAMPTZ,
  finished_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX game_sessions_active_code
  ON game_sessions (room_code) WHERE status IN ('lobby','in_progress');

CREATE TABLE game_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  nickname        TEXT NOT NULL,
  avatar_url      TEXT,
  status          participant_status NOT NULL DEFAULT 'joined',
  total_score     INT NOT NULL DEFAULT 0,
  power_ups_left  INT NOT NULL DEFAULT 1,        -- см. §13
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at         TIMESTAMPTZ
);
CREATE UNIQUE INDEX ON game_participants (game_session_id, user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX ON game_participants (game_session_id);

CREATE TABLE participant_answers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id      UUID NOT NULL REFERENCES game_participants(id) ON DELETE CASCADE,
  question_id         UUID NOT NULL REFERENCES questions(id),
  selected_option_ids UUID[] NOT NULL,
  answered_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  response_time_ms    INT NOT NULL,
  is_correct          BOOLEAN NOT NULL,
  score_awarded       INT NOT NULL,
  used_power_up       TEXT,                       -- 'fifty_fifty' | 'double' | NULL
  UNIQUE (participant_id, question_id)
);

-- Library: пользователь сохраняет публичный квиз в закладки
CREATE TABLE saved_quizzes (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id    UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, quiz_id)
);
```

**Генерация room_code:**

```go
// алфавит без неоднозначных символов
const codeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // 32 символа

func generateRoomCode() string {
    b := make([]byte, 7)
    for i := range b {
        // 3-й символ — дефис
        if i == 3 { b[i] = '-'; continue }
        b[i] = codeAlphabet[rand.IntN(len(codeAlphabet))]
    }
    return string(b)
}
// при коллизии — retry до 5 раз, потом error
```

---

## 8. REST API

База: `/api/v1`. JSON, snake_case. Ошибки — RFC 7807.

### Auth

```
POST /auth/register           { email, password, display_name, role }
POST /auth/login              { email, password }
POST /auth/refresh
POST /auth/logout
```

### Профиль / Player area

```
GET   /me
PATCH /me                     { display_name, avatar_url }
GET   /me/history             -- для Reports
GET   /me/library             -- saved_quizzes
POST  /me/library/:quiz_id    -- добавить в Library
DELETE /me/library/:quiz_id
```

### Explore / Library

```
GET /explore?category=&q=&page=
GET /categories
```

### Quizzes (organizer)

```
GET    /me/quizzes            -- Dashboard и My Quizzes
POST   /quizzes
GET    /quizzes/:id
PATCH  /quizzes/:id
DELETE /quizzes/:id
POST   /quizzes/:id/publish
POST   /quizzes/:id/duplicate
```

### Questions

```
POST   /quizzes/:id/questions
PATCH  /questions/:id
DELETE /questions/:id
POST   /quizzes/:id/questions/reorder   { order: [question_id,...] }
```

### Images

```
POST /images                  multipart -> { url, width, height, size }
```

### Games / Sessions

```
POST /games                   { quiz_id } -> { game_id, room_code, match_number }
GET  /games/:id
POST /games/by-code/:code/join { nickname, avatar_url? } -> { game_id, participant_id, ws_ticket }
GET  /games/:id/results
```

### Analytics (organizer)

```
GET /analytics/overview       -- KPI для Dashboard (total_players, active_sessions, completion_rate)
GET /analytics/quizzes/:id    -- статистика по квизу
```

### WebSocket

```
GET /ws?ticket=<short-lived>
```

---

## 9. WebSocket-протокол

### Формат

```json
{ "type": "namespace.action", "payload": { ... } }
```

### Client → Server

```jsonc
{ "type": "auth",           "payload": { "ticket": "..." } }
{ "type": "room.join",      "payload": { "room_code": "7X9-2B4" } }
{ "type": "participant.ready" }
{ "type": "answer.submit",  "payload": { "question_id": "...", "option_ids": ["..."] } }
{ "type": "powerup.use",    "payload": { "type": "fifty_fifty" } }

// host-only
{ "type": "host.start_game" }
{ "type": "host.next_question" }
{ "type": "host.skip_question" }
{ "type": "host.end_game" }
```

### Server → Client

```jsonc
{ "type": "auth.ok",              "payload": { "user_id": "...", "is_guest": false } }

{ "type": "room.state",           "payload": {
    "room_code": "7X9-2B4",
    "status": "lobby",
    "quiz": { "title": "Cosmic Trivia Challenge", "total_questions": 12 },
    "host": { "display_name": "Game Master", "avatar_url": "..." },
    "participants": [
      { "id":"...", "nickname":"Alex M.", "avatar_url":"...", "status":"ready", "score": 0 }
    ],
    "current_question_index": null
}}

{ "type": "participant.joined",   "payload": { "participant": {...} } }
{ "type": "participant.left",     "payload": { "participant_id": "..." } }
{ "type": "participant.status",   "payload": { "participant_id": "...", "status": "ready" } }

{ "type": "question.start",       "payload": {
    "question_id": "...",
    "index": 4, "total": 10,
    "text": "Which stellar object possesses a gravitational pull so strong…",
    "image_url": null,
    "type": "single",
    "options": [
      { "id":"a", "label":"A", "text":"Neutron Star" },
      { "id":"b", "label":"B", "text":"White Dwarf" },
      { "id":"c", "label":"C", "text":"Black Hole" },
      { "id":"d", "label":"D", "text":"Quasar" }
    ],
    "time_limit_ms": 20000,
    "server_ts": 1713300000000
}}

{ "type": "question.tick",        "payload": { "remaining_ms": 12000 } }

{ "type": "question.end",         "payload": {
    "question_id": "...",
    "correct_option_ids": ["c"],
    "stats": { "answered": 42, "correct": 30, "distribution": {"a":5,"b":2,"c":30,"d":5} },
    "my_result": { "is_correct": true, "score_awarded": 870, "total_score": 1250 }
}}

{ "type": "leaderboard.update",   "payload": {
    "top": [
      { "participant_id":"...", "nickname":"Jordan K.", "avatar_url":"...", "score": 12850 }
    ],
    "my_rank": 12, "my_score": 4150
}}

{ "type": "game.finished",        "payload": {
    "match_number": 442,
    "podium": [
      { "rank":1, "nickname":"Jordan K.", "score":12850, "avatar_url":"..." },
      { "rank":2, "nickname":"Alex R.",   "score":9420  },
      { "rank":3, "nickname":"Sam T.",    "score":8900  }
    ],
    "runner_ups": [ /* ... */ ],
    "me": { "rank": 12, "score": 4150 }
}}

{ "type": "error",                "payload": { "code":"already_answered", "message":"..." } }
```

**Heartbeat:** сервер ping каждые 30s, pong timeout 60s.
**Reconnect:** экспоненциальный backoff с jitter. После connect → `auth` → `room.join` → сервер высылает `room.state` + текущий `question.start` если в игре.

---

## 10. Структура проекта

```
nebula-quiz/
├── backend/
│   ├── cmd/server/main.go
│   ├── internal/
│   │   ├── auth/
│   │   ├── user/
│   │   ├── quiz/
│   │   ├── game/
│   │   ├── realtime/
│   │   │   ├── hub.go
│   │   │   ├── room.go
│   │   │   ├── client.go
│   │   │   └── protocol.go
│   │   ├── analytics/
│   │   ├── storage/
│   │   │   ├── migrations/
│   │   │   ├── queries/
│   │   │   └── gen/
│   │   ├── imagestore/
│   │   ├── httpapi/
│   │   └── config/
│   ├── sqlc.yaml
│   └── go.mod
│
├── frontend/
│   ├── src/ (см. §6)
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── deploy/
│   ├── nginx/nginx.conf
│   └── docker-compose.yml
│
├── docs/
│   └── nebula-quiz-spec.md      # этот файл
│
├── Makefile
└── README.md
```

---

## 11. Real-time Hub на Go

```go
// internal/realtime/hub.go
type Hub struct {
    mu    sync.RWMutex
    rooms map[string]*Room       // room_code -> Room
    repo  GameRepository
    rdb   *redis.Client
}

func (h *Hub) CreateRoom(code string, g *Game) *Room {
    h.mu.Lock(); defer h.mu.Unlock()
    r := NewRoom(code, g, h)
    h.rooms[code] = r
    go r.run()
    return r
}

// internal/realtime/room.go
type Room struct {
    Code   string
    GameID uuid.UUID
    quiz   *Quiz

    register, unregister chan *Client
    inbound              chan inboundMsg
    done                 chan struct{}

    // state — читается/изменяется только из run()
    clients        map[uuid.UUID]*Client
    state          RoomState          // lobby / in_progress / finished
    currentIdx     int
    activeQuestion *ActiveQuestion
    answers        map[uuid.UUID]*Answer
    scores         map[uuid.UUID]int
}

func (r *Room) run() {
    defer r.cleanup()
    for {
        select {
        case c := <-r.register:     r.handleJoin(c)
        case c := <-r.unregister:   r.handleLeave(c)
        case m := <-r.inbound:      r.handleMessage(m.client, m.msg)
        case <-r.questionTimerC():  r.finishQuestion()
        case <-r.done:              return
        }
    }
}
```

**Client readPump/writePump** — как в каноничном gorilla-chat, с heartbeat ticker 30s.

---

## 12. Скоринг и правила

**Формула:**
```
base       = question.points                  // по умолчанию 1000
ratio      = response_time_ms / time_limit_ms // [0..1]
timeFactor = 1 - ratio * 0.5                  // [0.5..1.0]
score      = is_correct ? round(base * timeFactor) : 0
```

Мгновенный верный ответ → 1000 pts, последняя секунда → 500 pts, неправильный → 0.

**Multiple choice:**
- *Строгий режим*: `selected == correct_set` → правильно, иначе 0.
- *Мягкий*: частичный кредит. Учитываем, что в макете у первого вопроса 4 варианта — можно не усложнять на MVP, взять строгий.

**Определение победителя:** по `total_score DESC`, tie-break — сумма `response_time_ms ASC`.

---

## 13. Power-ups и бонусы

В макете в правом нижнем углу Player Question — кружок `0` + жёлтая молния ⚡. Это классические power-up'ы. Предлагаю:

| Type | Эффект | Когда активен |
|------|--------|----------------|
| `fifty_fifty` | Скрывает 2 неправильных варианта для single choice | До выбора ответа |
| `double_points` | Удваивает начисление за текущий вопрос | До выбора ответа |
| `time_freeze` | Останавливает таймер на 5 сек (только для себя) | Во время вопроса |

Каждый участник получает 1 power-up в начале игры. В MVP можно оставить только `fifty_fifty`.

**Протокол:**

```jsonc
{ "type": "powerup.use", "payload": { "type": "fifty_fifty" } }

// ответ
{ "type": "powerup.applied", "payload": {
    "type": "fifty_fifty",
    "hidden_option_ids": ["b", "d"]
}}
```

**Важно:** сервер валидирует `power_ups_left > 0` и тип, уменьшает счётчик. Клиент только отрисовывает эффект.

---

## 14. Безопасность

- Пароли: **argon2id** (`time=3, memory=64MiB, threads=4, keyLen=32`, salt 16B).
- Access JWT: 15 мин; refresh: 30 дней, хешируется (sha256) перед записью в БД.
- Refresh в **httpOnly + Secure + SameSite=Lax** cookie.
- WS-auth через короткоживущий **ticket** (Redis, TTL 60 сек), не access_token.
- Правильные ответы **никогда** не попадают в `question.start` — только в `question.end`.
- Rate limit: `/auth/login` — 5/мин/IP; `answer.submit` по природе защищён (проверка активного вопроса + UNIQUE на (participant, question)).
- CORS: explicit origin, `credentials: true` для refresh cookie.
- CSRF: origin-check middleware для state-changing endpoints (или double-submit cookie).
- Upload: max 5MB, MIME whitelist (`image/jpeg|png|webp`) + magic-bytes проверка.
- Все SQL через sqlc — нет места для инъекций.
- Host-actions (`host.*` сообщения) проверяются — сервер проверяет `Client.IsHost == true` и совпадение `user_id` с `game_sessions.host_id`.

---

## 15. Развёртывание (Docker Compose)

```yaml
# deploy/docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment: { POSTGRES_DB: nebula, POSTGRES_USER: nebula, POSTGRES_PASSWORD: nebula }
    volumes: [pgdata:/var/lib/postgresql/data]
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment: { MINIO_ROOT_USER: minio, MINIO_ROOT_PASSWORD: miniominio }
    volumes: [miniodata:/data]
    ports: ["9000:9000", "9001:9001"]

  backend:
    build: ../backend
    environment:
      DATABASE_URL: postgres://nebula:nebula@postgres:5432/nebula?sslmode=disable
      REDIS_URL: redis://redis:6379
      S3_ENDPOINT: http://minio:9000
      S3_BUCKET: nebula
      S3_ACCESS_KEY: minio
      S3_SECRET_KEY: miniominio
      JWT_SECRET: ${JWT_SECRET}
    depends_on: [postgres, redis, minio]
    ports: ["8080:8080"]

  frontend:
    build: ../frontend
    ports: ["5173:80"]

  nginx:
    image: nginx:alpine
    volumes: [./nginx/nginx.conf:/etc/nginx/nginx.conf:ro]
    ports: ["80:80"]
    depends_on: [backend, frontend]

volumes: { pgdata: {}, miniodata: {} }
```

**Nginx для WS:**

```nginx
location /ws {
  proxy_pass http://backend:8080;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_read_timeout 3600s;
}
```

---

## 16. Тестирование

### Backend

- **Unit:** `scoring`, `codegen` (room_code), `realtime.Room` (сценарии).
- **Integration:** testcontainers Postgres + httptest, прогон сквозного сценария через REST.
- **WebSocket e2e:** тестовый сервер + 3 WS-клиента, сценарий «host создал → 2 player joined → start → 3 вопроса → finished → проверяем топ».
- **Нагрузка:** `k6` — 50 WS-клиентов в одной комнате, p95 latency `answer.submit → question.end`.

### Frontend

- **Unit:** `useServerTimer`, `store.handle`, `roomCodeFormatter`.
- **Component:** `AnswerGrid` — рендер и обработка кликов, `Podium` — раскладка 2-1-3.
- **E2E (Playwright):** «создаю квиз → открываю в host режиме → player присоединяется → проходит вопрос → видит podium».

---

## 17. Roadmap (1-недельные спринты)

| # | Backend | Frontend |
|---|---------|----------|
| **1** | chi + sqlc + goose, `users`, `categories`, `/healthz` | Vite+TS, дизайн-токены, `shared/ui` (Button, Card, Pill), layout shells |
| **2** | auth (register/login/refresh/logout), JWT middleware, argon2 | Landing+Login, Register, auth-store, `<RequireAuth>` |
| **3** | CRUD quizzes+questions, image upload | Dashboard (KPI + quiz cards), My Quizzes, Quiz Builder (Question Editor + Overview) |
| **4** | WS endpoint, Hub/Room каркас, ticket auth, lobby-режим | WS-клиент, Host Lobby (room code, players grid, START GAME), Player Join |
| **5** | Gameplay (start→question→answer→end→score), таймер вопроса | Player Question (countdown, 2x2 AnswerGrid), Host Question (counts) |
| **6** | Finish game, подиум, сохранение истории, analytics overview | Match Complete (Podium + Runner Ups), Reports, Library, Profile |
| **7** | Power-ups, saved_quizzes, docker-compose, README | Power-up UI, Explore page, полировка анимаций (framer-motion), Playwright e2e |

---

## 18. Action Items

1. [ ] Экспортировать из Figma design tokens (цвета, шрифты, spacing) — удобно через `figma-tokens` или `Variables2CSS`.
2. [ ] Создать репо с папками `backend/` и `frontend/`.
3. [ ] Залить миграцию из §7 как `0001_init.sql`.
4. [ ] Настроить sqlc + goose.
5. [ ] Определить `protocol.ts` по §9 — единый источник истины для типов WS.
6. [ ] Во фронте: установить шрифты (Space Grotesk, Inter, JetBrains Mono), завести `tokens.css` из §3.
7. [ ] Собрать shadcn/ui + переопределить `Button` / `Card` / `Input` под палитру Nebula.
8. [ ] Начать Спринт 1.

---

## Приложение A: Готовые сниппеты shadcn под дизайн

### KPI Card

```tsx
// features/dashboard/components/KpiCard.tsx
export function KpiCard({
  label, value, icon: Icon, accent = 'primary', children
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  accent?: 'primary' | 'cyan' | 'amber';
  children?: React.ReactNode;
}) {
  const accentClasses = {
    primary: 'bg-primary-500/10 text-primary-400',
    cyan:    'bg-accent-cyan/10 text-accent-cyan',
    amber:   'bg-accent-amber/10 text-accent-amber',
  }[accent];

  return (
    <div className="rounded-2xl bg-bg-card border border-white/5 p-6">
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm text-text-muted">{label}</span>
        <span className={`rounded-full p-2 ${accentClasses}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="font-display text-4xl font-bold">{value}</div>
      {children && <div className="mt-2 text-sm text-text-muted">{children}</div>}
    </div>
  );
}
```

### Answer Option (Player)

```tsx
export function AnswerOption({
  label, text, selected, correct, wrong, disabled, onClick
}: {
  label: 'A'|'B'|'C'|'D';
  text: string;
  selected?: boolean;
  correct?: boolean;
  wrong?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-4 w-full rounded-full px-6 py-4 transition',
        'bg-bg-card border border-white/5 text-left',
        selected && 'border-primary-500 bg-primary-500/10',
        correct  && 'border-accent-success bg-accent-success/10',
        wrong    && 'border-accent-error bg-accent-error/10',
        !disabled && 'hover:bg-white/5'
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full
                       bg-white/5 text-text-muted font-semibold">
        {label}
      </span>
      <span className="text-lg font-display">{text}</span>
    </button>
  );
}
```

### Status Pill

```tsx
export function StatusPill({ status, children }: { status: 'live' | 'draft' | 'ended'; children: React.ReactNode }) {
  const map = {
    live:  'bg-accent-cyan/10 text-accent-cyan',
    draft: 'bg-white/5 text-text-muted',
    ended: 'bg-white/5 text-text-secondary',
  };
  return (
    <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase', map[status])}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {children}
    </span>
  );
}
```
