export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <span className="rounded-full bg-surface px-4 py-1 text-sm text-muted">
        قيد التطوير
      </span>
      <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
        كل ما تحتاجه في عالم الرياضة
        <br />
        <span className="text-accent">في مكان واحد</span>
      </h1>
      <p className="max-w-xl text-lg text-muted">
        Jordan Gym Reviews: دليل النوادي والمدربين والمتاجر الرياضية في الأردن،
        مع الأسعار وساعات الدوام والموقع والتواصل المباشر.
      </p>
    </main>
  );
}
