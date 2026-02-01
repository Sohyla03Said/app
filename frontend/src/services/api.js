import axios from "axios";

// Create an axios instance with base URL
const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    'Content-Type': 'application/json',
  }
});

// ------------------- CONSTANTS -------------------
export const WORKSHEET_TYPES = {
  PDF: 'PDF',
  QUESTION_BASED: 'QUESTION_BASED',
  TEXT: 'TEXT'
};

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  TRUE_FALSE: 'TRUE_FALSE',
  SHORT_ANSWER: 'SHORT_ANSWER',
  ESSAY: 'ESSAY',
  FILL_BLANK: 'FILL_BLANK'
};

// ------------------- TOKEN INTERCEPTOR -------------------
// Automatically attach token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug logging
    console.log(`➡️ Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    if (config.data) {
      console.log('Request data:', config.data);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ------------------- RESPONSE INTERCEPTOR -------------------
api.interceptors.response.use(
  (response) => {
    console.log(`⬅️ Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ Error: ${error.response?.status || 'No status'} ${error.config?.url}`);
    console.error('Error details:', error.response?.data);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ------------------- AUTH -------------------
export const authAPI = {
  signup: (data) => api.post("/auth/signup", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

// ------------------- CLASS MATERIALS -------------------
export const materialAPI = {
  getClassMaterials: (classId) => api.get(`/classes/${classId}/materials`),
  
  uploadClassMaterial: (classId, formData) =>
    api.post(`/classes/${classId}/materials`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  
  deleteClassMaterial: (classId, materialId) => 
    api.delete(`/classes/${classId}/materials/${materialId}`),
  
  getClassMaterialFile: (classId, materialId) => 
    api.get(`/classes/${classId}/materials/${materialId}/file`, {
      responseType: 'blob'
    }),
  
  // Folders
  getClassFolders: (classId) => api.get(`/classes/${classId}/folders`),
  
  createClassFolder: (classId, data) => 
    api.post(`/classes/${classId}/folders`, data),
  
  deleteClassFolder: (classId, folderId) => 
    api.delete(`/classes/${classId}/folders/${folderId}`),
  
  updateClassFolder: (classId, folderId, data) => 
    api.put(`/classes/${classId}/folders/${folderId}`, data),
  
  // Student access
  getStudentClassMaterials: (classId) => api.get(`/student/classes/${classId}/materials`),
  
  downloadClassMaterial: (classId, materialId) => 
    api.get(`/student/classes/${classId}/materials/${materialId}/download`, {
      responseType: 'blob'
    }),
  
  recordDownload: (classId, materialId) => 
    api.post(`/classes/${classId}/materials/${materialId}/download`),

  getMaterials: (classId, params = {}) => 
    api.get(`/classes/${classId}/materials`, { params }),
  
  // Upload material (fixed to match backend)
  uploadMaterial: (classId, formData) => {
    // Ensure the formData has the right structure
    return api.post(`/classes/${classId}/materials`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  
  // Create folder
  createFolder: (classId, data) => 
    api.post(`/classes/${classId}/folders`, data),
  
  // Delete material
  deleteMaterial: (classId, materialId) => 
    api.delete(`/classes/${classId}/materials/${materialId}`),
  
  // Delete folder
  deleteFolder: (classId, folderId) => 
    api.delete(`/classes/${classId}/folders/${folderId}`),
  
  // Download material
  downloadMaterial: (materialId) => 
    api.get(`/materials/${materialId}/download`, {
      responseType: 'blob'
    }),
  
  // Student access to materials
  getStudentMaterials: (classId, params = {}) =>
    api.get(`/student/classes/${classId}/materials`, { params }),
};

// ------------------- DOCUMENTS -------------------
export const documentAPI = {
  getAll: () => api.get("/documents"),
  getById: (id) => api.get(`/documents/${id}`),
  upload: (formData) =>
    api.post("/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => api.delete(`/documents/${id}`),
  getFile: (id) => api.get(`/documents/${id}/file`, {
    responseType: 'blob'
  }),
  summarize: (docId, style) =>
    api.post(`/documents/${docId}/summarize?style=${style}`),
};

// ------------------- AI ACTIONS -------------------
export const aiAPI = {
  summarize: (documentId, style) => 
    api.post("/ai/summarize", { document_id: documentId, style }),
  explain: (documentId, concept, level = "detailed") =>
    api.post("/ai/explain", { document_id: documentId, concept, level }),
};

// ------------------- CHAT -------------------
export const chatAPI = {
  getAll: () => api.get('/chats'),
  create: (data) => api.post('/chats', data),
  createWithDocument: (documentId, title = "Document Chat") => 
    api.post('/chats', { title, document_id: documentId }),
  getChatInfo: (chatId) => api.get(`/chats/${chatId}`),
  // FIXED: Added delete method (alias for deleteChat)
  delete: (chatId) => api.delete(`/chats/${chatId}`),
  deleteChat: (chatId) => api.delete(`/chats/${chatId}`), // Keep for backward compatibility
  getMessages: (chatId, limit = 50) => 
    api.get(`/chats/${chatId}/messages`, { params: { limit } }),
  sendMessage: (chatId, content) => 
    api.post(`/chats/${chatId}/messages`, { content }),
  getQuickPrompts: (chatId) => api.get(`/chats/${chatId}/quick-prompts`),
  exportChat: (chatId) => api.post(`/chats/${chatId}/export`),
};

// ------------------- CLASSES -------------------
export const classAPI = {
  getAll: () => api.get('/classes'),
  create: (classData) => api.post('/classes', classData),
  getDetails: (classId) => api.get(`/classes/${classId}`),
  getPublicClasses: (params) => api.get('/classes/public', { params }),
  
  // FIXED: Add delete method for classes
  delete: (classId) => api.delete(`/classes/${classId}`),
  
  // FIXED: Add both join methods for compatibility
  join: (data) => api.post('/classes/join', data),
  joinClass: (data) => api.post('/classes/join', data),
  
  getEnrollments: (classId, status) => 
    api.get(`/classes/${classId}/enrollments`, { params: { status } }),
  approveEnrollment: (enrollmentId) => 
    api.post(`/enrollments/${enrollmentId}/approve`),
  rejectEnrollment: (enrollmentId) => 
    api.post(`/enrollments/${enrollmentId}/reject`),
  getClassChats: (classId) => api.get(`/classes/${classId}/chats`),
  createClassChat: (classId, chatData) => 
    api.post(`/classes/${classId}/chats`, chatData),
  getWorksheets: (classId) => api.get(`/classes/${classId}/worksheets`),
  getClassWorksheets: (classId) => api.get(`/classes/${classId}/worksheets`),
  
  // FIXED: Added getStudents method
  getStudents: (classId) => api.get(`/classes/${classId}/students`),
  
  // Added: Materials methods
  getMaterials: (classId) => api.get(`/classes/${classId}/materials`),
  getFolders: (classId) => api.get(`/classes/${classId}/folders`),
};

// ------------------- WORKSHEETS -------------------
export const worksheetAPI = {
  // Worksheet operations
  create: (classId, data) => {
    // Ensure worksheet_type is uppercase
    if (data.worksheet_type) {
      data.worksheet_type = data.worksheet_type.toUpperCase();
    }
    return api.post(`/classes/${classId}/worksheets`, data);
  },
  get: (worksheetId) => api.get(`/worksheets/${worksheetId}`),
  getDetails: (worksheetId) => api.get(`/worksheets/${worksheetId}`),
  publish: (worksheetId) => api.post(`/worksheets/${worksheetId}/publish`),
  getClassWorksheetDetails: (classId, worksheetId) => 
    api.get(`/api/classes/${classId}/worksheets/${worksheetId}`),

  // Questions
  getQuestions: (worksheetId) => api.get(`/worksheets/${worksheetId}/questions`),
  getWorksheetQuestions: (worksheetId) => api.get(`/worksheets/${worksheetId}/questions`),
  addQuestion: (worksheetId, data) => {
    // Ensure question_type is uppercase
    if (data.question_type) {
      data.question_type = data.question_type.toUpperCase();
    }
    return api.post(`/worksheets/${worksheetId}/questions`, data);
  },

  getDetails: (id) => api.get(`/worksheets/${id}`),
  getQuestions: (id) => api.get(`/worksheets/${id}/questions`),
  getSubmissions: (id) => api.get(`/worksheets/${id}/submissions`),
  
  // AI generation
  generateQuestions: (worksheetId, documentId, questionType, numQuestions = 5) =>
    api.post(`/worksheets/${worksheetId}/generate-questions`, null, {
      params: {
        document_id: documentId,
        question_type: questionType,
        num_questions: numQuestions,
      },
    }),
  
  // Submission
  submit: (worksheetId, answers) =>
    api.post(`/worksheets/${worksheetId}/submit`, { answers }),
  submitWorksheet: (worksheetId, answers) =>
    api.post(`/worksheets/${worksheetId}/submit`, { answers }),
  
  // FIXED: Added delete method
  delete: (worksheetId) => api.delete(`/worksheets/${worksheetId}`),
};

// ------------------- USER PROFILE -------------------
export const userAPI = {
  updateProfile: (data) => api.patch("/users/me", data),
  changePassword: ({ current_password, new_password }) => {
    return api.post("/users/me/password", { 
      current_password, 
      new_password 
    });
  }
};

// ------------------- STUDENT PROGRESS -------------------
export const studentAPI = {
  getProgress: () => api.get("/student/progress"),
  // Added: Student materials access
  getClassMaterials: (classId) => api.get(`/student/classes/${classId}/materials`),
  downloadMaterial: (classId, materialId) => 
    api.get(`/student/classes/${classId}/materials/${materialId}/download`, {
      responseType: 'blob'
    }),
};

export default api;