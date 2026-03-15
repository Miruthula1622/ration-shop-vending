export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center flex-col text-center">
      <h1 className="text-4xl font-bold text-red-900 mb-8">Smart Ration Vending Machine System</h1>
      <div className="flex gap-6">
        <a href="/admin" className="px-8 py-4 bg-red-900 text-white rounded shadow text-xl font-bold hover:bg-red-800 transition">
          Admin Dashboard
        </a>
        <a href="/vendor" className="px-8 py-4 bg-gray-800 text-white rounded shadow text-xl font-bold hover:bg-gray-700 transition">
          Machine / Vendor Interface
        </a>
      </div>
    </div>
  );
}
