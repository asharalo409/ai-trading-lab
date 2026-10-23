
import { useCallback, useEffect, useState } from "react";

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
type DataStatus = "loading" | "success" | "error";

const CRYPTO_IDS: Record<string, string> = {
  BTC: "btc-bitcoin",
  ETH: "eth-ethereum",
  SOL: "sol-solana",
  BNB: "bnb-binance-coin",
  XRP: "xrp-xrp",
  ADA: "ada-cardano",
  DOGE: "doge-dogecoin",
  AVAX: "avax-avalanche",
};

const INITIAL_MARKETS: Market[] = [
  ...Object.keys(CRYPTO_IDS).map((symbol) => ({
    symbol: `${symbol}/USD`,
    type: "CRYPTO" as const,
    price: 0,
    change: 0,
  })),
  { symbol: "EUR/USD", type: "FOREX", price: 0, change: 0 },
  { symbol: "GBP/USD", type: "FOREX", price: 0, change: 0 },
  { symbol: "USD/JPY", type: "FOREX", price: 0, change: 0 },
  { symbol: "AUD/USD", type: "FOREX", price: 0, change: 0 },
];

const TRANSLATIONS = {
  bn: {
    subtitle: "ক্রিপ্টো ও ফরেক্স মার্কেট পর্যবেক্ষণ",
    demoMode: "ডেমো মোড",
    warning:
      "শিক্ষামূলক ডেমো। ক্রিপ্টো ও ফরেক্স ডেটার উৎস এবং আপডেটের সময় দেখুন। এখানে আসল ট্রেড হয় না।",
    balance: "ভার্চুয়াল ব্যালেন্স",
    pnl: "ডেমোর লাভ/ক্ষতি",
    trades: "ডেমো ট্রেড",
    monitored: "মার্কেট",
    markets: "মার্কেট",
    bot: "ডেমো বট",
    history: "ট্রেডের ইতিহাস",
    scanner: "মার্কেট স্ক্যানার",
    sample: "বাইরের ডেটা সোর্স থেকে পাওয়া দাম",
    all: "সব",
    crypto: "ক্রিপ্টো",
    forex: "ফরেক্স",
    buy: "কেনা",
    sell: "বিক্রি",
    wait: "অপেক্ষা",
    signalNote:
      "২৪ ঘণ্টার পরিবর্তন শুধু তথ্য; এটি ট্রেডিং পরামর্শ বা নিশ্চিত সংকেত নয়।",
    botTitle: "ভার্চুয়াল সিমুলেশন বট",
    botDescription:
      "শুধু অনুশীলনের জন্য ভার্চুয়াল ট্রেডের রেকর্ড তৈরি হয়। লাভ-ক্ষতি বাস্তব বাজারের ফল নয় এবং এটি AI পূর্বাভাস নয়।",
    running: "ডেমো চলছে",
    paused: "ডেমো বন্ধ",
    pause: "বট থামাও",
    start: "ডেমো বট চালু করো",
    reset: "আবার শুরু",
    resultNote: "এখানে বাস্তব অর্থ ব্যবহার হয় না।",
    noTrades: "এখনো কোনো ডেমো ট্রেড নেই।",
    time: "সময়",
    market: "মার্কেট",
    side: "ধরন",
    footer: "AI Trading Lab · শিক্ষামূলক ডেমো · বাস্তব ট্রেড নয়",
    loading: "মার্কেট ডেটা আনা হচ্ছে...",
    success: "ডেটা আপডেট হয়েছে",
    error: "মার্কেট ডেটা আনা যায়নি। ইন্টারনেট বা ডেটা সোর্স পরীক্ষা করো।",
    refresh: "ডেটা আপডেট",
    lastUpdate: "সর্বশেষ আপডেট",
    cryptoSource: "ক্রিপ্টো: CoinPaprika",
    forexSource: "ফরেক্স: Frankfurter রেফারেন্স রেট",
    noPrice: "দাম পাওয়া যায়নি",
    retry: "আবার চেষ্টা করো",
  },
  en: {
    subtitle: "Crypto and forex market monitor",
    demoMode: "DEMO MODE",
    warning:
      "Educational demo. Check market data sources and update times. No real trades are placed.",
    balance: "Virtual balance",
    pnl: "Demo profit/loss",
    trades: "Demo trades",
    monitored: "Markets",
    markets: "Markets",
    bot: "Demo bot",
    history: "Trade history",
    scanner: "Market Scanner",
    sample: "Prices retrieved from external data sources",
    all: "All",
    crypto: "Crypto",
    forex: "Forex",
    buy: "BUY",
    sell: "SELL",
    wait: "WAIT",
    signalNote:
      "24-hour change is informational only, not trading advice or a confirmed signal.",
    botTitle: "Virtual Simulation Bot",
    botDescription:
      "Creates virtual trade records for practice only. Demo profit/loss is not a real market result or an AI prediction.",
    running: "DEMO RUNNING",
    paused: "DEMO PAUSED",
    pause: "Pause bot",
    start: "Start demo bot",
    reset: "Reset",
    resultNote: "No real money is used.",
    noTrades: "No demo trades yet.",
    time: "Time",
    market: "Market",
    side: "Side",
    footer: "AI Trading Lab · Educational demo · No real trading",
    loading: "Loading market data...",
    success: "Market data updated",
    error: "Could not load market data. Check your connection or data source.",
    refresh: "Refresh data",
    lastUpdate: "Last update",
    cryptoSource: "Crypto: CoinPaprika",
    forexSource: "Forex: Frankfurter reference rates",
    noPrice: "No price available",
    retry: "Try again",
  },
};

function formatPrice(price: number) {
  if (!Number.isFinite(price) || price <= 0) return "—";

  return price.toLocaleString("en-US", {
    minimumFractionDigits: price < 1 ? 4 : 2,
    maximumFractionDigits: price < 1 ? 6 : 4,
  });
}

function formatMoney(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatChange(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export default function App() {
  const [markets, setMarkets] = useState<Market[]>(INITIAL_MARKETS);
  const [balance, setBalance] = useState(10000);
  const [realized, setRealized] = useState(0);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tab, setTab] = useState("markets");
  const [language, setLanguage] = useState<Language>("bn");
  const [status, setStatus] = useState<DataStatus>("loading");
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const t = TRANSLATIONS[language];

  const loadMarkets = useCallback(async () => {
    setRefreshing(true);
    setStatus("loading");

    try {
      const [cryptoResponse, forexResponse] = await Promise.all([
        fetch("https://api.coinpaprika.com/v1/tickers", {
          cache: "no-store",
        }),
        fetch(
          "https://api.frankfurter.dev/v2/rates?base=USD&quotes=EUR,GBP,JPY,AUD",
          { cache: "no-store" }
        ),
      ]);

      if (!cryptoResponse.ok || !forexResponse.ok) {
        throw new Error("Market data request failed");
      }

      const cryptoData: Array<{
        id: string;
        quotes?: {
          USD?: {
            price?: number;
            percent_change_24h?: number;
          };
        };
      }> = await cryptoResponse.json();

      const forexData: Array<{
        base: string;
        quote: string;
        rate: number;
      }> = await forexResponse.json();

      const cryptoById = new Map(
        cryptoData.map((coin) => [coin.id, coin])
      );

      const forexByQuote = new Map(
        forexData.map((item) => [item.quote, item.rate])
      );

      const getForexRate = (quote: string) => {
        const rate = forexByQuote.get(quote);
        return typeof rate === "number" && rate > 0 ? rate : 0;
      };

      const eur = getForexRate("EUR");
      const gbp = getForexRate("GBP");
      const jpy = getForexRate("JPY");
      const aud = getForexRate("AUD");

      const nextMarkets: Market[] = [
        ...Object.entries(CRYPTO_IDS).map(([symbol, id]) => {
          const coin = cryptoById.get(id);
          const price = coin?.quotes?.USD?.price;
          const change = coin?.quotes?.USD?.percent_change_24h;

          return {
            symbol: `${symbol}/USD`,
            type: "CRYPTO" as const,
            price:
              typeof price === "number" && Number.isFinite(price)
                ? price
                : 0,
            change:
              typeof change === "number" && Number.isFinite(change)
                ? change
                : 0,
          };
        }),
        {
          symbol: "EUR/USD",
          type: "FOREX",
          price: eur > 0 ? 1 / eur : 0,
          change: 0,
        },
        {
          symbol: "GBP/USD",
          type: "FOREX",
          price: gbp > 0 ? 1 / gbp : 0,
          change: 0,
        },
        {
          symbol: "USD/JPY",
          type: "FOREX",
          price: jpy,
          change: 0,
        },
        {
          symbol: "AUD/USD",
          type: "FOREX",
          price: aud > 0 ? 1 / aud : 0,
          change: 0,
        },
      ];

      const hasAnyPrice = nextMarkets.some((m) => m.price > 0);

      if (!hasAnyPrice) {
        throw new Error("No market prices returned");
      }

      setMarkets(nextMarkets);
      setLastUpdate(new Date().toLocaleString());
      setStatus("success");
    } catch (error) {
      console.error("Market data error:", error);
      setStatus("error");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadMarkets();

    const timer = window.setInterval(() => {
      void loadMarkets();
    }, 60000);

    return () => window.clearInterval(timer);
  }, [loadMarkets]);

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      setMarkets((current) => {
        const candidates = current.filter(
          (m) => m.price > 0 && m.type === "CRYPTO"
        );

        if (candidates.length === 0) return current;

        const market =
          candidates[Math.floor(Math.random() * candidates.length)];

        const side = Math.random() >= 0.5 ? "BUY" : "SELL";

        // Virtual practice result only; not a real market P/L.
        const pnl = Number(((Math.random() - 0.5) * 4).toFixed(2));

        setBalance((value) => value + pnl);
        setRealized((value) => value + pnl);

        setTrades((old) =>
          [
            {
              id: Date.now(),
              symbol: market.symbol,
              side,
              price: market.price,
              pnl,
              time: new Date().toLocaleTimeString(),
            },
            ...old,
          ].slice(0, 100)
        );

        return current;
      });
    }, 10000);

    return () => window.clearInterval(timer);
  }, [running]);

  const shown = markets.filter(
    (market) => filter === "ALL" || market.type === filter
  );

  function reset() {
    setRunning(false);
    setBalance(10000);
    setRealized(0);
    setTrades([]);
    void loadMarkets();
  }

  const statusText =
    status === "loading"
      ? t.loading
      : status === "success"
        ? t.success
        : t.error;

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
              setLanguage((current) => (current === "bn" ? "en" : "bn"))
            }
          >
            {language === "bn" ? "English" : "বাংলা"}
          </button>
          <span className="demo">{t.demoMode}</span>
        </div>
      </header>

      <div className="warning">{t.warning}</div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <strong>{statusText}</strong>
            {lastUpdate && (
              <p className="muted small">
                {t.lastUpdate}: {lastUpdate}
              </p>
            )}
          </div>

          <button
            className="secondary"
            onClick={() => void loadMarkets()}
            disabled={refreshing}
          >
            {refreshing ? t.loading : t.refresh}
          </button>
        </div>

        <p className="muted small">{t.cryptoSource}</p>
        <p className="muted small">{t.forexSource}</p>

        {status === "error" && (
          <button
            className="secondary"
            onClick={() => void loadMarkets()}
            disabled={refreshing}
          >
            {t.retry}
          </button>
        )}
      </section>

      <section className="stats">
        <article className="stat">
          <span className="muted">{t.balance}</span>
          <strong>${formatMoney(balance)}</strong>
        </article>

        <article className="stat">
          <span className="muted">{t.pnl}</span>
          <strong className={realized >= 0 ? "green" : "red"}>
            {realized >= 0 ? "+" : "-"}$
            {formatMoney(Math.abs(realized))}
          </strong>
        </article>

        <article className="stat">
          <span className="muted">{t.trades}</span>
          <strong>{trades.length}</strong>
        </article>

        <article className="stat">
          <span className="muted">{t.monitored}</span>
          <strong>{markets.filter((m) => m.price > 0).length}</strong>
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
              onChange={(event) => setFilter(event.target.value)}
              aria-label={t.scanner}
            >
              <option value="ALL">{t.all}</option>
              <option value="CRYPTO">{t.crypto}</option>
              <option value="FOREX">{t.forex}</option>
            </select>
          </div>

          <div className="market-list">
            {shown.map((market) => (
              <article className="market" key={market.symbol}>
                <div>
                  <strong>{market.symbol}</strong>
                  <div className="muted small">
                    {market.type === "CRYPTO" ? t.crypto : t.forex}
                  </div>
                </div>

                <div className="right">
                  <strong>
                    {market.price > 0
                      ? formatPrice(market.price)
                      : t.noPrice}
                  </strong>

                  <div
                    className={
                      market.type === "FOREX"
                        ? "muted"
                        : market.change >= 0
                          ? "green"
                          : "red"
                    }
                  >
                    {market.type === "FOREX"
                      ? "—"
                      : formatChange(market.change)}
                  </div>
                </div>

                <span className="signal">
                  {market.price <= 0
                    ? "—"
                    : market.type === "FOREX"
                      ? t.wait
                      : Math.abs(market.change) >= 5
                        ? t.wait
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
            {running ? t.running : t.paused}
          </div>

          <div className="actions">
            <button
              className="primary"
              onClick={() => setRunning((value) => !value)}
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
                      <td>
                        {trade.symbol}
                        <div className="muted small">
                          ${formatPrice(trade.price)}
                        </div>
                      </td>
                      <td>{trade.side === "BUY" ? t.buy : t.sell}</td>
                      <td className={trade.pnl >= 0 ? "green" : "red"}>
                        {trade.pnl >= 0 ? "+" : "-"}$
                        {formatMoney(Math.abs(trade.pnl))}
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
