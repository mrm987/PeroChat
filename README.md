# PeroChat

Y2K 레트로 퓨처리즘 스타일의 챗봇 UI 프로토타입

## 개요

'니디 걸 오버도즈' 풍의 서브컬쳐 감성을 담은 소설형 챗봇 인터페이스입니다.

### 주요 기능

- **블록 기반 스크롤 스냅**: 대사+지문 단위로 텍스트가 분할되어 중앙 포커스
- **캐릭터 이미지 동기화**: 현재 블록의 캐릭터에 맞춰 좌측 이미지 자동 전환
- **이벤트 모드**: 특정 상황에서 배경이 전체 화면으로 확장, 텍스트 오버레이
- **Y2K 레트로 UI**: 네온 컬러, 스캔라인, 글리치 효과

## 실행 방법

```bash
# 프로젝트 디렉토리로 이동
cd PeroChat

# 정적 서버 실행 (npx 사용)
npm start

# 또는 직접 serve 사용
npx serve src -p 3000
```

브라우저에서 `http://localhost:3000` 접속

## 테스트 시나리오

입력창에 다음 키워드를 입력해보세요:

| 입력 | 결과 |
|------|------|
| `안녕` | 기본 인사 응답 |
| `뭐해` | 일상 대화 |
| `좋아` / `사랑` | 이벤트 모드 트리거 |
| `싫어` | 슬픈 분위기 |
| `수아` / `같이` | 두 캐릭터 등장 |
| `이벤트` / `CG` | 이벤트 모드 테스트 |

### 키보드 단축키

- `Enter`: 메시지 전송
- `Tab`: 타이핑 애니메이션 스킵
- `Esc`: 이벤트 모드 종료

## 프로젝트 구조

```
PeroChat/
├── docs/
│   └── UI_DESIGN_SPEC.md    # UI 기획 문서
├── src/
│   ├── index.html           # 메인 HTML
│   ├── css/
│   │   └── styles.css       # 스타일시트
│   ├── js/
│   │   └── app.js           # 메인 JavaScript
│   └── assets/
│       └── images/          # 캐릭터/CG 이미지
├── package.json
└── README.md
```

## 기술 스택

- HTML5
- CSS3 (CSS Variables, Flexbox, Scroll Snap, Glassmorphism)
- Vanilla JavaScript (ES6+)
- Google Fonts (Press Start 2P, Noto Serif KR, Noto Sans KR)

## 대사 형식

LLM 응답에서 사용하는 대사 형식:

```
**캐릭터명** | "대사 내용"
```

예시:
```
창밖으로 비가 내렸다.

**나은** | "...왜 왔어?"

그녀는 고개를 돌렸다.
```

## 이벤트 마커

LLM 응답에 삽입 가능한 마커:

- `[EVENT:dramatic]` - 이벤트 모드 트리거
- `[MOOD:happy]` - 캐릭터 표정 변경 (확장 예정)

## 라이선스

MIT
