import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { signUp } from "../auth/auth-client";
export default function Signup({ onDone }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setBusy(true);
        const { error } = await signUp.email({ name, email, password });
        setBusy(false);
        if (error) {
            setError(error.message ?? "Sign up failed.");
            return;
        }
        onDone();
    }
    return (_jsxs(_Fragment, { children: [_jsx("h2", { children: "Create your account" }), _jsx("p", { className: "muted", children: "One account for creating, publishing, and analytics." }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("label", { children: ["Name", _jsx("input", { type: "text", required: true, value: name, onChange: (e) => setName(e.target.value) })] }), _jsx("br", {}), _jsx("br", {}), _jsxs("label", { children: ["Email", _jsx("input", { type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value) })] }), _jsx("br", {}), _jsx("br", {}), _jsxs("label", { children: ["Password", _jsx("input", { type: "password", required: true, minLength: 8, value: password, onChange: (e) => setPassword(e.target.value) })] }), error && _jsx("p", { style: { color: "#dc2626" }, children: error }), _jsx("div", { className: "row", children: _jsx("button", { className: "btn btn-dark", type: "submit", disabled: busy, children: busy ? "Creating…" : "Create account" }) })] })] }));
}
//# sourceMappingURL=Signup.js.map