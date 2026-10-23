import { useEffect, useState } from "react";

type Market = {
  symbol: string;
  type: "CRYPTO" | "FOREX";
  price: number;
  change: number;
};

type Trade = {
  id: number;
  symbol: string;
  side: "BUY" | "SELL";
  price: number;
  pnl: number;
  time: string;
};

type Language = "bn" | "en";

const initialMarkets: Market[] = [
  { symbol: "BTC/USD", type: "CRYPTO", price: 67200, change: 0 },
  { symbol: "ETH/USD", type: "CRYPTO", price: 2450, change: 0 },
  { symbol: "SOL/USD", type: "CRYPTO", price: 155, change: 0 },
  { symbol: "BNB/USD", type: "CRYPTO", price: 590, change: 0 },
  { symbol: "XRP/USD", type: "CRYPTO", price: 0.55, change: 0 },
  { symbol: "ADA/USD", type: "CRYPTO", price: 0.42, change: 0 },
  { symbol: "DOGE/USD", type: "CRYPTO", price: 0.15, change: 0 },
  { symbol: "AVAX/USD", type: "CRYPTO", price: 35, change: 0 },
  { symbol: "EUR/USD", type: "FOREX", price: 1.084, change: 0 },
  { symbol: "GBP/USD", type: "FOREX", price: 1.291, change: 0 },
  { symbol: "USD/JPY", type: "FOREX", price: 149.5, change: 0 },
  { symbol: "AUD/USD", type: "FOREX", price: 0.658, change: 0 },
];

const fmt = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const translations = {
  bn: {
    subtitle: "একাধিক মার্কেটের ট্রেডিং সিমুলেটর",
    demoMode: "ডেমো মোড",
    warning:
      "শুধু সিমুলেশন — দামগুলো এলোমেলোভাবে তৈরি হয়। এখানে বাস্তব মার্কেট ডেটা, AI পূর্বাভাস বা আসল ট্রেড নেই।",
    balance: "ভার্চুয়াল ব্যালেন্স",
    pnl: "ডেমোর মোট লাভ/ক্ষতি",
    trades: "রেকর্ড করা ট্রেড",
    monitored: "পর্যবেক্ষণ করা মার্কেট",
    markets: "মার্কেট",
    bot: "ডেমো বট",
    history: "ট্রেডের ইতিহাস",
    scanner: "মার্কেট স্ক্যানার",
    sample: "সিমুলেট করা দামের নমুনা মার্কেট",
    all: "সব",
    crypto: "ক্রিপ্টো",
    forex: "ফরেক্স",
    buy: "কেনা",
    sell: "বিক্রি",
    wait: "অপেক্ষা",
    signalNote: "*এগুলো শুধু উদাহরণ; ট্রেডিং পরামর্শ নয়।",
    botTitle: "সিমুলেশন বট",
    botDescription:
      "এই ডেমোতে এলোমেলো দামের ওঠানামা ব্যবহার করে ভার্চুয়াল লেনদেন দেখানো হয়। এটি কোনো AI ট্রেডিং কৌশল নয়।",
    running: "সিমুলেশন চলছে",
    paused: "সিমুলেশন বন্ধ আছে",
    pause: "বট থামাও",
    start: "ডেমো বট চালু করো",
    reset: "আবার শুরু",
    resultNote: "ডেমোর ফলাফল বাস্তব ট্রেডিংয়ের ফল অনুমান করে না।",
    noTrades: "এখনো কোনো ডেমো ট্রেড নেই। প্রথমে ডেমো বট চালু করো।",
    time: "সময়",
    market: "মার্কেট",
    side: "ধরন",
    footer: "AI Trading Lab · শিক্ষামূলক ডেমো · বাস্তব ট্রেড নয়",
    cryptoType: "ক্রিপ্টো",
    forexType: "ফরেক্স",
  },
  en: {
    subtitle: "Multi-market trading simulator",
    demoMode: "DEMO MODE",
    warning:
      "SIMULATION ONLY — Prices are randomly generated. No real market data, AI predictions, or live trades.",
    balance: "Virtual balance",
    pnl: "Demo profit/loss",
    trades: "Recorded trades",
    monitored: "Markets monitored",
    markets: "Markets",
    bot: "Demo bot",
    history: "Trade history",
    scanner: "Market Scanner",
    sample: "Sample markets with simulated prices",
    all: "All",
    crypto: "Crypto",
    forex: "Forex",
    buy: "BUY",
    sell: "SELL",
    wait: "WAIT",
    signalNote: "*Illustrative signals only, not trading advice.",
    botTitle: "Simulation Bot",
    botDescription:
      "This demo shows virtual transactions using random price movements. It is not an AI trading strategy.",
    running: "SIMULATION RUNNING",
    paused: "SIMULATION PAUSED",
    pause: "Pause bot",
    start: "Start demo bot",
    reset: "Reset",
    resultNote: "Demo results do not predict real-world performance.",
    noTrades: "No demo trades yet. Start the demo bot first.",
    time: "Time",
    market: "Market",
    side: "Side",
    footer: "AI Trading Lab · Educational demo · No real trading",
    cryptoType: "CRYPTO",
    forexType: "FOREX",
  },
};

export default function App() {
  const [markets, setMarkets] = useState(initialMarkets);
  const [balance, setBalance] = useState(10000);
  const [realized, setRealized] = useState(0);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tab, setTab] = useState("markets");
  const [language, setLanguage] = useState<Language>("bn");

  const t = translations[language];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMarkets((old) =>
        old.map((m) => {
          const move = (Math.random() - 0.5) * 0.003;

          return {
            ...m,
            price: Math.max(0.00001, m.price * (1 + move)),
            change: move * 100,
          };
        })
      );
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      setMarkets((current) => {
        const candidate = current.filter(
          (m) => Math.abs(m.change) >= 0.08
        );

        if (!candidate.length) return current;

        const m =
          candidate[Math.floor(Math.random() * candidate.length)];

        const side = m.change > 0 ? "BUY" : "SELL";
        const pnl = (Math.random() - 0.5) * 4 - 0.05;

        setBalance((b) => b + pnl);
        setRealized((p) => p + pnl);

        setTrades((old) =>
          [
            {
              id: Date.now(),
              symbol: m.symbol,
              side,
              price: m.price,
              pnl,
              time: new Date().toLocaleTimeString(),
            },
            ...old,
          ].slice(0, 100)
        );

        return current;
      });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [running]);

  const shown = markets.filter(
    (m) => filter === "ALL" || m.type === filter
  );

  function reset() {
    setRunning(false);
    setMarkets(initialMarkets);
    setBalance(10000);
    setRealized(0);
    setTrades([]);
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <div className="brand">◈ AI TRADING LAB</div>
          <div className="muted">{t.subtitle}</div>
        </div>

        <div className="actions">
          <button
            className="secondary"
            onClick={() =>
              setLanguage((current) =>
                current === "bn" ? "en" : "bn"
              )
            }
          >
            {language === "bn" ? "English" : "বাংলা"}
          </button>

          <span className="demo">{t.demoMode}</span>
        </div>
      </header>

      <div className="warning">{t.warning}</div>

      <section className="stats">
        <article className="stat">
          <span className="muted">{t.balance}</span>
          <strong>${fmt(balance)}</strong>
        </article>

        <article className="stat">
          <span className="muted">{t.pnl}</span>
          <strong className={realized >= 0 ? "green" : "red"}>
            {realized >= 0 ? "+" : "-"}$
            {fmt(Math.abs(realized))}
          </strong>
        </article>

        <article className="stat">
          <span className="muted">{t.trades}</span>
          <strong>{trades.length}</strong>
        </article>

        <article className="stat">
          <span className="muted">{t.monitored}</span>
          <strong>{markets.length}</strong>
        </article>
      </section>

      <nav className="tabs">
        <button
          className={tab === "markets" ? "active" : ""}
          onClick={() => setTab("markets")}
        >
          {t.markets}
        </button>

        <button
          className={tab === "bot" ? "active" : ""}
          onClick={() => setTab("bot")}
        >
          {t.bot}
        </button>

        <button
          className={tab === "history" ? "active" : ""}
          onClick={() => setTab("history")}
        >
          {t.history}
        </button>
      </nav>

      {tab === "markets" && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>{t.scanner}</h2>
              <p className="muted">{t.sample}</p>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label={t.scanner}
            >
              <option value="ALL">{t.all}</option>
              <option value="CRYPTO">{t.crypto}</option>
              <option value="FOREX">{t.forex}</option>
            </select>
          </div>

          <div className="market-list">
            {shown.map((m) => (
              <article className="market" key={m.symbol}>
                <div>
                  <strong>{m.symbol}</strong>
                  <div className="muted small">
                    {language === "bn"
                      ? m.type === "CRYPTO"
                        ? t.cryptoType
                        : t.forexType
                      : m.type}
                  </div>
                </div>

                <div className="right">
                  <strong>
                    {m.price < 10
                      ? m.price.toFixed(4)
                      : m.price.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                  </strong>

                  <div className={m.change >= 0 ? "green" : "red"}>
                    {m.change >= 0 ? "+" : ""}
                    {m.change.toFixed(3)}%
                  </div>
                </div>

                <span className="signal">
                  {Math.abs(m.change) >= 0.08
                    ? m.change > 0
                      ? `${t.buy}*`
                      : `${t.sell}*`
                    : t.wait}
                </span>
              </article>
            ))}
          </div>

          <p className="muted small">{t.signalNote}</p>
        </section>
      )}

      {tab === "bot" && (
        <section className="panel">
          <h2>{t.botTitle}</h2>
          <p className="muted">{t.botDescription}</p>

          <div className={running ? "bot-on" : "bot-off"}>
            ● {running ? t.running : t.paused}
          </div>

          <div className="actions">
            <button
              className="primary"
              onClick={() => setRunning((v) => !v)}
            >
              {running ? t.pause : t.start}
            </button>

            <button className="secondary" onClick={reset}>
              {t.reset}
            </button>
          </div>

          <p className="muted small">{t.resultNote}</p>
        </section>
      )}

      {tab === "history" && (
        <section className="panel">
          <h2>{t.history}</h2>

          {trades.length === 0 ? (
            <p className="muted">{t.noTrades}</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t.time}</th>
                    <th>{t.market}</th>
                    <th>{t.side}</th>
                    <th>{t.pnl}</th>
                  </tr>
                </thead>

                <tbody>
                  {trades.map((trade) => (
                    <tr key={trade.id}>
                      <td>{trade.time}</td>
                      <td>{trade.symbol}</td>
                      <td>
                        {trade.side === "BUY" ? t.buy : t.sell}
                      </td>
                      <td className={trade.pnl >= 0 ? "green" : "red"}>
                        {trade.pnl >= 0 ? "+" : "-"}$
                        {fmt(Math.abs(trade.pnl))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <footer>{t.footer}</footer>
    </main>
  );
}
