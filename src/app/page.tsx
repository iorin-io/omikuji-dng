// app/page.tsx
import PrintButton from "./components/PrintReceiptButton";

export default function Home() {
  return (
    <main className="flex h-screen items-center justify-center">
      <PrintButton />
    </main>
  );
}
