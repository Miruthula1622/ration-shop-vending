'use client';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('USERS');
  const [users, setUsers] = useState<any[]>([]);
  const [otps, setOtps] = useState<any[]>([]);
  const [chambers, setChambers] = useState<any[]>([]);

  const [allocForm, setAllocForm] = useState({ userId: '', monthYear: '10-2023', grainType: 'Rice', allocatedQty: 0 });
  const [chamberForm, setChamberForm] = useState({ name: 'Rice', totalCapacity: 100, currentLevel: 50 });

  useEffect(() => {
    fetchUsers();
    fetchOtps();
    fetchChambers();
  }, []);

  async function fetchUsers() {
    const res = await fetch('/api/admin/users');
    if (res.ok) setUsers(await res.json());
  }

  async function fetchOtps() {
    const res = await fetch('/api/admin/otps');
    if (res.ok) setOtps(await res.json());
  }

  async function fetchChambers() {
    const res = await fetch('/api/admin/chamber');
    if (res.ok) setChambers(await res.json());
  }

  async function handleAllocate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...allocForm, allocatedQty: Number(allocForm.allocatedQty) })
    });
    if (res.ok) {
      alert('Allocated successfully');
      fetchUsers();
    }
  }

  async function handleUpdateChamber(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/chamber', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...chamberForm, totalCapacity: Number(chamberForm.totalCapacity), currentLevel: Number(chamberForm.currentLevel) })
    });
    if (res.ok) {
      alert('Chamber updated');
      fetchChambers();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-red-900 text-white flex flex-col p-4 shadow-lg">
        <h1 className="text-2xl font-bold mb-10 tracking-widest text-center border-b border-red-700 pb-4">
          ADMIN PANEL
        </h1>
        <button className={`p-3 text-left w-full mb-2 rouned ${activeTab==='USERS' ? 'bg-red-700' : 'hover:bg-red-800'}`} onClick={() => setActiveTab('USERS')}>
          Manage Users
        </button>
        <button className={`p-3 text-left w-full mb-2 rouned ${activeTab==='OTPS' ? 'bg-red-700' : 'hover:bg-red-800'}`} onClick={() => setActiveTab('OTPS')}>
          Pending WhatsApp OTPs
        </button>
        <button className={`p-3 text-left w-full mb-2 rouned ${activeTab==='CHAMBERS' ? 'bg-red-700' : 'hover:bg-red-800'}`} onClick={() => setActiveTab('CHAMBERS')}>
          Machine Chambers
        </button>
      </div>

      <div className="flex-1 p-10 overflow-y-auto">
        
        {activeTab === 'USERS' && (
          <div>
            <h2 className="text-3xl font-bold mb-6 text-red-900">Registered Users & Allocation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="bg-white p-6 shadow rounded">
                <h3 className="font-bold mb-4 border-b pb-2">User List</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {users.map(u => (
                    <div key={u.id} className="p-4 border rounded hover:border-red-900 cursor-pointer" onClick={() => setAllocForm({ ...allocForm, userId: u.id })}>
                      <p><strong>{u.username}</strong> ({u.mobile})</p>
                      <p className="text-sm text-gray-500">QR ID: {u.qrId || 'Pending'}</p>
                      <p className="text-sm text-gray-500">Family Members: {u.familyMembers?.length || 0}</p>
                    </div>
                  ))}
                  {users.length === 0 && <p className="text-gray-500 italic">No users found.</p>}
                </div>
              </div>

              <div className="bg-white p-6 shadow rounded">
                <h3 className="font-bold mb-4 border-b pb-2">Allocate Grains</h3>
                <form onSubmit={handleAllocate} className="space-y-4">
                  <div>
                    <label className="block font-bold text-sm">Selected User ID (Click from list):</label>
                    <input type="text" readOnly className="border w-full p-2 bg-gray-100" value={allocForm.userId} />
                  </div>
                  <div>
                    <label className="block font-bold text-sm">Month-Year:</label>
                    <input type="text" className="border w-full p-2" value={allocForm.monthYear} onChange={e => setAllocForm({...allocForm, monthYear: e.target.value})} placeholder="e.g. 10-2023" />
                  </div>
                  <div>
                    <label className="block font-bold text-sm">Grain Type:</label>
                    <select className="border w-full p-2" value={allocForm.grainType} onChange={e => setAllocForm({...allocForm, grainType: e.target.value})}>
                      <option value="Rice">Rice</option>
                      <option value="Wheat">Wheat</option>
                      <option value="Sugar">Sugar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-sm">Allocated Quantity (Kg):</label>
                    <input type="number" className="border w-full p-2" value={allocForm.allocatedQty} onChange={e => setAllocForm({...allocForm, allocatedQty: Number(e.target.value)})} />
                  </div>
                  <button type="submit" className="w-full bg-red-900 text-white p-2 rounded mt-4 font-bold disabled:bg-gray-400" disabled={!allocForm.userId}>
                    Update Allocation
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'OTPS' && (
          <div>
            <h2 className="text-3xl font-bold mb-6 text-red-900">Pending WhatsApp OTP Requests</h2>
            <p className="mb-4 text-gray-600">
              When a user creates an account on the mobile app, they request an OTP. The Admin will see the OTP here and must reply to the user's WhatsApp message with this 6-digit code.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {otps.map(otp => (
                <div key={otp.id} className="bg-white border-l-4 border-red-900 p-6 shadow rounded relative">
                  <p className="text-gray-500 text-sm mb-1">Mobile: <strong className="text-black">{otp.mobile}</strong></p>
                  <p className="text-3xl font-mono font-bold tracking-[0.2em] text-red-900 mt-2">{otp.otpCode}</p>
                  <p className="text-xs text-gray-400 mt-4 absolute top-2 right-4">{new Date(otp.createdAt).toLocaleTimeString()}</p>
                </div>
              ))}
              {otps.length === 0 && <p className="text-gray-500 italic">No pending OTP requests.</p>}
            </div>
          </div>
        )}

        {activeTab === 'CHAMBERS' && (
          <div>
            <h2 className="text-3xl font-bold mb-6 text-red-900">Machine Chambers Live Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="bg-white p-6 shadow rounded">
                <h3 className="font-bold gap-4 border-b pb-2 mb-4">Current Capacity</h3>
                {chambers.map(c => (
                  <div key={c.id} className="mb-6">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-gray-800">{c.name}</span>
                      <span className="text-sm font-bold">{c.currentLevel} Kg / {c.totalCapacity} Kg</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                      <div className="bg-red-800 h-4 rounded-full" style={{ width: `${(c.currentLevel / c.totalCapacity) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
                {chambers.length === 0 && <p className="text-gray-500 italic">No chambers configured yet.</p>}
              </div>

              <div className="bg-white p-6 shadow rounded">
                <h3 className="font-bold border-b pb-2 mb-4">Update Chamber</h3>
                <form onSubmit={handleUpdateChamber} className="space-y-4">
                  <div>
                    <label className="block font-bold text-sm">Chamber Name:</label>
                    <select className="border w-full p-2" value={chamberForm.name} onChange={e => setChamberForm({...chamberForm, name: e.target.value})}>
                      <option value="Rice">Rice</option>
                      <option value="Wheat">Wheat</option>
                      <option value="Sugar">Sugar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-sm">Total Capacity (Kg):</label>
                    <input type="number" className="border w-full p-2" value={chamberForm.totalCapacity} onChange={e => setChamberForm({...chamberForm, totalCapacity: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block font-bold text-sm">Current Level (Kg):</label>
                    <input type="number" className="border w-full p-2" value={chamberForm.currentLevel} onChange={e => setChamberForm({...chamberForm, currentLevel: Number(e.target.value)})} />
                  </div>
                  <button type="submit" className="w-full bg-red-900 text-white p-2 rounded mt-4 font-bold">
                    Refill / Update Chamber
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
