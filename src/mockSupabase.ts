// Mock Supabase Client for Local Development
// This replaces the real Supabase client to store data in localStorage

const STORAGE_KEYS = {
  USERS: 'utube_mock_users',
  SESSION: 'utube_mock_session',
  VIDEOS: 'utube_mock_videos',
  COMMENTS: 'utube_mock_comments',
  LIKES: 'utube_mock_likes',
  SUBSCRIPTIONS: 'utube_mock_subscriptions'
};

// Initialize Storage if empty
const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.VIDEOS)) {
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
  }
  // Add other tables as needed
};

initStorage();

// Helper to get/set data
const getTable = (table: string) => {
  const key = `utube_mock_${table}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setTable = (table: string, data: any[]) => {
  const key = `utube_mock_${table}`;
  localStorage.setItem(key, JSON.stringify(data));
};

// Mock Query Builder
class MockQueryBuilder {
  table: string;
  data: any[];
  filters: any[];
  orderParams: any;
  limitParam: number | null;

  constructor(table: string) {
    this.table = table;
    this.data = getTable(table);
    this.filters = [];
    this.orderParams = null;
    this.limitParam = null;
  }

  select(columns = '*') {
    // We ignore columns selection for simplicity and return all fields
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((row: any) => row[column] === value);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((row: any) => row[column] !== value);
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.orderParams = { column, ascending };
    return this;
  }

  limit(count: number) {
    this.limitParam = count;
    return this;
  }

  // Execute query (simulated)
  async then(resolve: any, reject: any) {
    let result = this.data;

    // Apply filters
    for (const filter of this.filters) {
      result = result.filter(filter);
    }

    // Apply order
    if (this.orderParams) {
      const { column, ascending } = this.orderParams;
      result.sort((a: any, b: any) => {
        if (a[column] < b[column]) return ascending ? -1 : 1;
        if (a[column] > b[column]) return ascending ? 1 : -1;
        return 0;
      });
    }

    // Apply limit
    if (this.limitParam !== null) {
      result = result.slice(0, this.limitParam);
    }

    resolve({ data: result, error: null, count: result.length });
  }

  // Modification methods
  async insert(row: any) {
    const newItem = { 
        id: crypto.randomUUID(), 
        created_at: new Date().toISOString(), 
        ...row 
    };
    const newData = [...this.data, newItem];
    setTable(this.table, newData);
    return { data: [newItem], error: null };
  }

  async update(updates: any) {
    let affectedRows: any[] = [];
    const newData = this.data.map(row => {
      // Check if row matches all filters
      const matches = this.filters.every(filter => filter(row));
      if (matches) {
        const updatedRow = { ...row, ...updates };
        affectedRows.push(updatedRow);
        return updatedRow;
      }
      return row;
    });
    setTable(this.table, newData);
    return { data: affectedRows, error: null };
  }

  async delete() {
    const newData = this.data.filter(row => {
      // Keep rows that DO NOT match all filters
      const matches = this.filters.every(filter => filter(row));
      return !matches;
    });
    setTable(this.table, newData);
    return { data: null, error: null };
  }
}

// Mock Auth
const mockAuth = {
  async getSession() {
    const sessionStr = localStorage.getItem(STORAGE_KEYS.SESSION);
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    return { data: { session }, error: null };
  },

  async signInWithOAuth({ provider }: { provider: string }) {
    console.log(`Mock signing in with ${provider}...`);
    const user = {
      id: 'mock-user-id',
      email: 'demo@utube.local',
      user_metadata: {
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        full_name: 'Demo User'
      }
    };
    const session = {
      access_token: 'mock-token',
      user
    };
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    
    // Trigger redirect manually since we are mocking
    window.location.href = '/'; 
    return { data: { session }, error: null };
  },

  async signOut() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    return { error: null };
  },

  onAuthStateChange(callback: any) {
    // Simple mock: call it once with current session
    this.getSession().then(({ data }) => {
      callback('SIGNED_IN', data.session);
    });
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
  
  async updateUser(updates: any) {
      const sessionStr = localStorage.getItem(STORAGE_KEYS.SESSION);
      if(sessionStr) {
          const session = JSON.parse(sessionStr);
          const newSession = {
              ...session,
              user: {
                  ...session.user,
                  user_metadata: {
                      ...session.user.user_metadata,
                      ...updates.data
                  }
              }
          };
          localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(newSession));
          return { data: { user: newSession.user }, error: null };
      }
      return { data: null, error: "No session" };
  }
};

// Mock Storage
const mockStorage = {
  from(bucket: string) {
    return {
      upload: async (path: string, file: File) => {
        console.log(`Mock upload to ${bucket}/${path}`, file);
        // In a real local mock, we might convert to Base64 and store in localStorage,
        // but for videos that's too heavy. We'll return a fake URL.
        return { data: { path }, error: null };
      },
      getPublicUrl: (path: string) => {
        // Return a placeholder or the actual file if we could serve it.
        // For images, we can use a placeholder service.
        // For videos, maybe a sample video?
        return { data: { publicUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' } };
      }
    };
  }
};

// Export the Mock Supabase Client
export const supabase = {
  from: (table: string) => new MockQueryBuilder(table),
  auth: mockAuth,
  storage: mockStorage,
  channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {}
  }),
  removeChannel: () => {}
};
