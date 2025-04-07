import "./index.css";
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Register from "./components/Register";
import Login from "./components/Login";
import Profile from "./components/Profile";
import TransactionDashboard from './components/TransactionDashboard';
import BitSlowMarketplace from './components/BitSlowMarketplace';
import { NotificationProvider } from './components/ui/NotificationSystem';
import { Transaction } from './types';

const ENDPOINT_URL = "http://localhost:3001/";

// Move HomePage to a separate component
const HomePage = ({ onLogin, onRegister }: { 
	onLogin: () => void; 
	onRegister: () => void;
}) => {
	return (
		<div className="min-h-screen bg-gray-100">
			<nav className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16">
						<div className="flex">
							<div className="flex-shrink-0 flex items-center">
								<h1 className="text-xl font-bold text-gray-800">BitSlow Exchange</h1>
							</div>
						</div>
						<div className="flex items-center space-x-4">
							<button
								onClick={onLogin}
								className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
							>
								Login
							</button>
							<button
								onClick={onRegister}
								className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
							>
								Register
							</button>
						</div>
					</div>
				</div>
			</nav>
			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="text-center py-12">
					<h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to BitSlow Exchange</h2>
					<p className="text-xl text-gray-600">Please login or register to start trading BitSlows</p>
				</div>
			</main>
		</div>
	);
};

// Move DashboardLayout to a separate component
const DashboardLayout = ({ user, onLogout }: {
	user: { id: number; name: string; email: string } | null;
	onLogout: () => void;
}) => {
	const navigate = useNavigate();
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		const fetchTransactions = async () => {
			try {
				const response = await fetch(ENDPOINT_URL + 'api/transactions');
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const data = await response.json();
				if (!Array.isArray(data)) {
					console.error("Received non-array data:", data);
					setTransactions([]);
				} else {
					setTransactions(data);
				}
			} catch (error) {
				console.error("Error fetching data:", error);
				setError(error instanceof Error ? error : new Error('Failed to fetch transactions'));
			} finally {
				setIsLoading(false);
			}
		};

		fetchTransactions();
	}, []);
	
	return (
		<div className="min-h-screen bg-gray-100">
			<nav className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16">
						<div className="flex">
							<div className="flex-shrink-0 flex items-center">
								<h1 className="text-xl font-bold text-gray-800">BitSlow Exchange</h1>
							</div>
							<div className="hidden sm:ml-6 sm:flex sm:space-x-8">
								<button
									onClick={() => navigate('/dashboard')}
									className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
								>
									Transactions
								</button>
								<button
									onClick={() => navigate('/marketplace')}
									className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
								>
									Marketplace
								</button>
							</div>
						</div>
						<div className="flex items-center space-x-4">
							<button
								onClick={() => navigate('/profile')}
								className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
							>
								Profile
							</button>
							<button
								onClick={onLogout}
								className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
							>
								Logout
							</button>
						</div>
					</div>
				</div>
			</nav>
			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<Routes>
					<Route 
						path="/dashboard" 
						element={
							isLoading ? (
								<div className="flex justify-center items-center h-64">
									<div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
								</div>
							) : error ? (
								<div className="text-red-500 p-4 text-center">
									Error loading transactions: {error.message}
								</div>
							) : (
								<TransactionDashboard transactions={transactions} />
							)
						} 
					/>
					<Route path="/marketplace" element={<BitSlowMarketplace />} />
					<Route path="/profile" element={<Profile user={user} />} />
				</Routes>
			</main>
		</div>
	);
};

// Create a new component for the authenticated routes
const AuthenticatedApp = () => {
	const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);
	const navigate = useNavigate();

	const handleRegister = async (formData: { name: string; email: string; password: string }) => {
		try {
			const response = await fetch(ENDPOINT_URL + 'api/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Registration failed');
			}

			const userData = await response.json();
			setUser(userData);
			return userData;
		} catch (error) {
			throw error;
		}
	};

	const handleLogin = async (formData: { email: string; password: string }) => {
		try {
			const response = await fetch(ENDPOINT_URL + 'api/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Login failed');
			}

			const userData = await response.json();
			setUser(userData);
			return userData;
		} catch (error) {
			throw error;
		}
	};

	const handleLogout = () => {
		setUser(null);
		navigate('/');
	};

	return (
		<Routes>
			<Route
				path="/"
				element={
					!user ? (
						<HomePage
							onLogin={() => navigate('/login')}
							onRegister={() => navigate('/register')}
						/>
					) : (
						<Navigate to="/dashboard" replace />
					)
				}
			/>
			<Route
				path="/login"
				element={
					!user ? (
						<Login
							onLogin={async (data) => {
								await handleLogin(data);
								navigate('/dashboard');
							}}
							onCancel={() => navigate('/')}
						/>
					) : (
						<Navigate to="/dashboard" replace />
					)
				}
			/>
			<Route
				path="/register"
				element={
					!user ? (
						<Register
							onRegister={async (data) => {
								await handleRegister(data);
								navigate('/dashboard');
							}}
							onCancel={() => navigate('/')}
						/>
					) : (
						<Navigate to="/dashboard" replace />
					)
				}
			/>
			<Route
				path="/*"
				element={
					user ? (
						<DashboardLayout user={user} onLogout={handleLogout} />
					) : (
						<Navigate to="/" replace />
					)
				}
			/>
		</Routes>
	);
};

export const App = () => {
	return (
		<Router>
			<NotificationProvider>
				<AuthenticatedApp />
			</NotificationProvider>
		</Router>
	);
};

export default App;
