export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            GR
          </div>
          <h1 className="text-2xl font-bold text-slate-900">GadgetReach</h1>
          <p className="mt-1 text-sm text-slate-500">
            Digital Marketing System for Gadget Retail
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
