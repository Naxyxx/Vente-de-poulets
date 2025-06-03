import React, { useState, useEffect } from "react";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [chickens, setChickens] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newChicken, setNewChicken] = useState({ name: "", price: "", stock: "" });
  const [newOrder, setNewOrder] = useState({
    client: "",
    chickenId: "",
    quantity: "",
    status: "En attente",
  });
  const [notifications, setNotifications] = useState([]);

  // Charger depuis localStorage
  useEffect(() => {
    const savedChickens = JSON.parse(localStorage.getItem("chickens")) || [
      { id: 1, name: "Poulet standard", price: "1200 FCFA/kg", stock: 45 },
      { id: 2, name: "Poulet fermier", price: "1500 FCFA/kg", stock: 32 },
      { id: 3, name: "Poulet bio", price: "1800 FCFA/kg", stock: 20 },
    ];
    const savedOrders = JSON.parse(localStorage.getItem("orders")) || [
      { id: 1, orderId: "#CMD001", client: "Jean Dupont", chickenId: 1, quantity: 5, status: "Payé" },
      { id: 2, orderId: "#CMD002", client: "Marie Sow", chickenId: 2, quantity: 3, status: "En attente" },
      { id: 3, orderId: "#CMD003", client: "Ali Traoré", chickenId: 3, quantity: 2, status: "Livré" },
    ];
    setChickens(savedChickens);
    setOrders(savedOrders);
  }, []);

  // Sauvegarder dans localStorage
  useEffect(() => {
    localStorage.setItem("chickens", JSON.stringify(chickens));
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [chickens, orders]);

  // Calcul stats
  const stats = () => {
    const totalSales = orders
      .filter((o) => o.status === "Payé")
      .reduce((acc, order) => {
        const chicken = chickens.find((c) => c.id === order.chickenId);
        return acc + parseFloat(chicken?.price.replace(" FCFA/kg", "") || "0") * order.quantity;
      }, 0);

    const soldCount = orders.reduce((acc, o) => acc + o.quantity, 0);
    const availableStock = chickens.reduce((acc, c) => acc + c.stock, 0);
    const profit = totalSales * 0.3; // Exemple de marge

    return [
      { label: "Ventes Totales", value: `${totalSales.toFixed(0)} FCFA` },
      { label: "Poulets Vendus", value: soldCount.toString() },
      { label: "Stock Disponible", value: availableStock.toString() },
      { label: "Bénéfice Net", value: `+${profit.toFixed(0)} FCFA` },
    ];
  };

  // Ajouter un produit
  const handleAddChicken = () => {
    if (!newChicken.name || !newChicken.price || !newChicken.stock) return;

    const newId = chickens.length ? Math.max(...chickens.map((c) => c.id)) + 1 : 1;
    setChickens([
      ...chickens,
      { ...newChicken, id: newId, stock: parseInt(newChicken.stock) },
    ]);
    setNewChicken({ name: "", price: "", stock: "" });
    showNotification("✅ Produit ajouté avec succès !");
  };

  // Supprimer une commande
  const deleteOrder = (id) => {
    setOrders(orders.filter((o) => o.id !== id));
    showNotification("🗑️ Commande supprimée.");
  };

  // Ajouter une commande
  const handleAddOrder = () => {
    if (!newOrder.client || !newOrder.chickenId || !newOrder.quantity) return;

    const chicken = chickens.find((c) => c.id === parseInt(newOrder.chickenId));
    if (!chicken || chicken.stock < newOrder.quantity) {
      showNotification("⚠️ Stock insuffisant !");
      return;
    }

    const newId = orders.length ? Math.max(...orders.map((o) => o.id)) + 1 : 1;
    const newOrderId = `#CMD${String(newId).padStart(3, "0")}`;

    setOrders([
      ...orders,
      {
        id: newId,
        orderId: newOrderId,
        client: newOrder.client,
        chickenId: parseInt(newOrder.chickenId),
        quantity: parseInt(newOrder.quantity),
        status: newOrder.status,
      },
    ]);

    // Mettre à jour le stock
    setChickens(
      chickens.map((c) =>
        c.id === parseInt(newOrder.chickenId)
          ? { ...c, stock: c.stock - parseInt(newOrder.quantity) }
          : c
      )
    );

    setNewOrder({ client: "", chickenId: "", quantity: "", status: "En attente" });
    showNotification("🛒 Nouvelle commande enregistrée !");
  };

  // Afficher une notification
  const showNotification = (message) => {
    const id = Date.now();
    setNotifications([...notifications, { id, message }]);
    setTimeout(() => {
      setNotifications(notifications.filter((n) => n.id !== id));
    }, 3000);
  };

  // Export CSV
  const exportToCSV = () => {
    const csvRows = [];
    csvRows.push(["ID", "Commande", "Client", "Type", "Quantité", "Statut"].join(","));
    orders.forEach((order) => {
      const chicken = chickens.find((c) => c.id === order.chickenId);
      csvRows.push(
        [
          order.id,
          order.orderId,
          order.client,
          chicken?.name || "Inconnu",
          order.quantity,
          order.status,
        ].join(",")
      );
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "commandes.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Impression de facture
  const printInvoice = (order) => {
    const chicken = chickens.find((c) => c.id === order.chickenId);
    const content = `
      <h1>Facture</h1>
      <p><strong>Commande :</strong> ${order.orderId}</p>
      <p><strong>Client :</strong> ${order.client}</p>
      <p><strong>Type :</strong> ${chicken?.name || "N/A"}</p>
      <p><strong>Prix unitaire :</strong> ${chicken?.price || "0 FCFA/kg"}</p>
      <p><strong>Quantité :</strong> ${order.quantity}</p>
      <p><strong>Total :</strong> ${
        chicken ? parseFloat(chicken.price.replace(" FCFA/kg", "")) * order.quantity : 0
      } FCFA</p>
      <p><strong>Date :</strong> ${new Date().toLocaleDateString()}</p>
    `;
    const w = window.open("", "_blank");
    w.document.write(`<html><body style="font-family:sans-serif; padding:2rem;">${content}</body></html>`);
    w.print();
    w.close();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 lg:relative lg:z-10`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold text-green-600">AgriPoultry</h1>
          <p className="text-sm text-gray-500 mt-1">Gestion des ventes de poulets</p>
        </div>
        <nav className="mt-6 px-4">
          <button
            onClick={() => setActiveSection("dashboard")}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center ${
              activeSection === "dashboard"
                ? "bg-green-100 text-green-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Tableau de bord
          </button>
          <button
            onClick={() => setActiveSection("orders")}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center ${
              activeSection === "orders"
                ? "bg-green-100 text-green-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Commandes
          </button>
          <button
            onClick={() => setActiveSection("products")}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center ${
              activeSection === "products"
                ? "bg-green-100 text-green-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Produits
          </button>
          <button
            onClick={() => setActiveSection("analytics")}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center ${
              activeSection === "analytics"
                ? "bg-green-100 text-green-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Statistiques
          </button>
          <button
            onClick={() => setActiveSection("settings")}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center ${
              activeSection === "settings"
                ? "bg-green-100 text-green-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Paramètres
          </button>
        </nav>
      </div>

      {/* Overlay mobile */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm z-30 relative">
        <div className="flex items-center justify-between p-4">
          <button
            className="lg:hidden text-gray-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-gray-800">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          </h2>
          <div className="flex items-center space-x-4">
            <button className="relative text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-0 right-0 block w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center space-x-2">
              <img
                src="https://picsum.photos/200/300" 
                alt="Profil"
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="hidden md:inline text-sm font-medium text-gray-700">Utilisateur</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6 pt-20 lg:pt-6">
        {activeSection === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats().map((stat, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</h3>
                  <div className="mt-4 flex items-center text-xs text-green-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                      />
                    </svg>
                    <span>+12% vs mois dernier</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4">Dernières commandes</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commande</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.slice(0, 4).map((order, index) => {
                        const chicken = chickens.find((c) => c.id === order.chickenId);
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{order.client}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{chicken?.name || "N/A"}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{order.quantity}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  order.status === "Payé"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "Livré"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                              <button onClick={() => printInvoice(order)} className="text-indigo-600 hover:text-indigo-900 mr-3">Facturer</button>
                              <button onClick={() => deleteOrder(order.id)} className="text-red-600 hover:text-red-900">Supprimer</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4">Types de poulets</h3>
                <ul className="divide-y divide-gray-200">
                  {chickens.map((chicken, index) => (
                    <li key={index} className="py-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-800">{chicken.name}</h4>
                        <p className="text-sm text-gray-500">{chicken.price}</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {chicken.stock}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeSection === "orders" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 text-lg mb-4">Ajouter une commande</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  placeholder="Nom du client"
                  className="border border-gray-300 rounded-md p-2"
                  value={newOrder.client}
                  onChange={(e) => setNewOrder({ ...newOrder, client: e.target.value })}
                />
                <select
                  className="border border-gray-300 rounded-md p-2"
                  value={newOrder.chickenId}
                  onChange={(e) => setNewOrder({ ...newOrder, chickenId: e.target.value })}
                >
                  <option value="">Sélectionner un type</option>
                  {chickens.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Quantité"
                  type="number"
                  min="1"
                  className="border border-gray-300 rounded-md p-2"
                  value={newOrder.quantity}
                  onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })}
                />
                <select
                  className="border border-gray-300 rounded-md p-2"
                  value={newOrder.status}
                  onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}
                >
                  <option value="En attente">En attente</option>
                  <option value="Payé">Payé</option>
                  <option value="Livré">Livré</option>
                </select>
                <button
                  className="bg-green-600 text-white rounded-md p-2 hover:bg-green-700"
                  onClick={handleAddOrder}
                >
                  Ajouter
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800 text-lg">Toutes les commandes</h3>
                <button
                  onClick={exportToCSV}
                  className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-md hover:bg-green-200"
                >
                  Exporter en CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commande</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order, index) => {
                      const chicken = chickens.find((c) => c.id === order.chickenId);
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{order.client}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{chicken?.name || "N/A"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{order.quantity}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                order.status === "Payé"
                                  ? "bg-green-100 text-green-800"
                                  : order.status === "Livré"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => printInvoice(order)} className="text-indigo-600 hover:text-indigo-900 mr-3">Facturer</button>
                            <button onClick={() => deleteOrder(order.id)} className="text-red-600 hover:text-red-900">Supprimer</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeSection === "products" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 text-lg mb-4">Ajouter un nouveau type de poulet</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  placeholder="Nom"
                  className="border border-gray-300 rounded-md p-2"
                  value={newChicken.name}
                  onChange={(e) => setNewChicken({ ...newChicken, name: e.target.value })}
                />
                <input
                  placeholder="Prix (ex: 1200 FCFA/kg)"
                  className="border border-gray-300 rounded-md p-2"
                  value={newChicken.price}
                  onChange={(e) => setNewChicken({ ...newChicken, price: e.target.value })}
                />
                <input
                  placeholder="Stock"
                  type="number"
                  min="0"
                  className="border border-gray-300 rounded-md p-2"
                  value={newChicken.stock}
                  onChange={(e) => setNewChicken({ ...newChicken, stock: e.target.value })}
                />
                <button
                  className="md:col-span-3 bg-green-600 text-white rounded-md p-2 hover:bg-green-700"
                  onClick={handleAddChicken}
                >
                  Ajouter le produit
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chickens.map((chicken, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-800 text-lg mb-2">{chicken.name}</h3>
                  <p className="text-gray-600 mb-4">{chicken.price}</p>
                  <div className="flex justify-between items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {chicken.stock} en stock
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "analytics" && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 text-lg mb-4">Statistiques de vente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-gray-700 font-medium mb-4">Ventes mensuelles</h4>
                <div className="h-64 flex items-end justify-around">
                  {[12, 18, 10, 20, 15, 25].map((value, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div
                        className="w-8 bg-green-500 rounded-t"
                        style={{ height: `${value * 8}px` }}
                      ></div>
                      <span className="text-xs mt-2 text-gray-600">Mois {i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-gray-700 font-medium mb-4">Répartition des types vendus</h4>
                <div className="h-64 flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="15" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="15"
                        strokeDasharray="125.66"
                        strokeDashoffset="31.415"
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold">
                        25%
                      </text>
                    </svg>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    <span>Poulet standard</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    <span>Poulet fermier</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                    <span>Poulet bio</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "settings" && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 max-w-3xl mx-auto">
            <h3 className="font-semibold text-gray-800 text-lg mb-6">Paramètres du système</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Votre nom ou raison sociale"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email de contact</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="+221 77 123 45 67"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <textarea
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Votre adresse complète"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  Annuler
                </button>
                <button className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 p-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} AgriPoultry - Optimisation des ventes de poulets
      </footer>

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="bg-white border-l-4 border-green-500 shadow-lg px-4 py-3 rounded-md animate-fade-in-down"
          >
            <p>{notif.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}