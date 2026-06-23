import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { BrandLogo } from "../components/ui/Brand";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!auth) return;

    setSubmitting(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError("Не удалось войти. Проверьте почту и пароль.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-panel" onSubmit={submit}>
        <BrandLogo size={24} />
        <h1>Маршрутные листы</h1>
        <p>Вход для менеджера</p>
        <label>
          Электронная почта
          <input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label>
          Пароль
          <input
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="button primary full" disabled={submitting}>
          {submitting ? "Вход..." : "Войти"}
        </button>
      </form>
    </main>
  );
}
