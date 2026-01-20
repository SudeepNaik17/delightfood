import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { fetchMenu, placeOrder } from "../api/api";

// --- RENDER CONFIGURATION ---
const API_URL = window.location.hostname === "localhost" 
  ? "http://localhost:5000" 
  : "https://delightfood-r9vx.onrender.com"; // REPLACE with your actual Render backend URL

const imageMap = {
  "Veg Burger": "https://images.unsplash.com/photo-1550547660-d9450f859349",
  "Chicken Burger": "https://images.unsplash.com/photo-1550317138-10000687a72b",
  "French Fries": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5",
  "Veg Pizza": "https://images.unsplash.com/photo-1548365328-8b849e6b6d1b",
  "Chicken Pizza": "https://images.unsplash.com/photo-1601924582975-7e1b4f1b9b6c",
  "Cold Coffee": "https://images.unsplash.com/photo-1517705008128-361805f42e86",
  "Tea": "https://images.unsplash.com/photo-1544787219-7f47ccb76574",
  "Sandwich": "https://images.unsplash.com/photo-1528731708534-816fe59f90cb"
};

export default function Menu() {
  const navigate = useNavigate();
  const [view, setView] = useState("menu");
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [token, setToken] = useState("");
  const [history, setHistory] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  const userEmail = Cookies.get("user_email");

  const fetchHistory = useCallback(async () => {
    if (!userEmail) return;
    try {
      // UPDATED: Used dynamic API_URL
      const res = await fetch(`${API_URL}/api/order/user/${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.log("History failed"); }
  }, [userEmail]);

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/auth"); return; }
    fetchMenu().then(setMenu).catch(() => console.log("Server Offline"));
    fetchHistory();
  }, [fetchHistory, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    Cookies.remove("user_email");
    navigate("/auth");
  };

  const add = (item) => {
    setCart(prev => {
      const found = prev.find(i => i._id === item._id);
      if (found) return prev.map(i => i._id === item._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const remove = (item) => {
    setCart(prev => {
      const found = prev.find(i => i._id === item._id);
      if (found?.qty === 1) return prev.filter(i => i._id !== item._id);
      return prev.map(i => i._id === item._id ? { ...i, qty: i.qty - 1 } : i);
    });
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const processOrder = async (method) => {
    if (!userEmail) { alert("Session expired. Please login again."); return; }
    try {
      const res = await placeOrder({ items: cart, total, email: userEmail, paymentMethod: method });
      setToken(res.token);
      setCart([]);
      setShowPayment(false);
      setShowQR(false);
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 5000);
      fetchHistory();
    } catch (err) { alert("Order Error"); }
  };

  return (
    <div className="app-root">
      {showSuccessPopup && (
        <div className="success-popup-right">
          <div className="popup-content">
            <span className="check-icon">✅</span>
            <div className="text-box">
              <strong style={{color: '#166534'}}>Payment Successful!</strong>
              <p style={{color: '#166534', margin: 0, fontSize: '13px'}}>Your order #{token} has been placed.</p>
            </div>
          </div>
        </div>
      )}

      <nav className="top-nav">
        <div className="nav-container">
          <div className="logo" onClick={() => setView("menu")}>🍔 QuickBite</div>
          <div className="nav-tabs">
            <button className={view === "menu" ? "active" : ""} onClick={() => setView("menu")}>Menu</button>
            <button className={view === "history" ? "active" : ""} onClick={() => { setView("history"); fetchHistory(); }}>History</button>
          </div>
          <div className="user-box">
            <span className="email-label">{userEmail || "Guest"}</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      {showQR && (
        <div className="qr-modal-overlay">
          <div className="qr-card">
            <h3 style={{color: '#111'}}>Scan QR to Pay</h3>
            <p style={{color: '#000'}}>Amount: <b>₹{total}</b></p>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://vau.my.id/success?amount=${total}`} 
              alt="Payment QR" 
            />
            <button className="verify-btn" onClick={() => processOrder("UPI / Online")}>I Have Scanned & Paid</button>
            <button className="cancel-qr" onClick={() => setShowQR(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="content-body">
        {view === "menu" ? (
          <div className="flex-layout">
            <div className="menu-grid">
              {menu.map(item => {
                const qty = cart.find(i => i._id === item._id)?.qty || 0;
                return (
                  <div className="item-card" key={item._id}>
                    <img src={imageMap[item.name]} alt="" className="item-img" />
                    <div className="item-info">
                      <h3 className="dark-label">{item.name}</h3>
                      <p className="price-label">₹{item.price}</p>
                      <div className="control-box">
                        {qty === 0 ? (
                          <button className="add-btn" onClick={() => add(item)}>ADD</button>
                        ) : (
                          <div className="sharp-stepper">
                            <button onClick={() => remove(item)}>−</button>
                            <span className="qty-num">{qty}</span>
                            <button onClick={() => add(item)}>+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="billing-sidebar">
              <div className="bill-card">
                <h3 className="dark-label">Billing Details</h3>
                {showPayment ? (
                  <div className="payment-options">
                    <button className="pay-opt" onClick={() => processOrder("Cash")}>💵 Cash at Counter</button>
                    <button className="pay-opt upi" onClick={() => setShowQR(true)}>📱 Pay via UPI QR</button>
                    <button className="cancel-pay" onClick={() => setShowPayment(false)}>Go Back</button>
                  </div>
                ) : (
                  <>
                    <div className="bill-items">
                      {cart.length === 0 ? <p style={{color: '#666'}}>Cart is empty</p> : 
                        cart.map(i => (
                          <div key={i._id} className="bill-row">
                            <span className="dark-text-bold">{i.name} x {i.qty}</span>
                            <span className="dark-text-bold">₹{i.price * i.qty}</span>
                          </div>
                        ))
                      }
                    </div>
                    <div className="bill-footer">
                      <div className="total-row">
                        <span className="dark-text-total">Total Amount</span>
                        <span className="dark-text-total">₹{total}</span>
                      </div>
                      <button className="pay-btn" onClick={() => setShowPayment(true)} disabled={cart.length === 0}>PROCEED TO PAY</button>
                    </div>
                  </>
                )}
              </div>
            </aside>
          </div>
        ) : (
          <div className="history-section">
            <h2 className="dark-label">Past Orders</h2>
            {history.length === 0 ? <p style={{color: '#666'}}>No orders found.</p> : 
              history.slice().reverse().map(o => (
                <div className="h-card" key={o._id}>
                  <div className="h-top">
                    <span className="h-token">#{o.token}</span>
                    <span className={`h-status ${o.status?.toLowerCase()}`}>{o.status}</span>
                  </div>
                  <p className="dark-text-bold">{o.items?.map(i => `${i.name} (x${i.qty})`).join(", ")}</p>
                  <strong className="dark-text-bold">Paid: ₹{o.total} | {o.paymentMethod}</strong>
                </div>
              ))}
          </div>
        )}
      </div>

      <style>{`
        .app-root { background: #f1f5f9; min-height: 100vh; width: 100vw; font-family: 'Inter', sans-serif; overflow-x: hidden; }
        .top-nav { background: #fff; height: 75px; display: flex; align-items: center; border-bottom: 2px solid #e2e8f0; position: sticky; top: 0; z-index: 100; }
        .nav-container { width: 90%; max-width: 1300px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 24px; font-weight: 800; color: #dc2626; cursor: pointer; }
        .nav-tabs button { background: none; border: none; font-size: 15px; font-weight: 600; color: #64748b; cursor: pointer; padding: 10px; margin: 0 10px; }
        .nav-tabs button.active { color: #dc2626; border-bottom: 4px solid #dc2626; }
        .email-label { font-weight: 800; color: #1e293b; margin-right: 15px; }
        .logout-btn { background: #dc2626; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 800; }
        .content-body { width: 90%; max-width: 1300px; margin: 40px auto; }
        .flex-layout { display: flex; gap: 30px; }
        .menu-grid { flex: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
        .dark-label { color: #000000 !important; font-weight: 900; }
        .price-label { color: #111111; font-weight: 800; font-size: 20px; }
        .dark-text-bold { color: #000000 !important; font-weight: 700; font-size: 15px; }
        .dark-text-total { color: #000000 !important; font-weight: 900; font-size: 24px; }
        .item-card { background: #fff; border-radius: 12px; border: 2px solid #e2e8f0; overflow: hidden; }
        .item-img { width: 100%; height: 160px; object-fit: cover; }
        .item-info { padding: 15px; text-align: center; }
        .add-btn { width: 100%; background: #dc2626; color: #fff; border: none; padding: 10px; border-radius: 8px; font-weight: 800; cursor: pointer; }
        .sharp-stepper { display: flex; border: 2px solid #dc2626; border-radius: 8px; overflow: hidden; }
        .sharp-stepper button { flex: 1; background: #dc2626; color: #fff; border: none; font-size: 20px; font-weight: bold; padding: 8px; cursor: pointer; }
        .qty-num { flex: 1; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #000; background: #fff; }
        .billing-sidebar { width: 350px; }
        .bill-card { background: #fff; padding: 25px; border-radius: 16px; border: 2px solid #e2e8f0; position: sticky; top: 110px; box-shadow: 0 10px 15px rgba(0,0,0,0.05); }
        .bill-row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
        .total-row { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 15px; border-top: 3px solid #000; }
        .pay-btn { width: 100%; background: #10b981; color: #fff; border: none; padding: 16px; border-radius: 10px; font-weight: 800; cursor: pointer; margin-top: 20px; font-size: 16px; }
        .payment-options { display: flex; flex-direction: column; gap: 12px; }
        .pay-opt { padding: 15px; border: 2px solid #000; border-radius: 10px; background: #fff; font-weight: 800; text-align: left; cursor: pointer; color: #000; }
        .qr-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .qr-card { background: #fff; padding: 40px; border-radius: 24px; text-align: center; width: 340px; border: 3px solid #000; }
        .verify-btn { width: 100%; background: #10b981; color: #fff; border: none; padding: 14px; border-radius: 10px; font-weight: 800; cursor: pointer; margin-top: 20px; }
        .cancel-qr { background: none; border: none; color: #ef4444; font-weight: 700; margin-top: 15px; cursor: pointer; text-decoration: underline; }
        .success-popup-right { position: fixed; top: 100px; right: 20px; background: #dcfce7; border: 2px solid #22c55e; padding: 15px 25px; border-radius: 12px; box-shadow: -5px 5px 20px rgba(0,0,0,0.1); z-index: 2000; animation: slideInRight 0.5s ease-out; }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .h-card { border-left: 8px solid #dc2626; background: #fff; padding: 20px; margin-bottom: 15px; border-radius: 10px; border: 1px solid #ddd; }
        .h-token { font-weight: 900; color: #dc2626; font-size: 18px; }
        .h-status { font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 6px; background: #000; color: #fff; }
      `}</style>
    </div>
  );
}