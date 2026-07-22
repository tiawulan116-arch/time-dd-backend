import { useState, useEffect } from 'react';

const Dashboard = ({ onNavigateToCalendar, onNavigateToOnboarding }) => {
  const [tasks, setTasks] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fungsi pembantu untuk mendapatkan format waktu (HH:MM) lokal saat ini
  const getWaktuSekarang = (tambahJam = 0) => {
    const sekarang = new Date();
    const jam = String(sekarang.getHours() + tambahJam).padStart(2, '0');
    const menit = String(sekarang.getMinutes()).padStart(2, '0');
    return `${jam}:${menit}`;
  };

  // Fungsi pembantu untuk mendapatkan format tanggal (YYYY-MM-DD) lokal saat ini
  const getTanggalHariIni = () => {
    const sekarang = new Date();
    const tahun = sekarang.getFullYear();
    const bulan = String(sekarang.getMonth() + 1).padStart(2, '0');
    const tanggal = String(sekarang.getDate()).padStart(2, '0');
    return `${tahun}-${bulan}-${tanggal}`;
  };

  // State Form dengan nilai awal dinamis
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Kuliah');
  const [date, setDate] = useState(getTanggalHariIni());
  const [startTime, setStartTime] = useState(getWaktuSekarang(0));
  const [endTime, setEndTime] = useState(getWaktuSekarang(2));

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Kuliah');
  const [isLoaded, setIsLoaded] = useState(false);
  const [userName, setUserName] = useState('Tia');

  // State navigasi sub-halaman dinamis
  const [currentSubPage, setCurrentSubPage] = useState('Utama'); 

  // ENDPOINT API ONLINE MOCKAPI
  const TASKS_API_URL = 'https://6a60fe94da10c59c180952e3.mockapi.io/events';
  const USERS_API_URL = 'https://6a60fe94da10c59c180952e3.mockapi.io/users';

  // Efek untuk memperbarui jam & tanggal ke waktu paling baru TEPAT saat modal dibuka
  useEffect(() => {
    if (isModalOpen) {
      setDate(getTanggalHariIni());
      setStartTime(getWaktuSekarang(0));
      setEndTime(getWaktuSekarang(2));
    }
  }, [isModalOpen]);

  // 1. AMBIL DATA DARI MOCKAPI ONLINE
  const fetchTasksAndUser = async () => {
    try {
      // Ambil data tugas harian dari server MockAPI
      const tasksRes = await fetch(TASKS_API_URL);
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      }

      // Ambil data user aktif dari LocalStorage atau MockAPI
      const localUser = JSON.parse(localStorage.getItem('currentUser'));
      if (localUser && localUser.name) {
        setUserName(localUser.name);
      } else {
        const userRes = await fetch(USERS_API_URL);
        if (userRes.ok) {
          const userData = await userRes.json();
          if (Array.isArray(userData) && userData.length > 0) {
            setUserName(userData[0].name || 'Tia');
          }
        }
      }
    } catch (error) {
      console.error("Gagal mengambil data dari MockAPI:", error);
      const localUser = JSON.parse(localStorage.getItem('currentUser'));
      if (localUser && localUser.name) setUserName(localUser.name);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    fetchTasksAndUser();
    return () => clearTimeout(timer);
  }, []);

  const formatDateToIndo = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // 2. TAMBAH DATA KE MOCKAPI (CREATE)
  const handleCreateAgenda = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("Judul agenda tidak boleh kosong!");

    const isConflict = tasks.some(task => {
      if (!task.time || task.category === 'Selesai') return false;

      const existingDate = task.time.substring(0, 10); 
      const openBracketIdx = task.time.indexOf('(');
      const closeBracketIdx = task.time.indexOf(')');
      if (openBracketIdx === -1 || closeBracketIdx === -1) return false;

      const timePart = task.time.substring(openBracketIdx + 1, closeBracketIdx);
      const [existingStart, existingEnd] = timePart.split(' - ');

      const isSameDate = existingDate.trim() === date.trim();
      const isTimeOverlap = (startTime >= existingStart && startTime < existingEnd) || 
                            (endTime > existingStart && endTime <= existingEnd) ||
                            (startTime <= existingStart && endTime >= existingEnd);

      return isSameDate && isTimeOverlap;
    });

    if (isConflict) {
      return alert(`⚠️ NOTIFIKASI BENTROK!\n\nJadwal "${title.trim()}" bertabrakan dengan agenda kuliah atau kerja kamu yang lain di waktu yang sama. Silakan atur ulang jam atau tanggalnya ya, Tia!`);
    }

    const newAgenda = {
      title,
      category,
      time: `${date} (${startTime} - ${endTime})`,
      date,
      startTime,
      endTime
    };

    try {
      const res = await fetch(TASKS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgenda)
      });
      if (res.ok) {
        setTitle(''); 
        setIsModalOpen(false);
        alert("✨ Agenda baru berhasil ditambahkan ke Server Online!");
        fetchTasksAndUser(); 
      }
    } catch (error) {
      alert("Gagal menyimpan ke Database Online");
    }
  };

  // 3. EDIT DATA DI MOCKAPI (UPDATE)
  const handleUpdateTask = async (id, currentTask) => {
    if (!editTitle.trim()) return alert("Judul tidak boleh kosong!");
    
    try {
      const res = await fetch(`${TASKS_API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentTask,
          title: editTitle,
          category: editCategory
        })
      });
      if (res.ok) {
        setEditingTaskId(null);
        alert("✨ Agenda berhasil diperbarui!");
        fetchTasksAndUser();
      }
    } catch (error) {
      alert("Gagal memperbarui data di server");
    }
  };

  // 4. MENGUBAH STATUS SELESAI DI MOCKAPI (UPDATE)
  const handleToggleComplete = async (task) => {
    let updatedCategory = task.category;
    let updatedOriginalCategory = task.originalCategory || task.category;

    if (task.category === 'Selesai') {
      updatedCategory = task.originalCategory || 'Kuliah';
    } else {
      updatedCategory = 'Selesai';
    }

    try {
      await fetch(`${TASKS_API_URL}/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...task,
          category: updatedCategory,
          originalCategory: updatedOriginalCategory
        })
      });
      fetchTasksAndUser();
    } catch (error) {
      console.error("Gagal mengubah status tugas:", error);
    }
  };

  // 5. HAPUS DATA DARI MOCKAPI (DELETE)
  const handleDeleteTask = async (id) => {
    if (window.confirm("Hapus agenda ini secara permanen dari server?")) {
      try {
        const res = await fetch(`${TASKS_API_URL}/${id}`, { method: 'DELETE' });
        if (res.ok) {
          alert("Agenda berhasil dihapus dari Server!");
          fetchTasksAndUser();
        }
      } catch (error) {
        alert("Gagal menghapus data dari server");
      }
    }
  };

  const navigateToSubPage = (pageName) => {
    setCurrentSubPage(pageName);
    const element = document.getElementById('sub-page-anchor');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const uncompletedCount = tasks.filter(t => t.category !== 'Selesai').length;
  const completedCount = tasks.filter(t => t.category === 'Selesai').length;
  const kuliahCount = tasks.filter(t => t.category === 'Kuliah' || t.originalCategory === 'Kuliah').length;
  const kerjaCount = tasks.filter(t => t.category === 'Kerja' || t.originalCategory === 'Kerja').length;
  const organisasiCount = tasks.filter(t => t.category === 'Organisasi' || t.originalCategory === 'Organisasi').length;

  const totalTasks = tasks.length || 1;
  const kuliahPercent = Math.round((tasks.filter(t => t.category === 'Kuliah' || t.originalCategory === 'Kuliah').length / totalTasks) * 100);
  const kerjaPercent = Math.round((tasks.filter(t => t.category === 'Kerja' || t.originalCategory === 'Kerja').length / totalTasks) * 100);
  const organisasiPercent = Math.round((tasks.filter(t => t.category === 'Organisasi' || t.originalCategory === 'Organisasi').length / totalTasks) * 100);

  const subPageTasks = tasks.filter(t => {
    if (currentSubPage === 'Belum Selesai') return t.category !== 'Selesai';
    if (currentSubPage === 'Selesai') return t.category === 'Selesai';
    return t.category === currentSubPage || t.originalCategory === currentSubPage;
  });

  return (
    <div style={styles.dashboardLayout}>
      
      {/* SIDEBAR LEFT */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarLogoIcon}>T</div>
          <div>
            <h2 style={styles.sidebarLogo}>TimeDD</h2>
            <span style={styles.sidebarSublogo}>Double Degree Balance</span>
          </div>
        </div>
        
        <nav style={styles.sidebarNav}>
          <div onClick={() => { setSelectedFilter('Semua'); setCurrentSubPage('Utama'); }} style={{ ...styles.sidebarMenu, backgroundColor: currentSubPage === 'Utama' ? 'rgba(255,255,255,0.15)' : 'transparent', color: '#FFFFFF' }}>
            📊 Ringkasan Panel
          </div>
          <div onClick={onNavigateToCalendar} style={styles.sidebarMenu}>📅 Kalender Jadwal</div>
        </nav>

        <div style={styles.sidebarFooter}>
          <button onClick={onNavigateToOnboarding} style={styles.btnLogout}>
            🚪 Keluar Aplikasi
          </button>
          <div style={styles.sidebarVersion}>v1.0.0 © 2026</div>
        </div>
      </aside>

      {/* MAIN KONTEN */}
      <main style={styles.mainContent}>
        
        {/* USER WELCOME BANNER CARD */}
        <header style={{
          ...styles.mainHeaderCard,
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(-15px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div>
            <h1 style={styles.headerTitle}>Halo, {userName.split(' ')[0].toLowerCase()} 👋</h1>
            <p style={styles.headerSubtitle}>Klik salah satu kartu ringkasan dibawah ini untuk membuka halaman rincian data spesifiknya!.</p>
          </div>
          <div style={styles.headerBtnGroup}>
            <button onClick={() => setIsModalOpen(true)} style={styles.btnCreate}>➕ Tambah Agenda Baru</button>
            <button onClick={onNavigateToCalendar} style={styles.btnCalendar}>Lihat Kalender →</button>
          </div>
        </header>

        {/* METRICS GRID AREA */}
        <div style={{
          ...styles.statsWrapper,
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(15px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.05s'
        }}>
          
          <div style={styles.gridStatus}>
            <div onClick={() => navigateToSubPage('Belum Selesai')} style={{ ...styles.cardStat, background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 50%, #FECDD3 100%)', border: currentSubPage === 'Belum Selesai' ? '2px solid #F43F5E' : '1px solid #FB7185' }}>
              <span style={styles.cardStatLabelDark}>🔴 Belum Selesai (Klik Rincian)</span>
              <h3 style={styles.cardStatNumDark}>{uncompletedCount}</h3>
            </div>
            <div onClick={() => navigateToSubPage('Selesai')} style={{ ...styles.cardStat, background: 'linear-gradient(135deg, #F0FDF4 0%, #E6F4EA 50%, #D1FAE5 100%)', border: currentSubPage === 'Selesai' ? '2px solid #10B981' : '1px solid #34D399' }}>
              <span style={styles.cardStatLabelDark}>🟢 Sudah Selesai (Klik Rincian)</span>
              <h3 style={styles.cardStatNumDark}>{completedCount}</h3>
            </div>
          </div>

          <div style={styles.gridCategory}>
            <div onClick={() => navigateToSubPage('Kuliah')} style={{ ...styles.cardStat, background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 50%, #BAE6FD 100%)', border: currentSubPage === 'Kuliah' ? '2px solid #3B82F6' : '1px solid #60A5FA' }}>
              <span style={styles.cardStatLabelDark}>📚 Total Kuliah</span>
              <h3 style={styles.cardStatNumDark}>{kuliahCount}</h3>
            </div>
            <div onClick={() => navigateToSubPage('Kerja')} style={{ ...styles.cardStat, background: 'linear-gradient(135deg, #FFFDF5 0%, #FFFBEB 50%, #FEF3C7 100%)', border: currentSubPage === 'Kerja' ? '2px solid #F59E0B' : '1px solid #FBBF24' }}>
              <span style={styles.cardStatLabelDark}>💼 Total Kerja</span>
              <h3 style={styles.cardStatNumDark}>{kerjaCount}</h3>
            </div>
            <div onClick={() => navigateToSubPage('Organisasi')} style={{ ...styles.cardStat, background: 'linear-gradient(135deg, #FAF5FF 0%, #FDF4FF 50%, #F5D0FE 100%)', border: currentSubPage === 'Organisasi' ? '2px solid #A855F7' : '1px solid #C084FC' }}>
              <span style={styles.cardStatLabelDark}>🏢 Total Organisasi</span>
              <h3 style={styles.cardStatNumDark}>{organisasiCount}</h3>
            </div>
          </div>
        </div>

        <div id="sub-page-anchor" />

        {/* SUB-HALAMAN RINCIAN TUGAS */}
        {currentSubPage !== 'Utama' && (
          <section style={styles.subPageWrapperCard}>
            <div style={styles.subPageHeaderRow}>
              <div>
                <span style={styles.subPagePreTitle}>SUB-HALAMAN PANEL JADWAL</span>
                <h2 style={styles.subPageMainTitle}>Lembar Rincian: Kategori {currentSubPage}</h2>
              </div>
              <button onClick={() => setCurrentSubPage('Utama')} style={styles.btnBackToMainDashboard}>
                ⬅️ Kembali Ke Ringkasan Utama
              </button>
            </div>

            <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
              <table style={styles.dataTable}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.thStyles}>Status</th>
                    <th style={styles.thStyles}>Nama Kegiatan / Agenda</th>
                    <th style={styles.thStyles}>Kategori</th>
                    <th style={styles.thStyles}>Waktu Jadwal</th>
                    <th style={styles.thStyles}>Aksi Pengelolaan</th>
                  </tr>
                </thead>
                <tbody>
                  {subPageTasks.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8', fontWeight: '500' }}>
                        Tidak ada agenda harian khusus pada rincian kategori "{currentSubPage}".
                      </td>
                    </tr>
                  ) : subPageTasks.map((task) => {
                    const rawDate = task.time ? task.time.substring(0, 10) : (task.date || '');
                    const timeRange = task.time && task.time.includes('(') ? task.time.substring(task.time.indexOf('(')) : `(${task.startTime || ''} - ${task.endTime || ''})`;
                    const formattedIndoDate = `${formatDateToIndo(rawDate)} ${timeRange}`;

                    return (
                      <tr key={task.id} style={styles.tableBodyRow}>
                        <td style={styles.tdStyles}>
                          <input type="checkbox" checked={task.category === 'Selesai'} onChange={() => handleToggleComplete(task)} style={styles.taskCheckbox} />
                        </td>
                        <td style={styles.tdStyles}>
                          {editingTaskId === task.id ? (
                            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={styles.tableInputText} />
                          ) : (
                            <span style={{ ...styles.taskTextSpan, textDecoration: task.category === 'Selesai' ? 'line-through' : 'none', opacity: task.category === 'Selesai' ? 0.4 : 1 }}>{task.title}</span>
                          )}
                        </td>
                        <td style={styles.tdStyles}>
                          {editingTaskId === task.id ? (
                            <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={styles.tableSelect}>
                              <option value="Kuliah">Kuliah</option>
                              <option value="Kerja">Kerja</option>
                              <option value="Organisasi">Organisasi</option>
                            </select>
                          ) : (
                            <span style={{
                              ...styles.badgeCategory,
                              backgroundColor: task.category === 'Selesai' ? '#D1FAE5' : task.category === 'Kerja' || task.originalCategory === 'Kerja' ? '#FEF3C7' : task.category === 'Kuliah' || task.originalCategory === 'Kuliah' ? '#E0F2FE' : '#F3E8FF',
                              color: task.category === 'Selesai' ? '#065F46' : task.category === 'Kerja' || task.originalCategory === 'Kerja' ? '#B45309' : task.category === 'Kuliah' || task.originalCategory === 'Kuliah' ? '#0369A1' : '#6B21A8'
                            }}>{task.category === 'Selesai' ? 'Selesai' : (task.originalCategory || task.category)}</span>
                          )}
                        </td>
                        <td style={styles.tdStyles}><span style={styles.tableTimeSpan}>📅 {formattedIndoDate}</span></td>
                        <td style={styles.tdStyles}>
                          <div style={styles.actionBtnGroup}>
                            {editingTaskId === task.id ? (
                              <button onClick={() => handleUpdateTask(task.id, task)} style={styles.btnSaveInline}>💾 Simpan</button>
                            ) : (
                              <>
                                <button onClick={() => { setEditingTaskId(task.id); setEditTitle(task.title); setEditCategory(task.originalCategory || task.category); }} style={styles.btnActionEditComponent}>✏️ Edit</button>
                                <button onClick={() => handleDeleteTask(task.id)} style={styles.btnActionDeleteComponent}>❌ Hapus</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* MONITORING BOARD GRAPH */}
        <section style={{
          ...styles.chartSection,
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s'
        }}>
          
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Traffic & Activity Monitoring</h3>
            <span style={styles.chartBadge}>Real-time Balance</span>
          </div>
          
          <div style={styles.chartProgressWrapper}>
            <div style={styles.progressItem}>
              <div style={styles.progressLabelRow}>
                <span style={styles.progressName}>📚 Beban Tugas Akademik</span>
                <span style={styles.progressVal}>{kuliahPercent}%</span>
              </div>
              <div style={styles.progressBarBg}>
                <div style={{ ...styles.progressBarFill, width: `${kuliahPercent}%`, backgroundColor: '#3B82F6' }} />
              </div>
            </div>

            <div style={styles.progressItem}>
              <div style={styles.progressLabelRow}>
                <span style={styles.progressName}>💼 Alokasi Jam Kerja Shift</span>
                <span style={styles.progressVal}>{kerjaPercent}%</span>
              </div>
              <div style={styles.progressBarBg}>
                <div style={{ ...styles.progressBarFill, width: `${kerjaPercent}%`, backgroundColor: '#F59E0B' }} />
              </div>
            </div>

            <div style={styles.progressItem}>
              <div style={styles.progressLabelRow}>
                <span style={styles.progressName}>🏢 Aktivitas & Rapat Organisasi</span>
                <span style={styles.progressVal}>{organisasiPercent}%</span>
              </div>
              <div style={styles.progressBarBg}>
                <div style={{ ...styles.progressBarFill, width: `${organisasiPercent}%`, backgroundColor: '#A855F7' }} />
              </div>
            </div>
          </div>

        </section>

      </main>

      {/* POPUP MODAL */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContentBox}>
            <h3 style={styles.modalContentTitle}>Tambah Agenda Baru 📝</h3>
            <form onSubmit={handleCreateAgenda} style={styles.modalFormWrapper}>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nama agenda..." style={styles.modalInputItem} />
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.modalInputItem}>
                <option value="Kuliah">📚 Kuliah</option>
                <option value="Kerja">💼 Kerja</option>
                <option value="Organisasi">🏢 Organisasi</option>
              </select>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.modalInputItem} />
              <div style={styles.modalTimeFlex}>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={styles.modalInputTime} />
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={styles.modalInputTime} />
              </div>
              <div style={styles.modalBtnGroup}>
                <button type="submit" style={styles.modalBtnSubmit}>Tambah Agenda</button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={styles.modalBtnCancel}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Objek Stylesheet Sempurna (Sidebar Tetap di Kiri di Laptop & Konten Rapi)
const styles = {
  dashboardLayout: {
    display: 'flex',
    flexDirection: 'row',
    background: 'linear-gradient(135deg, #EBF3FF 0%, #F5F9FF 100%)',
    minHeight: '100vh',
    fontFamily: '"Inter", sans-serif',
    width: '100%',
    overflowX: 'hidden'
  },
  sidebar: {
    width: '280px',
    backgroundColor: '#1E3A8A',
    color: 'white',
    padding: '2.5rem 1.5rem 1.5rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    boxShadow: '4px 0 20px rgba(30, 58, 138, 0.1)',
    flexShrink: 0,
    boxSizing: 'border-box'
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  sidebarLogoIcon: {
    width: '35px',
    height: '35px',
    backgroundColor: 'white',
    color: '#1E3A8A',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '10px',
    fontWeight: '900',
    fontSize: '1.25rem'
  },
  sidebarLogo: {
    fontSize: '1.35rem',
    fontWeight: '800',
    margin: 0,
    letterSpacing: '0.5px'
  },
  sidebarSublogo: {
    fontSize: '0.75rem',
    color: '#93C5FD',
    display: 'block',
    marginTop: '1px'
  },
  sidebarNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    flexGrow: 1
  },
  sidebarMenu: {
    padding: '0.85rem 1.25rem',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '0.95rem',
    cursor: 'pointer',
    color: '#93C5FD',
    transition: 'all 0.3s ease'
  },
  sidebarFooter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  btnLogout: {
    backgroundColor: '#EF4444',
    color: 'white',
    border: 'none',
    padding: '0.8rem 1rem',
    borderRadius: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '0.95rem',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
    transition: '0.2s'
  },
  sidebarVersion: {
    fontSize: '0.8rem',
    opacity: 0.4,
    textAlign: 'center'
  },
  mainContent: {
    flexGrow: 1,
    padding: 'clamp(1.5rem, 3vw, 3.5rem)',
    overflowY: 'auto',
    width: 'calc(100% - 280px)',
    boxSizing: 'border-box'
  },
  mainHeaderCard: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 'clamp(1.25rem, 3vw, 2.25rem)',
    borderRadius: '24px',
    boxShadow: '0 10px 30px rgba(30, 58, 138, 0.04)',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    marginBottom: '2rem',
    gap: '1.25rem',
    boxSizing: 'border-box'
  },
  headerTitle: {
    fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
    fontWeight: '900',
    color: '#1E3A8A',
    margin: 0,
    letterSpacing: '-0.5px'
  },
  headerSubtitle: {
    color: '#64748B',
    marginTop: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  headerBtnGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem'
  },
  btnCreate: {
    backgroundColor: '#10B981',
    color: 'white',
    padding: '0.75rem 1.25rem',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 8px 16px rgba(16, 185, 129, 0.15)',
    transition: '0.2s',
    fontSize: '0.9rem'
  },
  btnCalendar: {
    backgroundColor: '#4F46E5',
    color: 'white',
    padding: '0.75rem 1.25rem',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 8px 16px rgba(79, 70, 229, 0.15)',
    transition: '0.2s',
    fontSize: '0.9rem'
  },
  statsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    marginBottom: '2rem'
  },
  gridStatus: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.25rem'
  },
  gridCategory: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.25rem'
  },
  cardStat: {
    padding: '1.5rem 1.25rem',
    borderRadius: '24px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(0,0,0,0.02)',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    boxSizing: 'border-box'
  },
  cardStatLabelDark: {
    color: '#374151',
    fontSize: '0.9rem',
    fontWeight: '800',
    letterSpacing: '0.3px'
  },
  cardStatNumDark: {
    fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
    fontWeight: '900',
    margin: '0.4rem 0 0 0',
    color: '#111827',
    lineHeight: '1'
  },
  subPageWrapperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    padding: 'clamp(1.25rem, 3vw, 2.5rem)',
    boxShadow: '0 15px 35px rgba(30, 58, 138, 0.06)',
    border: '1px solid #E2E8F0',
    marginBottom: '1rem',
    marginTop: '0.5rem',
    boxSizing: 'border-box'
  },
  subPageHeaderRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #F1F5F9',
    paddingBottom: '1rem',
    gap: '1rem'
  },
  subPagePreTitle: {
    fontSize: '0.7rem',
    color: '#3B82F6',
    fontWeight: '800',
    letterSpacing: '1px'
  },
  subPageMainTitle: {
    margin: '0.25rem 0 0 0',
    fontSize: '1.25rem',
    fontWeight: '900',
    color: '#0F172A'
  },
  btnBackToMainDashboard: {
    backgroundColor: '#1E293B',
    color: 'white',
    border: 'none',
    padding: '0.6rem 1.1rem',
    borderRadius: '10px',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  chartSection: {
    backgroundColor: 'white',
    padding: 'clamp(1.25rem, 3vw, 2.5rem)',
    borderRadius: '24px',
    boxShadow: '0 12px 40px rgba(30, 58, 138, 0.04)',
    border: '1px solid #E2E8F0',
    marginTop: '1.5rem',
    boxSizing: 'border-box'
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  chartTitle: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#1E293B',
    margin: 0
  },
  chartBadge: {
    backgroundColor: '#EEF2F6',
    color: '#475569',
    padding: '0.3rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: '700'
  },
  chartProgressWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
  },
  progressItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  progressLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  progressName: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#475569'
  },
  progressVal: {
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#1E293B'
  },
  progressBarBg: {
    width: '100%',
    height: '10px',
    backgroundColor: '#F1F5F9',
    borderRadius: '999px',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  tableSectionWrapper: {
    marginTop: '1rem'
  },
  tableSectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: '1rem'
  },
  emptyTableText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '0.85rem',
    padding: '2rem 0',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    border: '1px dashed #E2E8F0'
  },
  dataTable: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    minWidth: '600px'
  },
  tableHeaderRow: {
    borderBottom: '2px solid #E2E8F0',
    backgroundColor: '#F8FAFC'
  },
  thStyles: {
    padding: '0.85rem',
    fontSize: '0.8rem',
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tableBodyRow: {
    borderBottom: '1px solid #F1F5F9',
    transition: 'background-color 0.2s ease'
  },
  tdStyles: {
    padding: '1rem 0.85rem',
    verticalAlign: 'middle'
  },
  taskCheckbox: {
    transform: 'scale(1.2)',
    cursor: 'pointer',
    accentColor: '#10B981'
  },
  taskTextSpan: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#1E293B'
  },
  tableTimeSpan: {
    fontSize: '0.8rem',
    color: '#64748B',
    fontWeight: '600'
  },
  badgeCategory: {
    padding: '0.3rem 0.85rem',
    borderRadius: '9999px',
    fontSize: '0.7rem',
    fontWeight: '800',
    letterSpacing: '0.2px'
  },
  actionBtnGroup: {
    display: 'flex',
    gap: '0.4rem'
  },
  btnActionEditComponent: {
    backgroundColor: '#3B82F6',
    color: 'white',
    border: 'none',
    padding: '0.45rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(59, 130, 246, 0.15)',
    transition: 'all 0.2s ease'
  },
  btnActionDeleteComponent: {
    backgroundColor: '#EF4444',
    color: 'white',
    border: 'none',
    padding: '0.45rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(239, 68, 68, 0.15)',
    transition: 'all 0.2s ease'
  },
  tableInputText: {
    padding: '0.4rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #3B82F6',
    width: '90%'
  },
  tableSelect: {
    padding: '0.4rem 0.5rem',
    borderRadius: '6px',
    border: '1px solid #3B82F6',
    backgroundColor: 'white'
  },
  btnSaveInline: {
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    padding: '0.45rem 0.9rem',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.15)'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    padding: '1rem',
    boxSizing: 'border-box'
  },
  modalContentBox: {
    backgroundColor: 'white',
    padding: '1.75rem 1.5rem',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '450px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
    boxSizing: 'border-box'
  },
  modalContentTitle: {
    margin: 0,
    fontSize: '1.2rem',
    fontWeight: '800',
    color: '#0F172A'
  },
  modalFormWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  modalInputItem: {
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    fontSize: '0.9rem',
    backgroundColor: '#F8FAFC',
    boxSizing: 'border-box'
  },
  modalTimeFlex: {
    display: 'flex',
    gap: '0.75rem'
  },
  modalInputTime: {
    flex: 1,
    padding: '0.8rem 1rem',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    fontSize: '0.9rem',
    backgroundColor: '#F8FAFC',
    boxSizing: 'border-box'
  },
  modalBtnGroup: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.25rem'
  },
  modalBtnSubmit: {
    flex: 2,
    backgroundColor: '#2563EB',
    color: 'white',
    padding: '0.8rem',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
  },
  modalBtnCancel: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    color: '#475569',
    padding: '0.8rem',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer'
  }
};

export default Dashboard;