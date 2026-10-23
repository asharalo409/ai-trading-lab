
import { useCallback, useEffect, useState } from "react";

type Language = "bn" | "en";

type Quote = {
  bid: number;
  ask: number;
  fetchedAt: number;
};

type Asset = {
  symbol: string;
  binancePair: string;
  krakenPair: string;
};

type AssetQuotes = {
  symbol: string;
  binance?: Quote;
  kraken?: Quote;
};

const ASSETS: Asset[] = [
  { symbol: "BTC", binancePair: "BTCUSDT", krakenPair: "XBTUSD" },
  { symbol: "ETH", binancePair: "ETHUSDT", krakenPair: "ETHUSD" },
  { symbol: "SOL", binancePair: "SOLUSDT", krakenPair: "SOLUSD" },
  { symbol: "XRP", binancePair: "XRPUSDT", krakenPair: "XRPUSD" },
];

const TEXT = {
  bn: {
    title: "Arbitrage Detector",
    subtitle: "একাধিক উৎসের ক্রয়-বিক্রয় দর তুলনা",
    refresh: "দাম আপডেট",
    loading: "আপডেট হচ্ছে...",
    unavailable: "তথ্য পাওয়া যায়নি",
    fetched: "অ্যাপে পাওয়া সময়",
    fresh: "সাম্প্রতিক",
    stale: "ডেটা পুরোনো",
    buy: "কাল্পনিক কেনার উৎস",
    sell: "কাল্পনিক বিক্রির উৎস",
    gross: "মোট দামের ব্যবধান",
    costs: "আনুমানিক মোট খরচ",
    net: "খরচ বাদে ব্যবধান",
    positive: "পরীক্ষায় ইতিবাচক ব্যবধান",
    negative: "খরচ বাদে ইতিবাচক ব্যবধান নেই",
    fee: "প্রতি পাশে ফি (%)",
    slippage: "প্রতি পাশে স্লিপেজ (%)",
    warning:
      "শুধু শিক্ষামূলক ডেমো। এখানে কোনো অর্ডার দেওয়া হয় না। Binance-এর USDT দর Kraken-এর USD দর-এর সঙ্গে তুলনা করা হচ্ছে; USDT সবসময় ঠিক 1 USD নয়। অ্যাপে পাওয়া সময় এক্সচেঞ্জের নিজস্ব quote timestamp নয়।",
    note:
      "এই হিসাব নিশ্চিত লাভ নয়। অর্ডার-বুকের গভীরতা, লিকুইডিটি, উত্তোলন ও নেটওয়ার্ক ফি, দামের পরিবর্তন, স্লিপেজ এবং API-র বিলম্বে বাস্তব ফল আলাদা হতে পারে।",
    sources: "উৎস: Binance public book ticker ও Kraken public ticker",
  },
  en: {
    title: "Arbitrage Detector",
    subtitle: "Compare bid/ask prices across public data sources",
    refresh: "Refresh quotes",
    loading: "Refreshing...",
    unavailable: "Quote unavailable",
    fetched: "Fetched by app",
    fresh: "Recent",
    stale: "Stale",
    buy: "Hypothetical buy venue",
    sell: "Hypothetical sell venue",
    gross: "Gross spread",
    costs: "Estimated total costs",
    net: "Spread after costs",
    positive: "Positive spread in this snapshot",
    negative: "No positive spread after estimated costs",
    fee: "Fee per side (%)",
    slippage: "Slippage per side (%)",
    warning:
      "Educational demo only; no orders are placed. Binance USDT quotes are compared with Kraken USD quotes; USDT may not equal exactly 1 USD. App fetch time is not the exchange's own quote timestamp.",
    note:
      "This is not guaranteed profit. Order-book depth, liquidity, withdrawal/network fees, price changes, slippage, and API delays can change the real outcome.",
    sources: "Sources: Binance public book ticker and Kraken public ticker",
  },
};

const MAX_AGE_MS = 60_000;
const REFRESH_MS = 30_000;

function positiveNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function getBinance(pair: string): Promise<Quote> {
  const response = await fetch(
    `https://api.binance.com/api/v3/ticker/bookTicker?symbol=${pair}`,
    { cache: "no-store" }
  );

  if (!response.ok) throw new Error("Binance unavailable");

  const data: { bidPrice?: string; askPrice?: string } =
    await response.json();

  const bid = positiveNumber(data.bidPrice);
  const ask = positiveNumber(data.askPrice);

  if (!bid || !ask || bid > ask) {
    throw new Error("Invalid Binance quote");
  }

  return { bid, ask, fetchedAt: Date.now() };
}

async function getKraken(pair: string): Promise<Quote> {
  const response = await fetch(
    `https://api.kraken.com/0/public/Ticker?pair=${pair}`,
    { cache: "no-store" }
  );

  if (!response.ok) throw new Error("Kraken unavailable");

  const data: {
    error?: string[];
    result?: Record<string, { a?: string[]; b?: string[] }>;
  } = await response.json();

  if (data.error?.length || !data.result) {
    throw new Error("Invalid Kraken response");
  }

  const ticker = Object.values(data.result)[0];
  const ask = positiveNumber(ticker?.a?.[0]);
  const bid = positiveNumber(ticker?.b?.[0]);

  if (!bid || !ask || bid > ask) {
    throw new Error("Invalid Kraken quote");
  }

  return { bid, ask, fetchedAt: Date.now() };
}

function price(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: value < 1 ? 5 : 2,
    maximumFractionDigits: value < 1 ? 7 : 4,
  });
}

function pct(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(3)}%`;
}

function age(value: number, language: Language): string {
  const seconds = Math.max(0, Math.floor((Date.now() - value) / 1000));
  return language === "bn" ? `${seconds} সেকেন্ড আগে` : `${seconds}s ago`;
}

export default function ArbitrageScanner({
  language,
}: {
  language: Language;
}) {
  const t = TEXT[language];

  const [quotes, setQuotes] = useState<AssetQuotes[]>(
    ASSETS.map((asset) => ({ symbol: asset.symbol }))
  );
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);
  const [fee, setFee] = useState(0.1);
  const [slippage, setSlippage] = useState(0.1);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const result = await Promise.all(
        ASSETS.map(async (asset): Promise<AssetQuotes> => {
          const [binance, kraken] = await Promise.allSettled([
            getBinance(asset.binancePair),
            getKraken(asset.krakenPair),
          ]);

          return {
            symbol: asset.symbol,
            binance:
              binance.status === "fulfilled"
                ? binance.value
                : undefined,
            kraken:
              kraken.status === "fulfilled"
                ? kraken.value
                : undefined,
          };
        })
      );

      setQuotes(result);
      setLastRefresh(Date.now());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const totalCosts = 2 * (fee + slippage);

  return (
    <section className="panel arb-panel">
      <div className="panel-head">
        <div>
          <h2>{t.title}</h2>
          <p className="muted">{t.subtitle}</p>
        </div>

        <button
          className="secondary"
          onClick={() => void refresh()}
          disabled={loading}
        >
          {loading ? t.loading : t.refresh}
        </button>
      </div>

      <div className="warning arb-warning">{t.warning}</div>

      <div className="arb-controls">
        <label>
          <span>{t.fee}</span>
          <input
            type="number"
            min="0"
            max="5"
            step="0.01"
            value={fee}
            onChange={(event) =>
              setFee(Math.min(5, Math.max(0, Number(event.target.value) || 0)))
            }
          />
        </label>

        <label>
          <span>{t.slippage}</span>
          <input
            type="number"
            min="0"
            max="5"
            step="0.01"
            value={slippage}
            onChange={(event) =>
              setSlippage(
                Math.min(5, Math.max(0, Number(event.target.value) || 0))
              )
            }
          />
        </label>
      </div>

      <p className="muted small">
        {t.sources}
        {lastRefresh
          ? ` · ${t.fetched}: ${new Date(lastRefresh).toLocaleTimeString()}`
          : ""}
      </p>

      <div className="arb-list">
        {quotes.map((item) => {
          const b = item.binance;
          const k = item.kraken;

          const stale =
            !b ||
            !k ||
            Date.now() - b.fetchedAt > MAX_AGE_MS ||
            Date.now() - k.fetchedAt > MAX_AGE_MS;

          if (!b || !k || stale) {
            return (
              <article className="arb-card" key={item.symbol}>
                <div className="arb-card-head">
                  <strong>{item.symbol}/USD</strong>
                  <span className="arb-status stale">{t.stale}</span>
                </div>
                <p className="muted small">{t.unavailable}</p>

                <div className="arb-source-grid">
                  <div>
                    <span className="muted small">Binance · USDT</span>
                    <strong>{b ? `Bid ${price(b.bid)}` : "—"}</strong>
                    <strong>{b ? `Ask ${price(b.ask)}` : "—"}</strong>
                    {b && (
                      <span className="muted small">
                        {t.fetched}: {age(b.fetchedAt, language)}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="muted small">Kraken · USD</span>
                    <strong>{k ? `Bid ${price(k.bid)}` : "—"}</strong>
                    <strong>{k ? `Ask ${price(k.ask)}` : "—"}</strong>
                    {k && (
                      <span className="muted small">
                        {t.fetched}: {age(k.fetchedAt, language)}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          }

          const options = [
            {
              buyName: "Binance",
              sellName: "Kraken",
              buyAsk: b.ask,
              sellBid: k.bid,
            },
            {
              buyName: "Kraken",
              sellName: "Binance",
              buyAsk: k.ask,
              sellBid: b.bid,
            },
          ].map((option) => {
            const gross = ((option.sellBid - option.buyAsk) / option.buyAsk) * 100;
            return { ...option, gross, net: gross - totalCosts };
          });

          const best = options[0].net >= options[1].net ? options[0] : options[1];

          return (
            <article className="arb-card" key={item.symbol}>
              <div className="arb-card-head">
                <strong>{item.symbol}/USD</strong>
                <span className="arb-status fresh">{t.fresh}</span>
              </div>

              <div className="arb-source-grid">
                <div>
                  <span className="muted small">Binance · USDT</span>
                  <strong>Bid {price(b.bid)}</strong>
                  <strong>Ask {price(b.ask)}</strong>
                  <span className="muted small">
                    {t.fetched}: {age(b.fetchedAt, language)}
                  </span>
                </div>

                <div>
                  <span className="muted small">Kraken · USD</span>
                  <strong>Bid {price(k.bid)}</strong>
                  <strong>Ask {price(k.ask)}</strong>
                  <span className="muted small">
                    {t.fetched}: {age(k.fetchedAt, language)}
                  </span>
                </div>
              </div>

              <div className="arb-result">
                <div>
                  <span className="muted small">{t.buy}</span>
                  <strong>{best.buyName}</strong>
                </div>
                <div>
                  <span className="muted small">{t.sell}</span>
                  <strong>{best.sellName}</strong>
                </div>
                <div>
                  <span className="muted small">{t.gross}</span>
                  <strong className={best.gross >= 0 ? "green" : "red"}>
                    {pct(best.gross)}
                  </strong>
                </div>
                <div>
                  <span className="muted small">{t.costs}</span>
                  <strong>{pct(-totalCosts)}</strong>
                </div>
                <div>
                  <span className="muted small">{t.net}</span>
                  <strong className={best.net > 0 ? "green" : "red"}>
                    {pct(best.net)}
                  </strong>
                </div>
              </div>

              <p className={best.net > 0 ? "green arb-verdict" : "muted arb-verdict"}>
                {best.net > 0 ? t.positive : t.negative}
              </p>
            </article>
          );
        })}
      </div>

      <p className="muted small">{t.note}</p>
    </section>
  );
}
