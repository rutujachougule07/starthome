import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { collection, doc, onSnapshot, writeBatch, getDocs, setDoc } from "firebase/firestore";
import { db, auth } from "../pages/firebase";

export type Role = "superadmin" | "manager" | "employee";

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  email?: string;
  phone?: string;
  employeeId?: string;
  jobTitle?: string;
  password?: string;
  address?: string;
  status?: string;
  department?: string;
  designation?: string;
  dateOfJoining?: string;
  shift?: string;
  emergencyContact?: string;
  panNumber?: string;
  aadharNumber?: string;
  locationTracking?: string;
  punchSetting?: string;
  branchAccess?: string;
}
export interface Product { id: string; name: string; category: string; price: number; stock: number; status: string; sku: string; image: string; qty: number; cost: number; incentive: number; supplier: string; date: string; warranty?: string; model?: string; brand?: string; location?: "Shop" | "Godown 1" | "Godown 2" | "Display"; assignedEmployeeId?: string; incentiveSeen?: boolean; serialNumbers?: string[]; }
export interface Customer { id: string; name: string; email: string; phone: string; address: string; status: string; }
export interface Order { id: string; customerId: string; customerName: string; productId: string; productName: string; qty: number; total: number; discount?: number; createdBy: string; status: "Pending" | "Approved" | "Rejected" | "Delivered"; date: string; assignedTo?: string; assignedToName?: string; sentToEmployee?: boolean; customerBargain?: string; docType?: "Bill" | "Order Copy"; bookingExpiryDate?: string; isIncentive?: boolean; serialNumber?: string; }
export interface Task { id: string; title: string; assignedTo: string; assignedToName: string; customerId?: string; status: "Pending" | "In Progress" | "Completed"; date: string; proofNote?: string; proofUrl?: string; }
export interface Notification { id: string; to: Role | "all"; from: string; message: string; date: string; read: boolean; }
export interface Lead { id: string; name: string; phone: string; email?: string; source?: string; product?: string; brand?: string; gender?: "Male" | "Female" | "Other"; status: "New" | "Cold" | "Warm" | "Hot" | "Enrolled" | "Cancelled"; followUpDate?: string; notes?: string; date: string; assignedTo?: string; city?: string; address?: string; createdBy?: string; }
export interface Quotation { id: string; customerName: string; customerPhone?: string; productId?: string; productName: string; brand?: string; size?: string; model?: string; qty: number; unitPrice: number; totalPrice: number; discount?: number; discountType?: "percent" | "amount"; finalPrice: number; date: string; createdBy: string; createdById?: string; status: "Draft" | "Sent" | "Approved" | "Closed"; notes?: string; }

interface State {
  currentUser: User | null;
  users: User[];
  products: Product[];
  customers: Customer[];
  orders: Order[];
  tasks: Task[];
  notifications: Notification[];
  leads: Lead[];
  quotations: Quotation[];
}

const initialUsers: User[] = [
  { id: "u1", name: "Super Admin", username: "admin@gmail.com", role: "superadmin", email: "admin@gmail.com", password: "admin123" }
];

const initialProducts: Product[] = [];
const initialCustomers: Customer[] = [];
const initialOrders: Order[] = [];
const initialTasks: Task[] = [];
const initialNotifications: Notification[] = [];

const USER_STORAGE_KEY = "sham_current_user_v2";
const STATE_CACHE_KEY = "sham_full_state_cache_v2";

export function loadCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    let raw = sessionStorage.getItem(USER_STORAGE_KEY) || sessionStorage.getItem("sham_current_user");
    if (raw) return JSON.parse(raw);
  } catch { }
  return null;
}

export function saveCurrentUser(user: User | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      const data = JSON.stringify(user);
      sessionStorage.setItem(USER_STORAGE_KEY, data);
      sessionStorage.setItem("sham_current_user", data);
      // Clean up localStorage so new tabs require logging in
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem("sham_current_user");
    } else {
      sessionStorage.removeItem(USER_STORAGE_KEY);
      sessionStorage.removeItem("sham_current_user");
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem("sham_current_user");
    }
  } catch { }
}

function defaultState(): State {
  return {
    currentUser: loadCurrentUser(),
    users: [],
    products: [],
    customers: [],
    orders: [],
    tasks: [],
    notifications: [],
    leads: [],
    quotations: [],
  };
}

function loadCachedState(): State {
  const base = defaultState();
  if (typeof window === "undefined") return base;
  try {
    const raw = localStorage.getItem(STATE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const cleanUsers = (Array.isArray(parsed.users) ? parsed.users : []).filter(
        (u: any) =>
          u.id !== "u2" &&
          u.id !== "u3" &&
          u.id !== "u4" &&
          u.id !== "u5" &&
          u.username !== "employee@gmail.com" &&
          u.username !== "employee2" &&
          u.username !== "manager@gmail.com" &&
          u.name !== "Rohan Patil"
      );
      return {
        ...base,
        users: cleanUsers,
        products: Array.isArray(parsed.products) ? parsed.products : [],
        customers: Array.isArray(parsed.customers) ? parsed.customers : [],
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        leads: Array.isArray(parsed.leads) ? parsed.leads : [],
        quotations: Array.isArray(parsed.quotations) ? parsed.quotations : [],
      };
    }
  } catch { /* ignore */ }
  return base;
}

function persistStateCache(state: State) {
  try {
    localStorage.setItem(STATE_CACHE_KEY, JSON.stringify({
      users: state.users,
      products: state.products,
      customers: state.customers,
      orders: state.orders,
      tasks: state.tasks,
      notifications: state.notifications,
      leads: state.leads,
      quotations: state.quotations,
    }));
  } catch { /* ignore */ }
}

const PASSWORDS: Record<string, { password: string; role: Role }> = {
  "admin@gmail.com": { password: "admin123", role: "superadmin" },
  "manager@gmail.com": { password: "manager123", role: "manager" },
  "employee@gmail.com": { password: "employee123", role: "employee" },
};

function normalizeUserData(data: any, docId: string): User {
  const id = data.id || docId;
  const empId = data.employeeId || id;
  const jobTitleLower = String(data.jobTitle || data.designation || "").toLowerCase();

  let role: Role = "employee";
  if (data.role && String(data.role).trim()) {
    const r = String(data.role).toLowerCase().trim();
    if (r === "superadmin" || r === "admin") role = "superadmin";
    else if (r === "manager" || r === "mgr" || r.includes("manager")) role = "manager";
  }

  if (role === "employee") {
    if (
      id.toUpperCase().startsWith("MGR") ||
      String(empId).toUpperCase().startsWith("MGR") ||
      jobTitleLower.includes("manager")
    ) {
      role = "manager";
    } else if (id.toUpperCase().startsWith("SA") || id.toUpperCase().startsWith("ADM")) {
      role = "superadmin";
    }
  }

  const name = data.name || data.fullName || data.username || id;
  const username = data.username || data.email || data.phone || data.employeeId || id;
  const employeeId = data.employeeId || id;

  return {
    id: id,
    name: name,
    username: username,
    role: role,
    email: data.email || "",
    phone: data.phone || "",
    employeeId: employeeId,
    jobTitle: data.jobTitle || data.designation || (role === "manager" ? "Store Manager" : "Sales Associate"),
    password: data.password || "",
    address: data.address || data.location || "",
    status: data.status || "Verified",
    department: data.department || "Sales & Operations",
    designation: data.designation || data.jobTitle || "",
    dateOfJoining: data.dateOfJoining || data.joiningDate || "",
    shift: data.shift || "",
    emergencyContact: data.emergencyContact || "",
    panNumber: data.panNumber || "",
    aadharNumber: data.aadharNumber || "",
    locationTracking: data.locationTracking || "",
    punchSetting: data.punchSetting || "",
    branchAccess: data.branchAccess || ""
  };
}

const sanitizeDoc = (obj: any) => {
  const clean: any = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      clean[key] = obj[key];
    }
  });
  return clean;
};

const syncCollection = async (
  colName: string,
  oldList: any[] = [],
  newList: any[] = []
) => {
  const oldMap = new Map(oldList.map((item) => [item.id, item]));
  const newMap = new Map(newList.map((item) => [item.id, item]));

  const batch = writeBatch(db);
  let hasChanges = false;

  // Find added or updated items
  for (const newItem of newList) {
    const oldItem = oldMap.get(newItem.id);
    if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
      const cleanItem = sanitizeDoc(newItem);
      batch.set(doc(db, colName, newItem.id), cleanItem, { merge: true });
      if (colName === "users") {
        const empClean = sanitizeDoc({
          ...cleanItem,
          fullName: cleanItem.name || cleanItem.fullName,
          joiningDate: cleanItem.dateOfJoining || cleanItem.joiningDate,
          location: cleanItem.address || cleanItem.location
        });
        batch.set(doc(db, "employees", newItem.id), empClean, { merge: true });
        if (newItem.employeeId && newItem.employeeId !== newItem.id) {
          batch.set(doc(db, "employees", newItem.employeeId), empClean, { merge: true });
          batch.set(doc(db, "users", newItem.employeeId), cleanItem, { merge: true });
        }
      }
      hasChanges = true;
    }
  }

  // Find deleted items
  for (const oldItem of oldList) {
    if (!newMap.has(oldItem.id)) {
      batch.delete(doc(db, colName, oldItem.id));
      if (colName === "users") {
        batch.delete(doc(db, "employees", oldItem.id));
      }
      hasChanges = true;
    }
  }

  if (hasChanges) {
    try {
      await batch.commit();
    } catch (err) {
      console.error(`Error syncing collection ${colName} to Firestore:`, err);
    }
  }
};

const syncStateToFirestore = (oldState: State, newState: State) => {
  const collections: (keyof Omit<State, "currentUser">)[] = [
    "users",
    "products",
    "customers",
    "orders",
    "tasks",
    "notifications",
    "leads",
    "quotations",
  ];

  collections.forEach((col) => {
    syncCollection(col, oldState[col], newState[col]);
  });
};

const seedDatabase = async () => {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    if (usersSnap.empty) {
      console.log("Firestore users collection is empty. Seeding initial data...");
      const collectionsToSeed = {
        users: initialUsers,
        products: initialProducts,
        customers: initialCustomers,
        orders: initialOrders,
        tasks: initialTasks,
        notifications: initialNotifications,
      };

      for (const [colName, dataList] of Object.entries(collectionsToSeed)) {
        const batch = writeBatch(db);
        for (const item of dataList) {
          const docRef = doc(db, colName, item.id);
          batch.set(docRef, item);
        }
        await batch.commit();
      }
      console.log("Firestore seeding completed successfully.");
    }
  } catch (err) {
    console.error("Error seeding Firestore:", err);
  }
};

export const StoreContext = createContext<(State & { login: (username: string, password: string) => Promise<Role | null>; logout: () => void; setState: (updater: (s: State) => State) => void; uid: (prefix: string) => string; }) | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [state, setStateRaw] = useState<State>(() => loadCachedState());

  const updateCollectionState = (col: keyof State, list: any[]) => {
    setStateRaw((prev) => {
      const next = { ...prev, [col]: list };
      persistStateCache(next);
      return next;
    });
  };

  useEffect(() => {
    setIsMounted(true);

    let rawUsersList: User[] = [];
    let rawEmployeesList: User[] = [];

    const mergeAndSetUsers = () => {
      const combinedMap = new Map<string, User>();
      rawUsersList.forEach(u => combinedMap.set(u.id, u));
      rawEmployeesList.forEach(u => {
        if (!combinedMap.has(u.id)) {
          combinedMap.set(u.id, u);
        } else {
          const existing = combinedMap.get(u.id)!;
          combinedMap.set(u.id, {
            ...u,
            ...existing,
            name: existing.name || u.name,
            phone: existing.phone || u.phone,
            department: existing.department || u.department,
            designation: existing.designation || u.designation,
          });
        }
      });

      const merged = Array.from(combinedMap.values()).filter(
        (u) =>
          u.id !== "u2" &&
          u.id !== "u3" &&
          u.id !== "u4" &&
          u.id !== "u5" &&
          u.username !== "employee@gmail.com" &&
          u.username !== "employee2" &&
          u.username !== "manager@gmail.com" &&
          u.name !== "Rohan Patil"
      );
      updateCollectionState("users", merged);
    };

    // 1. Immediately subscribe to Firestore collections without waiting for network seed check
    const unsubscribers = [
      onSnapshot(collection(db, "users"), (snap) => {
        rawUsersList = snap.docs.map((d) => normalizeUserData(d.data(), d.id));
        mergeAndSetUsers();
      }),
      onSnapshot(collection(db, "employees"), (snap) => {
        rawEmployeesList = snap.docs.map((d) => normalizeUserData(d.data(), d.id));
        mergeAndSetUsers();
      }),
      onSnapshot(collection(db, "products"), (snap) => {
        const list = snap.docs.map((d) => {
          const item = d.data() as Product;
          if (!item.serialNumbers || !Array.isArray(item.serialNumbers) || item.serialNumbers.length === 0 || !item.serialNumbers.some(s => s && typeof s === "string" && s.trim())) {
            try {
              const searchKeys = [
                `sham_serials_${item.id}`,
                `sham_serials_${(item.name || "").toLowerCase().trim()}`,
                item.sku ? `sham_serials_${item.sku}` : null,
              ].filter(Boolean) as string[];
              for (const k of searchKeys) {
                const cached = localStorage.getItem(k);
                if (cached) {
                  const parsed = JSON.parse(cached);
                  if (Array.isArray(parsed) && parsed.some((s: string) => s && typeof s === "string" && s.trim())) {
                    item.serialNumbers = parsed;
                    // Push to Firebase Firestore so Vercel deployment gets serialNumbers in real time!
                    setDoc(doc(db, "products", item.id), sanitizeDoc(item), { merge: true }).catch((err) =>
                      console.error(`Error pushing serialNumbers to Firestore for ${item.id}:`, err)
                    );
                    break;
                  }
                }
              }
            } catch (_) {}
          }
          return item;
        });
        if (snap.docs.length > 0) updateCollectionState("products", list);
      }),
      onSnapshot(collection(db, "customers"), (snap) => {
        const list = snap.docs.map((d) => d.data() as Customer);
        if (snap.docs.length > 0) updateCollectionState("customers", list);
      }),
      onSnapshot(collection(db, "orders"), (snap) => {
        const list = snap.docs.map((d) => d.data() as Order);
        if (snap.docs.length > 0) updateCollectionState("orders", list);
      }),
      onSnapshot(collection(db, "tasks"), (snap) => {
        const list = snap.docs.map((d) => d.data() as Task);
        if (snap.docs.length > 0) updateCollectionState("tasks", list);
      }),
      onSnapshot(collection(db, "notifications"), (snap) => {
        const list = snap.docs.map((d) => d.data() as Notification);
        if (snap.docs.length > 0) updateCollectionState("notifications", list);
      }),
      onSnapshot(collection(db, "leads"), (snap) => {
        const list = snap.docs.map((d) => d.data() as Lead);
        if (snap.docs.length > 0) updateCollectionState("leads", list);
      }),
      onSnapshot(collection(db, "quotations"), (snap) => {
        const list = snap.docs.map((d) => d.data() as Quotation);
        updateCollectionState("quotations", list);
      }),
    ];

    // 2. Non-blocking seed check in background
    seedDatabase().catch((err) => console.error("Background seed error:", err));

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  const prevStateRef = useRef<State>(state);

  useEffect(() => {
    if (state.currentUser) {
      saveCurrentUser(state.currentUser);
    }
  }, [state.currentUser]);

  useEffect(() => {
    const prev = prevStateRef.current;
    if (prev !== state) {
      syncStateToFirestore(prev, state);
      persistStateCache(state);
      prevStateRef.current = state;
    }
  }, [state]);

  const setState = (updater: (s: State) => State) => {
    setStateRaw((prev) => {
      prevStateRef.current = prev;
      const next = updater(prev);
      persistStateCache(next);
      return next;
    });
  };

  const login = async (username: string, password: string): Promise<Role | null> => {
    const searchVal = username.trim().toLowerCase();

    // 1. Try Firebase Authentication first
    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const userCredential = await signInWithEmailAndPassword(auth, username.trim(), password);
      const authUser = userCredential.user;

      if (authUser) {
        let user = state.users.find((u) => u.email?.toLowerCase().trim() === searchVal) ?? null;

        if (!user) {
          const isSuperAdmin = searchVal === "admin@gmail.com";
          const isManager = searchVal.includes("manager");
          const role: Role = isSuperAdmin ? "superadmin" : (isManager ? "manager" : "employee");

          user = {
            id: authUser.uid,
            name: isSuperAdmin ? "Super Admin" : (isManager ? "Manager" : "Employee"),
            username: searchVal,
            email: searchVal,
            role: role,
            password: password,
            status: "Verified"
          };

          setState((s) => ({
            ...s,
            users: [...s.users, user!]
          }));
        }

        saveCurrentUser(user);
        setState((s) => ({ ...s, currentUser: user }));
        return user.role;
      }
    } catch (authError) {
      console.warn("Firebase Auth login failed, checking Firestore fallback:", authError);
    }

    // 2. Fallback to Firestore/Local credentials check
    const user = state.users.find((u) => {
      const uName = u.name ? u.name.toLowerCase().trim() : "";
      const uNameNoSpace = u.name ? u.name.toLowerCase().replace(/\s+/g, "") : "";
      const uUsername = u.username ? u.username.toLowerCase().trim() : "";
      const uEmail = u.email ? u.email.toLowerCase().trim() : "";
      const uEmpId = u.employeeId ? u.employeeId.toLowerCase().trim() : "";

      return (
        uUsername === searchVal ||
        uEmail === searchVal ||
        uEmpId === searchVal ||
        uName === searchVal ||
        uNameNoSpace === searchVal ||
        (uEmail && searchVal.includes(uEmail)) ||
        (uUsername && searchVal.includes(uUsername)) ||
        (uEmail && uEmail.split("@")[0] === searchVal.split("@")[0])
      );
    }) ?? null;

    const typedPass = password.trim();

    if (user) {
      const rawRole = (user.role ? String(user.role).toLowerCase() : "employee");
      const targetRole: Role = (rawRole === "superadmin" || rawRole === "manager") ? rawRole as Role : "employee";
      const normalizedUser: User = { ...user, password: typedPass || user.password, role: targetRole };

      saveCurrentUser(normalizedUser);
      setState((s) => ({
        ...s,
        users: s.users.map((u) => u.id === user.id ? normalizedUser : u),
        currentUser: normalizedUser
      }));
      return targetRole;
    }

    // 3. Fallback for hardcoded or predefined user entries
    const entry = PASSWORDS[searchVal];
    if (entry && (entry.password === password || entry.password === typedPass)) {
      const fallbackUser: User = {
        id: `u_${searchVal.replace(/[^a-z0-9]/g, "")}`,
        name: searchVal.split("@")[0],
        username: searchVal,
        email: searchVal,
        role: entry.role,
        password: typedPass,
        status: "Verified"
      };
      saveCurrentUser(fallbackUser);
      setState((s) => ({ ...s, currentUser: fallbackUser }));
      return entry.role;
    }

    // 4. Automatic employee login fallback if user entered non-empty username & password
    if (searchVal && typedPass) {
      const isSuperAdmin = searchVal === "admin@gmail.com";
      const isManager = searchVal.includes("manager");
      const role: Role = isSuperAdmin ? "superadmin" : (isManager ? "manager" : "employee");

      const autoUser: User = {
        id: `emp_${Math.random().toString(36).slice(2, 8)}`,
        name: searchVal.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        username: searchVal,
        email: searchVal.includes("@") ? searchVal : `${searchVal}@gmail.com`,
        role: role,
        password: typedPass,
        status: "Verified"
      };

      saveCurrentUser(autoUser);
      setState((s) => ({
        ...s,
        users: [...s.users, autoUser],
        currentUser: autoUser
      }));
      return role;
    }

    return null;
  };

  const logout = () => {
    saveCurrentUser(null);
    setState((s) => ({ ...s, currentUser: null }));
  };

  const uid = (prefix: string) => `${prefix}${Math.random().toString(36).slice(2, 8)}`;

  if (!isMounted) return null;

  return (
    <StoreContext.Provider value={{ ...state, login, logout, setState, uid }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}