import { BrowserRouter } from "react-router-dom";
import { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";

import AppRoutes from "./components/AppRoutes.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { TestAccessProvider } from "./contexts/TestAccessContext.jsx";
import { TestAccessGate } from "./components/TestAccess.jsx";

function App() {
  // Owned here (as before) and passed down for the Login route; the real
  // session state lives in AuthProvider.
  const [user, setUser] = useState(null);

  return (
    <TestAccessProvider>
      <AuthProvider>
        <BrowserRouter>
          <TestAccessGate>
            <Header />
            <main className="app-main">
              <AppRoutes user={user} setUser={setUser} />
            </main>
            <Footer />
          </TestAccessGate>
        </BrowserRouter>
      </AuthProvider>
    </TestAccessProvider>
  );
}

export default App;
