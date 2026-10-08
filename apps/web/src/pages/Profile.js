import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { authClient, twoFactor, useSession } from "../auth/auth-client";
const EMPTY = { id: "", name: "", description: "", website: "", voice: "Casual" };
export default function Profile({ go }) {
    void go;
    const [brand, setBrand] = useState(EMPTY);
    const [status, setStatus] = useState("Loading…");
    const [connectNote, setConnectNote] = useState("");
    const [verifyNote, setVerifyNote] = useState("");
    const [tfPassword, setTfPassword] = useState("");
    const [totpUri, setTotpUri] = useState("");
    const [backupCodes, setBackupCodes] = useState([]);
    const [tfCode, setTfCode] = useState("");
    const [tfMsg, setTfMsg] = useState("");
    const [conns, setConns] = useState([]);
    const [config, setConfig] = useState({});
    const nameRef = useRef(null);
    const { data: session } = useSession();
    async function loadSocial() {
        try {
            const [c, list] = await Promise.all([api.get("/api/social/config"), api.get("/api/social")]);
            setConfig(c);
            setConns(list);
        }
        catch {
            setConns([]);
        }
    }
    async function resendVerification() {
        const email = session?.user.email;
        if (!email) {
            setVerifyNote("Sign in first, then resend.");
            return;
        }
        setVerifyNote("Sending…");
        const { error } = await authClient.sendVerificationEmail({ email });
        setVerifyNote(error ? error.message ?? "Send failed." : "Verification email sent — check your inbox.");
    }
    useEffect(() => {
        api
            .get("/api/brands")
            .then((rows) => {
            if (rows[0])
                setBrand(rows[0]);
            setStatus("");
        })
            .catch(() => setStatus("Could not reach the API — is it running?"));
        loadSocial();
    }, []);
    async function enable2fa() {
        setTfMsg("Enabling…");
        const { data, error } = await twoFactor.enable({ password: tfPassword });
        if (error) {
            setTfMsg(error.message ?? "Enable failed.");
            return;
        }
        if (data && data.method === "totp") {
            setTotpUri(data.totpURI);
            setBackupCodes(data.backupCodes);
            setTfMsg("Scan the URI below in your authenticator app (Google Authenticator, Authy, 1Password), then verify a code.");
        }
        else {
            setTfMsg(`Enabled with method: ${data?.method ?? "unknown"}.`);
        }
    }
    async function verify2fa() {
        const { error } = await twoFactor.verifyTotp({ code: tfCode });
        setTfMsg(error ? error.message ?? "Invalid code." : "Two-factor enabled for your account.");
    }
    async function disable2fa() {
        const { error } = await twoFactor.disable({ password: tfPassword });
        setTfMsg(error ? error.message ?? "Disable failed." : "Two-factor disabled.");
        if (!error) {
            setTotpUri("");
            setBackupCodes([]);
        }
    }
    async function save() {
        setStatus("Saving…");
        try {
            const saved = brand.id
                ? await api.put(`/api/brands/${brand.id}`, brand)
                : await api.post("/api/brands", brand);
            setBrand(saved);
            setStatus("Saved.");
        }
        catch {
            setStatus("Save failed.");
        }
    }
    return (_jsxs(_Fragment, { children: [_jsx("h2", { children: "Brand profile" }), _jsx("p", { className: "muted", children: "The AI uses this to keep content consistent." }), status && _jsx("p", { className: "muted", children: status }), _jsxs("label", { children: ["Brand name", _jsx("input", { ref: nameRef, value: brand.name, onChange: (e) => setBrand({ ...brand, name: e.target.value }) })] }), _jsx("br", {}), _jsx("br", {}), _jsxs("label", { children: ["Description", _jsx("input", { value: brand.description, onChange: (e) => setBrand({ ...brand, description: e.target.value }) })] }), _jsx("br", {}), _jsx("br", {}), _jsxs("label", { children: ["Website", _jsx("input", { value: brand.website, onChange: (e) => setBrand({ ...brand, website: e.target.value }) })] }), _jsx("br", {}), _jsx("br", {}), _jsxs("label", { children: ["Voice", _jsx("select", { value: brand.voice, onChange: (e) => setBrand({ ...brand, voice: e.target.value }), children: ["Casual", "Professional", "Funny", "Inspirational", "Promotional"].map((v) => (_jsx("option", { children: v }, v))) })] }), _jsxs("div", { className: "row", children: [_jsx("button", { className: "btn btn-dark", onClick: save, children: "Save profile" }), _jsx("button", { className: "btn", onClick: () => nameRef.current?.focus(), children: "Edit name" }), _jsx("button", { className: "btn", onClick: () => setConnectNote("Social connectors arrive in the review pass — your One Link login is the connected identity for now."), children: "Connect account" })] }), connectNote && _jsx("p", { className: "muted", children: connectNote }), _jsxs("div", { className: "card", children: [_jsx("h3", { children: "Email verification" }), _jsxs("p", { children: ["Status:", " ", _jsx("strong", { children: session?.user.emailVerified ? "Verified" : "Not verified" })] }), !session?.user.emailVerified && (_jsx("div", { className: "row", children: _jsx("button", { className: "btn btn-dark", onClick: resendVerification, children: "Resend verification email" }) })), verifyNote && _jsx("p", { className: "muted", children: verifyNote })] }), _jsxs("div", { className: "card", children: [_jsx("h3", { children: "Two-factor authentication" }), _jsxs("p", { children: ["Status:", " ", _jsx("strong", { children: String(session?.user?.twoFactorEnabled ?? "unknown") })] }), _jsxs("label", { children: ["Account password (to confirm changes)", _jsx("input", { type: "password", value: tfPassword, onChange: (e) => setTfPassword(e.target.value) })] }), _jsxs("div", { className: "row", children: [_jsx("button", { className: "btn btn-dark", onClick: enable2fa, children: "Enable 2FA" }), _jsx("button", { className: "btn", onClick: disable2fa, children: "Disable 2FA" })] }), totpUri && (_jsxs(_Fragment, { children: [_jsx("p", { style: { wordBreak: "break-all" }, children: totpUri }), backupCodes.length > 0 && (_jsxs("p", { children: ["Backup codes (save these somewhere safe): ", backupCodes.join(", ")] })), _jsxs("label", { children: ["6-digit code from your app", _jsx("input", { value: tfCode, onChange: (e) => setTfCode(e.target.value), placeholder: "123456" })] }), _jsx("div", { className: "row", children: _jsx("button", { className: "btn btn-dark", onClick: verify2fa, children: "Verify and finish" }) })] })), tfMsg && _jsx("p", { className: "muted", children: tfMsg })] }), _jsxs("div", { className: "grid", children: [_jsxs("div", { className: "card", children: [_jsx("h3", { children: "Connected accounts" }), ["tiktok", "instagram", "facebook", "linkedin"].map((p) => {
                                const conn = conns.find((c) => c.platform === p);
                                const ready = config[p];
                                return (_jsxs("p", { children: [_jsx("strong", { style: { textTransform: "capitalize" }, children: p }), ":", " ", conn ? `${conn.account_name} · ${conn.status}` : "not connected", " ", conn ? (_jsxs(_Fragment, { children: [_jsx("button", { className: "btn", onClick: async () => {
                                                        await api.del(`/api/social/${p}`).catch(() => { });
                                                        await loadSocial();
                                                    }, children: "Disconnect" }), " ", _jsx("button", { className: "btn", onClick: async () => {
                                                        const res = await api.post(`/api/social/${p}/refresh`, {}).catch((e) => e);
                                                        setConnectNote(res?.ok ? "Tokens refreshed." : String(res?.message || res));
                                                        await loadSocial();
                                                    }, children: "Refresh" })] })) : ready ? (_jsx("button", { className: "btn btn-dark", onClick: () => {
                                                window.location.href = `http://localhost:3000/api/social/${p}/connect`;
                                            }, children: "Connect" })) : (_jsx("span", { className: "muted", children: "keys needed \u2014 see docs/social-connectors.md" }))] }, p));
                            })] }), _jsxs("div", { className: "card", children: [_jsx("h3", { children: "Saved assets" }), _jsx("p", { children: "Captions, hashtag groups, templates." })] })] })] }));
}
//# sourceMappingURL=Profile.js.map