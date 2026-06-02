const defaultMallId = process.env.CAFE24_MALL_ID ?? "sevenpet7";

export default function Home() {
  return (
    <main className="shell">
      <section className="topBar" aria-label="Seegro dashboard">
        <div>
          <p className="eyebrow">Seegro</p>
          <h1>Cafe24 매출 연결</h1>
        </div>
        <span className="statusPill">연결 준비</span>
      </section>

      <section className="workspace">
        <div className="panel primaryPanel">
          <div className="panelHeader">
            <div>
              <h2>Cafe24 인증</h2>
              <p>쇼핑몰 ID를 넣고 연결을 시작하세요.</p>
            </div>
          </div>

          <form className="connectForm" action="/api/cafe24/authorize" method="GET">
            <label htmlFor="mall_id">쇼핑몰 ID</label>
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
              <dt>권한</dt>
              <dd>주문, 상품, 매출통계, 상점 조회</dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}
