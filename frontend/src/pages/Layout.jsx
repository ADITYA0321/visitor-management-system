import { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarDays,
  Ticket,
  ScanLine,
  FileBarChart,
  LogOut,
  Menu,
  X,
  ShieldCheck
} from "lucide-react";

function Layout() {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const navItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Visitors",
    path: "/visitors",
    icon: Users,
  },
  {
    name: "Add Visitor",
    path: "/add-visitor",
    icon: UserPlus,
  },
  {
    name: "Appointments",
    path: "/appointments",
    icon: CalendarDays,
  },
  {
    name: "Passes",
    path: "/passes",
    icon: Ticket,
  },
  {
  name: "Check In / Out",
  path: "/check-in",
  icon: ScanLine,
},
{
  name: "Reports",
  path: "/reports",
  icon: FileBarChart,
},
];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col md:flex-row relative overflow-hidden font-sans">
      {/* 🌌 Background Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-purple-900/20 blur-[130px] rounded-full pointer-events-none" />

      {/* 📱 Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#161b22]/90 border-b border-gray-800/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-lg flex items-center justify-center font-bold">
            V
          </div>
          <span className="font-bold text-white tracking-wide">VisitorMS</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-gray-400 hover:text-white"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 🖥️ Sidebar Navigation */}
      <aside
        className={`fixed md:static top-0 left-0 h-full w-64 bg-[#161b22]/95 backdrop-blur-md border-r border-gray-800/80 p-5 flex flex-col justify-between z-40 transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          {/* App Branding */}
          <div className="hidden md:flex items-center gap-3 pb-6 mb-6 border-b border-gray-800/80">
            <div className="w-9 h-9 bg-purple-600/20 border border-purple-500/40 text-purple-400 rounded-xl flex items-center justify-center text-lg font-bold shadow-lg shadow-purple-900/40">
              V
            </div>
            <div>
              <h1 className="font-bold text-white tracking-tight">VisitorMS</h1>
              <span className="text-[10px] text-purple-400 font-semibold tracking-wider uppercase block">
                Management Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 mt-10 md:mt-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                    active
                      ? "bg-purple-600/20 border border-purple-500/40 text-purple-300 shadow-md shadow-purple-900/20"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                  }`}
                >
                  <Icon size={18} className={active ? "text-purple-400" : "text-gray-400"} />
                  {item.name}
                </Link>
              );
            })}

            {/* Admin Section */}
            {user?.role === "admin" && (
              <div className="pt-4 mt-4 border-t border-gray-800/80">
                <span className="px-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Admin Control
                </span>
                <Link
                  to="/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition"
                >
                  <ShieldCheck size={18} className="text-gray-400" />
                  User Management
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* User Info & Logout Footer */}
        <div className="pt-4 border-t border-gray-800/80">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.name || "User"}</p>
              <p className="text-[11px] text-gray-400 truncate">{user?.email || "N/A"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-lg transition"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      {/* 📄 Dynamic Page Content Area */}
      <main className="flex-1 overflow-y-auto z-10 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;