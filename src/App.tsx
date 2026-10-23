
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

export default function App() {
  const [markets, setMarkets] = useState(initialMarkets);
  const [balance, setBalance] = useState(10000);
  const [realized, setRealized] = useState(0);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tab, setTab] = useState("markets");

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
        const result = (Math.random() - 0.5) * 4 - 0.05;
        const pnl = result;

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
          <div className="muted">
            Multi-market trading simulator
          </div>
        </div>
        <span className="demo">DEMO MODE</span>
      </header>

      <div className="warning">
        SIMULATION ONLY — Prices are randomly generated.
        No real market data, AI predictions, or live trades.
      </div>

      <section className="stats">
        <article className="stat">
          <span className="muted">Virtual balance</span>
          <strong>${fmt(balance)}</strong>
        </article>
        <article className="stat">
          <span className="muted">Realized demo P/L</span>
          <strong className={realized >= 0 ? "green" : "red"}>
            {realized >= 0 ? "+" : "-"}$
            {fmt(Math.abs(realized))}
          </strong>
        </article>
        <article className="stat">
          <span className="muted">Recorded trades</span>
          <strong>{trades.length}</strong>
        </article>
        <article className="stat">
          <span className="muted">Markets monitored</span>
          <strong>{markets.length}</strong>
        </article>
      </section>

      <nav className="tabs">
        <button
          className={tab === "markets" ? "active" : ""}
          onClick={() => setTab("markets")}
        >
          Markets
        </button>
        <button
          className={tab === "bot" ? "active" : ""}
          onClick={() => setTab("bot")}
        >
          Demo bot
        </button>
        <button
          className={tab === "history" ? "active" : ""}
          onClick={() => setTab("history")}
        >
          History
        </button>
      </nav>

      {tab === "markets" && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Market Scanner</h2>
              <p className="muted">
                Sample markets with simulated prices
              </p>
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="CRYPTO">Crypto</option>
              <option value="FOREX">Forex</option>
            </select>
          </div>

          <div className="market-list">
            {shown.map((m) => (
              <article className="market" key={m.symbol}>
                <div>
                  <strong>{m.symbol}</strong>
                  <div className="muted small">{m.type}</div>
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
                      ? "BUY*"
                      : "SELL*"
                    : "WAIT"}
                </span>
              </article>
            ))}
          </div>
          <p className="muted small">
            *Illustrative signals only, not trading advice.
          </p>
        </section>
      )}

      {tab === "bot" && (
        <section className="panel">
          <h2>Simulation Bot</h2>
          <p className="muted">
            The demo records virtual transactions using random
            price movements. It is not an AI trading strategy.
          </p>
          <div className={running ? "bot-on" : "bot-off"}>
            {running ? "● SIMULATION RUNNING" : "● SIMULATION PAUSED"}
          </div>
          <div className="actions">
            <button
              className="primary"
              onClick={() => setRunning((v) => !v)}
            >
              {running ? "Pause bot" : "Start demo bot"}
            </button>
            <button className="secondary" onClick={reset}>
              Reset
            </button>
          </div>
          <p className="muted small">
            The result does not predict real-world performance.
          </p>
        </section>
      )}

      {tab === "history" && (
        <section className="panel">
          <h2>Trade History</h2>
          {trades.length === 0 ? (
            <p className="muted">
              No demo trades yet. Start the demo bot first.
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Market</th>
                    <th>Side</th>
                    <th>P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => (
                    <tr key={t.id}>
                      <td>{t.time}</td>
                      <td>{t.symbol}</td>
                      <td>{t.side}</td>
                      <td className={t.pnl >= 0 ? "green" : "red"}>
                        {t.pnl >= 0 ? "+" : "-"}$
                        {fmt(Math.abs(t.pnl))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <footer>
        AI Trading Lab · Educational demo · No real trading
      </footer>
    </main>
  );
}
