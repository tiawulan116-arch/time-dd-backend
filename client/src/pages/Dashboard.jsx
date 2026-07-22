import { useState, useEffect } from 'react';

const Dashboard = ({ onNavigateToCalendar, onNavigateToOnboarding }) => {
  const [tasks, setTasks] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getWaktuSekarang = (tambahJam = 0) => {
    const sekarang = new Date();
    const jam = String(sekarang.getHours() + tambahJam).padStart(2, '0');
    const menit = String(sekarang.getMinutes()).padStart(2, '0');
    return `${jam}:${menit}`;
  };

  const getTanggalHariIni = () => {
    const sekarang = new Date();
    const tahun = sekarang.getFullYear();
    const bulan = String(sekarang.getMonth() + 1).padStart(2, '0');
    const tanggal = String(sekarang.getDate()).padStart(2, '0');
    return `${tahun}-${bulan}-${tanggal}`;
  };

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
  const [currentSubPage, setCurrentSubPage] = useState('Utama'); 

  const TASKS_API_URL = 'https://6a60fe94da10c59c180952e3.mockapi.io/events';
  const USERS_API_URL = 'https://6a60fe94da10c59c180952e3.mockapi.io/users';

  useEffect(() => {
    if (isModalOpen) {
      setDate(getTanggalHariIni());
      setStartTime(getWaktuSekarang(0));
      setEndTime(getWaktuSekarang(2));
    }
  }, [isModalOpen]);

  const fetchTasksAndUser = async () => {
    try {
      const tasksRes = await fetch(TASKS_API_URL);
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      }

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
      return alert(`⚠️ NOTIFIKASI BENTROK!\n\nJadwal "${title.trim()}" bertabrakan dengan agenda kamu yang lain.`);
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
        alert("✨ Agenda baru berhasil ditambahkan!");
        fetchTasksAndUser(); 
      }
    } catch (error) {
      alert("Gagal menyimpan ke Database Online");
    }
  };

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

  const handleToggleComplete = async (task) => {
    let updatedCategory = task.category === 'Selesai' ? (task.originalCategory || 'Kuliah') : 'Selesai';
    let updatedOriginalCategory = task.originalCategory || task.category;

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

  const handleDeleteTask = async (id) => {
    if (window.confirm("Hapus agenda ini secara permanen dari server?")) {
      try {
        const res = await fetch(`${TASKS_API_URL}/${id}`, { method: 'DELETE' });
        if (res.ok) {
          alert("Agenda berhasil dihapus!");
          fetchTasksAndUser();
        }
      } catch (error) {
        alert("Gagal menghapus data");
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
  const kuliahPercent = Math.round((kuliahCount / totalTasks) * 100);
  const kerjaPercent = Math.round((kerjaCount / totalTasks) * 100);
  const organisasiPercent = Math.round((organisasiCount / totalTasks) * 100);

  const subPageTasks = tasks.filter(t => {
    if (currentSubPage === 'Belum Selesai') return t.category !== 'Selesai';
    if (currentSubPage === 'Selesai') return t.category === 'Selesai';
    return t.category === currentSubPage || t.originalCategory === currentSubPage;
  });

  return (
    <div className="dashboard-layout" style={styles.dashboardLayout}>
      {/* CSS MEDIA QUERY UNTUK RESPONTIF HP */}
      <style>{`
        @media (max-width: 768px) {
          .dashboard-layout {
            flex-direction: column !important;
          }
          .dashboard-sidebar {
            width: 100% !important;
            padding: 1.25rem !important;
          }
          .dashboard-nav {
            flex-direction: row !important;
            justify-content: space-around !important;
          }
          .dashboard-main {
            width: 100% !important;
            padding: 1rem !important;
          }
          .hide-mobile {
            display: none !important;
          }
        }
      `}</style>
      
      {/* SIDEBAR LEFT */}
      <aside className="dashboard-sidebar" style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarLogoIcon}>T</div>
          <div>
            <h2 style={styles.sidebarLogo}>TimeDD</h2>
            <span style={styles.sidebarSublogo}>Double Degree Balance</span>
          </div>
        </div>
        
        <nav className="dashboard-nav" style={styles.sidebarNav}>
          <div onClick={() => { setSelectedFilter('Semua'); setCurrentSubPage('Utama'); }} style={{ ...styles.sidebarMenu, backgroundColor: currentSubPage === 'Utama' ? 'rgba(255,255,255,0.15)' : 'transparent', color: '#FFFFFF' }}>
            📊 Ringkasan
          </div>
          <div onClick={onNavigateToCalendar} style={styles.sidebarMenu}>📅 Kalender</div>
          <div onClick={onNavigateToOnboarding} style={{ ...styles.sidebarMenu, color: '#FCA5A5' }}>
            🚪 Keluar
          </div>
        </nav>

        <div className="hide-mobile" style={styles.sidebarFooter}>
          <div style={styles.sidebarVersion}>v1.0.0 © 2026</div>
        </div>
      </aside>

      {/* MAIN KONTEN */}
      <main className="dashboard-main" style={styles.mainContent}>
        
        {/* USER WELCOME BANNER CARD */}
        <header style={styles.mainHeaderCard}>
          <div>
            <h1 style={styles.headerTitle}>Halo, {userName.split(' ')[0].toLowerCase()} 👋</h1>
            <p style={styles.headerSubtitle}>Klik salah satu kartu ringkasan di bawah ini untuk melihat rincian datanya.</p>
          </div>
          <div style={styles.headerBtnGroup}>
            <button onClick={() => setIsModalOpen(true)} style={styles.btnCreate}>➕ Tambah Agenda</button>
            <button onClick={onNavigateToCalendar} style={styles.btnCalendar}>Kalender →</button>
          </div>
        </header>

        {/* METRICS GRID AREA */}
        <div style={styles.statsWrapper}>
          <div style={styles.gridStatus}>
            <div onClick={() => navigateToSubPage('Belum Selesai')} style={{ ...styles.cardStat, background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 50%, #FECDD3 100%)', border: currentSubPage === 'Belum Selesai' ? '2px solid #F43F5E' : '1px solid #FB7185' }}>
              <span style={styles.cardStatLabelDark}>🔴 Belum Selesai</span>
              <h3 style={styles.cardStatNumDark}>{uncompletedCount}</h3>
            </div>
            <div onClick={() => navigateToSubPage('Selesai')} style={{ ...styles.cardStat, background: 'linear-gradient(135deg, #F0FDF4 0%, #E6F4EA 50%, #D1FAE5 100%)', border: currentSubPage === 'Selesai' ? '2px solid #10B981' : '1px solid #34D399' }}>
              <span style={styles.cardStatLabelDark}>🟢 Sudah Selesai</span>
              <h3 style={styles.cardStatNumDark}>{completedCount}</h3>
            </div>
          </div>

          <div style={styles.gridCategory}>
            <div onClick={() => navigateToSubPage('Kuliah')} style={{ ...styles.cardStat, background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 50%, #BAE6FD 100%)', border: currentSubPage === 'Kuliah' ? '2px solid #3B82F6' : '1px solid #60A5FA' }}>
              <span style={styles.cardStatLabelDark}>📚 Kuliah</span>
              <h3 style={styles.cardStatNumDark}>{kuliahCount}</h3>
            </div>
            <div onClick={() => navigateToSubPage('Kerja')} style={{ ...styles.cardStat, background: 'linear-gradient(135deg, #FFFDF5 0%, #FFFBEB 50%, #FEF3C7 100%)', border: currentSubPage === 'Kerja' ? '2px solid #F59E0B' : '1px solid #FBBF24' }}>
              <span style={styles.cardStatLabelDark}>💼 Kerja</span>
              <h3 style={styles.cardStatNumDark}>{kerjaCount}</h3>
            </div>
            <div onClick={() => navigateToSubPage('Organisasi')} style={{ ...styles.cardStat, background: 'linear-gradient(135deg, #FAF5FF 0%, #FDF4FF 50%, #F5D0FE 100%)', border: currentSubPage === 'Organisasi' ? '2px solid #A855F7' : '1px solid #C084FC' }}>
              <span style={styles.cardStatLabelDark}>🏢 Organisasi</span>
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
                <span style={styles.subPagePreTitle}>SUB-HALAMAN PANEL</span>
                <h2 style={styles.subPageMainTitle}>Rincian: {currentSubPage}</h2>
              </div>
              <button onClick={() => setCurrentSubPage('Utama')} style={styles.btnBackToMainDashboard}>
                ⬅️ Kembali
              </button>
            </div>

            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={styles.dataTable}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.thStyles}>Status</th>
                    <th style={styles.thStyles}>Kegiatan</th>
                    <th style={styles.thStyles}>Kategori</th>
                    <th style={styles.thStyles}>Waktu</th>
                    <th style={styles.thStyles}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {subPageTasks.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
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
                                <button onClick={() => { setEditingTaskId(task.id); setEditTitle(task.title); setEditCategory(task.originalCategory || task.category); }} style={styles.btnActionEditComponent}>✏️</button>
                                <button onClick={() => handleDeleteTask(task.id)} style={styles.btnActionDeleteComponent}>❌</button>
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
        <section style={styles.chartSection}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Activity Monitoring</h3>
            <span style={styles.chartBadge}>Real-time</span>
          </div>
          
          <div style={styles.chartProgressWrapper}>
            <div style={styles.progressItem}>
              <div style={styles.progressLabelRow}>
                <span style={styles.progressName}>📚 Akademik</span>
                <span style={styles.progressVal}>{kuliahPercent}%</span>
              </div>
              <div style={styles.progressBarBg}>
                <div style={{ ...styles.progressBarFill, width: `${kuliahPercent}%`, backgroundColor: '#3B82F6' }} />
              </div>
            </div>

            <div style={styles.progressItem}>
              <div style={styles.progressLabelRow}>
                <span style={styles.progressName}>💼 Kerja</span>
                <span style={styles.progressVal}>{kerjaPercent}%</span>
              </div>
              <div style={styles.progressBarBg}>
                <div style={{ ...styles.progressBarFill, width: `${kerjaPercent}%`, backgroundColor: '#F59E0B' }} />
              </div>
            </div>

            <div style={styles.progressItem}>
              <div style={styles.progressLabelRow}>
                <span style={styles.progressName}>🏢 Organisasi</span>
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

const styles = {
  dashboardLayout: {
    display: 'flex',
    flexDirection: 'row',
    background: 'linear-gradient(135deg, #EBF3FF 0%, #F5F9FF 100%)',
    minHeight: '100vh',
    fontFamily: '"Inter", sans-serif',
    width: '100%',
    boxSizing: 'border-box'
  },
  sidebar: {
    width: '280px',
    backgroundColor: '#1E3A8A',
    color: 'white',
    padding: '2.5rem 1.5rem',
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
    margin: 0
  },
  sidebarSublogo: {
    fontSize: '0.75rem',
    color: '#93C5FD',
    display: 'block'
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
    color: '#93C5FD'
  },
  sidebarFooter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  sidebarVersion: {
    fontSize: '0.8rem',
    opacity: 0.4,
    textAlign: 'center'
  },
  mainContent: {
    flexGrow: 1,
    padding: '2.5rem',
    width: 'calc(100% - 280px)',
    boxSizing: 'border-box'
  },
  mainHeaderCard: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: '1.5rem',
    borderRadius: '24px',
    boxShadow: '0 10px 30px rgba(30, 58, 138, 0.04)',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    marginBottom: '2rem',
    gap: '1rem'
  },
  headerTitle: {
    fontSize: 'clamp(1.4rem, 3vw, 2.25rem)',
    fontWeight: '900',
    color: '#1E3A8A',
    margin: 0
  },
  headerSubtitle: {
    color: '#64748B',
    marginTop: '0.5rem',
    fontSize: '0.9rem'
  },
  headerBtnGroup: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap'
  },
  btnCreate: {
    backgroundColor: '#10B981',
    color: 'white',
    padding: '0.75rem 1.25rem',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '700',
    cursor: 'pointer',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.25rem'
  },
  gridCategory: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1.25rem'
  },
  cardStat: {
    padding: '1.5rem 1.25rem',
    borderRadius: '24px',
    cursor: 'pointer',
    boxSizing: 'border-box'
  },
  cardStatLabelDark: {
    color: '#374151',
    fontSize: '0.9rem',
    fontWeight: '800'
  },
  cardStatNumDark: {
    fontSize: 'clamp(2rem, 4vw, 3.25rem)',
    fontWeight: '900',
    margin: '0.4rem 0 0 0',
    color: '#111827'
  },
  subPageWrapperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    padding: '1.5rem',
    boxShadow: '0 15px 35px rgba(30, 58, 138, 0.06)',
    border: '1px solid #E2E8F0',
    marginBottom: '1rem'
  },
  subPageHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #F1F5F9',
    paddingBottom: '1rem'
  },
  subPagePreTitle: {
    fontSize: '0.7rem',
    color: '#3B82F6',
    fontWeight: '800'
  },
  subPageMainTitle: {
    margin: '0.25rem 0 0 0',
    fontSize: '1.25rem',
    fontWeight: '900'
  },
  btnBackToMainDashboard: {
    backgroundColor: '#1E293B',
    color: 'white',
    border: 'none',
    padding: '0.6rem 1.1rem',
    borderRadius: '10px',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer'
  },
  chartSection: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '24px',
    boxShadow: '0 12px 40px rgba(30, 58, 138, 0.04)',
    border: '1px solid #E2E8F0',
    marginTop: '1.5rem'
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
    margin: 0
  },
  chartBadge: {
    backgroundColor: '#EEF2F6',
    color: '#475569',
    padding: '0.3rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.75rem'
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
    justifyContent: 'space-between'
  },
  progressName: {
    fontSize: '0.85rem',
    fontWeight: '700'
  },
  progressVal: {
    fontSize: '0.85rem',
    fontWeight: '800'
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
    transition: 'width 1s ease'
  },
  dataTable: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    minWidth: '500px'
  },
  tableHeaderRow: {
    borderBottom: '2px solid #E2E8F0',
    backgroundColor: '#F8FAFC'
  },
  thStyles: {
    padding: '0.85rem',
    fontSize: '0.8rem',
    fontWeight: '800',
    color: '#475569'
  },
  tableBodyRow: {
    borderBottom: '1px solid #F1F5F9'
  },
  tdStyles: {
    padding: '1rem 0.85rem',
    verticalAlign: 'middle',
    fontSize: '0.85rem'
  },
  taskCheckbox: {
    transform: 'scale(1.2)',
    cursor: 'pointer'
  },
  taskTextSpan: {
    fontWeight: '700'
  },
  tableTimeSpan: {
    fontSize: '0.8rem',
    color: '#64748B'
  },
  badgeCategory: {
    padding: '0.3rem 0.85rem',
    borderRadius: '9999px',
    fontSize: '0.7rem',
    fontWeight: '800'
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
    cursor: 'pointer'
  },
  btnActionDeleteComponent: {
    backgroundColor: '#EF4444',
    color: 'white',
    border: 'none',
    padding: '0.45rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.8rem',
    cursor: 'pointer'
  },
  tableInputText: {
    padding: '0.4rem',
    borderRadius: '6px',
    border: '1px solid #3B82F6',
    width: '90%'
  },
  tableSelect: {
    padding: '0.4rem',
    borderRadius: '6px',
    border: '1px solid #3B82F6'
  },
  btnSaveInline: {
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    padding: '0.45rem 0.9rem',
    borderRadius: '8px',
    fontSize: '0.8rem',
    cursor: 'pointer'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
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
    padding: '1.75rem',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '450px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    boxSizing: 'border-box'
  },
  modalContentTitle: {
    margin: 0,
    fontSize: '1.2rem',
    fontWeight: '800'
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
    boxSizing: 'border-box'
  },
  modalBtnGroup: {
    display: 'flex',
    gap: '0.75rem'
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
    cursor: 'pointer'
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