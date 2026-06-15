import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  FileSearch, 
  BarChart3, 
  MessageSquare, 
  IndianRupee, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Percent, 
  ShieldCheck, 
  Clock, 
  Send, 
  Search,
  ArrowRight,
  UserCheck,
  Compass
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts';

const API_BASE = "https://verifi-191i.onrender.com/api";

// Custom inline Markdown parser
const parseInline = (text) => {
  if (!text) return "";
  const parts = text.split('**');
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index}>{part}</strong>;
    }
    const codeParts = part.split('`');
    return codeParts.map((cp, cIndex) => {
      if (cIndex % 2 === 1) {
        return <code key={cIndex} style={{backgroundColor: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace'}}>{cp}</code>;
      }
      return cp;
    });
  });
};

// Custom Markdown renderer supporting Headers, Bullet Lists, and Tables
const renderMarkdown = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  let inList = false;
  let listItems = [];
  let inTable = false;
  let tableRows = [];
  const elements = [];

  const flushList = (key) => {
    if (inList && listItems.length > 0) {
      elements.push(<ul key={`list-${key}`} style={{margin: '10px 0 16px 20px'}}>{listItems}</ul>);
      listItems = [];
      inList = false;
    }
  };

  const flushTable = (key) => {
    if (inTable && tableRows.length > 0) {
      const headers = tableRows[0];
      const bodyRows = tableRows.slice(2); // Skip separator row
      elements.push(
        <div className="table-wrapper" key={`table-container-${key}`} style={{margin: '16px 0'}}>
          <table className="data-table" style={{width: '100%', borderCollapse: 'collapse', border: '1px solid rgba(255,255,255,0.08)'}}>
            <thead>
              <tr style={{backgroundColor: 'rgba(255,255,255,0.04)'}}>
                {headers.map((h, i) => <th key={i} style={{padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '0.85rem', color: '#9CA3AF'}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => <td key={j} style={{padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '0.9rem'}}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('|')) {
      flushList(i);
      inTable = true;
      const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
      tableRows.push(cells);
      continue;
    } else {
      flushTable(i);
    }

    if (line.startsWith('### ')) {
      flushList(i);
      elements.push(<h3 key={i} style={{fontSize: '1.2rem', marginTop: '18px', marginBottom: '10px', color: '#FFFFFF'}}>{parseInline(line.substring(4))}</h3>);
    } else if (line.startsWith('#### ')) {
      flushList(i);
      elements.push(<h4 key={i} style={{fontSize: '1.05rem', marginTop: '16px', marginBottom: '8px', color: '#10B981'}}>{parseInline(line.substring(5))}</h4>);
    } else if (line.startsWith('- ')) {
      inList = true;
      listItems.push(<li key={i} style={{marginBottom: '6px', color: '#D1D5DB'}}>{parseInline(line.substring(2))}</li>);
    } else if (line === '') {
      flushList(i);
    } else {
      flushList(i);
      elements.push(<p key={i} style={{marginBottom: '12px', lineHeight: '1.5', color: '#9CA3AF'}}>{parseInline(line)}</p>);
    }
  }
  flushList(lines.length);
  flushTable(lines.length);
  return elements;
};

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  
  // Data States
  const [stats, setStats] = useState({
    total_transactions: 0,
    fraud_cases: 0,
    avg_risk_score: 0,
    model_accuracy: 98.4
  });
  const [transactions, setTransactions] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({
    distribution: [],
    amount_histogram: [],
    risk_distribution: [],
    daily_trend: []
  });
  const [loading, setLoading] = useState(true);
  
  // Prediction Form State
  const [predictForm, setPredictForm] = useState({
    amt: '120.00',
    distance: '4.5',
    txn_velocity: '2',
    age: '35',
    hour: 14,
    is_online: false,
    is_international: false,
    card_present: true
  });
  const [predictResult, setPredictResult] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);
  
  // Continuous Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationRef = useRef(null);

  useEffect(() => {
    if (isSimulating) {
      simulationRef.current = setInterval(async () => {
        const isSuspicious = Math.random() < 0.15;
        const isOnline = isSuspicious ? true : Math.random() > 0.5;
        const payload = {
          amt: isSuspicious ? parseFloat((Math.random() * 4500 + 500).toFixed(2)) : parseFloat((Math.random() * 145 + 5).toFixed(2)),
          distance: isSuspicious ? parseFloat((Math.random() * 4900 + 100).toFixed(2)) : parseFloat((Math.random() * 49.5 + 0.5).toFixed(2)),
          txn_velocity: isSuspicious ? Math.floor(Math.random() * 16) + 5 : Math.floor(Math.random() * 4),
          age: Math.floor(Math.random() * 63) + 18,
          hour: isSuspicious ? [0, 1, 2, 3, 4, 5][Math.floor(Math.random() * 6)] : Math.floor(Math.random() * 18) + 6,
          is_online: isOnline,
          is_international: isSuspicious ? Math.random() > 0.5 : false,
          card_present: !isOnline
        };
        
        try {
          await fetch(`${API_BASE}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (e) {
          console.error("Simulation error", e);
        }
      }, 2500); // Send one every 2.5 seconds
    } else if (simulationRef.current) {
      clearInterval(simulationRef.current);
    }
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, [isSimulating]);
  
  // Explainability State
  const [selectedTxnId, setSelectedTxnId] = useState('');
  const [explainResult, setExplainResult] = useState(null);
  const [explainLoading, setExplainLoading] = useState(false);
  
  // Chat / AI Investigator State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'assistant',
      text: '### 👋 Welcome to the AI Investigator Console!\n\nI am your forensic co-pilot. I can audit transaction histories, outline anomaly vectors, and break down ML classifier outputs.\n\n**To audit a specific transaction, type something like:**\n- *"Explain transaction #15"* (or click "Investigate" next to any entry in the log).'
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Global Data Fetch
  const fetchData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [statsRes, txnsRes, analyticsRes] = await Promise.all([
        fetch(`${API_BASE}/stats`),
        fetch(`${API_BASE}/transactions`),
        fetch(`${API_BASE}/analytics`)
      ]);
      
      const statsVal = await statsRes.json();
      const txnsVal = await txnsRes.json();
      const analyticsVal = await analyticsRes.json();
      
      setStats(statsVal);
      setTransactions(txnsVal);
      setAnalyticsData(analyticsVal);
      
      // Auto-select the first transaction for explainability if none selected
      setSelectedTxnId(prev => {
        if (!prev && txnsVal.length > 0) return txnsVal[0].id.toString();
        return prev;
      });
    } catch (e) {
      console.error("Error loading data from API:", e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 2.5 seconds for real-time live updates
    const intervalId = setInterval(() => {
      fetchData(true);
    }, 2500);
    return () => clearInterval(intervalId);
  }, []);

  // Sync scroll for chat window
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Load individual transaction explainability
  useEffect(() => {
    if (!selectedTxnId) return;
    
    const fetchExplanation = async () => {
      try {
        setExplainLoading(true);
        const res = await fetch(`${API_BASE}/explain/${selectedTxnId}`);
        if (res.ok) {
          const data = await res.json();
          setExplainResult(data);
        }
      } catch (e) {
        console.error("Error loading explanation:", e);
      } finally {
        setExplainLoading(false);
      }
    };
    
    fetchExplanation();
  }, [selectedTxnId]);

  // Poll for prediction explainability completion if it is pending
  useEffect(() => {
    if (!predictResult || predictResult.status !== 'pending') return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/explain/${predictResult.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'completed') {
            setPredictResult(data);
            fetchData();
            if (selectedTxnId === predictResult.id.toString()) {
              setExplainResult(data);
            }
          }
        }
      } catch (err) {
        console.error("Error polling prediction explainability:", err);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [predictResult, selectedTxnId]);

  // Poll for explain target completion if it is pending
  useEffect(() => {
    if (!explainResult || explainResult.status !== 'pending') return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/explain/${explainResult.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'completed') {
            setExplainResult(data);
            fetchData();
            if (predictResult && predictResult.id === explainResult.id) {
              setPredictResult(data);
            }
          }
        }
      } catch (err) {
        console.error("Error polling explainability target:", err);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [explainResult, predictResult]);

  // Handle Predict Submit
  const handlePredictSubmit = async (e) => {
    e.preventDefault();
    try {
      setPredictLoading(true);
      const payload = {
        amt: parseFloat(predictForm.amt) || 0.0,
        distance: parseFloat(predictForm.distance) || 0.0,
        txn_velocity: parseInt(predictForm.txn_velocity) || 1,
        age: parseInt(predictForm.age) || 18,
        hour: predictForm.hour,
        is_online: predictForm.is_online,
        is_international: predictForm.is_international,
        card_present: predictForm.card_present
      };
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setPredictResult(data);
        // Refresh stats & transaction list
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPredictLoading(false);
    }
  };

  // Handle Chat Submit
  const handleChatSubmit = async (e, forceMsg = null) => {
    if (e) e.preventDefault();
    const queryText = forceMsg || chatInput;
    if (!queryText.trim()) return;

    // Append User Message
    const userMsg = { sender: 'user', text: queryText };
    setChatMessages(prev => [...prev, userMsg]);
    if (!forceMsg) setChatInput('');
    
    try {
      setChatLoading(true);
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: queryText })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { sender: 'assistant', text: data.response }]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { sender: 'assistant', text: '🛑 Error: Failed to connect to the backend server.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Helper trigger to audit transaction from log
  const auditTransaction = (id) => {
    setActivePage('investigator');
    handleChatSubmit(null, `Explain transaction #${id}`);
  };

  // Helper trigger to explain transaction
  const explainTransaction = (id) => {
    setSelectedTxnId(id.toString());
    setActivePage('explainability');
  };

  // Format Time
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoString;
    }
  };

  // SHAP Waterfall color mapping helper
  const getShapChartData = () => {
    if (!explainResult || !explainResult.shap_values) return [];
    return Object.entries(explainResult.shap_values).map(([name, val]) => ({
      name: name.replace('_', ' ').toUpperCase(),
      impact: Number(val.toFixed(4)),
      color: val >= 0 ? "#EF4444" : "#10B981" // Red for risk-increase, Green for risk-reduction
    })).sort((a, b) => b.impact - a.impact);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container" style={{ gap: '10px' }}>
          <img src="/logo.jpg" alt="VerFi Logo" className="logo-icon" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
          <span className="logo-text">VerFi</span>
        </div>
        
        <ul className="nav-links">
          <li 
            className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActivePage('dashboard')}
          >
            <Activity className="nav-icon" />
            Dashboard
          </li>
          <li 
            className={`nav-item ${activePage === 'prediction' ? 'active' : ''}`}
            onClick={() => setActivePage('prediction')}
          >
            <Compass className="nav-icon" />
            Fraud Prediction
          </li>
          <li 
            className={`nav-item ${activePage === 'analytics' ? 'active' : ''}`}
            onClick={() => setActivePage('analytics')}
          >
            <BarChart3 className="nav-icon" />
            Analytics
          </li>
          <li 
            className={`nav-item ${activePage === 'explainability' ? 'active' : ''}`}
            onClick={() => setActivePage('explainability')}
          >
            <FileSearch className="nav-icon" />
            Explainability
          </li>
          <li 
            className={`nav-item ${activePage === 'investigator' ? 'active' : ''}`}
            onClick={() => setActivePage('investigator')}
          >
            <MessageSquare className="nav-icon" />
            AI Investigator
          </li>
        </ul>
        
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">SO</div>
            <div className="user-info">
              <div className="username">SecOps Manager</div>
              <div className="role">Tier 3 Analyst</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* PAGE: DASHBOARD */}
        {activePage === 'dashboard' && (
          <div>
            <div className="page-header">
              <h1 className="page-title">SecOps Fraud Ledger</h1>
              <p className="page-subtitle">Real-time banking transaction auditing and risk analysis platform.</p>
            </div>

            {/* Metrics cards grid */}
            <div className="metrics-grid">
              <div className="metric-card total-txns">
                <div className="metric-info">
                  <h3>Total Transactions</h3>
                  <div className="metric-value">{stats.total_transactions}</div>
                </div>
                <div className="metric-icon-wrapper">
                  <TrendingUp size={24} />
                </div>
              </div>
              
              <div className="metric-card fraud-cases">
                <div className="metric-info">
                  <h3>Fraud Cases</h3>
                  <div className="metric-value">{stats.fraud_cases}</div>
                </div>
                <div className="metric-icon-wrapper">
                  <AlertTriangle size={24} />
                </div>
              </div>

              <div className="metric-card accuracy">
                <div className="metric-info">
                  <h3>Model Accuracy</h3>
                  <div className="metric-value">{stats.model_accuracy}%</div>
                </div>
                <div className="metric-icon-wrapper">
                  <UserCheck size={24} />
                </div>
              </div>

              <div className="metric-card risk-score">
                <div className="metric-info">
                  <h3>Avg Risk Score</h3>
                  <div className="metric-value">{stats.avg_risk_score}%</div>
                </div>
                <div className="metric-icon-wrapper">
                  <Percent size={24} />
                </div>
              </div>
            </div>

            {/* Dashboard Charts */}
            <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-title">
                  <span>Velocity Trend (Last 7 Days)</span>
                  <Activity size={18} style={{color: 'var(--info)'}} />
                </div>
                <div style={{width: '100%', height: 300}}>
                  {analyticsData.daily_trend.length > 0 ? (
                    <ResponsiveContainer>
                      <LineChart data={analyticsData.daily_trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" stroke="#6B7280" fontSize={11} />
                        <YAxis stroke="#6B7280" fontSize={11} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                          labelStyle={{ color: '#F9FAFB', fontWeight: 'bold' }}
                        />
                        <Legend wrapperStyle={{fontSize: 12}} />
                        <Line type="monotone" dataKey="Total Transactions" stroke="#3B82F6" strokeWidth={2.5} activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="Fraud Cases" stroke="#EF4444" strokeWidth={2.5} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)'}}>Loading chart...</div>
                  )}
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-title">
                  <span>Class Breakdown</span>
                  <ShieldCheck size={18} style={{color: 'var(--primary)'}} />
                </div>
                <div style={{width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  {analyticsData.distribution.length > 0 ? (
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={analyticsData.distribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#10B981" />
                          <Cell fill="#EF4444" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{fontSize: 11}} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{color: 'var(--text-muted)'}}>Loading data...</div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent transaction table */}
            <div className="table-card">
              <div className="chart-title" style={{marginBottom: 16}}>
                <span>Incoming Transaction Stream</span>
                <Clock size={16} style={{color: 'var(--text-secondary)'}} />
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Time</th>
                      <th>Amount</th>
                      <th>Distance</th>
                      <th>Velocity</th>
                      <th>Channel</th>
                      <th>Risk Score</th>
                      <th>Severity</th>
                      <th style={{textAlign: 'center'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 15).map(txn => (
                      <tr key={txn.id}>
                        <td style={{fontFamily: 'monospace', fontWeight: 600}}>#{txn.id}</td>
                        <td>{formatTime(txn.timestamp)}</td>
                        <td style={{fontWeight: 600}}>₹{txn.amt.toFixed(2)}</td>
                        <td>{txn.distance.toFixed(1)} km</td>
                        <td>{txn.txn_velocity}</td>
                        <td>
                          <span className={`badge ${txn.is_online ? 'fraud' : 'genuine'}`} style={{fontSize: '0.7rem', padding: '2px 8px'}}>
                            {txn.is_online ? 'Online' : 'In-Store'}
                          </span>
                        </td>
                        <td>
                          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                            <span style={{fontWeight: 600}}>{(txn.risk_score * 100).toFixed(0)}%</span>
                            <div style={{width: 50, height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden'}}>
                              <div style={{
                                width: `${txn.risk_score * 100}%`, 
                                height: '100%', 
                                backgroundColor: txn.risk_score > 0.5 ? 'var(--danger)' : txn.risk_score > 0.2 ? 'var(--warning)' : 'var(--primary)'
                              }} />
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`badge severity-${txn.severity.toLowerCase()}`}>
                              {txn.severity}
                            </span>
                            {txn.status === 'pending' && (
                              <span className="badge pending" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                Analyzing
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{textAlign: 'center'}}>
                          <div style={{display: 'flex', gap: 10, justifyContent: 'center'}}>
                            <button 
                              onClick={() => explainTransaction(txn.id)}
                              className="nav-item" 
                              style={{padding: '6px 12px', fontSize: '0.75rem', borderRadius: 6, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)'}}
                            >
                              SHAP
                            </button>
                            <button 
                              onClick={() => auditTransaction(txn.id)}
                              className="nav-item"
                              style={{padding: '6px 12px', fontSize: '0.75rem', borderRadius: 6, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--info)'}}
                            >
                              Investigate
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PAGE: FRAUD PREDICTION FORM */}
        {activePage === 'prediction' && (
          <div>
            <div className="page-header">
              <h1 className="page-title">Real-Time Prediction Engine</h1>
              <p className="page-subtitle">Trigger active machine learning evaluation on arbitrary transaction attributes.</p>
            </div>

            <div className="predict-layout">
              {/* Form Input Card */}
              <div className="input-card">
                <h3 style={{marginBottom: 20, fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: 12}}>Transaction Characteristics</h3>
                <form onSubmit={handlePredictSubmit}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Amount (₹)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="form-input" 
                        value={predictForm.amt}
                        onChange={(e) => setPredictForm({...predictForm, amt: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Distance to Merchant (km)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        className="form-input" 
                        value={predictForm.distance}
                        onChange={(e) => setPredictForm({...predictForm, distance: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Transactions (Last 24h)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={predictForm.txn_velocity}
                        onChange={(e) => setPredictForm({...predictForm, txn_velocity: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cardholder Age</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={predictForm.age}
                        onChange={(e) => setPredictForm({...predictForm, age: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Transaction Hour (0-23)</label>
                      <select 
                        className="form-input"
                        value={predictForm.hour}
                        onChange={(e) => setPredictForm({...predictForm, hour: parseInt(e.target.value)})}
                      >
                        {Array.from({length: 24}, (_, i) => (
                          <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group" style={{gridColumn: 'span 2'}}>
                      <div className="switch-group" style={{marginTop: 10}}>
                        <span className="switch-label">Online Channel (Card-Not-Present)</span>
                        <input 
                          type="checkbox" 
                          className="switch-input"
                          checked={predictForm.is_online}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setPredictForm({
                              ...predictForm, 
                              is_online: val,
                              card_present: val ? false : predictForm.card_present
                            });
                          }}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="switch-group">
                        <span className="switch-label">International</span>
                        <input 
                          type="checkbox" 
                          className="switch-input"
                          checked={predictForm.is_international}
                          onChange={(e) => setPredictForm({...predictForm, is_international: e.target.checked})}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="switch-group" style={{opacity: predictForm.is_online ? 0.5 : 1}}>
                        <span className="switch-label">Physical Card Present</span>
                        <input 
                          type="checkbox" 
                          className="switch-input"
                          disabled={predictForm.is_online}
                          checked={predictForm.card_present}
                          onChange={(e) => setPredictForm({...predictForm, card_present: e.target.checked})}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" className="btn-primary" disabled={predictLoading || isSimulating} style={{ flex: 1 }}>
                      {predictLoading ? "Scoring..." : (
                        <>
                          Predict Transaction Risk
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                    
                    <button 
                      type="button" 
                      onClick={() => setIsSimulating(!isSimulating)}
                      className={`btn-primary ${isSimulating ? 'simulating' : ''}`}
                      style={{ 
                        flex: 1, 
                        backgroundColor: isSimulating ? 'var(--danger)' : '#3B82F6',
                        borderColor: isSimulating ? 'var(--danger)' : '#3B82F6'
                      }}
                    >
                      {isSimulating ? "Stop Simulation" : "Start Continuous Flow"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Predict Output Results */}
              <div className="result-card">
                {predictResult ? (
                  <div style={{width: '100%'}}>
                    <h3 style={{fontSize: '1.25rem', marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 12}}>Risk Assessment Output</h3>
                    
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                      <div className="gauge-container">
                        <svg className="gauge-circle">
                          <circle className="gauge-bg" cx="90" cy="90" r="70" />
                          <circle 
                            className="gauge-fill" 
                            cx="90" 
                            cy="90" 
                            r="70" 
                            stroke={predictResult.risk_score > 0.5 ? "var(--danger)" : predictResult.risk_score > 0.2 ? "var(--warning)" : "var(--primary)"}
                            strokeDasharray={`${2 * Math.PI * 70 * predictResult.risk_score} ${2 * Math.PI * 70 * (1 - predictResult.risk_score)}`}
                          />
                        </svg>
                        <div className="gauge-val">
                          <span className="gauge-num">{(predictResult.risk_score * 100).toFixed(0)}%</span>
                          <span className="gauge-lbl">Risk</span>
                        </div>
                      </div>

                      <div className="status-callout">
                        <div className={`status-title ${predictResult.is_fraud ? 'fraud-text' : 'genuine-text'}`}>
                          {predictResult.is_fraud ? "FLAGGED AS FRAUDULENT" : "CLASSIFIED AS GENUINE"}
                        </div>
                        <span className={`badge severity-${predictResult.severity.toLowerCase()}`} style={{fontSize: '0.85rem', padding: '6px 14px'}}>
                          Severity: {predictResult.severity}
                        </span>
                      </div>

                      <div className="explain-summary-box" style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        minHeight: '120px', 
                        justifyContent: predictResult.status === 'pending' ? 'center' : 'flex-start',
                        alignItems: predictResult.status === 'pending' ? 'center' : 'stretch',
                        gap: '12px' 
                      }}>
                        {predictResult.status === 'pending' ? (
                          <>
                            <div className="spinning-loader" style={{
                              width: '28px',
                              height: '28px',
                              border: '3px solid rgba(255, 255, 255, 0.05)',
                              borderTop: '3px solid var(--info)',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                              Analyzing transaction vectors in background...
                            </span>
                          </>
                        ) : (
                          renderMarkdown(predictResult.ai_explanation)
                        )}
                      </div>
                      
                      <div style={{marginTop: 20, display: 'flex', gap: 12, width: '100%'}}>
                        <button 
                          onClick={() => explainTransaction(predictResult.id)}
                          className="btn-primary" 
                          disabled={predictResult.status === 'pending'}
                          style={{
                            background: 'rgba(255,255,255,0.05)', 
                            border: '1px solid rgba(255,255,255,0.08)', 
                            flex: 1, 
                            boxShadow: 'none',
                            opacity: predictResult.status === 'pending' ? 0.4 : 1,
                            cursor: predictResult.status === 'pending' ? 'not-allowed' : 'pointer'
                          }}
                        >
                          View SHAP Chart
                        </button>
                        <button 
                          onClick={() => auditTransaction(predictResult.id)}
                          className="btn-primary" 
                          disabled={predictResult.status === 'pending'}
                          style={{
                            flex: 1,
                            opacity: predictResult.status === 'pending' ? 0.4 : 1,
                            cursor: predictResult.status === 'pending' ? 'not-allowed' : 'pointer',
                            boxShadow: predictResult.status === 'pending' ? 'none' : '0 4px 14px 0 rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          Audit in Chat
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="result-placeholder">
                    <ShieldAlert size={60} strokeWidth={1} style={{color: 'var(--text-muted)'}} />
                    <div>
                      <h4 style={{fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 6}}>Awaiting Input Parameters</h4>
                      <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>Fill out the ledger transaction specifications on the left to invoke VerFi Risk Engine classification.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PAGE: ANALYTICS */}
        {activePage === 'analytics' && (
          <div>
            <div className="page-header">
              <h1 className="page-title">Platform Statistics & Analytics</h1>
              <p className="page-subtitle">Deep dive distribution reports compiled across the full transaction ledger history.</p>
            </div>

            <div className="analytics-grid">
              {/* Chart 1: Amount Distribution Histogram */}
              <div className="chart-card">
                <div className="chart-title">
                  <span>Amount Distribution</span>
                  <IndianRupee size={16} />
                </div>
                <div style={{width: '100%', height: 300}}>
                  {analyticsData.amount_histogram.length > 0 ? (
                    <ResponsiveContainer>
                      <BarChart data={analyticsData.amount_histogram}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="range" stroke="#6B7280" fontSize={11} />
                        <YAxis stroke="#6B7280" fontSize={11} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                          {analyticsData.amount_histogram.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index > 3 ? '#EF4444' : '#3B82F6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)'}}>Loading data...</div>
                  )}
                </div>
              </div>

              {/* Chart 2: Risk Score Distribution */}
              <div className="chart-card">
                <div className="chart-title">
                  <span>Risk Score Threshold Bins</span>
                  <Percent size={16} />
                </div>
                <div style={{width: '100%', height: 300}}>
                  {analyticsData.risk_distribution.length > 0 ? (
                    <ResponsiveContainer>
                      <BarChart data={analyticsData.risk_distribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="range" stroke="#6B7280" fontSize={10} />
                        <YAxis stroke="#6B7280" fontSize={11} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]}>
                          {analyticsData.risk_distribution.map((entry, index) => {
                            const colors = ["#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)'}}>Loading data...</div>
                  )}
                </div>
              </div>
            </div>

            {/* Overall statistical distributions panel */}
            <div className="table-card">
              <h3 style={{marginBottom: 16, fontSize: '1.1rem'}}>Security Operations Insights</h3>
              <p style={{fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12}}>
                Based on historical runs, transaction severity levels map directly to the platform warning triggers. Out of <strong>{stats.total_transactions}</strong> audited attempts, <strong>{stats.fraud_cases}</strong> cases were flagged as positive fraud vectors, displaying a ledger-wide vulnerability density of <strong>{((stats.fraud_cases / (stats.total_transactions || 1)) * 100).toFixed(1)}%</strong>.
              </p>
              <div style={{display: 'flex', gap: 16, flexWrap: 'wrap'}}>
                <div style={{flex: 1, minWidth: 200, padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border-color)'}}>
                  <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4}}>Card Not Present Rate</div>
                  <div style={{fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--info)'}}>
                    {((transactions.filter(t => t.is_online).length / (transactions.length || 1)) * 100).toFixed(0)}%
                  </div>
                </div>
                <div style={{flex: 1, minWidth: 200, padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border-color)'}}>
                  <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4}}>Cross-Border Rate</div>
                  <div style={{fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--warning)'}}>
                    {((transactions.filter(t => t.is_international).length / (transactions.length || 1)) * 100).toFixed(0)}%
                  </div>
                </div>
                <div style={{flex: 1, minWidth: 200, padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border-color)'}}>
                  <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4}}>Auto-Approve Rate</div>
                  <div style={{fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary)'}}>
                    {((transactions.filter(t => t.severity === 'Low').length / (transactions.length || 1)) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAGE: EXPLAINABILITY */}
        {activePage === 'explainability' && (
          <div>
            <div className="page-header">
              <h1 className="page-title">Explainer Console (SHAP)</h1>
              <p className="page-subtitle">Inspect game-theoretic model evaluations (SHAP values) and audit trails for specific transactions.</p>
            </div>

            {/* Dropdown selector for transactions */}
            <div className="explain-selector-card">
              <span style={{fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap'}}>Audit Target:</span>
              <select 
                className="explain-selector"
                value={selectedTxnId}
                onChange={(e) => setSelectedTxnId(e.target.value)}
              >
                <option value="" disabled>Select a transaction to inspect...</option>
                {transactions.map(t => (
                  <option key={t.id} value={t.id}>
                    #{t.id} - ₹{t.amt.toFixed(2)} | Risk: {(t.risk_score * 100).toFixed(0)}% | Severity: {t.severity}{t.status === 'pending' ? " [Analyzing...]" : ""} | {t.is_online ? "Online" : "In-store"}
                  </option>
                ))}
              </select>
            </div>

            {explainResult ? (
              explainResult.status === 'pending' ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '80px 24px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 16,
                  backgroundColor: 'var(--bg-card)',
                  gap: '16px',
                  width: '100%',
                  boxShadow: 'var(--shadow-glow)'
                }}>
                  <div className="spinning-loader" style={{
                    width: '36px',
                    height: '36px',
                    border: '3px solid rgba(255, 255, 255, 0.05)',
                    borderTop: '3px solid var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    Generating SHAP contributions and AI forensic report...
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    VerFi classifier calculations take around 1 second to offload, compute, and compile database records.
                  </div>
                </div>
              ) : (
                <div className="explainability-layout">
                {/* Horizontal SHAP Bar Chart */}
                <div className="chart-card">
                  <div className="chart-title">
                    <span>SHAP Feature Contribution Waterfall</span>
                    <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Base value: {explainResult.base_value ? explainResult.base_value.toFixed(3) : '0.50'}</span>
                  </div>
                  <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20}}>
                    Positive contributions (Red) drive the risk probability score up towards a fraud flag, while negative contributions (Green) pull it down towards genuine clearance.
                  </p>
                  <div style={{width: '100%', height: 350}}>
                    <ResponsiveContainer>
                      <BarChart 
                        data={getShapChartData()} 
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis type="number" stroke="#6B7280" fontSize={11} domain={['auto', 'auto']} />
                        <YAxis type="category" dataKey="name" stroke="#6B7280" fontSize={10} width={100} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                          {getShapChartData().map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Global Feature Importance list */}
                  <div style={{marginTop: 24, borderTop: '1px solid var(--border-color)', paddingTop: 20}}>
                    <div style={{fontWeight: 600, fontSize: '0.95rem', marginBottom: 12}}>Global Classifier feature Weights</div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                      {[
                        { name: "Online Channel (is_online)", weight: 28 },
                        { name: "Distance to Merchant (distance)", weight: 22 },
                        { name: "Amount (amt)", weight: 18 },
                        { name: "Transaction Velocity (txn_velocity)", weight: 12 },
                        { name: "Time of Day (hour)", weight: 10 },
                        { name: "Cardholder Age (age)", weight: 6 },
                        { name: "Cross-Border (is_international)", weight: 4 }
                      ].map((f, i) => (
                        <div key={i} style={{fontSize: '0.85rem'}}>
                          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
                            <span style={{color: 'var(--text-secondary)'}}>{f.name}</span>
                            <span style={{fontWeight: 600}}>{f.weight}%</span>
                          </div>
                          <div style={{height: 6, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 3, overflow: 'hidden'}}>
                            <div style={{height: '100%', width: `${f.weight}%`, backgroundColor: '#3B82F6'}} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Investigator side card */}
                <div className="chart-card" style={{display: 'flex', flexDirection: 'column'}}>
                  <div className="chart-title">
                    <span>Investigator Report</span>
                    <button 
                      onClick={() => auditTransaction(explainResult.id)}
                      className="nav-item" 
                      style={{padding: '6px 14px', fontSize: '0.75rem', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)'}}
                    >
                      Audit
                    </button>
                  </div>
                  {explainLoading ? (
                    <div style={{flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'}}>Re-indexing report...</div>
                  ) : (
                    <div style={{flexGrow: 1, overflowY: 'auto', maxHeight: '550px'}} className="explain-summary-box">
                      {renderMarkdown(explainResult.ai_explanation)}
                    </div>
                  )}
                </div>
              </div>
              )
            ) : (
              <div style={{textAlign: 'center', padding: 80, border: '1px dashed var(--border-color)', borderRadius: 16, backgroundColor: 'var(--bg-card)'}}>
                <FileSearch size={48} style={{color: 'var(--text-muted)', marginBottom: 16}} />
                <h3>No Target Selected</h3>
                <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 6}}>Choose a transaction from the list above to view local explainability statistics.</p>
              </div>
            )}
          </div>
        )}

        {/* PAGE: AI INVESTIGATOR CHAT */}
        {activePage === 'investigator' && (
          <div>
            <div className="page-header">
              <h1 className="page-title">AI Investigator Console</h1>
              <p className="page-subtitle">Ask questions about transaction risk details, velocity metrics, or system-wide anomalies.</p>
            </div>

            <div className="chat-card">
              <div className="chat-messages">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`chat-bubble ${msg.sender === 'user' ? 'user' : 'assistant'}`}>
                    <div className="chat-bubble-avatar">
                      {msg.sender === 'user' ? 'U' : 'AI'}
                    </div>
                    <div className="chat-bubble-content">
                      {renderMarkdown(msg.text)}
                    </div>
                  </div>
                ))}
                
                {chatLoading && (
                  <div className="chat-bubble assistant">
                    <div className="chat-bubble-avatar">AI</div>
                    <div className="chat-bubble-content" style={{color: 'var(--text-muted)'}}>
                      🕵️ Analyzing transaction data graphs...
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
              
              <form onSubmit={(e) => handleChatSubmit(e)} className="chat-input-bar">
                <input 
                  type="text" 
                  className="chat-input-field"
                  placeholder="Ask a question (e.g. 'Explain transaction #12' or 'how is the model performing?')"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                />
                <button type="submit" className="btn-send" disabled={chatLoading}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
