import ThemeToggle from './ThemeToggle';

export default function Layout({ children }) {
  return (
    <div>
      <header>
        <ThemeToggle />
      </header>
      <main>
        {children}
      </main>
    </div>
  );
}
