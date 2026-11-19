import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { useCafe } from './context/CafeContext.jsx';
import Logo from './components/Logo.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Menu from './pages/Menu.jsx';
import Cart from './pages/Cart.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Rewards from './pages/Rewards.jsx';
import Passport from './pages/Passport.jsx';
import Gifts from './pages/Gifts.jsx';
import Passes from './pages/Passes.jsx';
import TableLanding from './pages/TableLanding.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Account from './pages/Account.jsx';
import ComingSoon from './pages/ComingSoon.jsx';
import NotFound from './pages/NotFound.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';
import AdminOrders from './admin/AdminOrders.jsx';
import AdminMenu from './admin/AdminMenu.jsx';
import AdminCustomers from './admin/AdminCustomers.jsx';
import AdminPromotions from './admin/AdminPromotions.jsx';
import AdminGiftsPasses from './admin/AdminGiftsPasses.jsx';
import AdminTables from './admin/AdminTables.jsx';

const MIN_LOADING_MS = 2200; // keep the coffee cup on screen long enough to enjoy it

export function AppRoutes() {
  return (
    <Routes>
      {/* Customer app (phone layout with bottom navigation) */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="menu" element={<Menu />} />
        <Route path="cart" element={<Cart />} />
        <Route path="account" element={<Account />} />
        <Route path="table/:number" element={<TableLanding />} />

        {/* Signed-in customers only */}
        <Route element={<ProtectedRoute />}>
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="passport" element={<Passport />} />
          <Route path="gifts" element={<Gifts />} />
          <Route path="passes" element={<Passes />} />
        </Route>
      </Route>

      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />

      {/* Admin only */}
      <Route path="admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="menu" element={<AdminMenu />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="promotions" element={<AdminPromotions />} />
        <Route path="gifts" element={<AdminGiftsPasses />} />
        <Route path="tables" element={<AdminTables />} />
        <Route path="*" element={<ComingSoon title="Page not found" note="This admin page does not exist." />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  const { loading, error } = useCafe();
  const { loading: authLoading } = useAuth();
  const [minDone, setMinDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), MIN_LOADING_MS);
    return () => clearTimeout(t);
  }, []);

  if (loading || authLoading || !minDone) return <LoadingScreen />;

  if (error) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-130 flex-col items-center justify-center gap-4 bg-cream p-6 text-center">
        <Logo tone="dark" className="w-40" />
        <p className="text-danger">{error}</p>
        <button className="btn" onClick={() => window.location.reload()}>Try again</button>
      </div>
    );
  }

  return <AppRoutes />;
}