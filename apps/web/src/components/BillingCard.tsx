import { useEffect, useState } from "react";
import { api, errorText, MOCK } from "../lib/api";
import { whenText } from "../lib/format";
import { StatusPill, useToast } from "./ui";

interface Plan { id: string; label: string; blurb: string; features: string[]; ai_monthly: number; price_usd: number }
interface Status {
  plan: string; used: number; limit: number; renews_or_ends: string | null; provider: string | null; status: string | null;
  country: string; fx_attribution: { text: string; url: string } | null;
  providers: string[]; currency_options: Record<string, CurrencyOpt[]>; plans: Plan[]; manual_instructions: string; pending_request: { plan: string; reference: string } | null; is_admin: boolean;
}
interface CurrencyOpt { code: string; label: string; creator: number; business: number; estimated?: boolean; as_of?: string | null }
const COUNTRIES: [string, string][] = [["SS", "South Sudan"], ["UG", "Uganda"], ["KE", "Kenya"], ["TZ", "Tanzania"], ["RW", "Rwanda"], ["ET", "Ethiopia"], ["NG", "Nigeria"], ["GH", "Ghana"], ["ZA", "South Africa"], ["", "Somewhere else"]];
const REGION_COUNTRY: Record<string, string> = { south_sudan: "SS" };
const TZ_COUNTRY: Record<string, string> = { "Africa/Juba": "SS", "Africa/Kampala": "UG", "Africa/Nairobi": "KE", "Africa/Dar_es_Salaam": "TZ", "Africa/Kigali": "RW", "Africa/Addis_Ababa": "ET", "Africa/Lagos": "NG", "Africa/Accra": "GH", "Africa/Johannesburg": "ZA" };
const deviceCountry = () => { try { return TZ_COUNTRY[Intl.DateTimeFormat().resolvedOptions().timeZone] ?? ""; } catch { return ""; } };
const money = (code: string, n: number, approx = false) => `${approx ? "about " : ""}${code === "USD" ? "$" : code + " "}${n.toLocaleString()}`;
const PROVIDER_LABEL: Record<string, string> = {
  manual: "Mobile money or bank transfer", stripe: "Card", flutterwave: "Card, bank or mobile money", paystack: "Card (Paystack)",
};

export default function BillingCard() {
  const toast = useToast();
  const [s, setS] = useState<Status | null>(null);
  const [pick, setPick] = useState<string>("");
  const [provider, setProvider] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [country, setCountry] = useState<string | null>(null);
  const [method, setMethod] = useState("MTN MoMo");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [requests, setRequests] = useState<{ id: string; email: string; plan: string; method: string; reference: string }[]>([]);

  async function load(c: string | null = country) {
    try {
      const st: Status = await api.get(`/api/billing/status${c !== null ? `?country=${c}` : ""}`);
      if (c === null && !st.country) {
        // No location from the network: use the region chosen at setup, then the device time zone.
        const region = await api.get("/api/prefs").then((p: { region: string }) => p.region).catch(() => "");
        const guess = REGION_COUNTRY[region] || deviceCountry();
        if (guess) { setCountry(guess); return load(guess); }
      }
      if (c === null) setCountry(st.country || "");
      setS(st);
      setProvider((p) => p || st.providers[0] || "");
      if (st.is_admin) setRequests(await api.get("/api/billing/admin/requests").catch(() => []));
    } catch { setS(null); }
  }
  useEffect(() => { load(); }, []);

  if (!s) return <div className="card"><h3>Your plan</h3><p className="muted">Sign in to see your plan.</p></div>;

  async function pay() {
    setBusy(true);
    try {
      const r = await api.post("/api/billing/checkout", { plan: pick, provider, currency, country: country ?? "" });
      if (MOCK) toast("Preview: this is where the secure payment page opens.");
      else if (r.url) window.location.href = r.url;
      else if (r.provider !== "manual") toast("Checkout did not start. Try another payment method.", "bad");
    } catch (e) { toast(errorText(e), "bad"); }
    setBusy(false);
  }
  async function sendManual() {
    setBusy(true);
    try {
      await api.post("/api/billing/manual", { plan: pick, method, reference, currency, country: country ?? "", amount: price });
      toast("Thanks. We will confirm your payment and turn your plan on.");
      setReference("");
      await load();
    } catch (e) { toast(errorText(e), "bad"); }
    setBusy(false);
  }
  async function decide(id: string, action: "approve" | "reject") {
    try { await api.post(`/api/billing/admin/requests/${id}/${action}`, {}); toast(action === "approve" ? "Plan turned on." : "Request rejected."); await load(); }
    catch (e) { toast(errorText(e), "bad"); }
  }

  const paid = s.plans.filter((p) => p.price_usd > 0);
  const opts = s.currency_options?.[provider] ?? [{ code: "USD", label: "US dollars", creator: 0, business: 0 }];
  const chosen = opts.find((o) => o.code === currency) ?? opts[0];
  const price = pick === "creator" || pick === "business" ? chosen[pick] : 0;
  return (
    <div className="card">
      <h3>Your plan</h3>
      <p>
        <strong style={{ textTransform: "capitalize" }}>{s.plan}</strong>
        {s.status && s.status !== "active" && <> <StatusPill status={s.status} /></>}
        <span className="muted"> · AI helper used {s.used} of {s.limit} this month</span>
        {s.renews_or_ends && s.plan !== "free" && <span className="muted"> · paid until {whenText(s.renews_or_ends)}</span>}
      </p>
      <div className="plans">
        {s.plans.map((p) => (
          <div key={p.id} className={`plan${s.plan === p.id ? " current" : ""}`}>
            <strong>{p.label}</strong>
            <span className="price">{p.price_usd ? `$${p.price_usd}` : "Free"}{p.price_usd ? <small className="muted" style={{ fontSize: 13, fontFamily: "var(--body)", fontWeight: 500 }}> /month</small> : null}</span>
            <span className="muted small">{p.blurb}</span>
            <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
            {p.price_usd > 0 && s.plan !== p.id && (
              <button className="btn btn-sm btn-dark" style={{ marginTop: 8 }} onClick={() => setPick(p.id)}>Choose {p.label}</button>
            )}
          </div>
        ))}
      </div>

      {pick && paid.some((p) => p.id === pick) && (
        <div className="stack" style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <strong>Pay for {pick} · how would you like to pay?</strong>
          {s.providers.length === 0 && <p className="notice notice-warn">No payment method is switched on yet. The owner needs to add one in settings.</p>}
          <div className="row" style={{ marginTop: 0 }}>
            {s.providers.map((p) => (
              <button key={p} className={`chip${provider === p ? " on" : ""}`} aria-pressed={provider === p} onClick={() => { setProvider(p); setCurrency("USD"); }}>{PROVIDER_LABEL[p] ?? p}</button>
            ))}
          </div>
          <label className="field" htmlFor="pay-country" style={{ maxWidth: 260 }}>Where are you paying from?
            <select id="pay-country" value={country ?? ""} onChange={(e) => { setCountry(e.target.value); setCurrency("USD"); load(e.target.value); }}>
              {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </select>
          </label>
          {provider && opts.length > 1 && (
            <div>
              <strong className="small">Pay in dollars or in your own money?</strong>
              <div className="row" style={{ marginTop: 6 }}>
                {opts.map((o) => (
                  <button key={o.code} className={`chip${chosen.code === o.code ? " on" : ""}`} aria-pressed={chosen.code === o.code} onClick={() => setCurrency(o.code)}>
                    {o.label} · {money(o.code, o[pick as "creator" | "business"], o.estimated)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {provider && price > 0 && <p className="notice notice-good">You pay <b>{money(chosen.code, price)}</b> for one month of {pick}.</p>}
          {chosen.estimated && (
            <p className="muted small">Local prices follow the current exchange rate{chosen.as_of ? `, updated ${new Date(chosen.as_of).toLocaleDateString([], { day: "numeric", month: "short" })}` : ""}, and update on their own. The amount you see when you start paying is the amount you pay. Your bank or mobile money app may show a slightly different rate.
              {s.fx_attribution && <> <a href={s.fx_attribution.url} target="_blank" rel="noreferrer">{s.fx_attribution.text}</a>.</>}</p>
          )}
          {provider === "manual" ? (
            <>
              <div className="notice notice-info" style={{ whiteSpace: "pre-wrap" }}>{s.manual_instructions || "Send your payment as the owner describes, then enter the transaction reference below."}</div>
              {s.pending_request ? (
                <p className="notice notice-warn">Your {s.pending_request.plan} payment (ref {s.pending_request.reference}) is waiting to be confirmed.</p>
              ) : (
                <>
                  <label className="field" htmlFor="pay-method">Paid with
                    <select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value)}>
                      {["MTN MoMo", "Zain Cash", "Airtel Money", "M-Pesa", "Bank transfer", "Other"].map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </label>
                  <label className="field" htmlFor="pay-ref">Transaction reference
                    <input id="pay-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="From your payment confirmation message" />
                  </label>
                  <div className="row" style={{ marginTop: 0 }}><button className="btn btn-hero" disabled={busy || reference.trim().length < 4} onClick={sendManual}>I have paid</button></div>
                </>
              )}
            </>
          ) : (
            <div className="row" style={{ marginTop: 0 }}><button className="btn btn-hero" disabled={busy || !provider} onClick={pay}>{busy ? "Opening…" : "Continue to payment"}</button></div>
          )}
        </div>
      )}

      {s.is_admin && (
        <div style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 14 }}>
          <strong>Payments to confirm (owner only)</strong>
          {requests.length === 0 && <p className="muted">Nothing waiting.</p>}
          {requests.map((r) => (
            <div key={r.id} className="list-item">
              <div className="grow"><div className="title">{r.email} · {r.plan}</div><div className="muted small">{r.method} · ref <span className="mono">{r.reference}</span></div></div>
              <div className="row" style={{ margin: 0 }}>
                <button className="btn btn-sm btn-dark" onClick={() => decide(r.id, "approve")}>Confirm</button>
                <button className="btn btn-sm" onClick={() => decide(r.id, "reject")}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
