import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { authClient, signIn } from "../auth/auth-client";
export default function Login({ onDone }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotMsg, setForgotMsg] = useState("");
    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setBusy(true);
        const { error } = await signIn.email({ email, password });
        setBusy(false);
        if (error) {
            setError(error.message ?? "Sign in failed.");
            return;
        }
        onDone();
    }
    async function handleForgot(e) {
        e.preventDefault();
        setForgotMsg("Sending…");
        const { error } = await authClient.requestPasswordReset({
            email: forgotEmail,
            redirectTo: "http://localhost:5173",
        });
        setForgotMsg(error ? error.message ?? "Request failed." : "Reset link sent — check your inbox.");
    }
    return (_jsxs(_Fragment, { children: [_jsx("h2", { children: "Welcome back" }), _jsx("p", { className: "muted", children: "Sign in to your One Link studio." }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("label", { children: ["Email", _jsx("input", { type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value) })] }), _jsx("br", {}), _jsx("br", {}), _jsxs("label", { children: ["Password", _jsx("input", { type: "password", required: true, value: password, onChange: (e) => setPassword(e.target.value) })] }), error && _jsx("p", { style: { color: "#dc2626" }, children: error }), _jsxs("div", { className: "row", children: [_jsx("button", { className: "btn btn-dark", type: "submit", disabled: busy, children: busy ? "Signing in…" : "Sign in" }), _jsx("button", { className: "btn", type: "button", onClick: () => setShowForgot((v) => !v), children: "Forgot password?" })] })] }), showForgot && (_jsxs("form", { onSubmit: handleForgot, style: { marginTop: 12 }, children: [_jsxs("label", { children: ["Account email", _jsx("input", { type: "email", required: true, value: forgotEmail, onChange: (e) => setForgotEmail(e.target.value) })] }), forgotMsg && _jsx("p", { className: "muted", children: forgotMsg }), _jsx("div", { className: "row", children: _jsx("button", { className: "btn btn-dark", type: "submit", children: "Send reset link" }) })] }))] }));
}
//# sourceMappingURL=Login.js.map