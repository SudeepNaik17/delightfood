import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * RENDER DEPLOYMENT CONFIGURATION
 * Automatically switches between local and production backend URLs
 */
const API = window.location.hostname === "localhost" 
  ? "http://localhost:5000/api" 
  : "https://your-backend-service-name.onrender.com/api"; // REPLACE with your actual Render Backend URL

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }
    loadOrders();
    loadMenu();
  }, [token, navigate]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadOrders = async () => {
    try {
      const res = await fetch(`${API}/order/admin/all`, { 
        headers: { Authorization: token } 
      });
      
      if (res.status === 403 || res.status === 401) {
        localStorage.clear();
        navigate("/auth");
        return;
      }

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load orders");
    }
  };

  const loadMenu = async () => {
    try {
      const res = await fetch(`${API}/menu`);
      const data = await res.json();
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load menu");
    }
  };

  const handleSubmitMenu = async (e) => {
    e.preventDefault();
    setLoading(true);
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `${API}/menu/${editingId}` : `${API}/menu`;

    try {
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({ name, price })
      });

      setSuccess(editingId ? "Item updated!" : "Item added!");
      setName(""); setPrice(""); setEditingId(null);
      loadMenu();
    } catch (err) {
      console.error("Failed to save menu item");
    } finally {
      setLoading(false);
    }
  };

  const deleteMenu = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await fetch(`${API}/menu/${id}`, { 
        method: "DELETE", 
        headers: { Authorization: token } 
      });
      setSuccess("Item removed");
      loadMenu();
    } catch (err) {
      console.error("Failed to delete item");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API}/order/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({ status })
      });
      setSuccess(`Order marked as ${status}`);
      loadOrders();
    } catch (err) {
      console.error("Failed to update status");
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setName(item.name);
    setPrice(item.price);
  };

  return (
    <div className="admin-layout">
      {success && <div className="admin-toast">{success}</div>}

      <aside className="admin-sidebar">
        <div className="sidebar-brand">🍔 QuickBite Admin</div>
        <nav className="sidebar-nav">
          <button className={activeTab === "orders" ? "active" : ""} onClick={() => {setActiveTab("orders"); loadOrders();}}>📋 Live Orders</button>
          <button className={activeTab === "menu" ? "active" : ""} onClick={() => {setActiveTab("menu"); loadMenu();}}>🍴 Menu Management</button>
        </nav>
        <button className="logout-btn-side" onClick={() => { localStorage.clear(); navigate("/auth"); }}>Logout</button>
      </aside>

      <main className="admin-main">
        <header className="main-header">
          <h2 className="dark-text">{activeTab === "orders" ? "Live Customer Orders" : "Manage Menu Items"}</h2>
          <div className="admin-user-info">Administrator Panel</div>
        </header>

        <div className="main-body">
          {activeTab === "orders" ? (
            <div className="admin-card overflow-x">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Customer</th>
                    <th>Ordered Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan="7" style={{textAlign:'center', padding:'40px', color:'#666'}}>No active orders found.</td></tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o._id}>
                        <td><span className="token-tag">#{o.token}</span></td>
                        <td>
                          <div className="customer-email">{o.email || "Guest"}</div>
                        </td>
                        <td className="dark-text font-medium">
                          {o.items.map(i => `${i.name} (x${i.qty || 1})`).join(", ")}
                        </td>
                        <td className="dark-text bold-text">₹{o.total}</td>
                        <td>
                          <span className={`pay-method ${o.paymentMethod?.toLowerCase() === 'cash' ? 'cash-tag' : 'upi-tag'}`}>
                            {o.paymentMethod || "Cash"}
                          </span>
                        </td>
                        <td><span className={`status-pill ${o.status.toLowerCase()}`}>{o.status}</span></td>
                        <td>
                          <div className="action-btns">
                            {o.status === "Pending" ? (
                              <>
                                <button className="ready-btn" onClick={() => updateStatus(o._id, "Ready")}>Ready</button>
                                <button className="cancel-btn" onClick={() => updateStatus(o._id, "Cancelled")}>Cancel</button>
                              </>
                            ) : o.status === "Ready" ? (
                                <button className="deliver-btn" onClick={() => updateStatus(o._id, "Delivered")}>Mark Delivered</button>
                            ) : (
                              <span className="completed-text">✅ Done</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="menu-mgmt-grid">
              <div className="admin-card">
                <h3 className="dark-text">{editingId ? "Edit Menu Item" : "Add New Item"}</h3>
                <form className="add-form" onSubmit={handleSubmitMenu}>
                  <div className="input-group">
                    <label>Item Name</label>
                    <input placeholder="e.g. Cheese Pizza" value={name} onChange={e=>setName(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>Price (₹)</label>
                    <input type="number" placeholder="e.g. 199" value={price} onChange={e=>setPrice(e.target.value)} required />
                  </div>
                  <div className="form-btns">
                    <button type="submit" className="save-btn">{loading ? "Processing..." : editingId ? "Save Changes" : "Add to Menu"}</button>
                    {editingId && <button type="button" className="cancel-edit" onClick={() => {setEditingId(null); setName(""); setPrice("");}}>Cancel</button>}
                  </div>
                </form>
              </div>

              <div className="admin-card">
                <h3 className="dark-text">Live Menu ({menuItems.length} items)</h3>
                <div className="menu-list-scroll">
                  {menuItems.map(item => (
                    <div className="menu-list-item" key={item._id}>
                      <div className="item-info">
                        <strong className="dark-text item-title">{item.name}</strong>
                        <span className="price-label-admin">₹{item.price}</span>
                      </div>
                      <div className="item-actions">
                        <button className="edit-btn" onClick={() => startEdit(item)} title="Edit">✏️</button>
                        <button className="delete-btn" onClick={() => deleteMenu(item._id)} title="Delete">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .admin-layout { display: flex; width: 100vw; height: 100vh; background: #ffffff; overflow: hidden; font-family: 'Inter', sans-serif; }
        .admin-sidebar { width: 280px; background: #0f172a; color: #ffffff; display: flex; flex-direction: column; padding: 25px; flex-shrink: 0; }
        .sidebar-brand { font-size: 24px; font-weight: 900; margin-bottom: 45px; color: #ef4444; }
        .sidebar-nav { display: flex; flex-direction: column; gap: 12px; flex-grow: 1; }
        .sidebar-nav button { background: none; border: none; color: #94a3b8; text-align: left; padding: 14px 18px; font-size: 15px; font-weight: 600; cursor: pointer; border-radius: 10px; transition: 0.2s; }
        .sidebar-nav button.active { background: #ef4444; color: #ffffff; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }
        .sidebar-nav button:hover:not(.active) { background: #1e293b; color: #ffffff; }
        .logout-btn-side { background: transparent; border: 1px solid #334155; color: #94a3b8; padding: 12px; border-radius: 10px; cursor: pointer; margin-top: auto; font-weight: 700; transition: 0.2s; }
        .logout-btn-side:hover { border-color: #ef4444; color: #ef4444; }

        .admin-main { flex-grow: 1; display: flex; flex-direction: column; background: #f8fafc; overflow-y: auto; }
        .main-header { padding: 20px 40px; background: #ffffff; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 10; }
        .main-header h2 { color: #0f172a; margin: 0; font-weight: 800; font-size: 22px; }
        .admin-user-info { color: #64748b; font-weight: 700; font-size: 14px; background: #f1f5f9; padding: 6px 15px; border-radius: 20px; }

        .main-body { padding: 40px; }
        .admin-card { background: #ffffff; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-bottom: 30px; }
        .overflow-x { overflow-x: auto; }

        .dark-text { color: #111111 !important; }
        .bold-text { font-weight: 800 !important; font-size: 16px; }
        .font-medium { font-weight: 500; }

        .admin-table { width: 100%; border-collapse: collapse; min-width: 800px; }
        .admin-table th { text-align: left; padding: 16px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; }
        .admin-table td { padding: 18px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; }

        .customer-email { color: #2563eb; font-weight: 700; font-size: 13px; }
        .token-tag { background: #f1f5f9; color: #ef4444; padding: 6px 12px; border-radius: 8px; font-weight: 900; font-size: 14px; border: 1px solid #e2e8f0; }
        
        .pay-method { font-size: 11px; font-weight: 800; padding: 4px 8px; border-radius: 5px; text-transform: uppercase; }
        .cash-tag { background: #f1f5f9; color: #475569; }
        .upi-tag { background: #dbeafe; color: #1e40af; }

        .status-pill { padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; }
        .status-pill.pending { background: #fef3c7; color: #92400e; }
        .status-pill.ready { background: #dcfce7; color: #166534; }
        .status-pill.delivered { background: #f1f5f9; color: #475569; }
        .status-pill.cancelled { background: #fee2e2; color: #991b1b; }

        .ready-btn { background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 13px; transition: 0.2s; }
        .deliver-btn { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 13px; }
        .cancel-btn { background: #ffffff; color: #ef4444; border: 1px solid #fee2e2; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 13px; }
        .completed-text { color: #10b981; font-weight: 700; font-size: 13px; }

        .menu-mgmt-grid { display: grid; grid-template-columns: 380px 1fr; gap: 30px; align-items: start; }
        .input-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
        .input-group label { font-size: 13px; font-weight: 700; color: #475569; }
        .add-form input { padding: 12px 16px; border: 1px solid #cbd5e1; border-radius: 10px; color: #0f172a; font-weight: 600; font-size: 15px; }
        .add-form input:focus { outline: 2px solid #ef4444; border-color: transparent; }
        
        .save-btn { width: 100%; background: #ef4444; color: white; border: none; padding: 14px; border-radius: 10px; cursor: pointer; font-weight: 800; font-size: 15px; margin-top: 10px; }
        .cancel-edit { width: 100%; background: #f1f5f9; color: #475569; border: none; padding: 14px; border-radius: 10px; cursor: pointer; font-weight: 700; margin-top: 10px; }

        .menu-list-scroll { max-height: 60vh; overflow-y: auto; padding-right: 5px; }
        .menu-list-item { display: flex; justify-content: space-between; padding: 16px; border: 1px solid #f1f5f9; background: #ffffff; margin-bottom: 12px; border-radius: 12px; transition: 0.2s; }
        .menu-list-item:hover { border-color: #e2e8f0; transform: translateX(5px); }
        .item-title { font-size: 16px; }
        .price-label-admin { color: #10b981; font-weight: 800; font-size: 14px; }
        .edit-btn, .delete-btn { background: #f8fafc; border: 1px solid #e2e8f0; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 10px; cursor: pointer; font-size: 14px; }
        .delete-btn:hover { background: #fee2e2; border-color: #fecaca; }

        .admin-toast { position: fixed; top: 30px; right: 30px; background: #0f172a; color: white; padding: 16px 32px; border-radius: 12px; z-index: 1000; font-weight: 700; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2); animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}