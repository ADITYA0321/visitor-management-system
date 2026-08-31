import { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext(null);

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}


export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Safety check: Agar kisi ne Provider ke bahar useAuth call kar diya
  if (!context) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }
  
  return context;
};