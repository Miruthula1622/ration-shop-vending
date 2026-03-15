'use client';
import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function VendorPage() {
  const [port, setPort] = useState<any>(null);
  const [writer, setWriter] = useState<any>(null);
  const [statusMsg, setStatusMsg] = useState('Waiting for QR Scan...');
  const [user, setUser] = useState<any>(null);
  const [selectedGrain, setSelectedGrain] = useState('');
  const [qty, setQty] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    scanner.render((decodedText) => {
      scanner.pause();
      processQR(decodedText);
    }, (error) => {});
    return () => {
      scanner.clear().catch(e => console.error(e));
    };
  }, []);

  async function connectSerial() {
    try {
      const p = await (navigator as any).serial.requestPort();
      await p.open({ baudRate: 115200 });
      setPort(p);
      setWriter(p.writable.getWriter());
      setStatusMsg("ESP32 Connected. Ready to scan.");
    } catch (err) {
      alert("Failed to connect Serial: " + err);
    }
  }

  async function processQR(qrId: string) {
    setStatusMsg("Verifying User...");
    try {
      const res = await fetch(`/api/dispense?qrId=${qrId}`);
      if (!res.ok) {
        setStatusMsg("Invalid QR or User not found.");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setStatusMsg("User Verified. Select grains.");
    } catch(err) {
      setStatusMsg("Error verifying user.");
    }
  }

  async function handleDispense() {
    if (!selectedGrain || !qty) return alert('Select grain and quantity');
    setShowPayment(true);
    setStatusMsg("Scan Payment QR to complete transaction...");
  }

  async function simulatePaymentSuccess() {
    setShowPayment(false);
    setStatusMsg("Payment Successful. Starting Dispense...");
    try {
      const res = await fetch('/api/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrId: user.qrId, grainType: selectedGrain, dispenseQty: Number(qty) })
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error);
        setStatusMsg("Dispense Failed.");
        return;
      }
      if (writer) {
        await writer.write(new TextEncoder().encode("OPEN\n"));
        setStatusMsg(`Dispensing ${qty}Kg ${selectedGrain}...`);
        setTimeout(async () => {
          await writer.write(new TextEncoder().encode("STOP\n"));
          setStatusMsg("Dispensing Completed.");
          setTimeout(() => {
            setUser(null);
            setSelectedGrain('');
            setQty('');
            setStatusMsg("Waiting for QR Scan...");
          }, 3000);
        }, 5000 * Number(qty));
      } else {
        alert("Dispense logged, but ESP32 not connected.");
        setUser(null);
      }
    } catch (e) {
      alert("API Error");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <div className="w-full bg-red-800 text-white p-4 text-center font-bold text-xl uppercase tracking-wider">
        Smart Ration Distribution System
      </div>
      <div className="mt-4">
        <button onClick={connectSerial} className="bg-red-800 text-white px-6 py-2 rounded shadow">
          {port ? 'ESP32 Connected' : 'Connect ESP32 Serial'}
        </button>
      </div>
      <div className="flex gap-8 mt-8 w-full max-w-5xl justify-center items-start flex-wrap">
        <div className="flex flex-col items-center bg-white p-4 rounded shadow w-[400px]">
          <h2 className="text-red-800 font-bold mb-4">E-Smart Card Scanner</h2>
          {!user && <div id="reader" className="w-full"></div>}
          {user && (
            <div className="text-center">
              <p className="text-xl font-bold bg-green-100 text-green-800 px-4 py-2 rounded">Scan Success</p>
              <button className="mt-4 text-blue-600 underline" onClick={() => setUser(null)}>Scan Again</button>
            </div>
          )}
        </div>
        <div className="bg-white p-6 rounded shadow w-[400px]">
          <h2 className="text-red-800 font-bold mb-4 text-xl border-b pb-2">User Details</h2>
          {user ? (
            <div className="space-y-4">
              <p><strong>Name:</strong> {user.username}</p>
              <p><strong>Mobile:</strong> {user.mobile}</p>
              <div className="mt-4">
                <label className="block mb-1 font-bold">Select Grain:</label>
                <select className="w-full border p-2 rounded" value={selectedGrain} onChange={e => setSelectedGrain(e.target.value)}>
                  <option value="">-- Choose --</option>
                  <option value="Rice">Rice</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Sugar">Sugar</option>
                </select>
              </div>
              <div className="mt-4">
                <label className="block mb-1 font-bold">Quantity (Kg):</label>
                <input type="number" className="w-full border p-2 rounded" value={qty} onChange={e => setQty(e.target.value)} />
              </div>
              {!showPayment && (
                <button onClick={handleDispense} className="w-full bg-red-800 text-white py-2 rounded mt-6 font-bold">
                  Proceed to Pay
                </button>
              )}
              {showPayment && (
                <div className="mt-6 border-2 border-red-800 p-4 text-center rounded">
                  <h3 className="font-bold text-red-800 mb-2">Scan to Pay UPI</h3>
                  <div className="bg-gray-200 h-40 w-40 mx-auto flex flex-col justify-center items-center mb-2">
                    <span className="text-xs">UPI QR CODE MOCK</span>
                    <strong>₹{Number(qty) * 2}</strong>
                  </div>
                  <button onClick={simulatePaymentSuccess} className="bg-green-600 w-full text-white py-2 font-bold rounded">
                    Confirm Payment Received
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-10 italic">
              Awaiting User QR Scan...
            </div>
          )}
        </div>
      </div>
      <div className="fixed bottom-0 w-full bg-red-800 text-white text-center py-3 text-lg font-bold uppercase tracking-widest shadow-[0_-4px_10px_rgba(0,0,0,0.2)]">
        {statusMsg}
      </div>
    </div>
  );
}
