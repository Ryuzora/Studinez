import React, { useState, useEffect, useCallback } from 'react';
import { Home, BookOpen, GraduationCap, Calendar, CheckSquare, Sun, Moon, Plus, X, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';

// --- HELPER HOOK for Local Storage ---
function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    const stickyValue = window.localStorage.getItem(key);
    if (stickyValue !== null) {
      try {
        // More robust parsing for dates
        return JSON.parse(stickyValue, (k, v) => {
          if (k === 'dueDate' && typeof v === 'string') {
            const date = new Date(v);
            return isNaN(date) ? v : date; // return original string if date is invalid
          }
          return v;
        });
      } catch (error) {
        console.error("Error parsing JSON from localStorage", error);
        return defaultValue;
      }
    }
    return defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}


const initialAssignments = [
  { id: 1, title: 'Essay Analisis Puisi', course: 'Sastra Indonesia', dueDate: new Date(new Date().setDate(new Date().getDate() + 2)), priority: 'Tinggi', progress: 25, notes: 'Fokus pada analisis metafora dan citraan.' },
  { id: 2, title: 'Laporan Praktikum Kimia', course: 'Kimia Dasar', dueDate: new Date(new Date().setDate(new Date().getDate() + 5)), priority: 'Tinggi', progress: 80, notes: 'Jangan lupa lampirkan data hasil percobaan.' },
  { id: 3, title: 'Presentasi Kelompok', course: 'Pengantar Sosiologi', dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), priority: 'Sedang', progress: 50, notes: 'Bagian saya adalah teori konflik.' },
  { id: 4, title: 'Mengerjakan Latihan Soal', course: 'Kalkulus I', dueDate: new Date(new Date().setDate(new Date().getDate() + 10)), priority: 'Rendah', progress: 10, notes: 'Bab 3 tentang turunan.' },
];

const initialCourses = [
  { id: 1, name: 'Sastra Indonesia', code: 'SI101', lecturer: 'Dr. Anisa Lestari', room: 'Gedung A, R. 301', credits: 3, notes: 'Buku wajib: "Sejarah Sastra" oleh H.B. Jassin.' },
  { id: 2, name: 'Kimia Dasar', code: 'KD202', lecturer: 'Prof. Budi Santoso', room: 'Lab Kimia Terpadu', credits: 4, notes: 'Jas lab wajib dipakai setiap praktikum.' },
  { id: 3, name: 'Pengantar Sosiologi', code: 'PS301', lecturer: 'Dr. Rina Puspita', room: 'Online via Zoom', credits: 3, notes: 'Link Zoom ada di portal akademik.' },
  { id: 4, name: 'Kalkulus I', code: 'KL101', lecturer: 'Dr. Iwan Setiawan', room: 'Gedung C, R. 105', credits: 4, notes: 'Bawa kalkulator scientific.' },
];

const initialSchedule = {
  Monday: [{ start: '08:00', end: '10:00', course: 'Kalkulus I', room: 'C-105' }],
  Tuesday: [{ start: '10:00', end: '12:00', course: 'Sastra Indonesia', room: 'A-301' }, { start: '14:00', end: '16:00', course: 'Pengantar Sosiologi', room: 'Zoom' }],
  Wednesday: [{ start: '08:00', end: '10:00', course: 'Kalkulus I', room: 'C-105' }],
  Thursday: [{ start: '13:00', end: '16:00', course: 'Kimia Dasar (Praktikum)', room: 'Lab Kimia' }],
  Friday: [],
  Saturday: [{ start: '13:00', end: '15:00', course: 'Workshop Penulisan Kreatif', room: 'Gedung D, R. 202' }],
  Sunday: [],
};

const initialDailyTasks = [
  { id: 1, text: 'Review catatan Kalkulus', completed: true },
  { id: 2, text: 'Beli alat tulis untuk praktikum', completed: false },
  { id: 3, text: 'Email Prof. Budi tentang laporan', completed: false },
];

// --- HELPER COMPONENTS ---

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-cream-100 dark:bg-slate-800 rounded-2xl shadow-soft-xl w-full max-w-md p-6 relative animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-gray-700 dark:text-cream-200">{title}</h2>
          <button onClick={onClose} className="text-slate-gray-500 hover:text-peach-500 dark:text-cream-400 dark:hover:text-peach-300 transition-colors rounded-full p-1">
            <X size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const PriorityBadge = ({ priority }) => {
  const styles = {
    Tinggi: 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-100',
    Sedang: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
    Rendah: 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100',
  };
  return <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[priority]}`}>{priority}</span>;
};

// --- PAGE COMPONENTS ---

const Dashboard = ({ assignments, schedule, dailyTasks, toggleTask }) => {
  const today = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = dayNames[today.getDay()];

  const upcomingAssignments = assignments
  .filter(a => a.progress < 100)
  .sort((a, b) => a.dueDate - b.dueDate)
  .slice(0, 3);

  const todaySchedule = schedule[todayName] || [];

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const getTimeDifference = (dueDate) => {
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return <span className="text-red-500">Terlewat</span>;
    if (diffDays === 1) return 'Besok';
    if (diffDays === 0) return <span className="text-yellow-500">Hari ini</span>;
    return `Dalam ${diffDays} hari`;
  };

  const isCurrentClass = (item) => {
    const now = currentTime;
    const [startH, startM] = item.start.split(':').map(Number);
    const [endH, endM] = item.end.split(':').map(Number);
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startH, startM);
    const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endH, endM);
    return now >= startTime && now <= endTime;
  };

  return (
    <div className="animate-fade-in-up space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-gray-800 dark:text-cream-100">Welcome back ✨</h1>
        <p className="text-slate-gray-500 dark:text-cream-400">Today's overview</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-cream-200 dark:bg-slate-800 p-6 rounded-2xl shadow-soft">
          <h2 className="text-xl font-bold text-slate-gray-700 dark:text-cream-200 mb-4">Tugas Mendatang</h2>
          <div className="space-y-4">
            {upcomingAssignments.length > 0 ? upcomingAssignments.map(a => (
              <div key={a.id} className="bg-cream-100 dark:bg-slate-700 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-gray-800 dark:text-cream-100">{a.title}</p>
                  <p className="text-sm text-slate-gray-500 dark:text-cream-400">{a.course}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-gray-600 dark:text-cream-300">{getTimeDifference(a.dueDate)}</p>
                  <PriorityBadge priority={a.priority} />
                </div>
              </div>
            )) : <p className="text-slate-gray-500 dark:text-cream-400">No assignment today</p>}
          </div>
        </div>

        {/*Dashboard Schedule*/}
        <div className="bg-mint-200 dark:bg-slate-800 p-6 rounded-2xl shadow-soft">
          <h2 className="text-xl font-bold text-slate-gray-700 dark:text-mint-100 mb-4">Schedule ({todayName})</h2>
          <div className="space-y-3">
            {todaySchedule.length > 0 ? todaySchedule.map((item, index) => (
              <div key={index} className={`p-3 rounded-lg transition-all ${isCurrentClass(item) ? 'bg-peach-300 dark:bg-slate-700 shadow-lg scale-105' : 'bg-mint-100 dark:bg-slate-700'}`}>
                <p className="font-bold text-slate-gray-800 dark:text-cream-100">{item.course}</p>
                <p className="text-sm text-slate-gray-600 dark:text-mint-200">{item.start} - {item.end}</p>
                <p className="text-sm text-slate-gray-500 dark:text-mint-300">{item.room}</p>
              </div>
            )) : <p className="text-slate-gray-500 dark:text-mint-300">Tidak ada jadwal hari ini. Waktu luang!</p>}
          </div>
        </div>
      </div>

      <div className="bg-cream-200 dark:bg-slate-800 p-6 rounded-2xl shadow-soft">
        <h2 className="text-xl font-bold text-slate-gray-700 dark:text-cream-200 mb-4">Daily reminder</h2>
        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
          {dailyTasks.map(task => (
            <div key={task.id} className="flex items-center bg-cream-100 dark:bg-slate-700 p-3 rounded-lg">
              <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} className="h-5 w-5 rounded border-gray-300 text-peach-500 focus:ring-peach-400 cursor-pointer"/>
              <span className={`ml-3 text-slate-gray-700 dark:text-cream-200 ${task.completed ? 'line-through text-slate-gray-400 dark:text-cream-500' : ''}`}>{task.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Assignments = ({ assignments, setAssignments, courses }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const openModal = (assignment = null) => {
    setEditingAssignment(assignment);
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingAssignment(null);
    setModalOpen(false);
  };

  const handleSave = (formData) => {
    if (editingAssignment) {
      setAssignments(assignments.map(a => a.id === editingAssignment.id ? { ...a, ...formData, id: a.id } : a));
    } else {
      setAssignments([...assignments, { ...formData, id: Date.now(), progress: Number(formData.progress) || 0 }]);
    }
    closeModal();
  };

  const handleDelete = (id) => {
    setAssignments(assignments.filter(a => a.id !== id));
  };

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const AssignmentForm = ({ assignment, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      title: assignment?.title || '',
      course: assignment?.course || (courses.length > 0 ? courses[0].name : ''),
      dueDate: assignment?.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '',
      priority: assignment?.priority || 'Sedang',
      progress: assignment?.progress || 0,
      notes: assignment?.notes || '',
    });

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => {                                                                     9
      e.preventDefault();
      onSave({ ...formData, dueDate: new Date(formData.dueDate) });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Nama Tugas" className="w-full p-3 bg-cream-200 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-peach-400 border-none" required />
        <select name="course" value={formData.course} onChange={handleChange} className="w-full p-3 bg-cream-200 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-peach-400 border-none">
          {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="w-full p-3 bg-cream-200 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-peach-400 border-none" required />
        <select name="priority" value={formData.priority} onChange={handleChange} className="w-full p-3 bg-cream-200 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-peach-400 border-none">
          <option>Rendah</option><option>Sedang</option><option>Tinggi</option>
        </select>
        <div>
          <label className="block text-sm font-medium text-slate-gray-600 dark:text-cream-400 mb-1">Progress: {formData.progress}%</label>
          <input type="range" name="progress" min="0" max="100" value={formData.progress} onChange={handleChange} className="w-full h-2 bg-cream-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-peach-500" />
        </div>
        <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Catatan..." rows="3" className="w-full p-3 bg-cream-200 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-peach-400 border-none"></textarea>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-600 text-slate-gray-800 dark:text-cream-200 hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors">Batal</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-peach-500 text-white hover:bg-peach-600 transition-colors">Simpan</button>
        </div>
      </form>
    );
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-gray-800 dark:text-cream-100">Assignments</h1>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-peach-500 text-white rounded-lg shadow-soft hover:bg-peach-600 transition-all transform hover:scale-105">
          <Plus size={20} /><span>Tugas Baru</span>
        </button>
      </div>
      <div className="space-y-4">
        {assignments.sort((a,b) => a.dueDate - b.dueDate).map(a => (
          <div key={a.id} className="bg-cream-200 dark:bg-slate-800 rounded-2xl shadow-soft transition-all">
            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(a.id)}>
              <div className="flex items-center gap-4 flex-grow">
                <div className="flex flex-col items-center justify-center w-16">
                  <span className="text-sm text-slate-gray-500 dark:text-cream-400">{a.dueDate.toLocaleString('id-ID', { month: 'short' })}</span>
                  <span className="text-2xl font-bold text-slate-gray-700 dark:text-cream-200">{a.dueDate.getDate()}</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-gray-800 dark:text-cream-100">{a.title}</h3>
                  <p className="text-sm text-slate-gray-500 dark:text-cream-400">{a.course}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <PriorityBadge priority={a.priority} />
                <div className="w-24">
                  <div className="h-2 bg-cream-100 dark:bg-slate-700 rounded-full"><div className="h-2 bg-mint-500 rounded-full" style={{ width: `${a.progress}%` }}></div></div>
                  <p className="text-xs text-center mt-1 text-slate-gray-500 dark:text-cream-400">{a.progress}%</p>
                </div>
                <button className="text-slate-gray-500 dark:text-cream-400">{expandedId === a.id ? <ChevronUp /> : <ChevronDown />}</button>
              </div>
            </div>
            {expandedId === a.id && (
              <div className="p-4 border-t border-cream-300 dark:border-slate-700 animate-fade-in-down">
                <p className="text-slate-gray-600 dark:text-cream-300 mb-4">{a.notes || "Tidak ada catatan."}</p>
                <div className="flex justify-end gap-2">
                  <button onClick={() => openModal(a)} className="p-2 text-slate-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(a.id)} className="p-2 text-slate-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingAssignment ? 'Edit Tugas' : 'Tugas Baru'}>
        <AssignmentForm assignment={editingAssignment} onSave={handleSave} onCancel={closeModal} courses={courses} />
      </Modal>
    </div>
  );
};

const Courses = ({ courses, setCourses }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const openModal = (course = null) => {
    setEditingCourse(course);
    setModalOpen(true);
  };
  const closeModal = () => {
    setEditingCourse(null);
    setModalOpen(false);
  };
  const handleSave = (formData) => {
    if (editingCourse) {
      setCourses(courses.map(c => c.id === editingCourse.id ? { ...c, ...formData } : c));
    } else {
      setCourses([...courses, { ...formData, id: Date.now() }]);
    }
    closeModal();
  };
  const handleDelete = (id) => setCourses(courses.filter(c => c.id !== id));

  const CourseForm = ({ course, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      name: course?.name || '', code: course?.code || '', lecturer: course?.lecturer || '',
      room: course?.room || '', credits: course?.credits || 3, notes: course?.notes || '',
    });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-gray-700 dark:text-cream-200">
        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nama Mata Kuliah" className="w-full p-3 bg-cream-200 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-peach-400 border-none" required />
        <div className="grid grid-cols-2 gap-4">
          <input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="Kode MK" className="w-full p-3 bg-cream-200 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-peach-400 border-none" />
          <input type="number" name="credits" value={formData.credits} onChange={handleChange} placeholder="SKS" className="w-full p-3 bg-cream-200 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-peach-400 border-none" />
        </div>
        <input type="text" name="lecturer" value={formData.lecturer} onChange={handleChange} placeholder="Nama Dosen" className="w-full p-3 bg-cream-200 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-peach-400 border-none" />
        <input type="text" name="room" value={formData.room} onChange={handleChange} placeholder="Ruangan / Link" className="w-full p-3 bg-cream-200 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-peach-400 border-none" />
        <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Catatan Penting..." rows="3" className="w-full p-3 bg-cream-200 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-peach-400 border-none"></textarea>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-600 text-slate-gray-800 dark:text-cream-200 hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors">Batal</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-peach-500 text-white hover:bg-peach-600 transition-colors">Simpan</button>
        </div>
      </form>
    );
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-gray-800 dark:text-cream-100">Courses</h1>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-peach-500 text-white rounded-lg shadow-soft hover:bg-peach-600 transition-all transform hover:scale-105">
          <Plus size={20} /><span>Add Course</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(c => (
          <div key={c.id} className="bg-cream-200 dark:bg-slate-800 rounded-2xl p-6 shadow-soft group relative">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openModal(c)} className="p-1 text-slate-gray-500 hover:text-blue-500 dark:hover:text-blue-400"><Edit2 size={16} /></button>
              <button onClick={() => handleDelete(c.id)} className="p-1 text-slate-gray-500 hover:text-red-500 dark:hover:text-red-400"><Trash2 size={16} /></button>
            </div>
            <h3 className="text-xl font-bold text-slate-gray-800 dark:text-cream-100 mb-1">{c.name}</h3>
            <p className="text-sm font-mono text-slate-gray-500 dark:text-cream-400 mb-4">{c.code} - {c.credits} SKS</p>
            <div className="space-y-2 text-slate-gray-600 dark:text-cream-300">
              <p><strong>Dosen:</strong> {c.lecturer}</p>
              <p><strong>Ruang:</strong> {c.room}</p>
              <p className="text-sm italic mt-2 bg-cream-100 dark:bg-slate-700 p-2 rounded-md">{c.notes || "Tidak ada catatan."}</p>
            </div>
          </div>
        ))}
      </div>
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCourse ? 'Edit Mata Kuliah' : 'Mata Kuliah Baru'}>
        <CourseForm course={editingCourse} onSave={handleSave} onCancel={closeModal} />
      </Modal>
    </div>
  );
};

const Schedule = ({ schedule }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayIndex = currentTime.getDay(); // Sunday is 0, Monday is 1...
  const todayName = days[(todayIndex + 6) % 7]; // Adjust to make Monday the first day of the week

  const isCurrentClass = (item) => {
    const now = currentTime;
    const [startH, startM] = item.start.split(':').map(Number);
    const [endH, endM] = item.end.split(':').map(Number);
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startH, startM);
    const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endH, endM);
    return now >= startTime && now <= endTime;
  };

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-3xl font-bold text-slate-gray-800 dark:text-cream-100 mb-6">Weekly Schedule</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {days.map(day => (
          <div key={day} className={`rounded-2xl p-4 shadow-soft ${day === todayName ? 'bg-mint-900 dark:bg-mint-900 ring-2 ring-peach-400' : 'bg-cream-200 dark:bg-slate-800'}`}>
            <h2 className={`font-bold text-xl text-center mb-4 ${day === todayName ? 'text-slate-gray-700 dark:text-mint-100' : 'text-slate-gray-700 dark:text-cream-200'}`}>{day}</h2>
            <div className="space-y-3 min-h-[5rem]">
              {schedule[day] && schedule[day].length > 0 ? (
                schedule[day].map((item, index) => (
                  <div key={index} className={`p-3 rounded-lg transition-all ${ day === todayName ? 'bg-peach-300 dark:bg-peach-600 shadow-lg scale-105' : 'bg-cream-100 dark:bg-slate-700'}`}>
                    <p className="font-bold text-slate-gray-800 dark:text-cream-100">{item.course}</p>
                    <p className="text-sm text-slate-gray-600 dark:text-cream-300">{item.start} - {item.end}</p>
                    <p className="text-sm text-slate-gray-500 dark:text-cream-400">{item.room}</p>
                  </div>
                ))
              ) : (
                  <p className="text-sm text-center text-slate-gray-500 dark:text-cream-400 pt-4">Tidak ada jadwal.</p>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DailyReminders = ({ dailyTasks, setDailyTasks }) => {
  const [newTask, setNewTask] = useState('');

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTask.trim() === '') return;
    setDailyTasks([...dailyTasks, { id: Date.now(), text: newTask, completed: false }]);
    setNewTask('');
  };

  const toggleTask = (id) => {
    setDailyTasks(dailyTasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };

  const deleteTask = (id) => {
    setDailyTasks(dailyTasks.filter(task => task.id !== id));
  };

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-3xl font-bold text-slate-gray-800 dark:text-cream-100 mb-6">Daily reminder</h1>
      <div className="max-w-2xl mx-auto bg-cream-200 dark:bg-slate-800 p-6 rounded-2xl shadow-soft">
        <form onSubmit={handleAddTask} className="flex gap-3 mb-6">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Tambah tugas baru..."
            className="w-full p-3 bg-cream-100 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-peach-400 border-none text-slate-gray-700 dark:text-cream-200"
          />
          <button type="submit" className="px-4 py-2 bg-peach-500 text-white rounded-lg shadow-soft hover:bg-peach-600 transition-colors">
            <Plus size={24} />
          </button>
        </form>
        <div className="space-y-3">
          {dailyTasks.map(task => (
            <div key={task.id} className="flex items-center bg-cream-100 dark:bg-slate-700 p-3 rounded-lg group">
              <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} className="h-5 w-5 rounded border-gray-300 text-peach-500 focus:ring-peach-400 cursor-pointer"/>
              <span className={`flex-grow ml-3 text-slate-gray-700 dark:text-cream-200 ${task.completed ? 'line-through text-slate-gray-400 dark:text-cream-500' : ''}`}>{task.text}</span>
              <button onClick={() => deleteTask(task.id)} className="ml-3 text-slate-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {dailyTasks.length === 0 && <p className="text-center text-slate-gray-500 dark:text-cream-400">Daftar tugasmu kosong!</p>}
        </div>
      </div>
    </div>
  );
};


// --- MAIN APP COMPONENT ---
export default function App() {
  const [theme, setTheme] = useStickyState('light', 'studinest-theme');
  const [page, setPage] = useStickyState('dashboard', 'studinest-page');
  const [assignments, setAssignments] = useStickyState(initialAssignments, 'studinest-assignments');
  const [courses, setCourses] = useStickyState(initialCourses, 'studinest-courses');
  const [schedule, setSchedule] = useStickyState(initialSchedule, 'studinest-schedule');
  const [dailyTasks, setDailyTasks] = useStickyState(initialDailyTasks, 'studinest-dailyTasks');

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const toggleTask = (id) => {
    setDailyTasks(dailyTasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard assignments={assignments} schedule={schedule} dailyTasks={dailyTasks} toggleTask={toggleTask} />;
      case 'assignments': return <Assignments assignments={assignments} setAssignments={setAssignments} courses={courses} />;
      case 'courses': return <Courses courses={courses} setCourses={setCourses} />;
      case 'schedule': return <Schedule schedule={schedule} />;
      case 'reminders': return <DailyReminders dailyTasks={dailyTasks} setDailyTasks={setDailyTasks} />;
      default: return <Dashboard assignments={assignments} schedule={schedule} dailyTasks={dailyTasks} toggleTask={toggleTask} />;
    }
  };

  const NavItem = ({ icon:Icon, label, pageName }) => (
    <button onClick={() => setPage(pageName)} className={`flex items-center w-full text-left p-3 rounded-lg transition-colors ${page === pageName ? 'bg-peach-200 dark:bg-peach-800 text-peach-800 dark:text-peach-100 font-bold' : 'hover:bg-cream-200 dark:hover:bg-slate-700 text-slate-gray-600 dark:text-cream-300'}`}>
      <Icon size={22} className="mr-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-cream-100 dark:bg-slate-900 text-slate-gray-800 dark:text-cream-200 font-sans transition-colors duration-300">
      {/* Sidebar */}
      <nav className="w-64 bg-cream-100 dark:bg-slate-800 p-6 flex flex-col shadow-lg z-10 border-r border-cream-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-peach-500 p-2 rounded-lg">
            <BookOpen className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-gray-800 dark:text-cream-100">Studinez</h1>
        </div>
        <div className="flex-grow space-y-3">
          <NavItem icon={Home} label="Dashboard" pageName="dashboard" />
          <NavItem icon={BookOpen} label="Assignments" pageName="assignments" />
          <NavItem icon={GraduationCap} label="Courses" pageName="courses" />
          <NavItem icon={Calendar} label="Schedule" pageName="schedule" />
          <NavItem icon={CheckSquare} label="Reminder" pageName="reminders" />
        </div>
        <div>
          <button onClick={toggleTheme} className="flex items-center w-full text-left p-3 rounded-lg hover:bg-cream-200 dark:hover:bg-slate-700 text-slate-gray-600 dark:text-cream-300 transition-colors">
            {theme === 'light' ? <Moon size={22} className="mr-4" /> : <Sun size={22} className="mr-4" />}
            <span>Ganti Tema</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
}
