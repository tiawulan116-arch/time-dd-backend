import { useState, useEffect } from 'react';

const Calendar = ({ onNavigateToDashboard }) => {
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 15)); // Fokus Juli 2026
  const [isLoaded, setIsLoaded] = useState(false);

  // ENDPOINT API MOCKAPI DISESUAIKAN DENGAN DASHBOARD
  const TASKS_API_URL = 'https://6a60fe94da10c59c180952e3.mockapi.io/events';

  // FUNGSI MENGAMBIL DATA DARI MOCKAPI ONLINE
  const fetchTasksFromApi = async () => {
    try {
      const res = await fetch(TASKS_API_URL);
      if (res.ok) {
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Gagal mengambil data kalender dari MockAPI:", error);
    }
  };

  useEffect(() => {
    setIsLoaded(true);
    fetchTasksFromApi();
  }, []);

  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const totalDays = daysInMonth(month, year);
  const startDay = startDayOfMonth(month, year);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleCurrentMonth = () => setCurrentDate(new Date(2026, 6, 15));

  // Fungsi pembantu untuk mencocokkan tugas berdasarkan tanggal kalender
  const getTasksForDate = (day) => {
    const formattedDay = day < 10 ? `0${day}` : day;
    const formattedMonth = (month + 1) < 10 ? `0${month + 1}` : month + 1;
    const targetDateStr = `${year}-${formattedMonth}-${formattedDay}`;

    return tasks.filter(task => {
      const taskDate = task.date || (task.time ? task.time.substring(0, 10) : '');
      return taskDate === targetDateStr;
    });
  };

  // Fungsi pemberi warna badge mini tugas di dalam kotak kalender harian
  const getBadgeStyle = (category) => {
    switch (category) {
      case 'Kuliah':
        return { backgroundColor: '#E0F2FE', color: '#0369A1', borderLeft: '3px solid #3B82F6' };
      case 'Kerja':
        return { backgroundColor: '#FEF3C7', color: '#B45309', borderLeft: '3px solid #F59E0B' };
      case 'Organisasi':
        return { backgroundColor: '#F3E8FF', color: '#6B21A8', borderLeft: '3px solid #A855F7' };
      case 'Selesai':
        return { backgroundColor: '#D1FAE5', color: '#065F46', borderLeft: '3px solid #10B981', textDecoration: 'line-through', opacity: 0.7 };
      default:
        return { backgroundColor: '#F1F5F9', color: '#475569' };
    }
  };

  const renderCalendarCells = () => {
    const cells = [];
    
    // Isi slot kosong sebelum tanggal 1 awal bulan
    for (let i = 0; i < startDay; i++) {
      cells.push(<div key={`empty-${i}`} style={styles.calendarCellEmpty} />);
    }

    // Isi baris kotak tanggal aktif harian
    for (let day = 1; day <= totalDays; day++) {
      const isToday = day === 15 && month === 6 && year === 2026;
      const dayTasks = getTasksForDate(day);

      cells.push(
        <div 
          key={`day-${day}`} 
          style={{
            ...styles.calendarCellActive,
            borderColor: isToday ? '#3B82F6' : '#EEF2F6',
            backgroundColor: isToday ? '#F8FAFC' : '#FFFFFF',
            boxShadow: isToday ? 'inset 0 0 0 2px #3B82F6' : 'none'
          }}
        >
          <div style={{
            ...styles.cellDayNumber,
            color: isToday ? '#3B82F6' : '#1E293B',
            fontWeight: isToday ? '900' : '700'
          }}>
            {day} {isToday && <span style={styles.todayIndicator}>Hari Ini</span>}
          </div>

          {/* MENAMPILKAN DAFTAR UTUH NAMA AGENDA YANG KAMU INPUT DARI MOCKAPI */}
          <div style={styles.cellTaskContainer}>
            {dayTasks.map(task => {
              const timeDisplay = task.time && task.time.includes('(') 
                ? task.time.substring(task.time.indexOf('(')) 
                : (task.startTime ? `(${task.startTime} - ${task.endTime})` : '');

              return (
                <div 
                  key={task.id} 
                  style={{ ...styles.taskMiniBadge, ...getBadgeStyle(task.category) }}
                  title={`${task.title} (${task.category})`}
                >
                  <div style={styles.taskMiniTitle}>{task.title}</div>
                  <div style={styles.taskMiniTime}>{timeDisplay}</div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return cells;
  };

  return (
    <div style={styles.calendarLayout}>
      
      {/* SIDEBAR LEFT */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarLogoIcon}>T</div>
          <div>
            <h2 style={styles.sidebarLogo}>TimeDD</h2>
            <span style={styles.sidebarSublogo}>Calendar Panel</span>
          </div>
        </div>
        <nav style={styles.sidebarNav}>
          <div onClick={onNavigateToDashboard} style={styles.sidebarMenu}>📊 Ringkasan Panel</div>
          <div style={{ ...styles.sidebarMenu, backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}>📅 Kalender Jadwal</div>
        </nav>
        <div style={styles.sidebarFooter}>
          <div style={styles.sidebarVersion}>v1.0.0 © 2026</div>
        </div>
      </aside>

      {/* MAIN CALENDAR CONTENT */}
      <main style={styles.mainContent}>
        <header style={{
          ...styles.mainHeaderCard,
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(-15px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div>
            <h1 style={styles.headerTitle}>Kalender Akademik & Kesibukan</h1>
            <p style={styles.headerSubtitle}>Gunakan tombol kontrol navigasi bulan untuk memantau plot sebaran jadwal kegiatanmu.</p>
          </div>
          <button onClick={onNavigateToDashboard} style={styles.btnBack}>
            ← Kembali ke Dashboard
          </button>
        </header>

        {/* CALENDAR BOARD HOUSING */}
        <section style={{
          ...styles.calendarCardBoard,
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(25px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.05s'
        }}>
          
          {/* Kalender Header Navigator */}
          <div style={styles.calendarControlHeader}>
            <div style={styles.btnControlGroup}>
              <button onClick={handlePrevMonth} style={styles.navArrowBtn}>←</button>
              <h2 style={styles.monthDisplayLabel}>{monthNames[month]} {year}</h2>
              <button onClick={handleNextMonth} style={styles.navArrowBtn}>→</button>
            </div>
            <button onClick={handleCurrentMonth} style={styles.btnTodayBack}>Bulan Ini</button>
          </div>

          {/* Wrapper scrollable untuk grid kalender di HP */}
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <div style={{ minWidth: '650px' }}>
              {/* Nama-Nama Hari Baris */}
              <div style={styles.daysOfWeekGrid}>
                <div style={{ ...styles.dayWeekLabel, color: '#EF4444' }}>Min</div>
                <div style={styles.dayWeekLabel}>Sen</div>
                <div style={styles.dayWeekLabel}>Sel</div>
                <div style={styles.dayWeekLabel}>Rab</div>
                <div style={styles.dayWeekLabel}>Kam</div>
                <div style={styles.dayWeekLabel}>Jum</div>
                <div style={styles.dayWeekLabel}>Sab</div>
              </div>

              {/* Grid Sel Tanggal Utama */}
              <div style={styles.calendarGridCells}>
                {renderCalendarCells()}
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
};

// Objek Stylesheet Vertikal Responsif Modern
const styles = {
  calendarLayout: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    background: 'linear-gradient(135deg, #EBF3FF 0%, #F5F9FF 100%)',
    minHeight: '100vh',
    fontFamily: '"Inter", sans-serif',
    width: '100%',
    overflowX: 'hidden'
  },
  sidebar: {
    width: '100%',
    maxWidth: '280px',
    backgroundColor: '#1E3A8A',
    color: 'white',
    padding: '2rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
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
  sidebarVersion: {
    fontSize: '0.8rem',
    opacity: 0.4,
    textAlign: 'center'
  },
  mainContent: {
    flexGrow: 1,
    padding: 'clamp(1rem, 3vw, 3.5rem)',
    overflowY: 'auto',
    width: '100%',
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
    gap: '1rem',
    boxSizing: 'border-box'
  },
  headerTitle: {
    fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
    fontWeight: '900',
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.5px'
  },
  headerSubtitle: {
    color: '#64748B',
    marginTop: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  btnBack: {
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
    border: '1px solid #E2E8F0',
    padding: '0.75rem 1.25rem',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
    transition: '0.2s'
  },
  calendarCardBoard: {
    backgroundColor: 'white',
    padding: 'clamp(1.25rem, 3vw, 2.5rem)',
    borderRadius: '24px',
    boxShadow: '0 12px 40px rgba(30, 58, 138, 0.04)',
    border: '1px solid #E2E8F0',
    boxSizing: 'border-box'
  },
  calendarControlHeader: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    gap: '1rem'
  },
  btnControlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  navArrowBtn: {
    backgroundColor: '#F1F5F9',
    border: 'none',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: '800',
    color: '#475569',
    cursor: 'pointer',
    transition: '0.2s'
  },
  monthDisplayLabel: {
    fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
    fontWeight: '900',
    color: '#1E3A8A',
    margin: 0,
    minWidth: '140px',
    textAlign: 'center'
  },
  btnTodayBack: {
    backgroundColor: '#EEF2F6',
    color: '#1E3A8A',
    border: 'none',
    padding: '0.55rem 1.1rem',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '0.8rem',
    cursor: 'pointer'
  },
  daysOfWeekGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    textAlign: 'center',
    marginBottom: '1rem',
    borderBottom: '1px solid #F1F5F9',
    paddingBottom: '0.75rem'
  },
  dayWeekLabel: {
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#475569'
  },
  calendarGridCells: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '0.65rem'
  },
  calendarCellEmpty: {
    backgroundColor: '#F8FAFC',
    borderRadius: '14px',
    minHeight: '100px',
    opacity: 0.4
  },
  calendarCellActive: {
    border: '1px solid #EEF2F6',
    borderRadius: '14px',
    padding: '0.6rem',
    minHeight: '110px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    transition: 'all 0.2s ease'
  },
  cellDayNumber: {
    fontSize: '0.85rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  todayIndicator: {
    backgroundColor: '#3B82F6',
    color: 'white',
    fontSize: '0.6rem',
    padding: '0.1rem 0.4rem',
    borderRadius: '6px',
    fontWeight: '700'
  },
  cellTaskContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    flexGrow: 1,
    overflowY: 'auto'
  },
  taskMiniBadge: {
    padding: '0.3rem 0.5rem',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
    boxShadow: '0 2px 6px rgba(0,0,0,0.01)',
    transition: '0.15s'
  },
  taskMiniTitle: {
    fontSize: '0.7rem',
    fontWeight: '800',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  taskMiniTime: {
    fontSize: '0.6rem',
    opacity: 0.75,
    fontWeight: '600'
  }
};

export default Calendar;