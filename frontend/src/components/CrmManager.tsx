"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  ShoppingBag, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  Package, 
  X, 
  RefreshCw,
  Search,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

interface User {
  id: number;
  name: str;
  email: str;
  risk_score: str;
}

interface Item {
  id: number;
  order_id: number;
  product_name: str;
  price: number;
  is_final_sale: boolean;
  return_window_days: number;
}

interface Order {
  id: number;
  user_id: number;
  purchase_date: str;
  total_amount: number;
  status: str;
  items: Item[];
}

export function CrmManager({ onDataChange }: { onDataChange?: () => void }) {
  const [activeTab, setActiveTab] = useState<"users" | "orders" | "items">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<str | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"user" | "order" | "item">("user");
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  
  // Current editing item ID
  const [editId, setEditId] = useState<number | null>(null);

  // Form states
  const [userForm, setUserForm] = useState({ name: "", email: "", risk_score: "low" });
  const [orderForm, setOrderForm] = useState({ user_id: "", total_amount: "", status: "delivered", purchase_date: "" });
  const [itemForm, setItemForm] = useState({ order_id: "", product_name: "", price: "", is_final_sale: false, return_window_days: "30" });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resUsers, resOrders, resItems] = await Promise.all([
        fetch("http://localhost:8000/api/users"),
        fetch("http://localhost:8000/api/orders"),
        fetch("http://localhost:8000/api/items")
      ]);

      if (!resUsers.ok || !resOrders.ok || !resItems.ok) {
        throw new Error("Failed to fetch CRM database tables.");
      }

      const [usersData, ordersData, itemsData] = await Promise.all([
        resUsers.json(),
        resOrders.json(),
        resItems.json()
      ]);

      setUsers(usersData);
      setOrders(ordersData);
      setItems(itemsData);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerChange = () => {
    fetchData();
    if (onDataChange) onDataChange();
  };

  // Delete Handlers
  const handleDeleteUser = async (id: number) => {
    if (!confirm("Are you sure? Deleting a user will also cascade delete all their orders and order items!")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete user.");
      triggerChange();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm("Are you sure you want to delete this order? Related items will also be deleted!")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/orders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete order.");
      triggerChange();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete item.");
      triggerChange();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open Create Modals
  const openCreateModal = (type: "user" | "order" | "item") => {
    setModalType(type);
    setModalMode("create");
    setEditId(null);
    
    if (type === "user") {
      setUserForm({ name: "", email: "", risk_score: "low" });
    } else if (type === "order") {
      setOrderForm({ 
        user_id: users.length > 0 ? users[0].id.toString() : "", 
        total_amount: "", 
        status: "delivered", 
        purchase_date: new Date().toISOString().split('T')[0]
      });
    } else {
      setItemForm({ 
        order_id: orders.length > 0 ? orders[0].id.toString() : "", 
        product_name: "", 
        price: "", 
        is_final_sale: false, 
        return_window_days: "30" 
      });
    }
    
    setShowModal(true);
  };

  // Open Edit Modals
  const openEditModal = (type: "user" | "order" | "item", data: any) => {
    setModalType(type);
    setModalMode("edit");
    setEditId(data.id);
    
    if (type === "user") {
      setUserForm({ name: data.name, email: data.email, risk_score: data.risk_score });
    } else if (type === "order") {
      const dateStr = data.purchase_date ? data.purchase_date.split('T')[0] : "";
      setOrderForm({ 
        user_id: data.user_id.toString(), 
        total_amount: data.total_amount.toString(), 
        status: data.status, 
        purchase_date: dateStr 
      });
    } else {
      setItemForm({ 
        order_id: data.order_id.toString(), 
        product_name: data.product_name, 
        price: data.price.toString(), 
        is_final_sale: data.is_final_sale, 
        return_window_days: data.return_window_days.toString() 
      });
    }
    
    setShowModal(true);
  };

  // Form Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    let url = "";
    let method = "POST";
    let bodyData: any = {};

    if (modalType === "user") {
      url = modalMode === "create" ? "http://localhost:8000/api/users" : `http://localhost:8000/api/users/${editId}`;
      method = modalMode === "create" ? "POST" : "PUT";
      bodyData = { ...userForm };
    } else if (modalType === "order") {
      url = modalMode === "create" ? "http://localhost:8000/api/orders" : `http://localhost:8000/api/orders/${editId}`;
      method = modalMode === "create" ? "POST" : "PUT";
      bodyData = { 
        user_id: parseInt(orderForm.user_id), 
        total_amount: parseFloat(orderForm.total_amount) || 0,
        status: orderForm.status,
        purchase_date: orderForm.purchase_date ? new Date(orderForm.purchase_date).toISOString() : null
      };
    } else {
      url = modalMode === "create" ? "http://localhost:8000/api/items" : `http://localhost:8000/api/items/${editId}`;
      method = modalMode === "create" ? "POST" : "PUT";
      bodyData = {
        order_id: parseInt(itemForm.order_id),
        product_name: itemForm.product_name,
        price: parseFloat(itemForm.price) || 0,
        is_final_sale: itemForm.is_final_sale,
        return_window_days: parseInt(itemForm.return_window_days) || 30
      };
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Error saving details.");
      }

      setShowModal(false);
      triggerChange();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    }
  };

  // Filters search results
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.risk_score.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(o => {
    const user = users.find(u => u.id === o.user_id);
    const userName = user ? user.name.toLowerCase() : "";
    return (
      o.id.toString().includes(searchTerm) ||
      o.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userName.includes(searchTerm.toLowerCase())
    );
  });

  const filteredItems = items.filter(i => 
    i.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.id.toString().includes(searchTerm) ||
    i.order_id.toString().includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-full bg-gray-950 p-6 overflow-y-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <TrendingUp className="text-purple-500 w-7 h-7" />
            CRM Database Manager
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Perform high-integrity CRUD operations across mock E-commerce relational schemas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-300 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-purple-400" : "text-gray-400"} />
            Reload DB
          </button>
          <button
            onClick={() => openCreateModal(activeTab)}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Add {activeTab === "users" ? "Customer" : activeTab === "orders" ? "Order" : "Item"}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Total Customers</div>
            <div className="text-2xl font-bold text-white mt-0.5">{users.length}</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <ShoppingBag size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Total Orders</div>
            <div className="text-2xl font-bold text-white mt-0.5">{orders.length}</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Package size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Total Order Items</div>
            <div className="text-2xl font-bold text-white mt-0.5">{items.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
        <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
          <button
            onClick={() => { setActiveTab("users"); setSearchTerm(""); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "users" 
                ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Users size={16} />
            Customers
          </button>
          <button
            onClick={() => { setActiveTab("orders"); setSearchTerm(""); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "orders" 
                ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            <ShoppingBag size={16} />
            Orders
          </button>
          <button
            onClick={() => { setActiveTab("items"); setSearchTerm(""); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "items" 
                ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Package size={16} />
            Order Items
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-sm transition-all"
          />
        </div>
      </div>

      {/* Main Grid/Table Content */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        {loading && (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
            <RefreshCw size={24} className="animate-spin text-purple-500" />
            <p className="text-sm font-mono">Loading data...</p>
          </div>
        )}

        {!loading && (
          <>
            {activeTab === "users" && (
              <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-340px)]">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/3 font-medium text-gray-400">
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Risk Profile</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          No customer entries found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-white/3 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-gray-500">#{u.id}</td>
                          <td className="px-6 py-4 font-semibold text-white">{u.name}</td>
                          <td className="px-6 py-4 text-gray-400">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                              u.risk_score === "low" 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                : u.risk_score === "medium" 
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            }`}>
                              {u.risk_score}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex gap-2">
                              <button 
                                onClick={() => openEditModal("user", u)}
                                className="p-2 rounded bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-purple-400 transition-all cursor-pointer"
                                title="Edit Customer"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-2 rounded bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/20 text-rose-400 transition-all cursor-pointer"
                                title="Delete Customer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-340px)]">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/3 font-medium text-gray-400">
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Purchase Date</th>
                      <th className="px-6 py-4">Total Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-200">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          No order entries found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => {
                        const user = users.find(u => u.id === o.user_id);
                        return (
                          <tr key={o.id} className="hover:bg-white/3 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-gray-400">#{o.id}</td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-white">{user ? user.name : "Unknown"}</div>
                              <div className="text-xs text-gray-500">User ID #{o.user_id}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-400">
                              {o.purchase_date ? new Date(o.purchase_date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              }) : "N/A"}
                            </td>
                            <td className="px-6 py-4 font-bold text-white">
                              ${o.total_amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                                o.status === "delivered" 
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                                  : o.status === "processing" 
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                                  : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                              }`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="inline-flex gap-2">
                                <button 
                                  onClick={() => openEditModal("order", o)}
                                  className="p-2 rounded bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-purple-400 transition-all cursor-pointer"
                                  title="Edit Order"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteOrder(o.id)}
                                  className="p-2 rounded bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/20 text-rose-400 transition-all cursor-pointer"
                                  title="Delete Order"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "items" && (
              <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-340px)]">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/3 font-medium text-gray-400">
                      <th className="px-6 py-4">Item ID</th>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Product Name</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Final Sale</th>
                      <th className="px-6 py-4">Return Window</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-200">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          No order item entries found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((i) => (
                        <tr key={i.id} className="hover:bg-white/3 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-gray-500">#{i.id}</td>
                          <td className="px-6 py-4 font-mono text-purple-400">Order #{i.order_id}</td>
                          <td className="px-6 py-4 font-semibold text-white">{i.product_name}</td>
                          <td className="px-6 py-4 font-bold text-white">${i.price.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                              i.is_final_sale 
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            }`}>
                              {i.is_final_sale ? "FINAL SALE" : "REFUNDABLE"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400">{i.return_window_days} Days</td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex gap-2">
                              <button 
                                onClick={() => openEditModal("item", i)}
                                className="p-2 rounded bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-purple-400 transition-all cursor-pointer"
                                title="Edit Item"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button 
                                onClick={() => handleDeleteItem(i.id)}
                                className="p-2 rounded bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/20 text-rose-400 transition-all cursor-pointer"
                                title="Delete Item"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* CRUD MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl border border-white/15 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/3">
              <h2 className="text-lg font-bold text-white">
                {modalMode === "create" ? "Add New" : "Edit"}{" "}
                {modalType === "user" ? "Customer" : modalType === "order" ? "Order" : "Item"}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit} className="p-6 flex flex-col gap-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex gap-2 items-center">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {modalType === "user" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      value={userForm.name}
                      onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Alice Smith"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      value={userForm.email}
                      onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. alice@example.com"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Risk Level Profile</label>
                    <select
                      value={userForm.risk_score}
                      onChange={(e) => setUserForm(prev => ({ ...prev, risk_score: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm cursor-pointer"
                    >
                      <option value="low" className="bg-gray-900 text-white">Low Risk (Standard)</option>
                      <option value="medium" className="bg-gray-900 text-white">Medium Risk (Warning)</option>
                      <option value="high" className="bg-gray-900 text-white">High Risk (Escalate Edge Cases)</option>
                    </select>
                  </div>
                </>
              )}

              {modalType === "order" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Customer</label>
                    {users.length === 0 ? (
                      <div className="text-xs text-amber-400 p-2 rounded bg-amber-500/5 border border-amber-500/10 flex items-center gap-1.5">
                        <AlertTriangle size={12} /> Please create a Customer first.
                      </div>
                    ) : (
                      <select
                        required
                        value={orderForm.user_id}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, user_id: e.target.value }))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm cursor-pointer"
                      >
                        {users.map(u => (
                          <option key={u.id} value={u.id.toString()} className="bg-gray-900 text-white">
                            {u.name} (User ID #{u.id})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={orderForm.total_amount}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, total_amount: e.target.value }))}
                      placeholder="e.g. 150.00"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Purchase Date</label>
                    <input
                      type="date"
                      required
                      value={orderForm.purchase_date}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, purchase_date: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Delivery Status</label>
                    <select
                      value={orderForm.status}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm cursor-pointer"
                    >
                      <option value="delivered" className="bg-gray-900 text-white">Delivered</option>
                      <option value="processing" className="bg-gray-900 text-white">Processing</option>
                      <option value="returned" className="bg-gray-900 text-white">Returned</option>
                    </select>
                  </div>
                </>
              )}

              {modalType === "item" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Associated Order</label>
                    {orders.length === 0 ? (
                      <div className="text-xs text-amber-400 p-2 rounded bg-amber-500/5 border border-amber-500/10 flex items-center gap-1.5">
                        <AlertTriangle size={12} /> Please create an Order first.
                      </div>
                    ) : (
                      <select
                        required
                        value={itemForm.order_id}
                        onChange={(e) => setItemForm(prev => ({ ...prev, order_id: e.target.value }))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm cursor-pointer"
                      >
                        {orders.map(o => {
                          const user = users.find(u => u.id === o.user_id);
                          return (
                            <option key={o.id} value={o.id.toString()} className="bg-gray-900 text-white">
                              Order #{o.id} - ${o.total_amount.toFixed(2)} ({user ? user.name : "Guest"})
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Product Name</label>
                    <input
                      type="text"
                      required
                      value={itemForm.product_name}
                      onChange={(e) => setItemForm(prev => ({ ...prev, product_name: e.target.value }))}
                      placeholder="e.g. Ergonomic Office Chair"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={itemForm.price}
                        onChange={(e) => setItemForm(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="e.g. 129.99"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Return Window (Days)</label>
                      <input
                        type="number"
                        required
                        value={itemForm.return_window_days}
                        onChange={(e) => setItemForm(prev => ({ ...prev, return_window_days: e.target.value }))}
                        placeholder="e.g. 30"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white/3 border border-white/5 rounded-xl mt-1">
                    <input
                      type="checkbox"
                      id="is_final_sale"
                      checked={itemForm.is_final_sale}
                      onChange={(e) => setItemForm(prev => ({ ...prev, is_final_sale: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 border-white/10 rounded focus:ring-purple-500 bg-black/40 cursor-pointer"
                    />
                    <label htmlFor="is_final_sale" className="text-xs font-semibold text-gray-200 cursor-pointer select-none">
                      Mark as "Final Sale" (Never Refundable)
                    </label>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-medium text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm shadow-md transition-colors cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
