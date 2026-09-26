import { BrowserRouter } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";

import AppRoutes from "./components/AppRoutes";
import { AuthProvider } from "./contexts/AuthContext";
import { TestAccessProvider } from "./contexts/TestAccessContext";
import { TestAccessGate } from "./components/TestAccess";

function App() {
  return (
    <TestAccessProvider>
      <AuthProvider>
        <BrowserRouter>
          <TestAccessGate>
            <Header />
            <main className="app-main">
              <AppRoutes />
            </main>
            <Footer />
          </TestAccessGate>
        </BrowserRouter>
      </AuthProvider>
    </TestAccessProvider>
  );
}

export default App;
