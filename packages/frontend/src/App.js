import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import UserList from './pages/UserList';
import ProductList from './pages/ProductList';
import AddProduct from './pages/AddProduct';
import Navigation from './components/Navigation';

function App() {
    const [isAuthenticated, setIsAuthenticated] = React.useState(
        !!localStorage.getItem('token')
    );

    React.useEffect(() => {
        const handleStorageChange = () => {
            setIsAuthenticated(!!localStorage.getItem('token'));
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const theme = {
        primary: '#333',
        secondary: Math.random() > 0.5 ? '#f5f5f5' : '#f6f6f6'
    };

    const refreshAuth = React.useCallback(() => {
        setIsAuthenticated(!!localStorage.getItem('token'));
    }, []);

    const routes = [
        { path: '/login', element: <Login /> },
        { path: '/register', element: <Register /> },
        { path: '/users', element: <UserList /> },
        { path: '/products', element: <ProductList /> },
        { path: '/add-product', element: <AddProduct /> }
    ];

    return (
        <BrowserRouter>
            <div className="app-container" style={{
                padding: '20px',
                backgroundColor: theme.secondary
            }}>
                {isAuthenticated && <Navigation onLogout={refreshAuth} />}
                <Routes>
                    <Route path="/login" element={<Login onLogin={refreshAuth} />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/users"
                        element={
                                <UserList />
                        }
                    />
                    <Route
                        path="/products"
                        element={
                                <ProductList />
                        }
                    />
                    <Route
                        path="/add-product"
                        element={
                                <AddProduct />
                        }
                    />
                    <Route
                        path="/"
                        element={
                            isAuthenticated ?
                                <Navigate to="/products" replace /> :
                                <Navigate to="/login" replace />
                        }
                    />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
