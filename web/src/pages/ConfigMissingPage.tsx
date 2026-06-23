import { BrandLogo } from "../components/ui/Brand";

export function ConfigMissingPage() {
  return (
    <main className="login-page">
      <section className="login-panel">
        <BrandLogo size={24} />
        <h1>Нужна настройка Firebase</h1>
        <p>Заполните переменные из файла web/.env.example.</p>
      </section>
    </main>
  );
}
