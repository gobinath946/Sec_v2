import { BrowserRouter as Router } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <header className="bg-primary text-white p-4">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold">Secure Gateway</h1>
            <p className="text-sm">E-sign Platform</p>
          </div>
        </header>
        <main className="container mx-auto p-4">
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-accent mb-4">
              Welcome to Secure Gateway
            </h2>
            <p className="text-gray-600">
              Multi-tenant electronic signature platform
            </p>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
