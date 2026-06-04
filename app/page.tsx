const defaultMallId = process.env.CAFE24_MALL_ID ?? "sevenpet7";

export default function Home() {
  return (
    <main className="shell">
      <section className="topBar" aria-label="Seegro dashboard">
        <div>
          <p className="eyebrow">Seegro</p>
          <h1>매출 대시보드 연결</h1>
        </div>
        <span className="statusPill">Cafe24 · 네이버</span>
      </section>

      <section className="workspace">
        <div className="panel primaryPanel">
          <div className="panelHeader">
            <div>
              <h2>Cafe24 인증</h2>
              <p>몰 ID를 넣고 Cafe24 연결을 시작하세요.</p>
            </div>
          </div>

          <form className="connectForm" action="/api/cafe24/authorize" method="GET">
            <label htmlFor="mall_id">몰 ID</label>
            <div className="inputRow">
              <input
                id="mall_id"
                name="mall_id"
                defaultValue={defaultMallId}
                placeholder="예: samplemall"
                required
              />
              <button type="submit">Cafe24 연결</button>
            </div>
          </form>
          <p style={{ marginTop: 18 }}>
            <a className="linkButton" href="/dashboard">
              Cafe24 대시보드 열기
            </a>
          </p>
        </div>

        <div className="panel primaryPanel">
          <div className="panelHeader">
            <div>
              <h2>네이버 커머스API</h2>
              <p>Vercel 환경변수에 네이버 앱 정보를 넣으면 주문을 조회합니다.</p>
            </div>
          </div>
          <p>
            <a className="linkButton" href="/naver-dashboard">
              네이버 대시보드 열기
            </a>
          </p>
        </div>

        <div className="panel">
          <h2>현재 설정값</h2>
          <dl className="settingsList">
            <div>
              <dt>App URL</dt>
              <dd>https://seegro.vercel.app</dd>
            </div>
            <div>
              <dt>Redirect URI</dt>
              <dd>https://seegro.vercel.app/api/cafe24/callback</dd>
            </div>
            <div>
              <dt>Cafe24 권한</dt>
              <dd>주문, 상품, 매출통계, 상점 조회</dd>
            </div>
            <div>
              <dt>Naver 인증</dt>
              <dd>SELF 토큰은 account_id 없이 발급</dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}
