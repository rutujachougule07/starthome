import React, { useState, useRef } from 'react';
import {
  LogOut, ClipboardList, Users, History, BarChart2, Plus, Package, FileText,
  CheckCircle, Edit2, Trash2, Box, Activity, Clock, AlertCircle, Save, X, Warehouse
} from 'lucide-react';
import './styles.css';
import { getAutoProductImage } from './utils/autoProductImage';

const LOW_STOCK_THRESHOLD = 10;

function StockModal({ type, items, onClose }: any) {
  const isLow = type === 'low';
  const title = isLow ? 'Low Stock Items' : 'High Stock Items';
  const accentColor = isLow ? '#ef4444' : '#10b981';
  const bgColor = isLow ? '#fee2e2' : '#d1fae5';
  return (
    <div className="Modal-overlay" onClick={onClose}>
      <div className="Modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="Modal-header" style={{ borderBottom: `3px solid ${accentColor}` }}>
          <span style={{ color: accentColor, fontWeight: 700, fontSize: 16 }}>{title}</span>
          <button className="Modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="Modal-body">
          {items.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No items in this category.</p>
          ) : items.map((item: any) => (
            <div key={item.id} className="Modal-item">
              <div className="Modal-item-left">
                <img src={getAutoProductImage(item.product, item.brand, item.category, item.image)} alt={item.imageAlt || item.product} className="Product-image" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.product}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.sku} · {item.category}</div>
                </div>
              </div>
              <div className="Modal-item-badge" style={{ backgroundColor: bgColor, color: accentColor }}>Qty: {item.qty}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const emptyForm = { product: '', brand: '', sku: '', imageUrl: '', category: 'Electronics', qty: '', cost: '', incentivePerUnit: '', supplier: '', date: '', status: 'Verified' };

function App() {
  const [activeTab, setActiveTab] = useState('Stocking Inventory');
  const [activeGodown, setActiveGodown] = useState('Godown 1'); // Godown switcher
  const [stockModal, setStockModal] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [editId, setEditId] = useState(null);
  const fileInputRef = useRef(null);

  // Separate inventory for each godown
  const [godown1Inventory, setGodown1Inventory] = useState<any[]>([]);
  const [godown2Inventory, setGodown2Inventory] = useState<any[]>([]);

  // Get current inventory based on selected godown
  const currentInventory = activeGodown === 'Godown 1' ? godown1Inventory : godown2Inventory;
  const setCurrentInventory = activeGodown === 'Godown 1' ? setGodown1Inventory : setGodown2Inventory;

  // Calculate stats for current godown
  const totalStock = currentInventory.length;
  const lowStockCount = currentInventory.filter(i => i.qty < LOW_STOCK_THRESHOLD).length;
  const highStockCount = currentInventory.filter(i => i.qty >= LOW_STOCK_THRESHOLD).length;
  const formatINR = (amt: number) => '₹' + Number(amt).toLocaleString('en-IN');
  // Tasks state (same for both godowns)
  const [tasks, setTasks] = useState<any[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const emptyTask = { title: '', assignee: '', priority: 'High', assignDate: '', due: '', desc: '', status: 'Pending' };
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [editTaskId, setEditTaskId] = useState(null);

  // Employees state (same for both godowns)
  const [employees, setEmployees] = useState<any[]>([]);
  const [showEmpForm, setShowEmpForm] = useState(false);
  const emptyEmp = { name: '', role: '', dept: '', email: '', status: 'Active' };
  const [empForm, setEmpForm] = useState(emptyEmp);
  const [editEmpId, setEditEmpId] = useState(null);

  const handleTabChange = (tab: string) => { 
    setActiveTab(tab); 
    setShowAddForm(false); 
    setShowTaskForm(false); 
    setShowEmpForm(false); 
    setEditId(null); 
    setEditTaskId(null); 
    setEditEmpId(null); 
  };

  const handleGodownChange = (godown: string) => {
    setActiveGodown(godown);
    setShowAddForm(false);
    setEditId(null);
  };

  // ---- Inventory handlers ----
  const handleFormChange = (e: any) => { setFormData(p => ({ ...p, [e.target.name]: e.target.value })); setFormError(''); };

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev: any) => setFormData(p => ({ ...p, imageUrl: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const openAddForm = () => { setFormData(emptyForm); setEditId(null); setFormError(''); setShowAddForm(true); };

  const openEditForm = (item: any) => {
    setFormData({ product: item.product, brand: item.brand || '', sku: item.sku, imageUrl: item.image || '', category: item.category, qty: item.qty, cost: item.cost, incentivePerUnit: item.incentivePerUnit, supplier: item.supplier, date: '', status: item.status });
    setEditId(item.id); setFormError(''); setShowAddForm(true);
  };

  const handleSaveProduct = (e: any) => {
    e.preventDefault();
    const { product, brand, sku, qty, cost, incentivePerUnit, supplier, date, status } = formData;
    if (!product || !sku || !qty || !cost || !incentivePerUnit || !supplier || (!date && !editId)) { setFormError('Please fill in all required fields.'); return; }
    if (editId) {
      setCurrentInventory((prev: any) => prev.map((item: any) => item.id === editId ? { ...item, product, brand, sku, category: formData.category, qty: parseInt(qty), cost: parseFloat(cost), incentivePerUnit: parseFloat(incentivePerUnit), supplier, status, image: formData.imageUrl || item.image } : item));
    } else {
      const dateStr = date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
      // Generate SKU prefix based on godown
      const skuPrefix = activeGodown === 'Godown 1' ? 'GD1-' : 'GD2-';
      const finalSku = sku.startsWith(skuPrefix) ? sku : `${skuPrefix}${sku}`;
      setCurrentInventory((prev: any) => [...prev, { id: Date.now(), image: formData.imageUrl || null, imageAlt: product, product, brand, sku: finalSku, category: formData.category, qty: parseInt(qty), cost: parseFloat(cost), incentivePerUnit: parseFloat(incentivePerUnit), supplier, date: dateStr, status }]);
    }
    setShowAddForm(false); setFormData(emptyForm); setEditId(null); setFormError('');
  };

  const handleDeleteItem = (id: number) => { if (window.confirm('Delete this item?')) setCurrentInventory((prev: any) => prev.filter((i: any) => i.id !== id)); };
  // ---- Task handlers ----
  const handleTaskChange = (e: any) => setTaskForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const openAddTask = () => { setTaskForm(emptyTask); setEditTaskId(null); setShowTaskForm(true); };
  const openEditTask = (t: any) => { setTaskForm({ title: t.title, assignee: t.assignee, priority: t.priority, assignDate: t.assignDate, due: t.due, desc: t.desc, status: t.status }); setEditTaskId(t.id); setShowTaskForm(true); };
  const handleSaveTask = (e: any) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.due || !taskForm.assignDate) return;
    if (editTaskId) {
      setTasks(prev => prev.map(t => t.id === editTaskId ? { ...t, ...taskForm } : t));
    } else {
      setTasks(prev => [...prev, { id: Date.now(), ...taskForm }]);
    }
    setShowTaskForm(false); setTaskForm(emptyTask); setEditTaskId(null);
  };
  const handleDeleteTask = (id: number) => { if (window.confirm('Delete this task?')) setTasks(prev => prev.filter(t => t.id !== id)); };

  // ---- Employee handlers ----
  const handleEmpChange = (e: any) => setEmpForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const openAddEmp = () => { setEmpForm(emptyEmp); setEditEmpId(null); setShowEmpForm(true); };
  const openEditEmp = (emp: any) => { setEmpForm({ name: emp.name, role: emp.role, dept: emp.dept, email: emp.email, status: emp.status }); setEditEmpId(emp.id); setShowEmpForm(true); };
  const handleSaveEmp = (e: any) => {
    e.preventDefault();
    if (!empForm.name || !empForm.role || !empForm.email) return;
    const initials = empForm.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['var(--accent-orange)', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b'];
    if (editEmpId) {
      setEmployees(prev => prev.map(emp => emp.id === editEmpId ? { ...emp, ...empForm, initials } : emp));
    } else {
      setEmployees(prev => [...prev, { id: Date.now(), initials, color: colors[prev.length % colors.length], ...empForm }]);
    }
    setShowEmpForm(false); setEmpForm(emptyEmp); setEditEmpId(null);
  };
  const handleDeleteEmp = (id: number) => { if (window.confirm('Delete this employee?')) setEmployees(prev => prev.filter(e => e.id !== id)); };

  // ---- Product Form ----
  const renderProductForm = () => (
    <div className="Inline-form-card">
      <div className="Inline-form-title">{editId ? 'Edit Product' : `Add New Product - ${activeGodown}`}</div>
      <form onSubmit={handleSaveProduct}>
        <div className="Inline-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div className="Form-group">
            <label>PRODUCT NAME *</label>
            <input className="Form-input" name="product" value={formData.product} onChange={handleFormChange} placeholder="e.g. Wireless Headset X200" />
          </div>
          <div className="Form-group">
            <label>BRAND</label>
            <input className="Form-input" name="brand" value={formData.brand || ''} onChange={handleFormChange} placeholder="e.g. Samsung, Havells" />
          </div>
          <div className="Form-group">
            <label>SKU * (Auto-prefixed)</label>
            <input className="Form-input" name="sku" value={formData.sku} onChange={handleFormChange} placeholder={`Will be ${activeGodown === 'Godown 1' ? 'GD1-' : 'GD2-'}YOUR_SKU`} />
          </div>
        </div>
        <div className="Inline-form-grid" style={{ marginTop: 12 }}>
          <div className="Form-group">
            <label>PRODUCT IMAGE URL</label>
            <input className="Form-input" name="imageUrl" value={formData.imageUrl} onChange={handleFormChange} placeholder="https://example.com/image.jpg" />
          </div>

        </div>
        <div className="Inline-form-grid-4" style={{ marginTop: 12 }}>
          <div className="Form-group">
            <label>CATEGORY</label>
            <select className="Form-select" name="category" value={formData.category} onChange={handleFormChange}>
              <option>Electronics</option><option>Appliances</option><option>Furniture</option><option>Other</option>
            </select>
          </div>
          <div className="Form-group">
            <label>QUANTITY *</label>
            <input className="Form-input" name="qty" type="number" min="0" value={formData.qty} onChange={handleFormChange} placeholder="0" />
          </div>
          <div className="Form-group">
            <label>UNIT COST (₹) *</label>
            <input className="Form-input" name="cost" type="number" min="0" value={formData.cost} onChange={handleFormChange} placeholder="0.00" />
          </div>
          <div className="Form-group">
            <label>INCENTIVE/UNIT (₹) *</label>
            <input className="Form-input" name="incentivePerUnit" type="number" min="0" value={formData.incentivePerUnit} onChange={handleFormChange} placeholder="0.00" />
          </div>
        </div>
        <div className="Inline-form-grid-3" style={{ marginTop: 12 }}>
          <div className="Form-group">
            <label>SUPPLIER *</label>
            <input className="Form-input" name="supplier" value={formData.supplier} onChange={handleFormChange} placeholder="Supplier Name" />
          </div>
          <div className="Form-group">
            <label>STOCK DATE {!editId && '*'}</label>
            <input className="Form-input" name="date" type="date" value={formData.date} onChange={handleFormChange} />
          </div>
          <div className="Form-group">
            <label>STATUS</label>
            <select className="Form-select" name="status" value={formData.status} onChange={handleFormChange}>
              <option>Verified</option><option>Pending</option><option>Rejected</option>
            </select>
          </div>
        </div>
        {formError && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{formError}</p>}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button type="submit" className="Btn-primary"><Save size={16} /> {editId ? 'Save Changes' : 'Save Entry'}</button>
          <button type="button" className="Btn-cancel" onClick={() => { setShowAddForm(false); setFormData(emptyForm); setEditId(null); setFormError(''); }}><X size={16} /> Cancel</button>
        </div>
      </form>
    </div>
  );
  const renderContent = () => {
    switch (activeTab) {
      case 'Stocking Inventory':
        return (
          <>
            {/* Godown Switcher */}
            <div className="Godown-switcher" style={{ marginBottom: 20 }}>
              <div className="Godown-tabs">
                <button 
                  className={`Godown-tab ${activeGodown === 'Godown 1' ? 'active' : ''}`}
                  onClick={() => handleGodownChange('Godown 1')}
                >
                  <Warehouse size={16} /> Godown 1
                </button>
                <button 
                  className={`Godown-tab ${activeGodown === 'Godown 2' ? 'active' : ''}`}
                  onClick={() => handleGodownChange('Godown 2')}
                >
                  <Warehouse size={16} /> Godown 2
                </button>
              </div>
            </div>

            {showAddForm && renderProductForm()}
            <div className="Table-container">
              <div className="Table-header"><FileText size={18} color="var(--text-muted)" /> {activeGodown} Inventory Register</div>
              <table className="Data-table">
                <thead><tr><th>IMAGE</th><th>PRODUCT</th><th>SKU</th><th>CATEGORY</th><th>QTY</th><th>COST</th><th>INCENTIVE/UNIT</th><th>TOTAL VALUE</th><th>SUPPLIER</th><th>DATE</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
                <tbody>
                  {currentInventory.map((item: any) => (
                    <tr key={item.id}>
                      <td><img src={getAutoProductImage(item.product, item.brand, item.category, item.image)} alt={item.imageAlt || item.product} className="Product-image" /></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.product}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Brand: {item.brand || '—'}</div>
                      </td>
                      <td>{item.sku}</td><td>{item.category}</td><td>{item.qty}</td>
                      <td>{formatINR(item.cost)}</td><td>{formatINR(item.incentivePerUnit)}</td><td>{formatINR(item.qty * item.cost)}</td>
                      <td>{item.supplier}</td><td style={{ whiteSpace: 'nowrap' }}>{item.date}</td>
                      <td><span className="Badge-verified">{item.status}</span></td>
                      <td><div className="Action-buttons">
                        <Edit2 size={16} style={{ cursor: 'pointer', color: 'var(--accent-orange)' }} onClick={() => openEditForm(item)} />
                        <Trash2 size={16} style={{ cursor: 'pointer' }} onClick={() => handleDeleteItem(item.id)} />
                      </div></td>
                    </tr>
                  ))}
                  {currentInventory.length === 0 && <tr><td colSpan={12} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No inventory items found.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        );

      case 'Task Assign':
        return (
          <>
            {showTaskForm && (
              <div className="Inline-form-card" style={{ marginBottom: 24 }}>
                <div className="Inline-form-title">{editTaskId ? 'Edit Task' : 'Assign New Task'}</div>
                <form onSubmit={handleSaveTask}>
                  <div className="Form-group">
                    <label>TASK TITLE *</label>
                    <input className="Form-input" name="title" value={taskForm.title} onChange={handleTaskChange} placeholder="e.g. Audit Shelf 4" />
                  </div>
                  <div className="Inline-form-grid" style={{ marginTop: 12 }}>
                    <div className="Form-group">
                      <label>ASSIGN DATE *</label>
                      <input className="Form-input" name="assignDate" type="date" value={taskForm.assignDate} onChange={handleTaskChange} />
                    </div>
                    <div className="Form-group">
                      <label>DUE DATE *</label>
                      <input className="Form-input" name="due" type="date" value={taskForm.due} onChange={handleTaskChange} />
                    </div>
                  </div>
                  <div className="Inline-form-grid-3" style={{ marginTop: 12 }}>
                    <div className="Form-group">
                      <label>ASSIGNEE</label>
                      <select className="Form-select" name="assignee" value={taskForm.assignee} onChange={handleTaskChange}>
                        {employees.map(e => <option key={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                    <div className="Form-group">
                      <label>PRIORITY</label>
                      <select className="Form-select" name="priority" value={taskForm.priority} onChange={handleTaskChange}>
                        <option>High</option><option>Medium</option><option>Low</option>
                      </select>
                    </div>
                    <div className="Form-group">
                      <label>STATUS</label>
                      <select className="Form-select" name="status" value={taskForm.status || 'Pending'} onChange={handleTaskChange}>
                        <option>Pending</option><option>In Progress</option><option>Completed</option>
                      </select>
                    </div>
                  </div>
                  <div className="Form-group" style={{ marginTop: 12 }}>
                    <label>DESCRIPTION</label>
                    <textarea className="Form-input" name="desc" value={taskForm.desc} onChange={handleTaskChange} rows={2} placeholder="Task details..." />
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <button type="submit" className="Btn-primary"><Save size={16} /> {editTaskId ? 'Save Changes' : 'Assign Task'}</button>
                    <button type="button" className="Btn-cancel" onClick={() => { setShowTaskForm(false); setTaskForm(emptyTask); setEditTaskId(null); }}><X size={16} /> Cancel</button>
                  </div>
                </form>
              </div>
            )}
            <div className="Table-container">
              <div className="Table-header"><ClipboardList size={18} color="var(--text-muted)" /> Task Register</div>
              <table className="Data-table">
                <thead>
                  <tr><th>TITLE</th><th>ASSIGNEE</th><th>PRIORITY</th><th>ASSIGN DATE</th><th>DUE DATE</th><th>STATUS</th><th>DESCRIPTION</th><th>ACTIONS</th></tr>
                </thead>
                <tbody>
                  {tasks.map((t: any) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.title}</td>
                      <td>{t.assignee}</td>
                      <td><span className={`Badge-priority Priority-${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                      <td>{t.assignDate || '—'}</td>
                      <td>{t.due}</td>
                      <td><span className="Badge-status">{t.status || 'Pending'}</span></td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</td>
                      <td>
                        <div className="Action-buttons">
                          <Edit2 size={16} style={{ cursor: 'pointer', color: 'var(--accent-orange)' }} onClick={() => openEditTask(t)} />
                          <Trash2 size={16} style={{ cursor: 'pointer' }} onClick={() => handleDeleteTask(t.id)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {tasks.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No tasks assigned yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        );
      case 'Employees':
        return (
          <>
            {showEmpForm && (
              <div className="Inline-form-card" style={{ marginBottom: 24, maxWidth: 700 }}>
                <div className="Inline-form-title">{editEmpId ? 'Edit Employee' : 'Add New Employee'}</div>
                <form onSubmit={handleSaveEmp}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                    <div className="Form-group"><label>FULL NAME *</label><input className="Form-input" name="name" value={empForm.name} onChange={handleEmpChange} placeholder="e.g. Amit Sharma" /></div>
                    <div className="Form-group"><label>ROLE *</label><input className="Form-input" name="role" value={empForm.role} onChange={handleEmpChange} placeholder="e.g. Store Manager" /></div>
                    <div className="Form-group"><label>DEPARTMENT</label><input className="Form-input" name="dept" value={empForm.dept} onChange={handleEmpChange} placeholder="e.g. Operations" /></div>
                    <div className="Form-group"><label>EMAIL *</label><input className="Form-input" name="email" type="email" value={empForm.email} onChange={handleEmpChange} placeholder="name@smartops.com" /></div>
                    <div className="Form-group"><label>STATUS</label><select className="Form-select" name="status" value={empForm.status} onChange={handleEmpChange}><option>Active</option><option>Inactive</option></select></div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <button type="submit" className="Btn-primary"><Save size={16} /> {editEmpId ? 'Save Changes' : 'Add Employee'}</button>
                    <button type="button" className="Btn-cancel" onClick={() => { setShowEmpForm(false); setEmpForm(emptyEmp); setEditEmpId(null); }}><X size={16} /> Cancel</button>
                  </div>
                </form>
              </div>
            )}
            <div className="Table-container">
              <div className="Table-header"><Users size={18} color="var(--text-muted)" /> Active Employees</div>
              <table className="Data-table">
                <thead><tr><th>EMPLOYEE</th><th>ROLE</th><th>DEPARTMENT</th><th>CONTACT</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
                <tbody>
                  {employees.map((emp: any) => (
                    <tr key={emp.id}>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div className="Avatar" style={{ width: 32, height: 32, fontSize: 12, backgroundColor: emp.color }}>{emp.initials}</div><span style={{ fontWeight: 600 }}>{emp.name}</span></div></td>
                      <td>{emp.role}</td><td>{emp.dept}</td><td>{emp.email}</td>
                      <td><span className="Badge-verified" style={{ color: emp.status === 'Active' ? 'var(--accent-green)' : '#ef4444' }}>{emp.status}</span></td>
                      <td><div className="Action-buttons">
                        <Edit2 size={16} style={{ cursor: 'pointer', color: 'var(--accent-orange)' }} onClick={() => openEditEmp(emp)} />
                        <Trash2 size={16} style={{ cursor: 'pointer' }} onClick={() => handleDeleteEmp(emp.id)} />
                      </div></td>
                    </tr>
                  ))}
                  {employees.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No employees found.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        );

      case 'History':
        return (
          <div className="History-list" style={{ maxWidth: 800 }}>
            <h3 style={{ marginBottom: 24 }}>System Activity Log</h3>
            <div className="History-item"><div className="History-icon"><Package size={20} /></div><div className="History-content"><h4>Stock Updated</h4><p>Admin User added 15 units of "Ceiling Fan" to Godown 1.</p><div className="History-time">10 mins ago</div></div></div>
            <div className="History-item"><div className="History-icon" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}><Users size={20} /></div><div className="History-content"><h4>New Employee Registered</h4><p>Super Admin created a new profile for Priya Patel.</p><div className="History-time">2 hours ago</div></div></div>
            <div className="History-item"><div className="History-icon" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}><AlertCircle size={20} /></div><div className="History-content"><h4>System Alert</h4><p>Low stock warning for SKU: GD1-WM001 (Washing Machine) in Godown 1.</p><div className="History-time">Yesterday</div></div></div>
          </div>
        );

      case 'Reports':
        return (
          <div className="Report-grid">
            <div className="Report-card"><h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={20} color="var(--accent-orange)" /> Sales Performance</h3><p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Monthly overview of all converted sales across departments.</p><div style={{ height: 200, backgroundColor: '#f8fafc', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #cbd5e1' }}><span style={{ color: '#94a3b8', fontWeight: 500 }}>Chart Visualization Area</span></div></div>
            <div className="Report-card"><h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={20} color="var(--accent-orange)" /> Inventory Turnover</h3><p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Speed at which inventory is sold and replaced over a year.</p><div style={{ height: 200, backgroundColor: '#f8fafc', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #cbd5e1' }}><span style={{ color: '#94a3b8', fontWeight: 500 }}>Chart Visualization Area</span></div></div>
          </div>
        );

      default: return null;
    }
  };

  const handleAddNew = () => {
    if (activeTab === 'Stocking Inventory') openAddForm();
    else if (activeTab === 'Task Assign') openAddTask();
    else if (activeTab === 'Employees') openAddEmp();
  };

  const showAddBtn = !showAddForm && !showTaskForm && !showEmpForm;
  return (
    <div className="App">
      <nav className="Navbar">
        <div className="Nav-brand"><div className="Brand-icon"><Package size={18} strokeWidth={2.5} /></div>Smart Ops</div>
      </nav>

      <div className="Layout-body">
        <aside className="Sidebar">
          <div className="Profile-section">
            <div className="Avatar">SA</div>
            <div className="Profile-info"><span className="Profile-name">Admin User</span><span className="Profile-role">Administrator</span></div>
          </div>
          <div className="Nav-section">
            <div className="Nav-title">Inventory & Sales</div>
            <ul className="Nav-menu">
              <li className={`Nav-item ${activeTab === 'Stocking Inventory' ? 'active' : ''}`} onClick={() => handleTabChange('Stocking Inventory')}><Box size={18} /> Stocking Inventory</li>
              <li className={`Nav-item ${activeTab === 'Task Assign' ? 'active' : ''}`} onClick={() => handleTabChange('Task Assign')}><ClipboardList size={18} /> Task Assign</li>
            </ul>
          </div>
          <div className="Nav-section">
            <div className="Nav-title">Data & Logs</div>
            <ul className="Nav-menu">
              <li className={`Nav-item ${activeTab === 'Employees' ? 'active' : ''}`} onClick={() => handleTabChange('Employees')}><Users size={18} /> Employees</li>
              <li className={`Nav-item ${activeTab === 'History' ? 'active' : ''}`} onClick={() => handleTabChange('History')}><History size={18} /> History</li>
              <li className={`Nav-item ${activeTab === 'Reports' ? 'active' : ''}`} onClick={() => handleTabChange('Reports')}><BarChart2 size={18} /> Reports</li>
            </ul>
          </div>
          <div className="Sidebar-footer">
            <button className="Btn-logout"><LogOut size={16} /> Logout</button>
          </div>
        </aside>

        <main className="Main-content">
          <div className="Header-area">
            <div>
              <h1 className="Page-title">{activeTab}</h1>
              <p className="Page-subtitle">View and manage your {activeTab.toLowerCase()}.</p>
            </div>
            {showAddBtn && ['Stocking Inventory', 'Task Assign', 'Employees'].includes(activeTab) && (
              <button className="Btn-primary" onClick={handleAddNew}><Plus size={18} /> Add New</button>
            )}
          </div>

          {activeTab === 'Stocking Inventory' && (
            <div className="Stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
              <div className="Stat-card">
                <div className="Stat-blob"></div>
                <div className="Stat-title"><Package size={14} color="var(--accent-orange)" /> Total Stock</div>
                <div className="Stat-value">{totalStock}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Items in {activeGodown}</div>
              </div>
              <div className="Stat-card Stat-card-clickable" onClick={() => setStockModal('low')}>
                <div className="Stat-blob" style={{ background: 'rgba(239,68,68,0.15)' }}></div>
                <div className="Stat-title"><AlertCircle size={14} color="#ef4444" /> Low Stock</div>
                <div className="Stat-value" style={{ color: '#ef4444' }}>{lowStockCount}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Items below threshold</div>
              </div>
              <div className="Stat-card Stat-card-clickable" onClick={() => setStockModal('high')}>
                <div className="Stat-blob" style={{ background: 'rgba(16,185,129,0.15)' }}></div>
                <div className="Stat-title"><CheckCircle size={14} color="#10b981" /> High Stock</div>
                <div className="Stat-value" style={{ color: '#10b981' }}>{highStockCount}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Items well stocked</div>
              </div>
            </div>
          )}

          {stockModal && (
            <StockModal
              type={stockModal}
              items={stockModal === 'low' ? currentInventory.filter((i: any) => i.qty < LOW_STOCK_THRESHOLD) : currentInventory.filter((i: any) => i.qty >= LOW_STOCK_THRESHOLD)}
              onClose={() => setStockModal(null)}
            />
          )}

          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;